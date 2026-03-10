import { type User, type InsertUser, type DashboardPost, type InsertPost, type Attachment, users, dashboardPosts, postAssignments } from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, inArray } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser & { role?: string }): Promise<User>;
  updateUserPassword(userId: string, hashedPassword: string): Promise<void>;
  getCustomers(): Promise<User[]>;
  getPublishedPostsForUser(userId: string): Promise<DashboardPost[]>;
  getAllPosts(): Promise<(DashboardPost & { assignedCustomerIds: string[] })[]>;
  getPost(id: number): Promise<DashboardPost | undefined>;
  createPost(post: InsertPost, createdBy: string, assignedCustomerIds: string[]): Promise<DashboardPost>;
  updatePost(id: number, data: Partial<InsertPost>, assignedCustomerIds?: string[]): Promise<DashboardPost | undefined>;
  deletePost(id: number): Promise<void>;
  getPostAssignments(postId: number): Promise<string[]>;
  canUserAccessFile(userId: string, userRole: string, filename: string): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser & { role?: string }): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUserPassword(userId: string, hashedPassword: string): Promise<void> {
    await db.update(users).set({ password: hashedPassword }).where(eq(users.id, userId));
  }

  async getCustomers(): Promise<User[]> {
    return db.select().from(users).where(eq(users.role, "customer"));
  }

  async getPublishedPostsForUser(userId: string): Promise<DashboardPost[]> {
    const assignments = await db.select().from(postAssignments).where(eq(postAssignments.userId, userId));
    const postIds = assignments.map(a => a.postId);
    if (postIds.length === 0) return [];
    return db.select().from(dashboardPosts)
      .where(and(eq(dashboardPosts.published, true), inArray(dashboardPosts.id, postIds)))
      .orderBy(desc(dashboardPosts.createdAt));
  }

  async getAllPosts(): Promise<(DashboardPost & { assignedCustomerIds: string[] })[]> {
    const posts = await db.select().from(dashboardPosts).orderBy(desc(dashboardPosts.createdAt));
    const allAssignments = await db.select().from(postAssignments);

    return posts.map(post => ({
      ...post,
      assignedCustomerIds: allAssignments.filter(a => a.postId === post.id).map(a => a.userId),
    }));
  }

  async getPost(id: number): Promise<DashboardPost | undefined> {
    const [post] = await db.select().from(dashboardPosts).where(eq(dashboardPosts.id, id));
    return post;
  }

  async getPostAssignments(postId: number): Promise<string[]> {
    const assignments = await db.select().from(postAssignments).where(eq(postAssignments.postId, postId));
    return assignments.map(a => a.userId);
  }

  async createPost(post: InsertPost, createdBy: string, assignedCustomerIds: string[]): Promise<DashboardPost> {
    const [created] = await db.insert(dashboardPosts).values({ ...post, createdBy }).returning();
    if (assignedCustomerIds.length > 0) {
      await db.insert(postAssignments).values(
        assignedCustomerIds.map(userId => ({ postId: created.id, userId }))
      );
    }
    return created;
  }

  async updatePost(id: number, data: Partial<InsertPost>, assignedCustomerIds?: string[]): Promise<DashboardPost | undefined> {
    const [updated] = await db.update(dashboardPosts).set(data).where(eq(dashboardPosts.id, id)).returning();
    if (!updated) return undefined;

    if (assignedCustomerIds !== undefined) {
      await db.delete(postAssignments).where(eq(postAssignments.postId, id));
      if (assignedCustomerIds.length > 0) {
        await db.insert(postAssignments).values(
          assignedCustomerIds.map(userId => ({ postId: id, userId }))
        );
      }
    }
    return updated;
  }

  async deletePost(id: number): Promise<void> {
    await db.delete(postAssignments).where(eq(postAssignments.postId, id));
    await db.delete(dashboardPosts).where(eq(dashboardPosts.id, id));
  }

  async canUserAccessFile(userId: string, userRole: string, filename: string): Promise<boolean> {
    if (userRole === "admin") return true;
    const allPosts = await db.select().from(dashboardPosts);
    const owningPosts = allPosts.filter(post => {
      const attachments = (post.attachments as Attachment[]) || [];
      return attachments.some(a => a.filename === filename);
    });
    if (owningPosts.length === 0) return false;
    for (const post of owningPosts) {
      if (!post.published) continue;
      const assignments = await db.select().from(postAssignments)
        .where(and(eq(postAssignments.postId, post.id), eq(postAssignments.userId, userId)));
      if (assignments.length > 0) return true;
    }
    return false;
  }

}

export const storage = new DatabaseStorage();
