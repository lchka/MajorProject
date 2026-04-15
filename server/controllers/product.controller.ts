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

type ProductScanBody = {
	name?: unknown;
	brand?: unknown;
	ingredients?: unknown;
	category?: unknown;
	product_image?: string;
};

export class ProductController {
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

	async createProductFromScan(
		req: Request<Record<string, never>, Record<string, never>, ProductScanBody>,
		res: Response,
		next: NextFunction,
	): Promise<void> {
		try {
			const userId = req.userId ?? req.user?.id;
			if (!userId) {
				throw new HttpError(UNAUTHORISED, "User is not authenticated");
			}

			if (!req.file) {
				throw new HttpError(BAD_REQUEST, "Product image is required for scan parsing");
			}

			let productImageUrl: string;
			try {
				productImageUrl = await uploadProductImageToS3(userId, req.file);
			} catch {
				throw new HttpError(
					INTERNAL_SERVER_ERROR,
					"Unable to upload product image to S3. Check AWS_S3_BUCKET and AWS credentials.",
				);
			}

			const parsed = await geminiService.extractProductFromImage(req.file);

			const product = await productService.createProductFromScan(userId, {
				name: parsed.name,
				brand: parsed.brand,
				ingredients: parsed.ingredients,
				category: parsed.category,
				product_image: productImageUrl,
			});

			res.status(CREATED_SUCCESS).json(product);
		} catch (error) {
			next(error);
		}
	}

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