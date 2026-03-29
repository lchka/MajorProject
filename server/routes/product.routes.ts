import express, { Router } from "express";
import productController from "../controllers/product.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import { can } from "../middleware/permission.middleware";
import { validate } from "../middleware/validateRequest";
import { createProductSchema, updateProductSchema } from "../types/product.dto";
import { Permission } from "../types/permissions.dto";

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
	productController.createProductFromScan.bind(productController),
);

// list products
router.get(
	"/",
	authMiddleware,
	can(Permission.PRODUCT_VIEW),
	productController.getAllProducts.bind(productController),
);

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
