import prisma from "../lib/prisma";
import {
  CreatePromptDto,
  PromptResponseDto,
  promptResponseSchema,
  UpdatePromptDto,
} from "../types/prompt.dto";
import { HttpError, NOT_FOUND } from "../utils/HttpError";

export class PromptService {
  async createPrompt(data: CreatePromptDto): Promise<PromptResponseDto> {
    const prompt = await prisma.prompt.create({
      data: {
        prompt_text: data.prompt_text,
        category: data.category,
      },
    });
    return promptResponseSchema.parse(prompt);
  }

  async getPromptById(id: number): Promise<PromptResponseDto> {
    const prompt = await prisma.prompt.findUnique({
      where: { id },
    });
    if (!prompt) {
      throw new HttpError(NOT_FOUND, `Prompt with id '${id}' not found`);
    }
    return promptResponseSchema.parse(prompt);
  }

  async getAllPrompts(): Promise<PromptResponseDto[]> {
    const prompts = await prisma.prompt.findMany({
      orderBy: {
        category: "desc",
      },
    });
    return promptResponseSchema.array().parse(prompts);
  }

  async updatePrompt(
    id: number,
    data: UpdatePromptDto,
  ): Promise<PromptResponseDto> {
    const existingPrompt = await prisma.prompt.findUnique({
      where: { id },
    });
    if (!existingPrompt) {
      throw new HttpError(NOT_FOUND, `Prompt with id '${id}' not found`);
    }
    const updatedPrompt = await prisma.prompt.update({
      where: { id },
      data,
    });
    return promptResponseSchema.parse(updatedPrompt);
  }

  async deletePrompt(id: number): Promise<{ message: string }> {
    const existingPrompt = await prisma.prompt.findUnique({
      where: { id },
    });
    if (!existingPrompt) {
      throw new HttpError(NOT_FOUND, `Prompt with id '${id}' not found`);
    }

    await prisma.prompt.delete({ where: { id } });

    return { message: `Prompt with id '${id}' deleted successfully` };
  }
}
