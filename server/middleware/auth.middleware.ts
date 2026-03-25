import { Request, Response, NextFunction } from "express";
import authService from "../services/auth.service.js";
import userRepository from "../repositories/user.repository.js";
import { HttpError } from "../utils/HttpError.js";

export const authMiddleware = async (
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new HttpError(401, "No token provided");
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    const decoded = authService.verifyToken(token);

    req.userId = decoded.userId;

    const user = await userRepository.findById(decoded.userId);

    if (!user) {
      throw new HttpError(401, "Unauthorized");
    }

    const selectedProfile =
      user.profiles?.find((profile) => profile.main_profile) ??
      user.profiles?.[0];

    req.user = {
      id: user.id,
      email: user.email,
      first_name: selectedProfile?.first_name || "",
      last_name: selectedProfile?.last_name || "",
      role: {
        id: user.role.id,
        name: user.role.name,
      },
    };

    next();
  } catch (error) {
    next(error);
  }
};
