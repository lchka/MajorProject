import { z, ZodError } from "zod";
import { Prisma } from "@prisma/client";
import prisma from "../lib/prisma";
import {
	CreateProductDto,
	ProductResponseDto,
	UpdateProductDto,
	createProductSchema,
	productResponseSchema,
} from "../types/product.dto";
import { categoryEnum } from "../types/prompt.dto";
import { BAD_REQUEST, HttpError, NOT_FOUND } from "../utils/HttpError";

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

	async createProduct(data: CreateProductDto): Promise<ProductResponseDto> {
		const product = await prisma.product.create({
			data: {
				name: data.name,
				product_image: data.product_image,
				brand: data.brand,
				ingredients: data.ingredients as Prisma.InputJsonValue,
				category: data.category,
			},
		});

		return productResponseSchema.parse(product);
	}

	async createProductFromScan(input: ProductScanInput): Promise<ProductResponseDto> {
		const candidate: CreateProductDto = {
			name: typeof input.name === "string" ? input.name.trim() : "",
			product_image: input.product_image,
			brand: typeof input.brand === "string" ? input.brand.trim() : "",
			ingredients: this.normalizeIngredients(input.ingredients),
			category: this.normalizeCategory(input.category),
		};

		try {
			const validated = createProductSchema.parse(candidate);
			return this.createProduct(validated);
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

		return productResponseSchema.parse(product);
	}

	async getAllProducts(): Promise<ProductResponseDto[]> {
		const products = await prisma.product.findMany({
			orderBy: { createdAt: "desc" },
		});

		return productResponseSchema.array().parse(products);
	}

	async updateProduct(id: string, data: UpdateProductDto): Promise<ProductResponseDto> {
		await this.assertProductExists(id);

		const updateData: Prisma.ProductUpdateInput = {
			...data,
			ingredients:
				data.ingredients !== undefined
					? (data.ingredients as Prisma.InputJsonValue)
					: undefined,
		};

		const updatedProduct = await prisma.product.update({
			where: { id },
			data: updateData,
		});

		return productResponseSchema.parse(updatedProduct);
	}

	async deleteProduct(id: string): Promise<{ message: string }> {
		await this.assertProductExists(id);

		await prisma.product.delete({ where: { id } });

		return { message: `Product with id '${id}' deleted successfully` };
	}
}

export default new ProductService();
