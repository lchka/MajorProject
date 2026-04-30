import { z } from "zod";

export const conditionResponseSchema = z.object({
  id: z.string().uuid("Condition id must be a valid UUID"),
  name: z.string().min(1, "Condition name is required"),
  description: z.string().min(1, "Condition description is required"),
  createdAt: z.date(),
  updatedAt: z.date(),
  usedCount: z.number().optional(),
});

export const createConditionSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Condition name must be at least 2 characters")
    .max(100, "Condition name must be at most 100 characters"),
  description: z
    .string()
    .trim()
    .min(2, "Condition description must be at least 2 characters")
    .max(500, "Condition description must be at most 500 characters"),
});

export const updateConditionSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Condition name must be at least 2 characters")
      .max(100, "Condition name must be at most 100 characters")
      .optional(),
    description: z
      .string()
      .trim()
      .min(2, "Condition description must be at least 2 characters")
      .max(500, "Condition description must be at most 500 characters")
      .optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided for update",
  });

export type ConditionResponseDto = z.infer<typeof conditionResponseSchema>;
export type CreateConditionDto = z.infer<typeof createConditionSchema>;
export type UpdateConditionDto = z.infer<typeof updateConditionSchema>;
