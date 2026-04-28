import { z } from "zod";

// shared shape for linked items on a profile
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

// response shape when sending profile + linked lists
export const profileResponseSchema = z.object({
  id: z.string().uuid("Profile id must be a valid UUID"),
  userId: z.string().uuid("User id must be a valid UUID"),
  first_name: z.string().min(1, "First Name is required"),
  last_name: z.string().optional().default(""),
  age: z.string().trim().optional().nullable(),
  profile_image: imageValid.optional().nullable(),
  main_profile: z.boolean(),
  isComplete: z.boolean(),
  conditions: z.array(relationItemSchema),
  allergens: z.array(relationItemSchema),
  preferences: z.array(relationItemSchema),
});

// create payload for profile + optional linked ids
export const createProfileSchema = z.object({
  first_name: z
    .string()
    .trim()
    .min(2, "First Name must be at least 2 characters")
    .max(100, "First Name must not exceed 100 characters"),

  last_name: z
    .string()
    .trim()
    .max(100, "Last Name must not exceed 100 characters")
    .optional()
    .refine(
      (value) => value === undefined || value.length === 0 || value.length >= 2,
      "Last Name must be at least 2 characters",
    ),

  age: z.string().trim().optional(),
  profile_image: imageValid.optional(),
  main_profile: z.boolean().optional(),

  // ids to link on create (optional)
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

// update payload (partial)
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

    // if passed, these replace current links
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

export type ProfileResponseDTO = z.infer<typeof profileResponseSchema>;
export type CreateProfileDTO = z.infer<typeof createProfileSchema>;
export type UpdateProfileDTO = z.infer<typeof updateProfileSchema>;