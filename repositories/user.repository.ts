import prisma from "../lib/prisma.js";
import { Prisma } from "@prisma/client";

export class UserRepository {
  async findByEmail(email: string) {
    return await prisma.user.findUnique({
      where: { email },
      include: {
        profile: true,
        role: true,
      },
    });
  }

  async findById(id: string) {
    return await prisma.user.findUnique({
      where: { id },
      include: {
        profile: true,
        role: true,
      },
    });
  }

  async create(data: {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    roleId: string;
  }) {
    return await prisma.user.create({
      data: {
        email: data.email,
        password: data.password,
        profile: {
          create: {
            first_name: data.first_name,
            last_name: data.last_name,
          },
        },
        roleId: data.roleId,
      },
      include: {
        profile: true,
        role: true,
      },
    });
  }

  async update(id: string, data: Prisma.UserUpdateInput) {
    return await prisma.user.update({
      where: { id },
      data,
      include: {
        profile: true,
        role: true,
      },
    });
  }

  async delete(id: string) {
    return await prisma.user.delete({
      where: { id },
    });
  }

  async findAll() {
    return await prisma.user.findMany({
      include: {
        profile: true,
        role: true,
      },
    });
  }
}

export default new UserRepository();
