import express, { Router } from "express";
import profileController from "../controllers/profile.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { can, canAccessProfileByProfileId, canDeleteProfileByProfileId, canUpdateProfileByProfileId, canViewProfile } from "../middleware/permission.middleware.js";
import { profileImageUpload } from "../middleware/upload.middleware.js";
import { normalizeFormDataArrays } from "../middleware/normalizeFormData.middleware.js";
import { validate } from "../middleware/validateRequest.js";
import { Permission } from "../types/permissions.dto.js";
import { createProfileSchema, updateProfileSchema } from "../types/profile.dto.js";

const router: Router = express.Router();

// create profile
router.post(
	"/",
	authMiddleware,
	can(Permission.PROFILE_CREATE),
	profileImageUpload,
	normalizeFormDataArrays,
	validate(createProfileSchema),
	profileController.createProfile.bind(profileController),
);

// list all profiles (admin/moderator)
router.get(
	"/",
	authMiddleware,
	can(Permission.PROFILE_VIEW_ALL),
	profileController.getAllProfiles.bind(profileController),
);

// get own profiles
router.get(
	"/me",
	authMiddleware,
	can(Permission.PROFILE_VIEW_OWN_ALL),
	profileController.getMyProfile.bind(profileController),
);

// get profiles by user id (own profiles or admin/moderator view)
router.get(
	"/user/:userId",
	authMiddleware,
	canViewProfile,
	profileController.getProfileByUserId.bind(profileController),
);

// get profile by profile id (own or admin/moderator)
router.get(
	"/:id",
	authMiddleware,
	canAccessProfileByProfileId({ paramKey: "id" }),
	profileController.getProfileById.bind(profileController),
);

// update profile
router.patch(
	"/:id",
	authMiddleware,
	can(Permission.PROFILE_UPDATE),
	canUpdateProfileByProfileId({ paramKey: "id" }),
	profileImageUpload,
	normalizeFormDataArrays,
	validate(updateProfileSchema),
	profileController.updateProfile.bind(profileController),
);

// delete profile
router.delete(
	"/:id",
	authMiddleware,
	can(Permission.PROFILE_DELETE),
	canDeleteProfileByProfileId({ paramKey: "id" }),
	profileController.deleteProfile.bind(profileController),
);

export default router;