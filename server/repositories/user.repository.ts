import prisma from "../lib/prisma.js";
import { Prisma } from "@prisma/client";

export class UserRepository {
  async findByEmail(email: string) {
    return await prisma.user.findFirst({
      where: {
        email,
        deletedAt: null,
      },
      include: {
        role: true,
        profile: true,
      },
    });
  }

  async findById(id: string) {
    return await prisma.user.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      include: {
        role: true,
        profile: true,
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
        roleId: data.roleId,
        profile: {
          create: {
            first_name: data.first_name,
            last_name: data.last_name,
          },
        },
      },
      include: {
        role: true,
        profile: true,
      },
    });
  }

  async update(id: string, data: Prisma.UserUpdateInput) {
    return await prisma.user.update({
      where: { id },
      data,
      include: {
        role: true,
        profile: true,
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
      where: {
        deletedAt: null,
      },
      include: {
        role: true,
        profile: true,
      },
    });
  }

  async softDelete(id: string) {
    return await prisma.user.update({
      where: { id },
      data: { deletedAt: new Date() },
      include: {
        role: true,
        profile: true,
      },
    });
  }

  async forceDelete(id: string) {
    return await prisma.user.delete({
      where: { id },
    });
  }

  async restore(id: string) {
    return await prisma.user.update({
      where: { id },
      data: { deletedAt: null },
      include: {
        role: true,
        profile: true,
      },
    });
  }
}

export default new UserRepository();
