import { Prisma } from "@prisma/client";
import prisma from "../lib/prisma";
import {
	CreateEvaluationContextDto,
	EvaluateProductRequestDto,
	EvaluationContextResponseDto,
	EvaluationResultJsonDto,
	evaluationContextResponseSchema,
	UpdateEvaluationContextDto,
} from "../types/evaluationContext.dto";
import geminiEvaluationService from "./geminiEvaluation.service";
import { BAD_REQUEST, HttpError, NOT_FOUND } from "../utils/HttpError";

type NamedEntity = { name: string };

type ProfileWithRelations = {
	id: string;
	conditions: NamedEntity[];
	allergens: NamedEntity[];
	preferences: NamedEntity[];
};

type ProductWithIngredients = {
	id: string;
	name: string;
	brand?: string;
	category?: string;
	ingredients: unknown;
};

type PromptRecord = {
	id: string;
	prompt_text: string;
};

type PrismaRuntime = {
	evaluationContext: {
		create: (args: { data: Record<string, unknown> }) => Promise<unknown>;
		findUnique: (args: { where: { id: string } }) => Promise<unknown | null>;
		findMany: (args?: Record<string, unknown>) => Promise<unknown[]>;
		update: (args: { where: { id: string }; data: Record<string, unknown> }) => Promise<unknown>;
		delete: (args: { where: { id: string } }) => Promise<unknown>;
	};
	profile: {
		findUnique: (args: Record<string, unknown>) => Promise<unknown | null>;
	};
	product: {
		findUnique: (args: Record<string, unknown>) => Promise<unknown | null>;
	};
	prompt: {
		findUnique: (args: Record<string, unknown>) => Promise<unknown | null>;
	};
};

const prismaRuntime = prisma as unknown as PrismaRuntime;

export class EvaluationContextService {
	private toResponseDto(record: unknown): EvaluationContextResponseDto {
		return evaluationContextResponseSchema.parse(record);
	}

	private normalizeIngredients(value: unknown): string[] {
		if (!Array.isArray(value)) {
			return [];
		}

		return value
			.filter((item): item is string => typeof item === "string")
			.map((item) => item.trim().toLowerCase())
			.filter((item) => item.length > 0);
	}

	private findMatches(ingredients: string[], entities: NamedEntity[]): string[] {
		const matches: string[] = [];

		for (const entity of entities) {
			const needle = entity.name.trim().toLowerCase();
			if (!needle) {
				continue;
			}

			const found = ingredients.some((ingredient) => ingredient.includes(needle));
			if (found) {
				matches.push(entity.name);
			}
		}

		return [...new Set(matches)];
	}

	private buildRuleBasedResult(
		ingredientTerms: string[],
		profile: ProfileWithRelations,
	): EvaluationResultJsonDto {
		const matchedAllergens = this.findMatches(ingredientTerms, profile.allergens);
		const matchedConditions = this.findMatches(ingredientTerms, profile.conditions);
		const matchedPreferences = this.findMatches(ingredientTerms, profile.preferences);

		let status: "safe" | "caution" | "avoid" = "safe";
		let score = 90;
		const reasons: string[] = [];

		if (matchedAllergens.length > 0) {
			status = "avoid";
			score = 10;
			reasons.push(`Matched allergens: ${matchedAllergens.join(", ")}`);
		}

		if (status !== "avoid" && matchedConditions.length > 0) {
			status = "caution";
			score = 45;
			reasons.push(`Potential condition triggers: ${matchedConditions.join(", ")}`);
		}

		if (matchedPreferences.length > 0) {
			reasons.push(`Preference overlaps found: ${matchedPreferences.join(", ")}`);
		}

		if (!reasons.length) {
			reasons.push("No direct ingredient conflicts found based on your profile data");
		}

		return {
			status,
			score,
			summary:
				status === "avoid"
					? "This product is likely not suitable for this profile"
					: status === "caution"
						? "Use caution for this profile"
						: "This product appears suitable for this profile",
			reasons,
			matched_allergens: matchedAllergens,
			matched_conditions: matchedConditions,
			matched_preferences: matchedPreferences,
		};
	}

	private async assertProfileExists(id: string): Promise<void> {
		const profile = await prismaRuntime.profile.findUnique({
			where: { id },
			select: { id: true },
		});

		if (!profile) {
			throw new HttpError(NOT_FOUND, `Profile with id '${id}' not found`);
		}
	}

	private async assertProductExists(id: string): Promise<void> {
		const product = await prismaRuntime.product.findUnique({
			where: { id },
			select: { id: true },
		});

		if (!product) {
			throw new HttpError(NOT_FOUND, `Product with id '${id}' not found`);
		}
	}

	private async assertPromptExists(id: string): Promise<void> {
		const prompt = await prismaRuntime.prompt.findUnique({
			where: { id },
			select: { id: true },
		});

		if (!prompt) {
			throw new HttpError(NOT_FOUND, `Prompt with id '${id}' not found`);
		}
	}

	private async assertEvaluationContextExists(id: string): Promise<void> {
		const existing = await prismaRuntime.evaluationContext.findUnique({
			where: { id },
		});

		if (!existing) {
			throw new HttpError(NOT_FOUND, `Evaluation context with id '${id}' not found`);
		}
	}

	async createEvaluationContext(data: CreateEvaluationContextDto): Promise<EvaluationContextResponseDto> {
		await this.assertProfileExists(data.profileId);
		await this.assertProductExists(data.productId);

		if (data.promptId) {
			await this.assertPromptExists(data.promptId);
		}

		const record = await prismaRuntime.evaluationContext.create({
			data: {
				profileId: data.profileId,
				productId: data.productId,
				promptId: data.promptId ?? null,
				resultJson: data.resultJson as Prisma.InputJsonValue,
			},
		});

		return this.toResponseDto(record);
	}

	async getEvaluationContextById(id: string): Promise<EvaluationContextResponseDto> {
		const record = await prismaRuntime.evaluationContext.findUnique({ where: { id } });

		if (!record) {
			throw new HttpError(NOT_FOUND, `Evaluation context with id '${id}' not found`);
		}

		return this.toResponseDto(record);
	}

	async getAllEvaluationContexts(): Promise<EvaluationContextResponseDto[]> {
		const records = await prismaRuntime.evaluationContext.findMany({
			orderBy: { createdAt: "desc" },
		});

		return records.map((record) => this.toResponseDto(record));
	}

	async getEvaluationContextsByProfileId(profileId: string): Promise<EvaluationContextResponseDto[]> {
		await this.assertProfileExists(profileId);

		const records = await prismaRuntime.evaluationContext.findMany({
			where: { profileId },
			orderBy: { createdAt: "desc" },
		});

		return records.map((record) => this.toResponseDto(record));
	}

	async getEvaluationContextsByProductId(productId: string): Promise<EvaluationContextResponseDto[]> {
		await this.assertProductExists(productId);

		const records = await prismaRuntime.evaluationContext.findMany({
			where: { productId },
			orderBy: { createdAt: "desc" },
		});

		return records.map((record) => this.toResponseDto(record));
	}

	async updateEvaluationContext(
		id: string,
		data: UpdateEvaluationContextDto,
	): Promise<EvaluationContextResponseDto> {
		await this.assertEvaluationContextExists(id);

		if (data.profileId) {
			await this.assertProfileExists(data.profileId);
		}

		if (data.productId) {
			await this.assertProductExists(data.productId);
		}

		if (typeof data.promptId === "string") {
			await this.assertPromptExists(data.promptId);
		}

		const updateData: Record<string, unknown> = {
			...data,
			resultJson:
				data.resultJson !== undefined
					? (data.resultJson as Prisma.InputJsonValue)
					: undefined,
		};

		const updated = await prismaRuntime.evaluationContext.update({
			where: { id },
			data: updateData,
		});

		return this.toResponseDto(updated);
	}

	async deleteEvaluationContext(id: string): Promise<{ message: string }> {
		await this.assertEvaluationContextExists(id);
		await prismaRuntime.evaluationContext.delete({ where: { id } });

		return { message: `Evaluation context with id '${id}' deleted successfully` };
	}

	async evaluateProduct(data: EvaluateProductRequestDto): Promise<EvaluationContextResponseDto> {
		const profile = (await prismaRuntime.profile.findUnique({
			where: { id: data.profileId },
			select: {
				id: true,
				conditions: { select: { name: true } },
				allergens: { select: { name: true } },
				preferences: { select: { name: true } },
			},
		})) as ProfileWithRelations | null;

		if (!profile) {
			throw new HttpError(NOT_FOUND, `Profile with id '${data.profileId}' not found`);
		}

		const product = (await prismaRuntime.product.findUnique({
			where: { id: data.productId },
			select: { id: true, name: true, brand: true, category: true, ingredients: true },
		})) as ProductWithIngredients | null;

		if (!product) {
			throw new HttpError(NOT_FOUND, `Product with id '${data.productId}' not found`);
		}

		let promptText: string | undefined;
		if (data.promptId) {
			const prompt = (await prismaRuntime.prompt.findUnique({
				where: { id: data.promptId },
				select: { id: true, prompt_text: true },
			})) as PromptRecord | null;

			if (!prompt) {
				throw new HttpError(NOT_FOUND, `Prompt with id '${data.promptId}' not found`);
			}

			promptText = prompt.prompt_text;
		}

		const ingredientTerms = this.normalizeIngredients(product.ingredients);
		if (!ingredientTerms.length) {
			throw new HttpError(BAD_REQUEST, "Product has no valid ingredients to evaluate");
		}

		let resultJson: EvaluationResultJsonDto;
		try {
			resultJson = await geminiEvaluationService.evaluate({
				productName: product.name,
				productBrand: product.brand,
				productCategory: product.category,
				ingredients: ingredientTerms,
				allergens: profile.allergens.map((item) => item.name),
				conditions: profile.conditions.map((item) => item.name),
				preferences: profile.preferences.map((item) => item.name),
				promptText,
			});
		} catch {
			resultJson = this.buildRuleBasedResult(ingredientTerms, profile);
		}

		return this.createEvaluationContext({
			profileId: profile.id,
			productId: product.id,
			promptId: data.promptId,
			resultJson,
		});
	}
}

export default new EvaluationContextService();
