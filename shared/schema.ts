import { sql } from "drizzle-orm";
import { pgTable, text, varchar, boolean, timestamp, serial, primaryKey, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("customer"),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const loginSchema = z.object({
  username: z.string().min(1, "Email is required").email("Please enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

export const registerSchema = z.object({
  username: z.string().min(1, "Email is required").email("Please enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export const attachmentSchema = z.object({
  filename: z.string(),
  originalName: z.string(),
  mimetype: z.string(),
  size: z.number(),
  url: z.string(),
});

export type Attachment = z.infer<typeof attachmentSchema>;

export const dashboardPosts = pgTable("dashboard_posts", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  link: text("link"),
  attachments: jsonb("attachments").$type<Attachment[]>().default([]),
  published: boolean("published").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  createdBy: varchar("created_by").references(() => users.id),
});

export const postAssignments = pgTable("post_assignments", {
  postId: serial("post_id").references(() => dashboardPosts.id, { onDelete: "cascade" }),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }),
}, (table) => [
  primaryKey({ columns: [table.postId, table.userId] }),
]);

export const insertPostSchema = createInsertSchema(dashboardPosts).omit({
  id: true,
  createdAt: true,
  createdBy: true,
});

export type InsertPost = z.infer<typeof insertPostSchema>;
export type DashboardPost = typeof dashboardPosts.$inferSelect;
export type PostAssignment = typeof postAssignments.$inferSelect;
