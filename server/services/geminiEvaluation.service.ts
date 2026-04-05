import { GoogleGenerativeAI } from "@google/generative-ai";
import {
	evaluationResultJsonSchema,
	type EvaluationResultJsonDto,
} from "../types/evaluationContext.dto";
import { HttpError, INTERNAL_SERVER_ERROR } from "../utils/HttpError";
import {
	formatChunksForPrompt,
	retrieveRelevantChunks,
	type RagChunkMatch,
} from "../RAG/src/retrieve.service";

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
	"matched_preferences": ["string"],
	"citations": ["'title' by 'author' from 'year of release'"]
}
Rules:
- status must be one of: safe, caution, avoid.
- score must be a number from 0 to 100.
- If any allergen match is present, status should usually be avoid.
- Include citations only when evidence from the provided research context supports your reasoning.
- Do not include markdown or extra keys.
-Citations simply mention title and author do NOT references lines from the papers
-Summary should be objective 
`;

const toCitationText = (match: Pick<RagChunkMatch, "title" | "author">): string => {
	const title = match.title?.trim() || "Untitled source";
	const author = match.author?.trim() || "Unknown author";
	return `as mentioned '${title}' by '${author}'`;
};

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
			citations: parsed.citations,
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
			citations: validated.citations ?? [],
		};
	}

	async evaluate(input: GeminiEvaluationInput): Promise<EvaluationResultJsonDto> {
		const model = this.getModel();

		const ragQuestion = [
			`Product: ${input.productName}`,
			input.productBrand ? `Brand: ${input.productBrand}` : "",
			`Category: ${input.productCategory ?? "Other"}`,
			`Ingredients: ${input.ingredients.join(", ")}`,
			input.conditions.length > 0 ? `Skin conditions: ${input.conditions.join(", ")}` : "",
			input.allergens.length > 0 ? `Allergens: ${input.allergens.join(", ")}` : "",
			input.preferences.length > 0 ? `Preferences: ${input.preferences.join(", ")}` : "",
			"Find relevant evidence from indexed skincare PDFs to support a safety evaluation.",
		]
			.filter(Boolean)
			.join("\n");

		let ragContext = "No supporting context was retrieved.";
		let ragCitations: string[] = [];

		try {
			const matches = await retrieveRelevantChunks({ question: ragQuestion, topK: 6 });
			ragContext = formatChunksForPrompt(matches);
			ragCitations = [...new Set(matches.map((match) => toCitationText(match)))];
		} catch {
			// Continue without RAG context when vector retrieval fails.
		}

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
			research_context: ragContext,
			candidate_citations: ragCitations,
		};

		const prompt = `${evaluationPromptTemplate}\n\nInput JSON:\n${JSON.stringify(context)}`;
		const result = await model.generateContent(prompt);
		const responseText = result.response.text();
		if (!responseText) {
			throw new Error("Gemini returned an empty evaluation response");
		}

		const parsed = this.extractJson(responseText);
		const normalized = this.normalizeResult(parsed);

		if ((!normalized.citations || normalized.citations.length === 0) && ragCitations.length > 0) {
			normalized.citations = ragCitations;
		}

		return normalized;
	}
}

export default new GeminiEvaluationService();
