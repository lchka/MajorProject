import prisma from "../../lib/prisma.js";
// Seeder script to populate the database with predefined roles for testing and development purposes
interface RoleData {
  name: string;
  description: string;
}

const roles: RoleData[] = [
  {
    name: "admin",
    description: "Administrator with full system access and permissions",
  },
  {
    name: "moderator",
    description: "Moderator with limited administrative capabilities",
  },
  {
    name: "user",
    description: "Standard user with basic access permissions",
  },
];

async function seedRoles(): Promise<void> {
  try {
    console.log("Seeding roles...");

    for (const role of roles) {
      await prisma.role.upsert({
        where: { name: role.name },
        update: {},
        create: role,
      });
      console.log(`✓ Role '${role.name}' created/updated`);
    }

    console.log("Roles seeded successfully!");
  } catch (error) {
    console.error("Error seeding roles:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seedRoles();
