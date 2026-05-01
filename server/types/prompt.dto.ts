import {z} from "zod"
// DTOs and validation schemas for prompts, using zod for schema definitions and type inference
export const categoryEnum = z.enum([
    "Shampoo", 
    "Deodorant & Antiperspirant",
    "Cleanser",
    "Scrub",
    "Conditioner",
    "Body Wash",
    "Moisturiser",
    "Serum",
    "Other"
])

export const promptResponseSchema= z.object({
      id: z.string().uuid("Prompt id must be a valid UUID"),
    prompt_text:z.string().min(1, "Prompt text is required"),
    category:categoryEnum,
    createdAt: z.date(),
    updatedAt: z.date(),
})

export const createPromptSchema = z.object({
    prompt_text:z.string().trim().min(10, "Prompt text must have minimum 10 characters"),
    category:categoryEnum,
})
export const updatePromptSchema = z.object({
    prompt_text:z.string().trim().min(10, "Prompt text must have minimum 10 characters").optional(),
    category:categoryEnum.optional(),
})

export type PromptResponseDto =z.infer<typeof promptResponseSchema>
export type CreatePromptDto  = z.infer<typeof createPromptSchema>
export type UpdatePromptDto = z.infer<typeof updatePromptSchema>
export type Category = z.infer<typeof categoryEnum>;