import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import pg from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

const pool = new pg.Pool({
  connectionString:
    process.env.DATABASE_URL ||
    "postgresql://myuser:postgres@localhost:5432/my_backend_db",
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function test() {
  const users = await prisma.user.findMany();
  console.log(users);
}

test()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
