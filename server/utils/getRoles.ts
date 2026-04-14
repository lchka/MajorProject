import prismaClientPkg from "@prisma/client";

const { PrismaClient } = prismaClientPkg;

const prisma = new PrismaClient();

async function getRoles() {
  try {
    const roles = await prisma.role.findMany();

    console.log("\nAvailable Roles:\n");
    roles.forEach((role) => {
      console.log(`  Name: ${role.name}`);
      console.log(`  ID: ${role.id}`);
      console.log(`  Description: ${role.description || "N/A"}`);
      console.log("  ---");
    });

    // Find the user role specifically
    const userRole = roles.find((r) => r.name === "user");
    if (userRole) {
      console.log("\nUser Role ID (use this in RegisterScreen):");
      console.log(`  ${userRole.id}\n`);
    }
  } catch (error) {
    console.error("Error fetching roles:", error);
  } finally {
    await prisma.$disconnect();
  }
}

getRoles();
