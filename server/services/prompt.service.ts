import prisma from "../lib/prisma";
import { HttpError } from "../utils/HttpError";
import { CreatePromptDto, UpdatePromptDto, PromptResponseDto } from "../types/prompt.dto";

export class PromptService{
    
async createPrompt (data:CreatePromptDto):Promise<PromptResponseDto>{
    const prompt = await prisma.prompt.create({
        data:{
            prompt_text:data.prompt_text,
            category:data.category,
        }
    })
    return prompt;
}

}