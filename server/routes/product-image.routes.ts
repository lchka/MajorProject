import express, { Router } from "express";
import productController from "../controllers/product.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { can } from "../middleware/permission.middleware.js";
import { Permission } from "../types/permissions.dto.js";

const router: Router = express.Router();

router.get(
  "/",
  authMiddleware,
  can(Permission.PRODUCT_VIEW),
  productController.getProductImage.bind(productController),
);

export default router;
