import { z, ZodError } from "zod";
import type { Prisma } from "@prisma/client";
import prisma from "../lib/prisma.js";
import {
	CreateProductDto,
	ProductResponseDto,
	UpdateProductDto,
	createProductSchema,
	productResponseSchema,
} from "../types/product.dto.js";
import { categoryEnum } from "../types/prompt.dto.js";
import { buildOfficialProductImageKey, uploadBufferToS3 } from "../lib/s3.js";
import serpApiImageService from "./serpApiImage.service.js";
import { BAD_REQUEST, HttpError, NOT_FOUND } from "../utils/HttpError.js";

type ProductScanInput = {
	name: unknown;
	brand: unknown;
	ingredients: unknown;
	category: unknown;
	product_image: string;
};

type ProductCategory = z.infer<typeof categoryEnum>;

export class ProductService {
	private zodErrorToMessage(error: ZodError): string {
		return error.issues
			.map((issue) => `${issue.path.join(".") || "body"}: ${issue.message}`)
			.join("; ");
	}

	private normalizeIngredients(value: unknown): string[] {
		if (Array.isArray(value)) {
			return value
				.filter((item): item is string => typeof item === "string")
				.map((item) => item.trim())
				.filter((item) => item.length > 0);
		}

		if (typeof value === "string") {
			return value
				.split(",")
				.map((item) => item.trim())
				.filter((item) => item.length > 0);
		}

		return [];
	}

	private normalizeCategory(value: unknown): ProductCategory {
		if (typeof value === "string" && categoryEnum.safeParse(value).success) {
			return value as ProductCategory;
		}

		return "Other";
	}

	private async assertProductExists(id: string): Promise<void> {
		const existingProduct = await prisma.product.findUnique({ where: { id } });

		if (!existingProduct) {
			throw new HttpError(NOT_FOUND, `Product with id '${id}' not found`);
		}
	}

	private get productRuntime() {
		return (prisma as unknown as {
			product: {
				create: (args: { data: Record<string, unknown> }) => Promise<unknown>;
				findMany: (args?: Record<string, unknown>) => Promise<unknown[]>;
				findUnique: (args: { where: { id: string }; select?: Record<string, boolean | Record<string, unknown>> }) => Promise<unknown | null>;
				update: (args: { where: { id: string }; data: Record<string, unknown> }) => Promise<unknown>;
				delete: (args: { where: { id: string } }) => Promise<unknown>;
			};
		}).product;
	}

	private toProductResponse(product: unknown): ProductResponseDto {
		const candidate = product as Record<string, unknown>;
		const userImage =
			typeof candidate.product_image_user === "string"
				? candidate.product_image_user
				: typeof candidate.product_image === "string"
					? candidate.product_image
					: "";

		const officialImage =
			typeof candidate.product_image_official === "string"
				? candidate.product_image_official
				: null;

		return productResponseSchema.parse({
			...candidate,
			product_image_user: userImage,
			product_image_official: officialImage,
			product_image: officialImage ?? userImage,
		});
	}

	async getAllProductsByUserId(userId: string): Promise<ProductResponseDto[]> {
		const products = await this.productRuntime.findMany({
			where: { userId },
			orderBy: { createdAt: "desc" },
		});

		return products.map((product) => this.toProductResponse(product));
	}

	async assertUserOwnsProduct(id: string, userId: string): Promise<void> {
		const product = (await this.productRuntime.findUnique({
			where: { id },
			select: { userId: true },
		})) as { userId?: string } | null;

		if (!product) {
			throw new HttpError(NOT_FOUND, `Product with id '${id}' not found`);
		}

		if (product.userId !== userId) {
			throw new HttpError(403, "Forbidden - You can only access your own products");
		}
	}

	async createProduct(userId: string, data: CreateProductDto): Promise<ProductResponseDto> {
		const userImage = data.product_image_user ?? data.product_image;

		const product = await this.productRuntime.create({
			data: {
				userId,
				name: data.name,
				product_image_user: userImage,
				product_image_official: null,
				brand: data.brand,
				ingredients: data.ingredients as Prisma.InputJsonValue,
				category: data.category,
			},
		});

		return this.toProductResponse(product);
	}

	async createProductFromScan(userId: string, input: ProductScanInput): Promise<ProductResponseDto> {
		const candidate: CreateProductDto = {
			name: typeof input.name === "string" ? input.name.trim() : "",
			product_image: input.product_image,
			brand: typeof input.brand === "string" ? input.brand.trim() : "",
			ingredients: this.normalizeIngredients(input.ingredients),
			category: this.normalizeCategory(input.category),
		};

		try {
			const validated = createProductSchema.parse(candidate);
			return this.createProduct(userId, validated);
		} catch (error) {
			if (error instanceof ZodError) {
				throw new HttpError(BAD_REQUEST, this.zodErrorToMessage(error));
			}

			throw error;
		}
	}

	async getProductById(id: string): Promise<ProductResponseDto> {
		const product = await prisma.product.findUnique({ where: { id } });

		if (!product) {
			throw new HttpError(NOT_FOUND, `Product with id '${id}' not found`);
		}

		return this.toProductResponse(product);
	}

	async getAllProducts(): Promise<ProductResponseDto[]> {
		const products = await prisma.product.findMany({
			orderBy: { createdAt: "desc" },
		});

		return products.map((product) => this.toProductResponse(product));
	}

	async updateProduct(id: string, data: UpdateProductDto): Promise<ProductResponseDto> {
		await this.assertProductExists(id);

		const updateData: Record<string, unknown> = {
			name: data.name,
			brand: data.brand,
			category: data.category,
			product_image_user: data.product_image_user ?? data.product_image,
			product_image_official: data.product_image_official,
			ingredients:
				data.ingredients !== undefined
					? (data.ingredients as Prisma.InputJsonValue)
					: undefined,
		};

		const updatedProduct = await prisma.product.update({
			where: { id },
			data: updateData as Prisma.ProductUpdateInput,
		});

		return this.toProductResponse(updatedProduct);
	}

	async getOfficialImageByProductId(id: string): Promise<{
		productId: string;
		product_image_official: string | null;
		product_image_user: string;
		product_image: string;
		source: "cached" | "serpapi" | "fallback";
	}> {
		// CHANGE: Added comprehensive logging to diagnose SerpAPI image fetch issues
		console.log(`[Product Service] getOfficialImageByProductId called - id: ${id}`);
		
		const product = (await this.productRuntime.findUnique({
			where: { id },
			select: {
				id: true,
				name: true,
				brand: true,
				product_image_user: true,
				product_image_official: true,
			},
		})) as {
			id: string;
			name: string;
			brand: string;
			product_image_user: string;
			product_image_official?: string | null;
		} | null;

		if (!product) {
			console.error(`[Product Service] Product not found - id: ${id}`);
			throw new HttpError(NOT_FOUND, `Product with id '${id}' not found`);
		}

		console.log(`[Product Service] Product found - name: "${product.name}", brand: "${product.brand}"`);

		if (product.product_image_official) {
			console.log(`[Product Service] Official image already cached - returning cached URL`);
			return {
				productId: product.id,
				product_image_official: product.product_image_official,
				product_image_user: product.product_image_user,
				product_image: product.product_image_official,
				source: "cached",
			};
		}

		console.log(`[Product Service] No cached official image - calling SerpAPI...`);
		
		try {
			const officialAsset = await serpApiImageService.fetchOfficialImageAsset({
				name: product.name,
				brand: product.brand,
			});

			console.log(`[Product Service] Official image asset fetched - uploading to S3...`);

			const officialKey = buildOfficialProductImageKey(product.id);
			const officialImageUrl = await uploadBufferToS3({
				key: officialKey,
				buffer: officialAsset.buffer,
				contentType: officialAsset.contentType,
			});

			console.log(`[Product Service] Official image uploaded to S3 - URL: ${officialImageUrl}`);

			await this.productRuntime.update({
				where: { id: product.id },
				data: {
					product_image_official: officialImageUrl,
				},
			});

			console.log(`[Product Service] Official image URL saved to database`);

			return {
				productId: product.id,
				product_image_official: officialImageUrl,
				product_image_user: product.product_image_user,
				product_image: officialImageUrl,
				source: "serpapi",
			};
		} catch (error) {
			console.error(`[Product Service] SerpAPI fetch failed - falling back to user image. Error:`, error instanceof Error ? error.message : error);
			// SerpAPI misses should not break product confirmation/evaluation flow.
			return {
				productId: product.id,
				product_image_official: null,
				product_image_user: product.product_image_user,
				product_image: product.product_image_user,
				source: "fallback",
			};
		}
	}

	async deleteProduct(id: string): Promise<{ message: string }> {
		await this.assertProductExists(id);

		await prisma.product.delete({ where: { id } });

		return { message: `Product with id '${id}' deleted successfully` };
	}
}

export default new ProductService();
