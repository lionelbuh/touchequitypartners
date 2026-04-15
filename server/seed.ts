import { storage } from "./storage";
import { hashPassword } from "./auth";

export async function seedDatabase() {
  const existingAdmin = await storage.getUserByUsername("hello@touchequitypartners.com");
  if (existingAdmin) return;

  const adminPassword = await hashPassword("Admin!55");
  const admin = await storage.createUser({
    username: "hello@touchequitypartners.com",
    password: adminPassword,
    role: "admin",
  });

  const pw1 = await hashPassword("user1!55");
  const customer1 = await storage.createUser({
    username: "buhler.lionel@gmail.com",
    password: pw1,
    role: "customer",
  });

  const pw2 = await hashPassword("Tommaso!noro!99");
  await storage.createUser({
    username: "tommaso@noro.co",
    password: pw2,
    role: "customer",
  });

  const pw3 = await hashPassword("Teun!99noro!");
  await storage.createUser({
    username: "teun@sharedstudios.com",
    password: pw3,
    role: "customer",
  });

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

  console.log("Database seeded successfully");
}
