import prisma from "../lib/prisma.js";
import { HttpError } from "../utils/HttpError.js";

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
    const existingAllergen = await prisma.allergen.findUnique({
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

  async deleteAllergen (id:string):Promise<{message:string}>{
    const existingAllergen  =await prisma.allergen.findUnique({where:{id}})

    if(!existingAllergen){
        throw new HttpError (404,"Allergen not found")
    }
    await prisma.allergen.delete({where:{id}})
    return {message:"Allergen deleted successfully"}
  }

  async getProfileAllergens(profileId: string): Promise<AllergenResponseDto[]> {
    const profile = await prisma.profile.findUnique({
      where: { id: profileId },
      select: {
        allergens: {
          orderBy: { name: "asc" },
        },
      },
    });

    if (!profile) {
      throw new HttpError(404, "Profile not found");
    }

    return profile.allergens;
  }
}
export default new AllergenService();