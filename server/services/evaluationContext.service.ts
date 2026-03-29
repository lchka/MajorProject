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
	ingredients: unknown;
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
			select: { id: true, name: true, ingredients: true },
		})) as ProductWithIngredients | null;

		if (!product) {
			throw new HttpError(NOT_FOUND, `Product with id '${data.productId}' not found`);
		}

		if (data.promptId) {
			await this.assertPromptExists(data.promptId);
		}

		const ingredientTerms = this.normalizeIngredients(product.ingredients);
		if (!ingredientTerms.length) {
			throw new HttpError(BAD_REQUEST, "Product has no valid ingredients to evaluate");
		}

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

		const resultJson: EvaluationResultJsonDto = {
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

		return this.createEvaluationContext({
			profileId: profile.id,
			productId: product.id,
			promptId: data.promptId,
			resultJson,
		});
	}
}

export default new EvaluationContextService();
