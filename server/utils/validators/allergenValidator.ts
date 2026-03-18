import { z } from "zod";

export const allergenSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Allergen must be at least 2 characters")
    .max(100, "Allergen name must be at most 100 characters"),
  description: z
    .string()
    .trim()
    .min(2, "Allergen description must be at    least 2 characters")
    .max(500, "Allergen description must be at most 500 characters"),
});

export const updateAllergenSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Allergen name must be at least 2 characters")
      .max(100, "Allergen name must be at most 100 characters")
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
