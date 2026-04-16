import { z } from "zod";
import { OptionalImageFileSchema } from "./general.schema";
import { relationIdsSchema } from "./general.schema";
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