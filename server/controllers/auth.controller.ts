import { Request, Response, NextFunction } from "express";
import authService from "../services/auth.service.js";
import {
  RegisterInput,
  LoginInput,
} from "../utils/validators/authValidator.js";

export class AuthController {
  async register(
    req: Request<Record<string, never>, Record<string, never>, RegisterInput>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const result = await authService.register(req.body);

      res.status(201).json(result);
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

      res.status(200).json(result);
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
      res.status(200).json({
        message: "Logout successful",
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new AuthController();
