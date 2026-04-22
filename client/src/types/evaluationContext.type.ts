import { z } from "zod";

export const EvaluationStatusEnum = z.enum(["safe", "caution", "avoid"]);
export type EvaluationStatus = z.infer<typeof EvaluationStatusEnum>;

export const DangerousIngredientSchema = z.object({
  ingredient: z.string(),
  danger_level: z.number(),
  reason: z.string().optional(),
});
export type DangerousIngredient = z.infer<typeof DangerousIngredientSchema>;

export const CitationSourceSchema = z.object({
  title: z.string(),
  lead_author: z.string(),
  year: z.number().nullable(),
  url: z.string(),
});
export type CitationSource = z.infer<typeof CitationSourceSchema>;

export const EvaluationResultJsonSchema = z.object({
  status: EvaluationStatusEnum.optional(),
  score: z.number().optional(),
  summary: z.string().optional(),
  reasons: z.array(z.string()).optional(),
  matched_allergens: z.array(z.string()).optional(),
  matched_conditions: z.array(z.string()).optional(),
  matched_preferences: z.array(z.string()).optional(),
  profile_allergens: z.array(z.string()).optional(),
  profile_conditions: z.array(z.string()).optional(),
  profile_preferences: z.array(z.string()).optional(),
  all_ingredients: z.array(z.string()).optional(),
  dangerous_ingredients: z.array(DangerousIngredientSchema).optional(),
  citations: z.array(z.string()).optional(),
  citation_links: z.array(z.string()).optional(),
  citation_sources: z.array(CitationSourceSchema).optional(),
}).catchall(z.unknown());
export type EvaluationResultJson = z.infer<typeof EvaluationResultJsonSchema>;

export const EvaluationContextSchema = z.object({
  id: z.string(),
  profileId: z.string(),
  productId: z.string(),
  promptId: z.string().nullable().optional(),
  resultJson: EvaluationResultJsonSchema,
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type EvaluationContext = z.infer<typeof EvaluationContextSchema>;

export const EvaluateProductInputSchema = z.object({
  productId: z.string(),
  profileId: z.string(),
  promptId: z.string().optional(),
});
export type EvaluateProductInput = z.infer<typeof EvaluateProductInputSchema>;

export const PersistEvaluationInputSchema = z.object({
  evaluationContextId: z.string().optional(),
  productId: z.string(),
  profileId: z.string(),
  promptId: z.string().optional(),
  resultJson: EvaluationResultJsonSchema,
});
export type PersistEvaluationInput = z.infer<typeof PersistEvaluationInputSchema>;