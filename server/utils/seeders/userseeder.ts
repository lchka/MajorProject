import prisma from "../../lib/prisma.js";
import UserSecurity from "../UserSecurity.js";

interface UserData {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  role: string;
}

const users: UserData[] = [
  {
    email: "admin@example.com",
    password: "Admin123!",
    first_name: "Admin",
    last_name: "User",
    role: "admin",
  },
  {
    email: "moderator@example.com",
    password: "Moderator123!",
    first_name: "Moderator",
    last_name: "User",
    role: "moderator",
  },
  {
    email: "user@example.com",
    password: "User123!",
    first_name: "Regular",
    last_name: "User",
    role: "user",
  },
];

async function seedUsers(): Promise<void> {
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

      const user = await prisma.user.upsert({
        where: { email: userData.email },
        update: {},
        create: {
          email: userData.email,
          password: hashedPassword,
          roleId: role.id,
          profile: {
            create: {
              first_name: userData.first_name,
              last_name: userData.last_name,
            },
          },
        },
        include: {
          role: true,
          profile: true,
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
