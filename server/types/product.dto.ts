import { z } from "zod";
import { imageValid } from "./profile.dto.js";
import { categoryEnum } from "./prompt.dto.js";
export const ingredientsJsonSchema = z.json().refine(
	(value) =>
		Array.isArray(value) &&
		value.length > 0 &&
		value.every((item) => typeof item === "string" && item.trim().length > 0),
	"Ingredients must be a non-empty JSON array of strings",
);

export const productResponseSchema = z.object({
	id: z.string().uuid("Product id must be a valid UUID"),
	name: z.string().min(1, "Product name is required"),
	product_image: imageValid,
	brand: z.string().min(1, "Brand name is required"),
	ingredients: ingredientsJsonSchema,
    category:categoryEnum,
    createdAt: z.date(),
    updatedAt: z.date(),
});

export const createProductSchema  =z.object({
    name:z.string().min(2,"Product name must be atleast 2 characters"),
    product_image:imageValid,
    brand:z.string().min(2,"Brand name must be at least 2 characters"),
    ingredients:ingredientsJsonSchema,
    category:categoryEnum
})

export const updateProductSchema  =z.object({
    name:z.string().min(2,"Product name must be atleast 2 characters").optional(),
    product_image:imageValid.optional(),
    brand:z.string().min(2,"Brand name must be at least 2 characters").optional(),
    ingredients:ingredientsJsonSchema.optional(),
    category:categoryEnum.optional()
})

export type ProductResponseDto = z.infer<typeof productResponseSchema>
export type CreateProductDto = z.infer<typeof createProductSchema>
export type UpdateProductDto = z.infer<typeof updateProductSchema>