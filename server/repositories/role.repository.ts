import prisma from "../lib/prisma.js";

export class RoleRepository {
  // get one role by name
  async findByName(name: string) {
    return await prisma.role.findUnique({
      where: { name },
    });
  }

  // get one role by id
  async findById(id: string) {
    return await prisma.role.findUnique({
      where: { id },
    });
  }

  // list all roles
  async findAll() {
    return await prisma.role.findMany();
  }
}

export default new RoleRepository();
