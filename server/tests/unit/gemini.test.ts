import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import type { Express } from "express";
import { HttpError } from "../../utils/HttpError.js";

const mockRetrieveRelevantChunks = jest.fn<
	(input?: unknown) => Promise<Array<{ title?: string }>>
>();
const mockFormatChunksForPrompt = jest.fn<
	(input?: unknown) => string
>();

const mockGenerateContent = jest.fn<
	(input?: unknown) => Promise<{ response: { text: () => string } }>
>();

jest.mock("@google/generative-ai", () => ({
	__esModule: true,
	GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
		getGenerativeModel: () => ({
			generateContent: mockGenerateContent,
		}),
	})),
}));

jest.mock("../../RAG/src/retrieve.service", () => ({
	__esModule: true,
	retrieveRelevantChunks: mockRetrieveRelevantChunks,
	formatChunksForPrompt: mockFormatChunksForPrompt,
}));

import geminiService from "../../services/gemini.service.js";
import geminiEvaluationService from "../../services/geminiEvaluation.service.js";

const makeFile = (): Express.Multer.File =>
	({
		buffer: Buffer.from("image-bytes"),
		mimetype: "image/jpeg",
	} as Express.Multer.File);

beforeEach(() => {
	jest.clearAllMocks();
	process.env.GEMINI_API_KEY = "test-key";
	mockRetrieveRelevantChunks.mockResolvedValue([]);
	mockFormatChunksForPrompt.mockReturnValue("No supporting context");
});

describe("GeminiService.extractProductFromImage", () => {
	it("should parse product response and filter ingredients", async () => {
		mockGenerateContent.mockResolvedValue({
			response: {
				text: () =>
					JSON.stringify({
						name: "Cleanser",
						brand: "SkinCo",
						ingredients: [
							"Ingredients: Water, Glycerin",
							"No Silicone",
						],
						category: "Cleanser",
					}),
			},
		});

		const result = await geminiService.extractProductFromImage(makeFile());

		expect(result).toEqual({
			name: "Cleanser",
			brand: "SkinCo",
			ingredients: ["Water", "Glycerin"],
			category: "Cleanser",
		});
	});

	it("should fallback to ingredients-only response", async () => {
		mockGenerateContent
			.mockResolvedValueOnce({
				response: {
					text: () =>
						JSON.stringify({
							name: "Body Wash",
							brand: "Glow",
							ingredients: [],
							category: "Body Wash",
						}),
				},
			})
			.mockResolvedValueOnce({
				response: {
					text: () =>
						JSON.stringify({
							ingredients: ["Aqua", "Cocamidopropyl Betaine"],
						}),
				},
			});

		const result = await geminiService.extractProductFromImage(makeFile());

		expect(result).toEqual({
			name: "Body Wash",
			brand: "Glow",
			ingredients: ["Aqua", "Cocamidopropyl Betaine"],
			category: "Body Wash",
		});
	});

	it("should fallback to web ingredients when image parsing fails", async () => {
		mockGenerateContent
			.mockResolvedValueOnce({
				response: {
					text: () =>
						JSON.stringify({
							name: "Serum",
							brand: "Glow",
							ingredients: [],
							category: "Serum",
						}),
				},
			})
			.mockResolvedValueOnce({
				response: {
					text: () => JSON.stringify({ ingredients: [] }),
				},
			})
			.mockResolvedValueOnce({
				response: {
					text: () =>
						JSON.stringify({
							ingredients: ["Aqua", "Niacinamide"],
						}),
				},
			});

		const result = await geminiService.extractProductFromImage(makeFile());

		expect(result).toEqual({
			name: "Serum",
			brand: "Glow",
			ingredients: ["Aqua", "Niacinamide"],
			category: "Serum",
		});
	});

	it("should throw for missing file", async () => {
		await expect(
			geminiService.extractProductFromImage({} as Express.Multer.File),
		).rejects.toThrow(HttpError);
	});
});

describe("GeminiEvaluationService.evaluate", () => {
	it("should normalize evaluation result", async () => {
		mockGenerateContent.mockResolvedValue({
			response: {
				text: () =>
					JSON.stringify({
						status: "safe",
						score: 85,
						summary: "All clear",
						reasons: ["No conflicts"],
						matched_allergens: [],
						matched_conditions: [],
						matched_preferences: [],
						all_ingredients: ["water"],
						dangerous_ingredients: [],
						citations: [],
						citation_links: [],
						citation_sources: [],
					}),
			},
		});

		const result = await geminiEvaluationService.evaluate({
			productName: "Cleanser",
			productBrand: "SkinCo",
			productCategory: "Cleanser",
			ingredients: ["Water"],
			allergens: [],
			conditions: [],
			preferences: [],
		});

		expect(result.status).toBe("safe");
		expect(result.score).toBe(85);
		expect(result.summary).toBe("All clear");
		expect(result.reasons).toEqual(["No conflicts"]);
		expect(result.all_ingredients).toEqual(["Water"]);
	});
});
