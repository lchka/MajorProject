import express, { Router } from "express";
import userController from "../controllers/user.controller.js";
// import { authMiddleware } from "../middleware/auth.middleware.js"; // TODO: Create this

const router: Router = express.Router();

/**
 * @route   GET /api/users/profile
 * @desc    Get current user profile
 * @access  Private
 */
router.get(
  "/profile",
  // authMiddleware, // TODO: Add auth middleware
  userController.getProfile.bind(userController)
);

/**
 * @route   GET /api/users
 * @desc    Get all users
 * @access  Private (Admin only)
 */
router.get(
  "/",
  // authMiddleware, // TODO: Add auth middleware
  // adminMiddleware, // TODO: Add admin middleware
  userController.getAllUsers.bind(userController)
);

/**
 * @route   GET /api/users/:id
 * @desc    Get user by ID
 * @access  Private
 */
router.get(
  "/:id",
  // authMiddleware, // TODO: Add auth middleware
  userController.getUserById.bind(userController)
);

export default router;
