import prisma from "../lib/prisma.js";
import { Prisma } from "@prisma/client";

export class UserRepository {
  // get active user by email
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

  // get active user by id
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

  // create user + starter profile
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

  // update user fields by id
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

  // hard delete user
  async delete(id: string) {
    return await prisma.user.delete({
      where: { id },
    });
  }

  // list active users
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

  // mark user as deleted
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

  // permanently remove user
  async forceDelete(id: string) {
    return await prisma.user.delete({
      where: { id },
    });
  }

  // undo soft delete
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
