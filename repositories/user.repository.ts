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
        profile: true,
        role: true,
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
      where: {
        deletedAt: null,
      },
      include: {
        profile: true,
        role: true,
      },
    });
  }

  async updateProfile(userId: string, data: {
    first_name?: string;
    last_name?: string;
    nickname?: string;
    age?: number;
  }) {
    return await prisma.profile.update({
      where: { userId },
      data,
    });
  }

  async softDelete(id: string) {
    return await prisma.user.update({
      where: { id },
      data: { deletedAt: new Date() },
      include: {
        profile: true,
        role: true,
      },
    });
  }

  async forceDelete(id: string) {
    // Delete profile first (due to foreign key constraint)
    await prisma.profile.deleteMany({
      where: { userId: id },
    });
    
    return await prisma.user.delete({
      where: { id },
    });
  }

  async restore(id: string) {
    return await prisma.user.update({
      where: { id },
      data: { deletedAt: null },
      include: {
        profile: true,
        role: true,
      },
    });
  }
}

export default new UserRepository();
