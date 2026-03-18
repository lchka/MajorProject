import { z } from "zod";

export const preferenceResponseSchema = z.object({
  id: z.string().uuid("Preference id must be a valid UUID"),
  name: z.string().min(1, "Preference name is required"),
  description: z.string().min(1, "Preference description is required"),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const createPreferenceSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Preference name must be at least 2 characters")
    .max(100, "Preference name must be at most 100 characters"),
  description: z
    .string()
    .trim()
    .min(2, "Preference description must be at least 2 characters")
    .max(500, "Preference description must be at most 500 characters"),
});

export const updatePreferenceSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Preference name must be at least 2 characters")
      .max(100, "Preference name must be at most 100 characters")
      .optional(),
    description: z
      .string()
      .trim()
      .min(2, "Preference description must be at least 2 characters")
      .max(500, "Preference description must be at most 500 characters")
      .optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided for update",
  });

export type PreferenceResponseDto = z.infer<typeof preferenceResponseSchema>;
export type CreatePreferenceDto = z.infer<typeof createPreferenceSchema>;
export type UpdatePreferenceDto = z.infer<typeof updatePreferenceSchema>;
