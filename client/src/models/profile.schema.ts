import { z } from "zod";
import { OptionalImageFileSchema,relationIdsSchema } from "./general.schema";
// The profileBaseSchema defines the base structure for profile data, including fields for first name, last name, age, profile image, and related condition, allergen, and preference IDs. The createProfileSchema is identical to the base schema and is used for validating new profile creation. The updateProfileSchema extends the base schema with optional fields for isComplete and main_profile, allowing for partial updates to existing profiles. Both schemas utilize Zod for validation and provide clear error messages for invalid inputs.
const nameSchema = z
	.string()
	.trim()
	.min(2, "Must be at least 2 characters")
	.max(100, "Must not exceed 100 characters");


export const profileBaseSchema = z.object({
	first_name: nameSchema,
	last_name: nameSchema.optional(),
	age: z.string().trim().optional(),
	profile_image: OptionalImageFileSchema,
	conditionIds: relationIdsSchema.optional(),
	allergenIds: relationIdsSchema.optional(),
	preferenceIds: relationIdsSchema.optional(),
});

export const createProfileSchema = profileBaseSchema;

export const updateProfileSchema = profileBaseSchema
	.partial()
	.extend({
		isComplete: z.boolean().optional(),
		main_profile: z.boolean().optional(),
	});

export type CreateProfileInput = z.infer<typeof createProfileSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;