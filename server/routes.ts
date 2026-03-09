import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, hashPassword } from "./auth";
import passport from "passport";
import { insertPostSchema, attachmentSchema } from "@shared/schema";
import { z } from "zod";
import multer from "multer";
import path from "path";
import { randomBytes } from "crypto";
import fs from "fs";

const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const upload = multer({
  storage: multer.diskStorage({
    destination: uploadsDir,
    filename: (_req, file, cb) => {
      const uniqueId = randomBytes(8).toString("hex");
      const ext = path.extname(file.originalname);
      cb(null, `${uniqueId}${ext}`);
    },
  }),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = [
      "image/jpeg", "image/png", "image/gif", "image/webp",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("File type not supported. Please upload images (JPG, PNG, GIF, WebP), PDF, or Word documents."));
    }
  },
});

function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
}

function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated() || req.user?.role !== "admin") {
    return res.status(403).json({ message: "Forbidden" });
  }
  next();
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  setupAuth(app);

  app.get("/uploads/:filename", requireAuth, async (req, res, next) => {
    try {
      const filename = path.basename(req.params.filename);
      const filePath = path.join(uploadsDir, filename);
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ message: "File not found" });
      }
      const canAccess = await storage.canUserAccessFile(req.user!.id, req.user!.role, filename);
      if (!canAccess) {
        return res.status(403).json({ message: "Forbidden" });
      }
      res.sendFile(filePath);
    } catch (err) {
      next(err);
    }
  });

  app.post("/api/register", async (req, res, next) => {
    try {
      const { registerSchema } = await import("@shared/schema");
      const parsed = registerSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: parsed.error.errors[0]?.message || "Invalid input" });
      }

      const { username, password } = parsed.data;
      const existing = await storage.getUserByUsername(username);
      if (existing) {
        return res.status(400).json({ message: "An account with this email already exists" });
      }

      const hashedPassword = await hashPassword(password);
      const user = await storage.createUser({ username, password: hashedPassword });

      req.login(user, (err) => {
        if (err) return next(err);
        return res.json({ id: user.id, username: user.username, role: user.role });
      });
    } catch (err) {
      next(err);
    }
  });

  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err: any, user: any, info: any) => {
      if (err) return next(err);
      if (!user) return res.status(401).json({ message: info?.message || "Invalid credentials" });
      req.login(user, (err) => {
        if (err) return next(err);
        return res.json({ id: user.id, username: user.username, role: user.role });
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.json({ message: "Logged out" });
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    const user = req.user!;
    res.json({ id: user.id, username: user.username, role: user.role });
  });

  app.get("/api/posts", requireAuth, async (req, res, next) => {
    try {
      const posts = await storage.getPublishedPostsForUser(req.user!.id);
      res.json(posts);
    } catch (err) {
      next(err);
    }
  });

  app.get("/api/admin/customers", requireAdmin, async (req, res, next) => {
    try {
      const customers = await storage.getCustomers();
      res.json(customers.map(c => ({ id: c.id, username: c.username })));
    } catch (err) {
      next(err);
    }
  });

  app.get("/api/admin/posts", requireAdmin, async (req, res, next) => {
    try {
      const posts = await storage.getAllPosts();
      res.json(posts);
    } catch (err) {
      next(err);
    }
  });

  app.post("/api/admin/upload", requireAdmin, upload.array("files", 5), (req, res) => {
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      return res.status(400).json({ message: "No files uploaded" });
    }
    const attachments = files.map(file => ({
      filename: file.filename,
      originalName: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      url: `/uploads/${file.filename}`,
    }));
    res.json(attachments);
  });

  app.post("/api/admin/posts", requireAdmin, async (req, res, next) => {
    try {
      const { assignedCustomerIds, attachments, ...postData } = req.body;
      const validatedAttachments = z.array(attachmentSchema).safeParse(attachments || []);
      if (!validatedAttachments.success) {
        return res.status(400).json({ message: "Invalid attachment data" });
      }
      const parsed = insertPostSchema.safeParse({ ...postData, attachments: validatedAttachments.data });
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid post data" });
      }
      const customerIds = Array.isArray(assignedCustomerIds) ? assignedCustomerIds : [];
      const post = await storage.createPost(parsed.data, req.user!.id, customerIds);
      const assignments = await storage.getPostAssignments(post.id);
      res.json({ ...post, assignedCustomerIds: assignments });
    } catch (err) {
      next(err);
    }
  });

  app.patch("/api/admin/posts/:id", requireAdmin, async (req, res, next) => {
    try {
      const idParam = req.params.id;
      const id = parseInt(Array.isArray(idParam) ? idParam[0] : idParam);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid post ID" });

      const { assignedCustomerIds, attachments, ...postData } = req.body;
      if (attachments !== undefined) {
        const validatedAttachments = z.array(attachmentSchema).safeParse(attachments);
        if (!validatedAttachments.success) {
          return res.status(400).json({ message: "Invalid attachment data" });
        }
        postData.attachments = validatedAttachments.data;
      }
      const customerIds = assignedCustomerIds !== undefined
        ? (Array.isArray(assignedCustomerIds) ? assignedCustomerIds : [])
        : undefined;

      const post = await storage.updatePost(id, postData, customerIds);
      if (!post) return res.status(404).json({ message: "Post not found" });
      const assignments = await storage.getPostAssignments(post.id);
      res.json({ ...post, assignedCustomerIds: assignments });
    } catch (err) {
      next(err);
    }
  });

  app.delete("/api/admin/posts/:id", requireAdmin, async (req, res, next) => {
    try {
      const idParam = req.params.id;
      const id = parseInt(Array.isArray(idParam) ? idParam[0] : idParam);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid post ID" });
      await storage.deletePost(id);
      res.json({ message: "Deleted" });
    } catch (err) {
      next(err);
    }
  });

  return httpServer;
}
