import { NextFunction, Request, Response } from "express";
import { ProductService } from "../services/product.service";
import { CreateProductDto, UpdateProductDto } from "../types/product.dto";
import { CREATED_SUCCESS, SUCCESS_RES } from "../utils/HttpError";

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
			const product = await productService.createProduct(req.body);
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
			const product = await productService.createProductFromScan({
				name: req.body.name,
				brand: req.body.brand,
				ingredients: req.body.ingredients,
				category: req.body.category,
				product_image: req.body.product_image ?? "",
			});

			res.status(CREATED_SUCCESS).json(product);
		} catch (error) {
			next(error);
		}
	}

	async getAllProducts(
		_req: Request,
		res: Response,
		next: NextFunction,
	): Promise<void> {
		try {
			const products = await productService.getAllProducts();
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
			const result = await productService.deleteProduct(req.params.id);
			res.status(SUCCESS_RES).json(result);
		} catch (error) {
			next(error);
		}
	}
}

export default new ProductController();