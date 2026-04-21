import { NextFunction, Request, Response } from "express";
import geminiService from "../services/gemini.service.js";
import { ProductService } from "../services/product.service.js";
import { CreateProductDto, UpdateProductDto } from "../types/product.dto.js";
import { uploadProductImageToS3 } from "../lib/s3.js";
import {
	BAD_REQUEST,
	CREATED_SUCCESS,
	HttpError,
	INTERNAL_SERVER_ERROR,
	SUCCESS_RES,
	UNAUTHORISED,
} from "../utils/HttpError.js";

const productService = new ProductService();
//CHECK AUTH MIDDLARE AND PERMISSION TYPES FOR ROLE POLICIES
type ProductScanBody = {
	name?: unknown;
	brand?: unknown;
	ingredients?: unknown;
	category?: unknown;
	product_image?: string;
};

export class ProductController {

	//create product method using types
	async createProduct(
		req: Request<Record<string, never>, Record<string, never>, CreateProductDto>,
		res: Response,
		next: NextFunction,
	): Promise<void> {
		try {
			const userId = req.userId ?? req.user?.id;
			if (!userId) {
				throw new HttpError(UNAUTHORISED, "User is not authenticated");
			}

			const product = await productService.createProduct(userId, req.body);
			res.status(CREATED_SUCCESS).json(product);
		} catch (error) {
			next(error);
		}
	}
	//create product from capturing an image method using types

	async createProductFromScan(
		req: Request<Record<string, never>, Record<string, never>, ProductScanBody>,
		res: Response,
		next: NextFunction,
	): Promise<void> {
		try {
			// CHANGE: Added detailed logging to debug image upload and product creation flow
			console.log(`[Product Controller] createProductFromScan called`);
			
			const userId = req.userId ?? req.user?.id;
			if (!userId) {
				throw new HttpError(UNAUTHORISED, "User is not authenticated");
			}

			if (!req.file) {
				throw new HttpError(BAD_REQUEST, "Product image is required for scan parsing");
			}

			console.log(`[Product Controller] Uploading image to S3 - file: ${req.file.originalname}, size: ${req.file.size} bytes`);
			
			let productImageUrl: string;
			try {
				productImageUrl = await uploadProductImageToS3(userId, req.file);
				console.log(`[Product Controller] Image uploaded to S3: ${productImageUrl}`);
			} catch {
				console.error(`[Product Controller] Failed to upload image to S3`);
				throw new HttpError(
					INTERNAL_SERVER_ERROR,
					"Unable to upload product image to S3. Check AWS_S3_BUCKET and AWS credentials.",
				);
			}

			console.log(`[Product Controller] Extracting product data via Gemini...`);
			const parsed = await geminiService.extractProductFromImage(req.file);
			console.log(`[Product Controller] Gemini extraction complete - name: "${parsed.name}", brand: "${parsed.brand}"`);

			const product = await productService.createProductFromScan(userId, {
				name: parsed.name,
				brand: parsed.brand,
				ingredients: parsed.ingredients,
				category: parsed.category,
				product_image: productImageUrl,
			});

			console.log(`[Product Controller] Product created - id: ${product.id}`);
			res.status(CREATED_SUCCESS).json(product);
		} catch (error) {
			console.error(`[Product Controller] Error in createProductFromScan:`, error instanceof Error ? error.message : error);
			next(error);
		}
	}
	//all products method

	async getAllProducts(
		req: Request,
		res: Response,
		next: NextFunction,
	): Promise<void> {
		try {
			const userId = req.userId ?? req.user?.id;
			if (!userId || !req.user) {
				throw new HttpError(UNAUTHORISED, "User is not authenticated");
			}

			const products =
				req.user.role.name === "user"
					? await productService.getAllProductsByUserId(userId)
					: await productService.getAllProducts();
			res.status(SUCCESS_RES).json(products);
		} catch (error) {
			next(error);
		}
	}
	// products by id method

	async getProductById(
		req: Request<{ id: string }>,
		res: Response,
		next: NextFunction,
	): Promise<void> {
		try {
			const userId = req.userId ?? req.user?.id;
			if (!userId || !req.user) {
				throw new HttpError(UNAUTHORISED, "User is not authenticated");
			}

			if (req.user.role.name === "user") {
				await productService.assertUserOwnsProduct(req.params.id, userId);
			}

			const product = await productService.getProductById(req.params.id);
			res.status(SUCCESS_RES).json(product);
		} catch (error) {
			next(error);
		}
	}

	async updateProduct(
		req: Request<{ id: string }, Record<string, never>, UpdateProductDto>,
		res: Response,
		next: NextFunction,
	): Promise<void> {
		try {
			const userId = req.userId ?? req.user?.id;
			if (!userId || !req.user) {
				throw new HttpError(UNAUTHORISED, "User is not authenticated");
			}

			if (req.user.role.name === "user") {
				await productService.assertUserOwnsProduct(req.params.id, userId);
			}

			const product = await productService.updateProduct(req.params.id, req.body);
			res.status(SUCCESS_RES).json(product);
		} catch (error) {
			next(error);
		}
	}

	async getProductImage(
		req: Request<Record<string, never>, Record<string, never>, Record<string, never>, { productId?: string }>,
		res: Response,
		next: NextFunction,
	): Promise<void> {
		try {
			const userId = req.userId ?? req.user?.id;
			const userRole = req.user?.role?.name;

			if (!userId || !userRole) {
				throw new HttpError(UNAUTHORISED, "User is not authenticated");
			}

			const productId = typeof req.query.productId === "string" ? req.query.productId : "";
			if (!productId) {
				throw new HttpError(BAD_REQUEST, "Query param productId is required");
			}

			if (userRole === "user") {
				await productService.assertUserOwnsProduct(productId, userId);
			}

			const imagePayload = await productService.getOfficialImageByProductId(productId);
			res.status(SUCCESS_RES).json(imagePayload);
		} catch (error) {
			next(error);
		}
	}

	async deleteProduct(
		req: Request<{ id: string }>,
		res: Response,
		next: NextFunction,
	): Promise<void> {
		try {
			const userId = req.userId ?? req.user?.id;
			if (!userId || !req.user) {
				throw new HttpError(UNAUTHORISED, "User is not authenticated");
			}

			if (req.user.role.name === "user") {
				await productService.assertUserOwnsProduct(req.params.id, userId);
			}

			const result = await productService.deleteProduct(req.params.id);
			res.status(SUCCESS_RES).json(result);
		} catch (error) {
			next(error);
		}
	}
}

export default new ProductController();