// prisma/seed.ts
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Check if Super Admin already exists
  const existingSuperAdmin = await prisma.user.findFirst({
    where: { 
      role: "OWNER",
      email: "superadmin@nexusai.com" 
    },
  });

  if (!existingSuperAdmin) {
    console.log("📝 Creating Super Admin...");

    // Check if organization exists or create new one
    let org = await prisma.organization.findFirst({
      where: { name: "NexusAI System" },
    });

    if (!org) {
      org = await prisma.organization.create({
        data: {
          name: "NexusAI System",
          slug: "nexusai-system-" + Date.now(),
          plan: "ENTERPRISE",
          tokenLimit: 100000000,
          defaultNiche: "default",
        },
      });
    }

    // Create super admin user
    const hashedPassword = await bcrypt.hash("SuperAdmin123!", 12);
    
    await prisma.user.create({
      data: {
        name: "Super Admin",
        email: "superadmin@nexusai.com",
        password: hashedPassword,
        role: "OWNER",
        orgId: org.id,
        niche: "default",
      },
    });

    console.log("✅ Super Admin created!");
    console.log("📧 Email: superadmin@nexusai.com");
    console.log("🔑 Password: SuperAdmin123!");
  } else {
    console.log("⚠️ Super Admin already exists, skipping...");
  }

  console.log("🌱 Seeding complete!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });