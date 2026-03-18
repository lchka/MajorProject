import express, { Router } from "express";
import authController from "../controllers/auth.controller.js";
import { validate } from "../middleware/validateRequest.js";
import {
  registerSchema,
  loginSchema,
} from "../utils/validators/authValidator.js";

const router: Router = express.Router();

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post(
  "/register",
  validate(registerSchema),
  authController.register.bind(authController),
);

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post(
  "/login",
  validate(loginSchema),
  authController.login.bind(authController),
);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user
 * @access  Public
 */
router.post("/logout", authController.logout.bind(authController));

export default router;
