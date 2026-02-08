import { Request, Response, NextFunction } from "express";
import authService from "../services/auth.service.js";
import { HttpError } from "../utils/HttpError.js";

// Extend Express Request type to include userId
declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

export const authMiddleware = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new HttpError(401, "No token provided");
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    const decoded = authService.verifyToken(token);
    
    req.userId = decoded.userId;

    next();
  } catch (error) {
    next(error);
  }
};
