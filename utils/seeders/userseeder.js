import prisma from "../../lib/prisma.js";
import UserSecurity from "../../models/User.js";

const users = [
  {
    email: "admin@example.com",
    password: "Admin123!",
    profile: {
      first_name: "Admin",
      last_name: "User",
    },
    role: "admin",
  },
  {
    email: "moderator@example.com",
    password: "Moderator123!",
    profile: {
      first_name: "Moderator",
      last_name: "User",
    },
    role: "moderator",
  },
  {
    email: "user@example.com",
    password: "User123!",
    profile: {
      first_name: "Regular",
      last_name: "User",
    },
    role: "user",
  },
];

async function seedUsers() {
  try {
    console.log("Seeding users...");

    for (const userData of users) {
      const existingUser = await prisma.user.findUnique({
        where: { email: userData.email },
      });

      if (existingUser) {
        console.log(`⊘ User '${userData.email}' already exists, skipping...`);
        continue;
      }

      const hashedPassword = await UserSecurity.hashPassword(userData.password);

      // Get role
      const role = await prisma.role.findUnique({
        where: { name: userData.role },
      });

      if (!role) {
        console.log(
          `✗ Role '${userData.role}' not found, skipping user '${userData.email}'`,
        );
        continue;
      }

      const user = await prisma.user.create({
        data: {
          email: userData.email,
          password: hashedPassword,
          profile: {
            create: userData.profile,
          },
          roleId: role.id,
        },
        include: {
          profile: true,
          role: true,
        },
      });

      console.log(
        `✓ User '${user.email}' created with role: ${user.role.name}`,
      );
    }

    console.log("Users seeded successfully!");
  } catch (error) {
    console.error("Error seeding users:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seedUsers();
