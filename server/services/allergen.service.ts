import prisma from "../lib/prisma";
import { HttpError } from "../utils/HttpError";

import {
  CreateAllergenDto,
  AllergenResponseDto,
  UpdateAllergenDto,
} from "../types/allergen.dto";

export class AllergenService {
  //create a new allergen
  async createAllergen(data: CreateAllergenDto): Promise<AllergenResponseDto> {
    const allergen = await prisma.allergen.create({
      data: {
        name: data.name,
        description: data.description,
      },
    });
    return allergen;
  }

  //get allergen by id
  async getAllergenById(id: string): Promise<AllergenResponseDto> {
    const allergen = await prisma.allergen.findUnique({ where: { id } });

    if (!allergen) {
      throw new HttpError(404, "Allergen not found");
    }
    return allergen;
  }

  async getAllAllergens(): Promise<AllergenResponseDto[]> {
    return prisma.allergen.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  async updateAllergen(
    id: string,
    data: UpdateAllergenDto,
  ): Promise<AllergenResponseDto> {
    const existingAllergen = await prisma.condition.findUnique({
      where: { id },
    });

    if (!existingAllergen) {
      throw new HttpError(404, "Allergen Not Found");
    }
    const updatedAllergen = await prisma.allergen.update({
      where: { id },
      data,
    });
    return updatedAllergen;
  }
}
