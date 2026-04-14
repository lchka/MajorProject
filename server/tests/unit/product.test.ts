import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import type { NextFunction, Request, Response } from "express";
import { CREATED_SUCCESS, SUCCESS_RES } from "../../utils/HttpError.js";
import type {
	CreateProductDto,
	ProductResponseDto,
	UpdateProductDto,
} from "../../types/product.dto.js";
import {
	createProductSchema,
	updateProductSchema,
} from "../../types/product.dto.js";
import { can } from "../../middleware/permission.middleware.js";
import { Permission } from "../../types/permissions.dto.js";

// Typed mocks
const mockCreateProduct = jest.fn<
	(userId: string, data: CreateProductDto) => Promise<ProductResponseDto>
>();

const mockCreateProductFromScan = jest.fn<
	(userId: string, data: unknown) => Promise<ProductResponseDto>
>();

const mockGetAllProducts = jest.fn<
	() => Promise<ProductResponseDto[]>
>();

const mockGetAllProductsByUserId = jest.fn<
	(userId: string) => Promise<ProductResponseDto[]>
>();

const mockGetProductById = jest.fn<
	(id: string) => Promise<ProductResponseDto>
>();

const mockUpdateProduct = jest.fn<
	(id: string, data: UpdateProductDto) => Promise<ProductResponseDto>
>();

const mockDeleteProduct = jest.fn<
	(id: string) => Promise<{ message: string }>
>();

const mockAssertUserOwnsProduct = jest.fn<
	(id: string, userId: string) => Promise<void>
>();

// Mocks (ESM safe)
jest.mock("../../services/product.service.js", () => ({
	__esModule: true,
	ProductService: class ProductService {
		createProduct = mockCreateProduct;
		createProductFromScan = mockCreateProductFromScan;
		getAllProducts = mockGetAllProducts;
		getAllProductsByUserId = mockGetAllProductsByUserId;
		getProductById = mockGetProductById;
		updateProduct = mockUpdateProduct;
		deleteProduct = mockDeleteProduct;
		assertUserOwnsProduct = mockAssertUserOwnsProduct;
	},
}));

// Imports AFTER mocks
import productController from "../../controllers/product.controller.js";

// Test data
const baseProduct: ProductResponseDto = {
	id: "11111111-1111-1111-1111-111111111111",
	name: "Gentle Cleanser",
	product_image: "https://example.com/product.jpg",
	brand: "SkinCo",
	ingredients: ["water", "glycerin"],
	category: "Cleanser",
	createdAt: new Date("2024-01-01T00:00:00.000Z"),
	updatedAt: new Date("2024-01-02T00:00:00.000Z"),
};

beforeEach(() => {
	jest.clearAllMocks();
});

// CREATE PRODUCT
describe("ProductController.createProduct", () => {
	it("should create product", async () => {
		mockCreateProduct.mockResolvedValue(baseProduct);

		const req = {
			userId: "user-1",
			body: {
				name: baseProduct.name,
				product_image: baseProduct.product_image,
				brand: baseProduct.brand,
				ingredients: baseProduct.ingredients,
				category: baseProduct.category,
			},
		} as Request<Record<string, never>, Record<string, never>, CreateProductDto>;
		const res = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		} as unknown as Response;
		const next = jest.fn() as NextFunction;

		await productController.createProduct(req, res, next);

		expect(mockCreateProduct).toHaveBeenCalledWith("user-1", {
			name: baseProduct.name,
			product_image: baseProduct.product_image,
			brand: baseProduct.brand,
			ingredients: baseProduct.ingredients,
			category: baseProduct.category,
		});
		expect(res.status).toHaveBeenCalledWith(CREATED_SUCCESS);
		expect(res.json).toHaveBeenCalledWith(baseProduct);
		expect(next).not.toHaveBeenCalled();
	});
});

// GET ALL PRODUCTS
describe("ProductController.getAllProducts", () => {
	it("should return all products for admin", async () => {
		mockGetAllProducts.mockResolvedValue([baseProduct]);

		const req = {
			userId: "admin-1",
			user: { id: "admin-1", role: { name: "admin" } },
		} as Request;
		const res = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		} as unknown as Response;
		const next = jest.fn() as NextFunction;

		await productController.getAllProducts(req, res, next);

		expect(mockGetAllProducts).toHaveBeenCalled();
		expect(res.status).toHaveBeenCalledWith(SUCCESS_RES);
		expect(res.json).toHaveBeenCalledWith([baseProduct]);
		expect(next).not.toHaveBeenCalled();
	});
});

// GET PRODUCT BY ID
describe("ProductController.getProductById", () => {
	it("should return product for user with ownership", async () => {
		mockGetProductById.mockResolvedValue(baseProduct);

		const req = {
			params: { id: baseProduct.id },
			userId: "user-1",
			user: { id: "user-1", role: { name: "user" } },
		} as Request<{ id: string }>;
		const res = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		} as unknown as Response;
		const next = jest.fn() as NextFunction;

		await productController.getProductById(req, res, next);

		expect(mockAssertUserOwnsProduct).toHaveBeenCalledWith(
			baseProduct.id,
			"user-1",
		);
		expect(mockGetProductById).toHaveBeenCalledWith(baseProduct.id);
		expect(res.status).toHaveBeenCalledWith(SUCCESS_RES);
		expect(res.json).toHaveBeenCalledWith(baseProduct);
		expect(next).not.toHaveBeenCalled();
	});
});

// UPDATE PRODUCT
describe("ProductController.updateProduct", () => {
	it("should update product for user with ownership", async () => {
		const updatedProduct = { ...baseProduct, name: "Updated" };
		mockUpdateProduct.mockResolvedValue(updatedProduct);

		const req = {
			params: { id: baseProduct.id },
			body: { name: "Updated" },
			userId: "user-1",
			user: { id: "user-1", role: { name: "user" } },
		} as Request<{ id: string }, Record<string, never>, UpdateProductDto>;
		const res = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		} as unknown as Response;
		const next = jest.fn() as NextFunction;

		await productController.updateProduct(req, res, next);

		expect(mockAssertUserOwnsProduct).toHaveBeenCalledWith(
			baseProduct.id,
			"user-1",
		);
		expect(mockUpdateProduct).toHaveBeenCalledWith(baseProduct.id, {
			name: "Updated",
		});
		expect(res.status).toHaveBeenCalledWith(SUCCESS_RES);
		expect(res.json).toHaveBeenCalledWith(updatedProduct);
		expect(next).not.toHaveBeenCalled();
	});
});

// DELETE PRODUCT
describe("ProductController.deleteProduct", () => {
	it("should delete product for user with ownership", async () => {
		mockDeleteProduct.mockResolvedValue({
			message: "Product deleted successfully",
		});

		const req = {
			params: { id: baseProduct.id },
			userId: "user-1",
			user: { id: "user-1", role: { name: "user" } },
		} as Request<{ id: string }>;
		const res = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		} as unknown as Response;
		const next = jest.fn() as NextFunction;

		await productController.deleteProduct(req, res, next);

		expect(mockAssertUserOwnsProduct).toHaveBeenCalledWith(
			baseProduct.id,
			"user-1",
		);
		expect(mockDeleteProduct).toHaveBeenCalledWith(baseProduct.id);
		expect(res.status).toHaveBeenCalledWith(SUCCESS_RES);
		expect(res.json).toHaveBeenCalledWith({
			message: "Product deleted successfully",
		});
		expect(next).not.toHaveBeenCalled();
	});
});

// VALIDATION
describe("Product validation", () => {
	it("should accept valid create input", () => {
		const result = createProductSchema.safeParse({
			name: "Face Wash",
			product_image: "https://example.com/facewash.png",
			brand: "SkinCo",
			ingredients: ["water"],
			category: "Cleanser",
		});

		expect(result.success).toBe(true);
	});

	it("should accept empty update input", () => {
		const result = updateProductSchema.safeParse({});

		expect(result.success).toBe(true);
	});
});

// ROUTE PERMISSIONS
describe("Product route permissions", () => {
	it("should allow user to create product", () => {
		const req = {
			user: { id: "user-1", role: { name: "user" } },
		} as Request;
		const res = {} as Response;
		const next = jest.fn() as NextFunction;

		can(Permission.PRODUCT_CREATE)(req, res, next);

		expect(next).toHaveBeenCalled();
	});

	it("should allow moderator to update product", () => {
		const req = {
			user: { id: "mod-1", role: { name: "moderator" } },
		} as Request;
		const res = {} as Response;
		const next = jest.fn() as NextFunction;

		can(Permission.PRODUCT_UPDATE)(req, res, next);

		expect(next).toHaveBeenCalled();
	});

	it("should allow admin to delete product", () => {
		const req = {
			user: { id: "admin-1", role: { name: "admin" } },
		} as Request;
		const res = {} as Response;
		const next = jest.fn() as NextFunction;

		can(Permission.PRODUCT_DELETE)(req, res, next);

		expect(next).toHaveBeenCalled();
	});

	it("should forbid user from deleting product", () => {
		const req = {
			user: { id: "user-1", role: { name: "user" } },
		} as Request;
		const res = {} as Response;
		const next = jest.fn() as NextFunction;

		expect(() => can(Permission.PRODUCT_DELETE)(req, res, next)).toThrow();
		expect(next).not.toHaveBeenCalled();
	});
});
