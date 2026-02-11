import express, { Router } from "express";
import userController from "../controllers/user.controller.js";
import { validate } from "../middleware/validateRequest.js";
import { updateUserSchema } from "../utils/validators/userValidator.js";
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
 * @route   PUT /api/users/profile
 * @desc    Update current user profile
 * @access  Private
 */
router.put(
  "/profile",
  // authMiddleware, // TODO: Add auth middleware
  validate(updateUserSchema),
  userController.updateProfile.bind(userController)
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

/**
 * @route   PUT /api/users/:id
 * @desc    Update user by ID
 * @access  Private (Admin only)
 */
router.put(
  "/:id",
  // authMiddleware, // TODO: Add auth middleware
  // adminMiddleware, // TODO: Add admin middleware
  validate(updateUserSchema),
  userController.updateUser.bind(userController)
);

/**
 * @route   DELETE /api/users/:id/soft
 * @desc    Soft delete user (mark as deleted)
 * @access  Private (Admin only)
 */
router.delete(
  "/:id/soft",
  // authMiddleware, // TODO: Add auth middleware
  // adminMiddleware, // TODO: Add admin middleware
  userController.softDeleteUser.bind(userController)
);

/**
 * @route   DELETE /api/users/:id/force
 * @desc    Force delete user (permanent deletion)
 * @access  Private (Admin only)
 */
router.delete(
  "/:id/force",
  // authMiddleware, // TODO: Add auth middleware
  // adminMiddleware, // TODO: Add admin middleware
  userController.forceDeleteUser.bind(userController)
);

/**
 * @route   POST /api/users/:id/restore
 * @desc    Restore soft deleted user
 * @access  Private (Admin only)
 */
router.post(
  "/:id/restore",
  // authMiddleware, // TODO: Add auth middleware
  // adminMiddleware, // TODO: Add admin middleware
  userController.restoreUser.bind(userController)
);

export default router;
