import { storage } from "./storage";
import { hashPassword } from "./auth";

export async function seedDatabase() {
  const existingAdmin = await storage.getUserByUsername("admin@touchequity.com");
  if (existingAdmin) return;

  const adminPassword = await hashPassword("admin123");
  const admin = await storage.createUser({
    username: "admin@touchequity.com",
    password: adminPassword,
    role: "admin",
  });

  const pw1 = await hashPassword("customer1");
  const customer1 = await storage.createUser({
    username: "customer1@touchequity.com",
    password: pw1,
    role: "customer",
  });

  const pw2 = await hashPassword("customer2");
  const customer2 = await storage.createUser({
    username: "customer2@touchequity.com",
    password: pw2,
    role: "customer",
  });

  const pw3 = await hashPassword("customer3");
  const customer3 = await storage.createUser({
    username: "customer3@touchequity.com",
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
    [customer1.id, customer2.id, customer3.id],
  );

  await storage.createPost(
    {
      title: "Preparing for Your First Fundraising Round",
      content:
        "Before approaching investors, make sure you have a clear business plan, realistic financial projections, and a compelling pitch deck. Our team is available to review your materials and provide strategic advice. Schedule a consultation through the platform to get started.",
      link: null,
      published: true,
    },
    admin.id,
    [customer1.id, customer2.id],
  );

  await storage.createPost(
    {
      title: "TouchConnectPro Platform Now Live",
      content:
        "We are excited to announce that TouchConnectPro, our fundraising and investor connection platform, is now live. Founders can use the platform to connect with vetted private investors, prepare pitch materials, and track their fundraising progress.",
      link: "https://touchconnectpro.com",
      published: true,
    },
    admin.id,
    [customer1.id, customer3.id],
  );

  console.log("Database seeded successfully");
}
