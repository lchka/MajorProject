import { GoogleGenerativeAI } from "@google/generative-ai";
import type { Express } from "express";
import { BAD_REQUEST, HttpError, INTERNAL_SERVER_ERROR } from "../utils/HttpError.js";

export type ParsedProductFromImage = {
	name: string;
	brand: string;
	ingredients: string[];
	category: string;
};

export type TextVisibilityProbe = {
	hasVisibleText: boolean;
	name: string;
	brand: string;
	signal: string;
};

const PRODUCT_CATEGORIES = [
	"Shampoo",
	"Deodorant & Antiperspirant",
	"Cleanser",
	"Scrub",
	"Conditioner",
	"Body Wash",
	"Moisturiser",
	"Serum",
	"Other",
] as const;

const extractionSchemaDescription = `
Return ONLY valid JSON with this exact shape:
{
  "name": "string",
  "brand": "string",
  "ingredients": ["string"],
  "category": "${PRODUCT_CATEGORIES.join(" | ")}"
}

Rules:
- ingredients must be the actual INCI ingredient list from the label section that starts with words like "Ingredients", "INCI", or "Composition".
- never return marketing claims as ingredients (examples to EXCLUDE: "No Silicone", "No Mineral Oils", "No Colourants", "Sulfate Free", "Paraben Free").
- if ingredients are shown as one comma-separated line, split into separate array items.
- If the category is unclear, use "Other".
- If text is partially unreadable, make the best safe guess.
- Do not include markdown, code fences, or extra keys.
`;

const ingredientsOnlySchemaDescription = `
Read the product label image and extract ONLY the ingredient list.
Return ONLY valid JSON in this exact shape:
{
	"ingredients": ["string"]
}

Rules:
- Pull ingredients from the INCI/Ingredients/Composition section only.
- Exclude marketing claims such as "No Silicone", "No Mineral Oils", "No Colourants", "Sulfate Free", and "Paraben Free".
- If the ingredient list appears in a single comma-separated sentence, split it into separate array items.
- Do not include markdown, code fences, or extra keys.
`;

const webIngredientsSchemaDescription = `
Use web search to find the most up-to-date ingredient list for the exact product in UK or Ireland.
Prioritize official manufacturer UK/IE pages and major UK/IE retailers (for example Boots, Superdrug, Tesco, Sainsbury's, Dunnes Stores).
Return ONLY valid JSON in this exact shape:
{
	"ingredients": ["string"]
}

Rules:
- Return real ingredient names only.
- Exclude claims such as "No Silicone", "No Mineral Oils", "No Colourants", "Sulfate Free", and "Paraben Free".
- If you find one long comma-separated list, split into array items.
- Do not include markdown, code fences, commentary, source links, or extra keys.
`;

const textVisibilitySchemaDescription = `
Return ONLY valid JSON in this exact shape:
{
	"hasVisibleText": true,
	"name": "string",
	"brand": "string"
}

Rules:
- hasVisibleText is true only when brand and/or product name text is readable from the label/front pack.
- hasVisibleText is false when text is blurry, cut off, too small, or not visible.
- name and brand should be best-effort short values when readable; otherwise empty strings.
- Do not include markdown, code fences, commentary, or extra keys.
`;

export class GeminiService {
	private model: ReturnType<GoogleGenerativeAI["getGenerativeModel"]> | null = null;

	private getModel() {
		// Reuse a single model client instance across requests.
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

	private parseJsonResponse(text: string): ParsedProductFromImage {
		const firstBrace = text.indexOf("{");
		const lastBrace = text.lastIndexOf("}");

		if (firstBrace === -1 || lastBrace === -1 || lastBrace < firstBrace) {
			throw new HttpError(BAD_REQUEST, "Gemini did not return valid JSON");
		}

		const raw = text.slice(firstBrace, lastBrace + 1);
		let parsed: unknown;

		try {
			parsed = JSON.parse(raw);
		} catch {
			throw new HttpError(BAD_REQUEST, "Gemini JSON response could not be parsed");
		}

		if (!parsed || typeof parsed !== "object") {
			throw new HttpError(BAD_REQUEST, "Gemini response shape is invalid");
		}

		const candidate = parsed as Record<string, unknown>;
		const ingredients = this.normalizeExtractedIngredients(candidate.ingredients);

		return {
			name: typeof candidate.name === "string" ? candidate.name.trim() : "",
			brand: typeof candidate.brand === "string" ? candidate.brand.trim() : "",
			ingredients,
			category:
				typeof candidate.category === "string" && PRODUCT_CATEGORIES.includes(candidate.category as (typeof PRODUCT_CATEGORIES)[number])
					? candidate.category
					: "Other",
		};
	}

	private normalizeExtractedIngredients(value: unknown): string[] {
		if (!Array.isArray(value)) {
			return [];
		}

		// Remove common marketing claims that are often misread as ingredients.
		const shouldExclude = (item: string): boolean => {
			const normalized = item.trim().toLowerCase();
			return (
				normalized.startsWith("no ") ||
				normalized.includes("free") ||
				normalized.includes("without") ||
				normalized.includes("mineral oil") ||
				normalized.includes("colourant") ||
				normalized.includes("colorant")
			);
		};

		const seen = new Set<string>();
		const normalizedIngredients: string[] = [];

		for (const item of value) {
			if (typeof item !== "string") {
				continue;
			}

			const cleaned = item.replace(/^ingredients\s*:\s*/i, "").trim();
			if (!cleaned) {
				continue;
			}

			const pieces = cleaned
				.split(/[;,]/)
				.map((part) => part.trim())
				.filter((part) => part.length > 0);

			for (const piece of pieces) {
				if (shouldExclude(piece)) {
					continue;
				}

				const key = piece.toLowerCase();
				if (seen.has(key)) {
					continue;
				}

				seen.add(key);
				normalizedIngredients.push(piece);
			}
		}

		return normalizedIngredients;
	}

	private parseIngredientsOnlyJson(text: string): string[] {
		const firstBrace = text.indexOf("{");
		const lastBrace = text.lastIndexOf("}");

		if (firstBrace === -1 || lastBrace === -1 || lastBrace < firstBrace) {
			return [];
		}

		try {
			const parsed = JSON.parse(text.slice(firstBrace, lastBrace + 1)) as {
				ingredients?: unknown;
			};
			return this.normalizeExtractedIngredients(parsed.ingredients);
		} catch {
			return [];
		}
	}

	private parseTextVisibilityJson(text: string): TextVisibilityProbe {
		const firstBrace = text.indexOf("{");
		const lastBrace = text.lastIndexOf("}");

		if (firstBrace === -1 || lastBrace === -1 || lastBrace < firstBrace) {
			return {
				hasVisibleText: false,
				name: "",
				brand: "",
				signal: "No parseable OCR signal",
			};
		}

		try {
			const parsed = JSON.parse(text.slice(firstBrace, lastBrace + 1)) as {
				hasVisibleText?: unknown;
				name?: unknown;
				brand?: unknown;
			};

			const name = typeof parsed.name === "string" ? parsed.name.trim() : "";
			const brand = typeof parsed.brand === "string" ? parsed.brand.trim() : "";
			const hasVisibleText =
				typeof parsed.hasVisibleText === "boolean"
					? parsed.hasVisibleText
					: name.length > 1 || brand.length > 1;

			const signal = [brand, name].filter(Boolean).join(" | ") || "Weak text signal";

			return {
				hasVisibleText,
				name,
				brand,
				signal,
			};
		} catch {
			return {
				hasVisibleText: false,
				name: "",
				brand: "",
				signal: "Unreadable text",
			};
		}
	}

	private async extractIngredientsFallback(file: Express.Multer.File): Promise<string[]> {
		const model = this.getModel();
		const result = await model.generateContent([
			ingredientsOnlySchemaDescription,
			{
				inlineData: {
					mimeType: file.mimetype,
					data: file.buffer.toString("base64"),
				},
			},
		]);

		const responseText = result.response.text();
		if (!responseText) {
			return [];
		}

		return this.parseIngredientsOnlyJson(responseText);
	}

	private async extractIngredientsFromWeb(params: {
		name: string;
		brand: string;
		category: string;
	}): Promise<string[]> {
		const model = this.getModel();
		// Web fallback is constrained to UK/Ireland to improve ingredient relevance.
		const queryPrompt = `Product name: ${params.name || "unknown"}\nBrand: ${params.brand || "unknown"}\nCategory: ${params.category || "Other"}\nRegion: UK and Ireland\n\n${webIngredientsSchemaDescription}`;

		try {
			const requestWithSearchTool: unknown = {
				contents: [{ role: "user", parts: [{ text: queryPrompt }] }],
				tools: [{ googleSearch: {} }],
			};

			const groundedResult = await model.generateContent(
				requestWithSearchTool as Parameters<typeof model.generateContent>[0],
			);
			const groundedText = groundedResult.response.text();
			if (groundedText) {
				const groundedIngredients = this.parseIngredientsOnlyJson(groundedText);
				if (groundedIngredients.length > 0) {
					return groundedIngredients;
				}
			}
		} catch {
			// Continue to non-grounded fallback prompt if search tooling is unavailable.
		}

		const nonGroundedResult = await model.generateContent(queryPrompt);
		const nonGroundedText = nonGroundedResult.response.text();
		if (!nonGroundedText) {
			return [];
		}

		return this.parseIngredientsOnlyJson(nonGroundedText);
	}

	async extractProductFromImage(file: Express.Multer.File): Promise<ParsedProductFromImage> {
		if (!file?.buffer || !file.mimetype) {
			throw new HttpError(BAD_REQUEST, "A valid product image file is required");
		}

		const model = this.getModel();
		const result = await model.generateContent([
			extractionSchemaDescription,
			{
				inlineData: {
					mimeType: file.mimetype,
					data: file.buffer.toString("base64"),
				},
			},
		]);

		const responseText = result.response.text();
		if (!responseText) {
			throw new HttpError(BAD_REQUEST, "Gemini returned an empty response");
		}

		const parsed = this.parseJsonResponse(responseText);
		// Preferred path: ingredient list comes directly from the label image.
		if (parsed.ingredients.length > 0) {
			return parsed;
		}

		// Second pass: ask for ingredients only, using the same image.
		const fallbackIngredients = await this.extractIngredientsFallback(file);
		if (fallbackIngredients.length > 0) {
			return {
				...parsed,
				ingredients: fallbackIngredients,
			};
		}

		// Final pass: fetch latest UK/Ireland ingredients from web-grounded results.
		const webIngredients = await this.extractIngredientsFromWeb({
			name: parsed.name,
			brand: parsed.brand,
			category: parsed.category,
		});

		if (webIngredients.length === 0) {
			throw new HttpError(
				BAD_REQUEST,
				"Could not detect ingredients from the image or UK/Ireland web sources. Please upload a clearer Ingredients/INCI photo or include product name and brand manually.",
			);
		}

		return {
			...parsed,
			ingredients: webIngredients,
		};
	}

	async detectTextVisibility(file: Express.Multer.File): Promise<TextVisibilityProbe> {
		if (!file?.buffer || !file.mimetype) {
			throw new HttpError(BAD_REQUEST, "A valid product image file is required");
		}

		const model = this.getModel();
		const result = await model.generateContent([
			textVisibilitySchemaDescription,
			{
				inlineData: {
					mimeType: file.mimetype,
					data: file.buffer.toString("base64"),
				},
			},
		]);

		const responseText = result.response.text();
		if (!responseText) {
			return {
				hasVisibleText: false,
				name: "",
				brand: "",
				signal: "No OCR response",
			};
		}

		return this.parseTextVisibilityJson(responseText);
	}
}

export default new GeminiService();
