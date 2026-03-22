import { Request, Response, NextFunction } from "express";
import { ProfileService } from "../services/profile.service.js";
import { CreateProfileDTO, UpdateProfileDTO } from "../types/profile.dto.js";
import { CREATED_SUCCESS, HttpError, SUCCESS_RES, UNAUTHORISED } from "../utils/HttpError.js";

const profileService = new ProfileService();

export class ProfileController {
    // create profile for the logged-in user
    async createProfile(
        req: Request<Record<string, never>, Record<string, never>, CreateProfileDTO>,
        res: Response,
        next: NextFunction,
    ): Promise<void> {
        try {
            const userId = req.userId ?? req.user?.id;
            if (!userId) {
                throw new HttpError(UNAUTHORISED, "User is not authenticated");
            }

            const profile = await profileService.createProfile(userId, req.body);
            res.status(CREATED_SUCCESS).json(profile);
        } catch (error) {
            next(error);
        }
    }

    async getAllProfiles(
        _req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> {
        try {
            // list all profiles
            const profiles = await profileService.getAllProfiles();
            res.status(SUCCESS_RES).json(profiles);
        } catch (error) {
            next(error);
        }
    }

    async getProfileById(
        req: Request<{ id: string }>,
        res: Response,
        next: NextFunction,
    ): Promise<void> {
        try {
            const profile = await profileService.getProfileById(req.params.id);
            res.status(SUCCESS_RES).json(profile);
        } catch (error) {
            next(error);
        }
    }

    async getProfileByUserId(
        req: Request<{ userId: string }>,
        res: Response,
        next: NextFunction,
    ): Promise<void> {
        try {
            const profile = await profileService.getProfileByUserId(req.params.userId);
            res.status(SUCCESS_RES).json(profile);
        } catch (error) {
            next(error);
        }
    }

    async getMyProfile(
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> {
        try {
            // pull user id from auth middleware
            const userId = req.userId ?? req.user?.id;
            if (!userId) {
                throw new HttpError(UNAUTHORISED, "User is not authenticated");
            }

            const profile = await profileService.getProfileByUserId(userId);
            res.status(SUCCESS_RES).json(profile);
        } catch (error) {
            next(error);
        }
    }

    async updateProfile(
        req: Request<{ id: string }, Record<string, never>, UpdateProfileDTO>,
        res: Response,
        next: NextFunction,
    ): Promise<void> {
        try {
            // patch profile fields + relation ids
            const profile = await profileService.updateProfile(req.params.id, req.body);
            res.status(SUCCESS_RES).json(profile);
        } catch (error) {
            next(error);
        }
    }

    async deleteProfile(
        req: Request<{ id: string }>,
        res: Response,
        next: NextFunction,
    ): Promise<void> {
        try {
            const result = await profileService.deleteProfile(req.params.id);
            res.status(SUCCESS_RES).json(result);
        } catch (error) {
            next(error);
        }
    }
}

export default new ProfileController();