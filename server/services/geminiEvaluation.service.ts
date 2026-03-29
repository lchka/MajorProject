import { GoogleGenerativeAI } from "@google/generative-ai";
import {
	evaluationResultJsonSchema,
	type EvaluationResultJsonDto,
} from "../types/evaluationContext.dto";
import { HttpError, INTERNAL_SERVER_ERROR } from "../utils/HttpError";

export type GeminiEvaluationInput = {
	productName: string;
	productBrand?: string;
	productCategory?: string;
	ingredients: string[];
	allergens: string[];
	conditions: string[];
	preferences: string[];
	promptText?: string;
};

const evaluationPromptTemplate = `
You are a cosmetics safety evaluator.
Evaluate whether this product is suitable for a user profile.
Return ONLY valid JSON with this exact shape:
{
  "status": "safe | caution | avoid",
  "score": 0,
  "summary": "string",
  "reasons": ["string"],
  "matched_allergens": ["string"],
  "matched_conditions": ["string"],
  "matched_preferences": ["string"]
}

Rules:
- status must be one of: safe, caution, avoid.
- score must be a number from 0 to 100.
- If any allergen match is present, status should usually be avoid.
- Do not include markdown or extra keys.
`;

export class GeminiEvaluationService {
	private model: ReturnType<GoogleGenerativeAI["getGenerativeModel"]> | null = null;

	private getModel() {
		if (this.model) {
			return this.model;
		}

		const apiKey = process.env.GEMINI_API_KEY;
		if (!apiKey) {
			throw new HttpError(
				INTERNAL_SERVER_ERROR,
				"GEMINI_API_KEY is missing. Add it to your server environment.",
			);
		}

		const gemini = new GoogleGenerativeAI(apiKey);
		this.model = gemini.getGenerativeModel({
			model: process.env.GEMINI_MODEL ?? "gemini-2.5-flash",
		});

		return this.model;
	}

	private extractJson(text: string): Record<string, unknown> {
		const firstBrace = text.indexOf("{");
		const lastBrace = text.lastIndexOf("}");
		if (firstBrace === -1 || lastBrace === -1 || lastBrace < firstBrace) {
			throw new Error("No JSON object found in Gemini response");
		}

		return JSON.parse(text.slice(firstBrace, lastBrace + 1)) as Record<string, unknown>;
	}

	private normalizeResult(parsed: Record<string, unknown>): EvaluationResultJsonDto {
		const candidate = {
			status: parsed.status,
			score: parsed.score,
			summary: parsed.summary,
			reasons: parsed.reasons,
			matched_allergens: parsed.matched_allergens,
			matched_conditions: parsed.matched_conditions,
			matched_preferences: parsed.matched_preferences,
		};

		const validated = evaluationResultJsonSchema.parse(candidate);
		return {
			status: validated.status ?? "caution",
			score: validated.score ?? 50,
			summary: validated.summary ?? "Evaluation generated",
			reasons: validated.reasons ?? [],
			matched_allergens: validated.matched_allergens ?? [],
			matched_conditions: validated.matched_conditions ?? [],
			matched_preferences: validated.matched_preferences ?? [],
		};
	}

	async evaluate(input: GeminiEvaluationInput): Promise<EvaluationResultJsonDto> {
		const model = this.getModel();
		const context = {
			product: {
				name: input.productName,
				brand: input.productBrand ?? "",
				category: input.productCategory ?? "Other",
				ingredients: input.ingredients,
			},
			profile: {
				allergens: input.allergens,
				conditions: input.conditions,
				preferences: input.preferences,
			},
			prompt: input.promptText ?? "",
		};

		const prompt = `${evaluationPromptTemplate}\n\nInput JSON:\n${JSON.stringify(context)}`;
		const result = await model.generateContent(prompt);
		const responseText = result.response.text();
		if (!responseText) {
			throw new Error("Gemini returned an empty evaluation response");
		}

		const parsed = this.extractJson(responseText);
		return this.normalizeResult(parsed);
	}
}

export default new GeminiEvaluationService();
