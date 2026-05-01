import { z } from "zod";
//  DTOs and validation schemas for user preferences, using zod for schema definitions and type inference
export const preferenceSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Preference name must be at least 2 characters")
    .max(100, "Preference name must be at most 100 characters"),
  description: z
    .string()
    .trim()
    .min(2, "Allergen description must be at least 2 characters")
    .max(100, "Allergen description must be at most 500 characters"),
});

export const updateAllergenSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Preference name must be at least 2 characters")
      .max(100, "Preference name must be at most 100 characters"),
    description: z
      .string()
      .trim()
      .min(2, "Allergen description must be at least 2 characters")
      .max(100, "Allergen description must be at most 500 characters"),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided for update",
  });
