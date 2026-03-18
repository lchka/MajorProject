import prisma from "../lib/prisma.js";
import { HttpError } from "../utils/HttpError.js";
import {
  CreateConditionDto,
  ConditionResponseDto,
  UpdateConditionDto,
} from "../types/condition.dto.js";

export class ConditionService {
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
    const condition = await prisma.condition.findUnique({ where: { id } });

    if (!condition) {
      throw new HttpError(404, "Condition not found");
    }

    return condition;
  }

  async getAllConditions(): Promise<ConditionResponseDto[]> {
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
    const existingCondition = await prisma.condition.findUnique({
      where: { id },
    });

    if (!existingCondition) {
      throw new HttpError(404, "Condition not found");
    }

    const updatedCondition = await prisma.condition.update({
      where: { id },
      data,
    });

    return updatedCondition;
  }

  async deleteCondition(id: string): Promise<{ message: string }> {
    const existingCondition = await prisma.condition.findUnique({
      where: { id },
    });

    if (!existingCondition) {
      throw new HttpError(404, "Condition not found");
    }

    await prisma.condition.delete({ where: { id } });

    return { message: "Condition deleted successfully" };
  }
}

export default new ConditionService();
