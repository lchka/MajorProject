import { Request, Response, NextFunction } from "express";
import { ProfileService } from "../services/profile.service.js";
import { CreateProfileDTO, UpdateProfileDTO } from "../types/profile.dto.js";
import { BAD_REQUEST, CREATED_SUCCESS, HttpError, SUCCESS_RES, UNAUTHORISED } from "../utils/HttpError.js";
import { uploadProfileImageToS3 } from "../lib/s3.js";

const profileService = new ProfileService();
//CHECK AUTH MIDDLARE AND PERMISSION TYPES FOR ROLE POLICIES
// controller functions for handling profile-related API requests, including creating profiles, retrieving profiles (by ID and by user ID), updating profiles, and deleting profiles, with support for profile image uploads to S3
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

            let profileImageUrl = req.body.profile_image;
            if (req.file) {
                profileImageUrl = await uploadProfileImageToS3(userId, req.file);
            }

            const profilePayload: CreateProfileDTO = {
                ...req.body,
                profile_image: profileImageUrl,
            };

            const profile = await profileService.createProfile(userId, profilePayload);
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
            const hasTextFields = Object.keys(req.body ?? {}).length > 0;

            if (!req.file && !hasTextFields) {
                throw new HttpError(BAD_REQUEST, "At least one field must be provided for update");
            }

            // patch profile fields + relation ids
            let profileImageUrl = req.body.profile_image;

            if (req.file) {
                const currentProfile = await profileService.getProfileById(req.params.id);
                profileImageUrl = await uploadProfileImageToS3(currentProfile.userId, req.file);
            }

            const payload: UpdateProfileDTO = {
                ...req.body,
                profile_image: profileImageUrl,
            };

            const profile = await profileService.updateProfile(req.params.id, payload);
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