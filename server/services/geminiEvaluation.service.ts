import { GoogleGenerativeAI } from "@google/generative-ai";
import {
	evaluationResultJsonSchema,
	type EvaluationResultJsonDto,
} from "../types/evaluationContext.dto";
import { HttpError, INTERNAL_SERVER_ERROR } from "../utils/HttpError";
import { formatChunksForPrompt, retrieveRelevantChunks, type RagChunkMatch } from "../RAG/src/retrieve.service";

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

const MAX_CITATION_REFERENCES = 3;


const evaluationPromptTemplate = `
You are a cosmetics safety evaluator.
Evaluate whether this product is suitable for a user profile.
Return ONLY valid JSON with this exact shape:
{
  "status": "safe | caution | avoid",
  "score": 0,
  "summary": "string",
  "profile_conditions",
  "profile_allergens",
  "profile_preferences",
  "reasons": ["string"],
  "matched_allergens": ["string"],
  "matched_conditions": ["string"],
	"matched_preferences": ["string"],
	"all_ingredients": ["string"],
	"dangerous_ingredients": [
		{
			"ingredient": "string",
			"danger_level": 0,
			"reason": "string"
		}
	],
	"citations": ["Title - Lead Author (Year) - URL"],
	"citation_links": ["https://..."],
	"citation_sources": [
		{
			"title": "string",
			"lead_author": "string",
			"year": 2024,
			"url": "https://..."
		}
	]
}
Rules:
- status must be one of: safe, caution, avoid.
- score must be a number from 0 to 100, be reasonable.
- If any allergen match is present, status should usually be avoid.
- Do not include markdown or extra keys.
- Summary should be objective and not mention the user.
- all_ingredients must include every ingredient from input product.ingredients.
- dangerous_ingredients must list only ingredients from all_ingredients and each danger_level must be between 0 and 10.
- dangerous_ingredients should be ordered by highest danger_level first.
- Do not mention papers, studies, journals, authors, citations, or research context in summary or reasons.
- citations, citation_links, and citation_sources may contain only official entries from candidate_citation_sources.
- Return at most 3 references across citations, citation_links, and citation_sources.
`;

type OfficialCitationSource = {
	title: string;
	lead_author: string;
	year: number | null;
	url: string;
	keywords: string[];
};

const OFFICIAL_CITATION_SOURCES: OfficialCitationSource[] = [
	{
		title:
			"A daily regimen of a ceramide-dominant moisturizing cream and cleanser restores the skin permeability barrier in adults with moderate eczema: A randomized trial",
		lead_author: "B. D. Lynde",
		year: 2021,
		url: "https://onlinelibrary.wiley.com/doi/epdf/10.1111/dth.14970",
		keywords: ["ceramide", "moisturizing cream", "skin permeability barrier", "moderate ecz"],
	},
	{
		title: "A review on the role of moisturizers for atopic dermatitis",
		lead_author: "Worrawatpatrapong",
		year: 2016,
		url: "https://synapse.koreamed.org/upload/synapsedata/pdfdata/0253apa/apa-6-120.pdf",
		keywords: ["role of moisturizers", "atopic dermatitis"],
	},
	{
		title: "Effects of tocotrienol on aging skin: A systematic review",
		lead_author: "Nur Afiqah Baharudin",
		year: 2022,
		url: "https://www.frontiersin.org/journals/pharmacology/articles/10.3389/fphar.2022.1006198/full",
		keywords: ["tocotrienol", "aging skin", "systematic review"],
	},
	{
		title: "Epidermal Barrier Dysfunction in Atopic Dermatitis",
		lead_author: "Ana Rua",
		year: null,
		url: "https://revista.spdv.com.pt/index.php/spdv/article/view/1405",
		keywords: ["epidermal barrier dysfunction", "atopic dermatitis"],
	},
	{
		title: "Lipid-based formulations in cosmeceuticals and biopharmaceuticals",
		lead_author: "Aniruddha Chatterjee",
		year: 2020,
		url: "https://link.springer.com/content/pdf/10.1186/s41702-020-00062-9.pdf",
		keywords: ["lipid-based formulations", "cosmeceuticals", "biopharmaceuticals"],
	},
	{
		title:
			"Study of the protective effects of cosmetic ingredients on the skin barrier, based on the expression of barrier-related genes and cytokines",
		lead_author: "Xiangyi Li",
		year: 2022,
		url: "https://link.springer.com/content/pdf/10.1007/s11033-021-06918-5.pdf",
		keywords: ["protective effects", "cosmetic ingredients", "barrier-related genes"],
	},
	{
		title: "The Role of Moisturizers in Addressing Various Kinds of Dermatitis: A Review",
		lead_author: "Schandra Purnamawati",
		year: 2017,
		url: "https://www.clinmedres.org/content/15/3-4/75?utm_campaign=DSL_clinique-smart-night-custom-repair-feuchtigkeitscreme-bewertungen",
		keywords: ["moisturizers", "various kinds of dermatitis", "review"],
	},
	{
		title:
			"Role of Topical Emollients and Moisturizers in the Treatment of Dry Skin Barrier Disorders",
		lead_author: "D. A. Loden",
		year: 2003,
		url: "https://link.springer.com/article/10.2165/00128071-200304110-00005",
		keywords: ["topical emollients", "moisturizers", "dry skin barrier disorders"],
	},
	{
		title: "Safety Assessment of Palm-Derived Ingredients as Used in Cosmetics",
		lead_author: "Cosmetic Ingredient Review Expert Panel",
		year: 2024,
		url: "https://journals.sagepub.com/doi/full/10.1177/10915818241237797",
		keywords: ["safety assessment", "palm-derived ingredients", "cosmetics"],
	},
	{
		title: "The Effect of Ceramide-Containing Skin Care",
		lead_author: "J. Q. Del Rosso",
		year: null,
		url: "https://cdn.mdedge.com/files/s3fs-public/Document/September-2017/081010087.pdf",
		keywords: ["effect of ceramide-containing"],
	},
	{
		title: "The Enigma of Bioactivity and Toxicity of Botanical Oils for Skin Care",
		lead_author: "J. Herman",
		year: 2020,
		url: "https://www.frontiersin.org/journals/pharmacology/articles/10.3389/fphar.2020.00785/full",
		keywords: ["enigma of bioactivity", "toxicity of botanical oils", "skin care"],
	},
];

const normalizeTitle = (value: string): string =>
	value
		.toLowerCase()
		.replace(/[^a-z0-9\s]/g, " ")
		.replace(/\s+/g, " ")
		.trim();

const findOfficialCitationSources = (matches: Pick<RagChunkMatch, "title">[]): OfficialCitationSource[] => {
	const sources = new Map<string, OfficialCitationSource>();

	for (const match of matches) {
		const title = normalizeTitle(match.title ?? "");
		if (!title) {
			continue;
		}

		for (const paper of OFFICIAL_CITATION_SOURCES) {
			const hasKeyword = paper.keywords.some((keyword) => title.includes(normalizeTitle(keyword)));
			if (hasKeyword) {
				sources.set(paper.url, paper);
			}
		}
	}

	return [...sources.values()];
};

const referenceRegex =
	/\b(paper|study|studies|journal|author|citation|cited|research context|research|article|review)\b/i;

const stripReferencePhrases = (text: string): string =>
	text
		.replace(
			/\b(according to|based on|as mentioned in|as reported in|as cited in|supported by|from)\b[^.]*\.?/gi,
			"",
		)
		.replace(/\s{2,}/g, " ")
		.trim();

const normalizeIngredient = (value: string): string =>
	value
		.toLowerCase()
		.replace(/\s+/g, " ")
		.trim();

const clampDangerLevel = (value: number): number => Math.max(0, Math.min(10, value));

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
			all_ingredients: parsed.all_ingredients,
			dangerous_ingredients: parsed.dangerous_ingredients,
			citations: parsed.citations,
			citation_links: parsed.citation_links,
			citation_sources: parsed.citation_sources,
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
			all_ingredients: validated.all_ingredients ?? [],
			dangerous_ingredients: validated.dangerous_ingredients ?? [],
			citations: validated.citations ?? [],
			citation_links: validated.citation_links ?? [],
			citation_sources: validated.citation_sources ?? [],
		};
	}

	private sanitizeResult(
		result: EvaluationResultJsonDto,
		officialCitationSources: OfficialCitationSource[],
		inputIngredients: string[],
	): EvaluationResultJsonDto {
		const limitedCitationSources = officialCitationSources.slice(0, MAX_CITATION_REFERENCES);
		const reasons = result.reasons ?? [];
		const summary = result.summary ?? "";
		const allIngredients = [...new Set(inputIngredients.map((item) => item.trim()).filter(Boolean))];
		const ingredientSet = new Set(allIngredients.map((item) => normalizeIngredient(item)));

		const sanitizedReasons = reasons
			.map((reason) => stripReferencePhrases(reason))
			.filter((reason) => reason.length > 0 && !referenceRegex.test(reason));

		const fallbackReason =
			"The ingredient profile appears compatible with the provided allergies, conditions, and preferences.";
		const fallbackSummary =
			"Evaluation focuses on product ingredients and profile compatibility only.";

		const cleanedSummary = stripReferencePhrases(summary);

		const modelDangerousIngredients = (result.dangerous_ingredients ?? [])
			.map((item) => ({
				ingredient: item.ingredient.trim(),
				danger_level: clampDangerLevel(item.danger_level),
				reason: item.reason?.trim(),
			}))
			.filter(
				(item) =>
					item.ingredient.length > 0 && ingredientSet.has(normalizeIngredient(item.ingredient)),
			)
			.sort((a, b) => b.danger_level - a.danger_level);

		const allergenDerivedDangerousIngredients = allIngredients
			.filter((ingredient) => {
				const normalizedIngredient = normalizeIngredient(ingredient);
				return (result.matched_allergens ?? []).some((allergen) =>
					normalizedIngredient.includes(normalizeIngredient(allergen)),
				);
			})
			.map((ingredient) => ({
				ingredient,
				danger_level: 10,
				reason: "Matches an allergen in the profile.",
			}));

		const dangerousMap = new Map<string, { ingredient: string; danger_level: number; reason?: string }>();
		for (const entry of [...modelDangerousIngredients, ...allergenDerivedDangerousIngredients]) {
			const key = normalizeIngredient(entry.ingredient);
			const existing = dangerousMap.get(key);
			if (!existing || entry.danger_level > existing.danger_level) {
				dangerousMap.set(key, entry);
			}
		}

		const dangerousIngredients = [...dangerousMap.values()].sort(
			(a, b) => b.danger_level - a.danger_level,
		);

		return {
			...result,
			reasons: sanitizedReasons.length > 0 ? sanitizedReasons : [fallbackReason],
			summary:
				cleanedSummary.length > 0 && !referenceRegex.test(cleanedSummary)
					? cleanedSummary
					: fallbackSummary,
			all_ingredients: allIngredients,
			dangerous_ingredients: dangerousIngredients,
			citations: limitedCitationSources.map((source) => {
				const year = source.year ?? "Unknown year";
				return `${source.title} - ${source.lead_author} (${year}) - ${source.url}`;
			}),
			citation_links: limitedCitationSources.map((source) => source.url),
			citation_sources: limitedCitationSources.map((source) => ({
				title: source.title,
				lead_author: source.lead_author,
				year: source.year,
				url: source.url,
			})),
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
		let officialCitationSources: OfficialCitationSource[] = [];

		try {
			const matches = await retrieveRelevantChunks({ question: ragQuestion, topK: 6 });
			ragContext = formatChunksForPrompt(matches);
			officialCitationSources = findOfficialCitationSources(matches).slice(0, MAX_CITATION_REFERENCES);
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
			candidate_citation_sources: officialCitationSources.map((source) => ({
				title: source.title,
				lead_author: source.lead_author,
				year: source.year,
				url: source.url,
			})),
		};

		const prompt = `${evaluationPromptTemplate}\n\nInput JSON:\n${JSON.stringify(context)}`;
		const result = await model.generateContent(prompt);
		const responseText = result.response.text();
		if (!responseText) {
			throw new Error("Gemini returned an empty evaluation response");
		}

		const parsed = this.extractJson(responseText);
		const normalized = this.normalizeResult(parsed);
		const sanitized = this.sanitizeResult(normalized, officialCitationSources, input.ingredients);

		return sanitized;
	}
}

export default new GeminiEvaluationService();
