import { z } from "zod";
//  DTOs and validation schemas for user profiles, using zod for schema definitions and type inference
const imageValid = z
  .string()
  .trim()
  .url("Image URL must be a valid URL")
  .refine((url) => /\.(jpg|jpeg|png|webp|gif|svg)(\?.*)?$/i.test(url), {
    message: "Image URL must end with .jpg, .jpeg, .png, .webp, .gif, or .svg",
  });

export const profileSchema = z.object({
  first_name: z
    .string()
    .trim()
    .min(2, "First Name must be at least 2 characters")
    .max(100, "First Name must not exceed 100 characters"),

  last_name: z
    .string()
    .trim()
    .optional()
    .refine(
      (val) => val === undefined || val.length === 0 || val.length >= 2,
      "Last Name must be at least 2 characters",
    )
    .refine(
      (val) => val === undefined || val.length <= 100,
      "Last Name must not exceed 100 characters",
    ),

  age: z.string().trim().optional(),
  profile_image: imageValid.optional(),

  conditionIds: z
    .array(z.string().uuid("Condition id must be a valid UUID"))
    .optional(),
  allergenIds: z
    .array(z.string().uuid("Allergen id must be a valid UUID"))
    .optional(),
  preferenceIds: z
    .array(z.string().uuid("Preference id must be a valid UUID"))
    .optional(),
});

export const updateProfileSchema = z
  .object({
    first_name: z
      .string()
      .trim()
      .min(2, "First Name must be at least 2 characters")
      .max(100, "First Name must not exceed 100 characters")
      .optional(),

    last_name: z
      .string()
      .trim()
      .optional()
      .refine(
        (val) => val === undefined || val.length === 0 || val.length >= 2,
        "Last Name must be at least 2 characters",
      )
      .refine(
        (val) => val === undefined || val.length <= 100,
        "Last Name must not exceed 100 characters",
      ),

    age: z.string().trim().optional(),
    profile_image: imageValid.optional().nullable(),

    conditionIds: z
      .array(z.string().uuid("Condition id must be a valid UUID"))
      .optional(),
    allergenIds: z
      .array(z.string().uuid("Allergen id must be a valid UUID"))
      .optional(),
    preferenceIds: z
      .array(z.string().uuid("Preference id must be a valid UUID"))
      .optional(),

    main_profile: z.boolean().optional(),
    isComplete: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided for update",
  });

export type ProfileInput = z.infer<typeof profileSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;