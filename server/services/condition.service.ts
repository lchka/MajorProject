import prisma from "../lib/prisma.js";
import { HttpError } from "../utils/HttpError.js";
import {
  CreateConditionDto,
  ConditionResponseDto,
  UpdateConditionDto,
} from "../types/condition.dto.js";

export class ConditionService {
  // create a new condition
  async createCondition(
    data: CreateConditionDto,
  ): Promise<ConditionResponseDto> {
    const condition = await prisma.condition.create({
      data: {
        name: data.name,
        description: data.description,
      },
    });

    return condition;
  }

  async getConditionById(id: string): Promise<ConditionResponseDto> {
    // get one condition by id
    const condition = await prisma.condition.findUnique({ where: { id } });

    if (!condition) {
      throw new HttpError(404, "Condition not found");
    }

    return condition;
  }

  async getAllConditions(): Promise<ConditionResponseDto[]> {
    // list conditions newest first
    return prisma.condition.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  async updateCondition(
    id: string,
    data: UpdateConditionDto,
  ): Promise<ConditionResponseDto> {
    // make sure condition exists first
    const existingCondition = await prisma.condition.findUnique({
      where: { id },
    });

    if (!existingCondition) {
      throw new HttpError(404, "Condition not found");
    }

    // patch condition fields
    const updatedCondition = await prisma.condition.update({
      where: { id },
      data,
    });

    return updatedCondition;
  }

  async deleteCondition(id: string): Promise<{ message: string }> {
    // make sure condition exists first
    const existingCondition = await prisma.condition.findUnique({
      where: { id },
    });

    if (!existingCondition) {
      throw new HttpError(404, "Condition not found");
    }

    // hard delete condition
    await prisma.condition.delete({ where: { id } });

    return { message: "Condition deleted successfully" };
  }

  async getProfileConditions(profileId: string): Promise<ConditionResponseDto[]> {
    const profile = await prisma.profile.findUnique({
      where: { id: profileId },
      select: {
        conditions: {
          orderBy: { name: "asc" },
        },
      },
    });

    if (!profile) {
      throw new HttpError(404, "Profile not found");
    }

    return profile.conditions;
  }
}

export default new ConditionService();
