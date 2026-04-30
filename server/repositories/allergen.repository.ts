import prisma from "../lib/prisma.js";
import type { Prisma } from "@prisma/client";

export class AllergenRepository {
  // newest allergens first + usage count
  async findAll() {
    const allergens = await prisma.allergen.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        profiles: true,
      },
    });

    return allergens.map((a) => ({
      ...a,
      usedCount: a.profiles.length,
    }));
  }

  // get one allergen by id
  async findById(id: string) {
    return await prisma.allergen.findUnique({
      where: { id },
      include: {
        profiles: true,
      },
    });
  }

  // get one allergen by name
  async findByName(name: string) {
    return await prisma.allergen.findFirst({
      where: { name },
    });
  }

  // create allergen record
  async create(data: Prisma.AllergenCreateInput) {
    return await prisma.allergen.create({
      data,
    });
  }

  // update allergen fields
  async update(id: string, data: Prisma.AllergenUpdateInput) {
    return await prisma.allergen.update({
      where: { id },
      data,
    });
  }

  // hard delete allergen
  async delete(id: string) {
    return await prisma.allergen.delete({
      where: { id },
    });
  }
}

export default new AllergenRepository();