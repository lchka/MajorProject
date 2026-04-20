import { Request, Response, NextFunction } from "express";
import authService from "../services/auth.service.js";
import {
  RegisterInput,
  LoginInput,
  GoogleLoginInput,
} from "../utils/validators/authValidator.js";
import { CREATED_SUCCESS, SUCCESS_RES } from "../utils/HttpError.js";

export class AuthController {
  async register(
    req: Request<Record<string, never>, Record<string, never>, RegisterInput>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const result = await authService.register(req.body);

      res.status(CREATED_SUCCESS).json(result);
    } catch (error) {
      next(error);
    }
  }

  async login(
    req: Request<Record<string, never>, Record<string, never>, LoginInput>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const result = await authService.login(req.body);

      res.status(SUCCESS_RES).json(result);
    } catch (error) {
      next(error);
    }
  }

  async googleLogin(
    req: Request<Record<string, never>, Record<string, never>, GoogleLoginInput>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const result = await authService.googleLogin(req.body);

      res.status(SUCCESS_RES).json(result);
    } catch (error) {
      next(error);
    }
  }

  async logout(
    _req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      // Since we're using JWT, logout is handled client-side by removing the token
      res.status(SUCCESS_RES).json({
        message: "Logout successful",
      });
    } catch (error) {
      next(error);
    }
  }

  async getCurrentUser(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      // userId is set by auth middleware
      const userId = (req as any).userId;
      
      if (!userId) {
        throw new Error("User ID not found in request");
      }

      const user = await authService.getCurrentUser(userId);

      res.status(SUCCESS_RES).json({
        message: "User retrieved successfully",
        user,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new AuthController();
