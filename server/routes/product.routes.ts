import express, { Router } from "express";
import productController from "../controllers/product.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { productImageUpload } from "../middleware/upload.middleware.js";
import { can } from "../middleware/permission.middleware.js";
import { validate } from "../middleware/validateRequest.js";
import { createProductSchema, updateProductSchema } from "../types/product.dto.js";
import { Permission } from "../types/permissions.dto.js";

const router: Router = express.Router();

// create product manually
router.post(
	"/",
	authMiddleware,
	can(Permission.PRODUCT_CREATE),
	validate(createProductSchema),
	productController.createProduct.bind(productController),
);

// create product from scanned/LLM extracted payload
router.post(
	"/scan",
	authMiddleware,
	can(Permission.PRODUCT_CREATE),
	productImageUpload,
	productController.createProductFromScan.bind(productController),
);

// list products
router.get(
	"/",
	authMiddleware,
	can(Permission.PRODUCT_VIEW),
	productController.getAllProducts.bind(productController),
);

// guide callers to the correct scan method
router.get("/scan", authMiddleware, (_req, res) => {
	res.status(405).json({
		message: "Use POST /api/products/scan with multipart form-data and product_image",
	});
});

// get single product
router.get(
	"/:id",
	authMiddleware,
	can(Permission.PRODUCT_VIEW),
	productController.getProductById.bind(productController),
);

// update product
router.patch(
	"/:id",
	authMiddleware,
	can(Permission.PRODUCT_UPDATE),
	validate(updateProductSchema),
	productController.updateProduct.bind(productController),
);

// delete product
router.delete(
	"/:id",
	authMiddleware,
	can(Permission.PRODUCT_DELETE),
	productController.deleteProduct.bind(productController),
);

export default router;
