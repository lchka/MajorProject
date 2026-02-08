import prisma from "../lib/prisma.js";

export class RoleRepository {
  async findByName(name: string) {
    return await prisma.role.findUnique({
      where: { name },
    });
  }

  async findById(id: string) {
    return await prisma.role.findUnique({
      where: { id },
    });
  }

  async findAll() {
    return await prisma.role.findMany();
  }
}

export default new RoleRepository();
