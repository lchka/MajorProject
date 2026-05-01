import { Request, Response, NextFunction } from "express";
import authService from "../services/auth.service.js";
import userRepository from "../repositories/user.repository.js";
import { HttpError } from "../utils/HttpError.js";
import { ProfileResponseDTO } from "../types/profile.dto.js";
// Type definition for a user object that includes associated profiles, used in the authentication middleware to ensure that the user data is properly structured when retrieved from the database, allowing for easy access to user information and their profiles within the request handling process.
type UserWithProfiles = {
  id: string;
  email: string;
  role: {
    id: string;
    name: string;
  };
  profiles?: ProfileResponseDTO[];
};
//  Authentication middleware for Express applications, responsible for verifying JWT tokens provided in the Authorization header of incoming requests, extracting user information from the token, and attaching it to the request object for use in subsequent middleware and route handlers, while also handling errors related to missing or invalid tokens and unauthorized access.
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

    const token = authHeader.substring(7);

    const decoded = authService.verifyToken(token);

    req.userId = decoded.userId;

    const user = (await userRepository.findById(
      decoded.userId,
    )) as UserWithProfiles | null;

    if (!user) {
      throw new HttpError(401, "Unauthorized");
    }
// Select the main profile if available, otherwise use the first profile, and attach user information to the request object for use in route handlers, ensuring that user data is easily accessible throughout the request lifecycle.
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