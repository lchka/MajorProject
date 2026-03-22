import { z } from "zod";

const relationItemSchema = z.object({
  id: z.string().uuid("Relation id must be a valid UUID"),
  name: z.string().min(1, "Relation name is required"),
  description: z.string().min(1, "Relation description is required"),
});

export const imageValid = z
  .string()
  .trim()
  .url("Image URL must be a valid URL")
  .refine((url) => /\.(jpg|jpeg|png|webp|gif|svg)(\?.*)?$/i.test(url), {
    message: "Image URL must end with .jpg, .jpeg, .png, .webp, .gif, or .svg",
  });

export const profileResponseSchema = z.object({
  id: z.string().uuid("Profile id must be a valid UUID"),
  userId: z.string().uuid("User id must be a valid UUID"),
  first_name: z.string().min(1, "First Name is required"),
  last_name: z.string().min(1, "Last Name is required"),
  age: z.string().trim().optional().nullable(),
  profile_image: imageValid.optional().nullable(),
  main_profile: z.boolean(),
  isComplete: z.boolean(),
  conditions: z.array(relationItemSchema),
  allergens: z.array(relationItemSchema),
  preferences: z.array(relationItemSchema),
});

export const createProfileSchema = z.object({
  first_name: z
    .string()
    .trim()
    .min(2, "First Name must be at least 2 characters")
    .max(100, "First Name must not exceed 100 characters"),
  last_name: z
    .string()
    .trim()
    .min(2, "Last Name must be at least 2 characters")
    .max(100, "Last Name must not exceed 100 characters"),
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

export const updateProfileSchema = z.object({
  first_name: z
    .string()
    .trim()
    .min(2, "First Name must be at least 2 characters")
    .max(100, "First Name must not exceed 100 characters")
    .optional(),
  last_name: z
    .string()
    .trim()
    .min(2, "Last Name must be at least 2 characters")
    .max(100, "Last Name must not exceed 100 characters")
    .optional(),
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
});

export type ProfileResponseDTO = z.infer<typeof profileResponseSchema>;

export type CreateProfileDTO = z.infer<typeof createProfileSchema>;

export type UpdateProfileDTO = z.infer<typeof updateProfileSchema>;
