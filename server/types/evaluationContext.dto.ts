import { z } from "zod";

const normalizeEvaluationContextInput = (value: unknown): unknown => {
	if (!value || typeof value !== "object") {
		return value;
	}

	const input = value as Record<string, unknown>;

	return {
		...input,
		profileId: input.profileId ?? input.profile_id,
		productId: input.productId ?? input.product_id,
		promptId: input.promptId ?? input.prompt_id,
		resultJson: input.resultJson ?? input.result_json,
	};
};

export const evaluationResultJsonSchema = z
	.object({
		status: z.enum(["safe", "caution", "avoid"]).optional(),
		score: z.number().min(0).max(100).optional(),
		summary: z.string().min(1).optional(),
		reasons: z.array(z.string().min(1)).optional(),
		matched_allergens: z.array(z.string().min(1)).optional(),
		matched_conditions: z.array(z.string().min(1)).optional(),
		matched_preferences: z.array(z.string().min(1)).optional(),
		citations: z.array(z.string().min(1)).optional(),
	})
	.passthrough();

export const evaluationContextResponseSchema = z.object({
	id: z.string().uuid("Evaluation context id must be a valid UUID"),
	profileId: z.string().uuid("Profile id must be a valid UUID"),
	productId: z.string().uuid("Product id must be a valid UUID"),
	promptId: z.string().uuid("Prompt id must be a valid UUID").nullable().optional(),
	resultJson: z.json(),
	createdAt: z.date(),
	updatedAt: z.date(),
});

export const createEvaluationContextSchema = z.preprocess(
	normalizeEvaluationContextInput,
	z.object({
		profileId: z.string().uuid("Profile id must be a valid UUID"),
		productId: z.string().uuid("Product id must be a valid UUID"),
		promptId: z.string().uuid("Prompt id must be a valid UUID").optional(),
		resultJson: z.union([evaluationResultJsonSchema, z.json()]),
	}),
);

export const updateEvaluationContextSchema = z.preprocess(
	normalizeEvaluationContextInput,
	z
		.object({
			profileId: z.string().uuid("Profile id must be a valid UUID").optional(),
			productId: z.string().uuid("Product id must be a valid UUID").optional(),
			promptId: z
				.string()
				.uuid("Prompt id must be a valid UUID")
				.nullable()
				.optional(),
			resultJson: z.union([evaluationResultJsonSchema, z.json()]).optional(),
		})
		.refine((data) => Object.keys(data).length > 0, {
			message: "At least one field must be provided for update",
		}),
);

export const evaluateProductRequestSchema = z.preprocess(
	normalizeEvaluationContextInput,
	z.object({
		productId: z.string().uuid("Product id must be a valid UUID"),
		profileId: z.string().uuid("Profile id must be a valid UUID"),
		promptId: z.string().uuid("Prompt id must be a valid UUID").optional(),
	}),
);

export type EvaluationResultJsonDto = z.infer<typeof evaluationResultJsonSchema>;
export type EvaluationContextResponseDto = z.infer<typeof evaluationContextResponseSchema>;
export type CreateEvaluationContextDto = z.infer<typeof createEvaluationContextSchema>;
export type UpdateEvaluationContextDto = z.infer<typeof updateEvaluationContextSchema>;
export type EvaluateProductRequestDto = z.infer<typeof evaluateProductRequestSchema>;
