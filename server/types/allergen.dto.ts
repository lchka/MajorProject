import { z } from "zod";

export const allergenResponseSchema = z.object({
	id: z.string().uuid("Allergen id must be a valid UUID"),
	name: z.string().min(1, "Allergen name is required"),
	description: z.string().min(1, "Allergen description is required"),
	createdAt: z.date(),
	updatedAt: z.date(),
});

export const createAllergenSchema = z.object({
	name: z
		.string()
		.trim()
		.min(2, "Allergen name must be at least 2 characters")
		.max(100, "Allergen name must be at most 100 characters"),
	description: z
		.string()
		.trim()
		.min(2, "Allergen description must be at least 2 characters")
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
			.min(2, "Allergen description must be at least 2 characters")
			.max(500, "Allergen description must be at most 500 characters")
			.optional(),
	})
	.refine((data) => Object.keys(data).length > 0, {
		message: "At least one field must be provided for update",
	});

export type AllergenResponseDto = z.infer<typeof allergenResponseSchema>;
export type CreateAllergenDto = z.infer<typeof createAllergenSchema>;
export type UpdateAllergenDto = z.infer<typeof updateAllergenSchema>;
