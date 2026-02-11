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
      },
    });
  }

  async findById(id: number) {
    return await prisma.user.findFirst({
      where: { 
        id,
        deletedAt: null,
      },
      include: {
        role: true,
      },
    });
  }

  async create(data: {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    roleId: number;
  }) {
    return await prisma.user.create({
      data: {
        email: data.email,
        password: data.password,
        first_name: data.first_name,
        last_name: data.last_name,
        roleId: data.roleId,
      },
      include: {
        role: true,
      },
    });
  }

  async update(id: number, data: Prisma.UserUpdateInput) {
    return await prisma.user.update({
      where: { id },
      data,
      include: {
        role: true,
      },
    });
  }

  async delete(id: number) {
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
      },
    });
  }

  async softDelete(id: number) {
    return await prisma.user.update({
      where: { id },
      data: { deletedAt: new Date() },
      include: {
        role: true,
      },
    });
  }

  async forceDelete(id: number) {
    return await prisma.user.delete({
      where: { id },
    });
  }

  async restore(id: number) {
    return await prisma.user.update({
      where: { id },
      data: { deletedAt: null },
      include: {
        role: true,
      },
    });
  }
}

export default new UserRepository();
