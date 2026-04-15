import { storage } from "./storage";
import { hashPassword } from "./auth";

async function ensureUser(username: string, password: string, role: string) {
  const existing = await storage.getUserByUsername(username);
  if (existing) return existing;
  const hashed = await hashPassword(password);
  const user = await storage.createUser({ username, password: hashed, role });
  console.log(`Created ${role}: ${username}`);
  return user;
}

export async function seedDatabase() {
  const admin = await ensureUser("hello@touchequitypartners.com", "Admin!55", "admin");
  const customer1 = await ensureUser("buhler.lionel@gmail.com", "user1!55", "customer");
  await ensureUser("tommaso@noro.co", "Tommaso!noro!99", "customer");
  await ensureUser("teun@sharedstudios.com", "Teun!99noro!", "customer");

  const posts = await storage.getAllPosts();
  if (posts.length === 0) {
    await storage.createPost(
      {
        title: "Welcome to Touch Equity Partners",
        content:
          "Welcome to the Touch Equity Partners dashboard. Here you will find the latest updates, resources, and insights to help you on your fundraising journey. Stay tuned for upcoming announcements and strategic guidance from our team.",
        link: null,
        published: true,
      },
      admin.id,
      [customer1.id],
    );
    console.log("Welcome post created");
  }

  console.log("Database seeded successfully");
}
