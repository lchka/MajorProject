import { GoogleGenerativeAI } from "@google/generative-ai";
import type { Express } from "express";
import {
  BAD_REQUEST,
  HttpError,
  INTERNAL_SERVER_ERROR,
} from "../utils/HttpError.js";

export type ParsedProductFromImage = {
  name: string;
  brand: string;
  ingredients: string[];
  category: ProductCategory;
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

type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];

type ParsedProductResponseJson = {
  name?: unknown;
  brand?: unknown;
  ingredients?: unknown;
  category?: unknown;
};

type ParsedIngredientsResponseJson = {
  ingredients?: unknown;
};

/**
 * FIXED PROMPT:
 * Added explicit instructions to capture SPF, Volume, and Variants.
 * This ensures the SerpAPI search has the specific data it needs to find the right bottle.
 */
const extractionSchemaDescription = `
Return ONLY valid JSON with this exact shape:
{
  "name": "string",
  "brand": "string",
  "ingredients": ["string"],
  "category": "${PRODUCT_CATEGORIES.join(" | ")}"
}

Rules for Name & Brand:
- "name" MUST be specific. Include technical details visible on the front label such as SPF (e.g., "SPF 30", "SPF 50+"), volume (e.g., "200ml"), and sub-brand variants (e.g., "Kids", "Sport", "Invisible Finish").
- Never simplify the name. If the bottle says "Sun Protect & Moisture SPF 30", do not return "Sun Cream".
- "brand" is the primary manufacturer (e.g., "Cien", "Nivea", "La Roche-Posay").

Rules for Ingredients:
- ingredients must be the actual INCI list starting with "Ingredients", "INCI", or "Composition".
- EXCLUDE marketing claims (e.g., "No Silicone", "Sulfate Free", "Paraben Free").
- If text is partially unreadable, make the best safe guess.
- Do not include markdown, code fences, or extra keys.
`;

const ingredientsOnlySchemaDescription = `
Read the product label image and extract ONLY the ingredient list.
Return ONLY valid JSON in this exact shape:
{
  "ingredients": ["string"]
}
Rules: Pull from INCI/Ingredients section only. Exclude marketing claims. Split comma-separated lines.
`;

const webIngredientsSchemaDescription = `
Use web search to find the most up-to-date ingredient list for the exact product in UK or Ireland.
Prioritize official manufacturer UK/IE pages and major retailers (Boots, Superdrug, Tesco, etc.).
Return ONLY valid JSON in this exact shape:
{
  "ingredients": ["string"]
}
`;

export class GeminiService {
  private model: ReturnType<GoogleGenerativeAI["getGenerativeModel"]> | null = null;

  private isProductCategory(value: unknown): value is ProductCategory {
    return (
      typeof value === "string" &&
      (PRODUCT_CATEGORIES as readonly string[]).includes(value)
    );
  }

  private extractJsonObject(text: string): unknown {
    const firstBrace = text.indexOf("{");
    const lastBrace = text.lastIndexOf("}");

    if (firstBrace === -1 || lastBrace === -1 || lastBrace < firstBrace) {
      throw new HttpError(BAD_REQUEST, "Gemini did not return valid JSON");
    }

    const raw = text.slice(firstBrace, lastBrace + 1);

    try {
      return JSON.parse(raw);
    } catch {
      throw new HttpError(BAD_REQUEST, "Gemini JSON response could not be parsed");
    }
  }

  private getModel() {
    if (this.model) return this.model;

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new HttpError(
        INTERNAL_SERVER_ERROR,
        "GEMINI_API_KEY is missing. Add it to your server environment.",
      );
    }

    const gemini = new GoogleGenerativeAI(apiKey);
    // Note: Standardized model version for better vision performance
    this.model = gemini.getGenerativeModel({
      model: process.env.GEMINI_MODEL ?? "gemini-1.5-flash", 
    });

    return this.model;
  }

  private parseJsonResponse(text: string): ParsedProductFromImage {
    const parsed = this.extractJsonObject(text) as ParsedProductResponseJson;

    const ingredients = this.normalizeExtractedIngredients(parsed.ingredients);

    return {
      name: typeof parsed.name === "string" ? parsed.name.trim() : "Unknown Product",
      brand: typeof parsed.brand === "string" ? parsed.brand.trim() : "Unknown Brand",
      ingredients,
      category: this.isProductCategory(parsed.category) ? parsed.category : "Other",
    };
  }

  private normalizeExtractedIngredients(value: unknown): string[] {
    if (!Array.isArray(value)) return [];

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
      if (typeof item !== "string") continue;

      const cleaned = item.replace(/^ingredients\s*:\s*/i, "").trim();
      if (!cleaned) continue;

      const pieces = cleaned.split(/[;,]/).map((part) => part.trim()).filter((part) => part.length > 0);

      for (const piece of pieces) {
        if (shouldExclude(piece)) continue;
        const key = piece.toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);
        normalizedIngredients.push(piece);
      }
    }

    return normalizedIngredients;
  }

  private parseIngredientsOnlyJson(text: string): string[] {
    const firstBrace = text.indexOf("{");
    const lastBrace = text.lastIndexOf("}");
    if (firstBrace === -1 || lastBrace === -1) return [];

    try {
      const parsed = JSON.parse(
        text.slice(firstBrace, lastBrace + 1),
      ) as ParsedIngredientsResponseJson;
      return this.normalizeExtractedIngredients(parsed.ingredients);
    } catch {
      return [];
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

    return this.parseIngredientsOnlyJson(result.response.text());
  }

  private async extractIngredientsFromWeb(params: {
    name: string;
    brand: string;
    category: string;
  }): Promise<string[]> {
    const model = this.getModel();
    const queryPrompt = `Product: ${params.brand} ${params.name}\nCategory: ${params.category}\nRegion: UK/Ireland\n\n${webIngredientsSchemaDescription}`;

    try {
      const groundedRequest = {
        contents: [{ role: "user", parts: [{ text: queryPrompt }] }],
        tools: [{ googleSearch: {} }],
      } as unknown as Parameters<typeof model.generateContent>[0];
      const groundedResult = await model.generateContent(groundedRequest);
      const groundedText = groundedResult.response.text();
      if (groundedText) {
        const ingredients = this.parseIngredientsOnlyJson(groundedText);
        if (ingredients.length > 0) return ingredients;
      }
    } catch {
      console.warn("[Gemini] Web grounding failed, attempting standard fallback");
    }

    const nonGroundedResult = await model.generateContent(queryPrompt);
    return this.parseIngredientsOnlyJson(nonGroundedResult.response.text());
  }

  async extractProductFromImage(file: Express.Multer.File): Promise<ParsedProductFromImage> {
    if (!file?.buffer || !file.mimetype) {
      throw new HttpError(BAD_REQUEST, "A valid product image file is required");
    }

    console.log(`[Gemini] Processing scan: ${file.mimetype} (${file.buffer.length} bytes)`);

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
    if (!responseText) throw new HttpError(BAD_REQUEST, "Gemini returned an empty response");

    const parsed = this.parseJsonResponse(responseText);

    console.log(`[Gemini] Extracted: "${parsed.brand} ${parsed.name}"`);

    // If we have ingredients, we are done
    if (parsed.ingredients.length > 0) return parsed;

    // Fallback 1: Retrying image specifically for ingredients
    const fallbackIngredients = await this.extractIngredientsFallback(file);
    if (fallbackIngredients.length > 0) {
      return { ...parsed, ingredients: fallbackIngredients };
    }

    // Fallback 2: Web Search (Now uses the improved specific name)
    const webIngredients = await this.extractIngredientsFromWeb({
      name: parsed.name,
      brand: parsed.brand,
      category: parsed.category,
    });

    if (webIngredients.length === 0) {
      throw new HttpError(BAD_REQUEST, "Could not identify ingredients. Please ensure the label is clear.");
    }

    return { ...parsed, ingredients: webIngredients };
  }
}

export default new GeminiService();
