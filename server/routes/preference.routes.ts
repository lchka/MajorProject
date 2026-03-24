import express, { Router } from "express";
import preferenceController from "../controllers/preference.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { can, canAccessProfileByProfileId } from "../middleware/permission.middleware.js";
import { validate } from "../middleware/validateRequest.js";
import { Permission } from "../types/permissions.dto.js";
import { createPreferenceSchema, updatePreferenceSchema } from "../types/preference.dto.js";

const router: Router = express.Router();

// create preference
router.post(
  "/",
  authMiddleware,
  can(Permission.PREFERENCE_CREATE),
  validate(createPreferenceSchema),
  preferenceController.createPreference.bind(preferenceController),
);

// list preferences
router.get(
  "/",
  authMiddleware,
  can(Permission.PREFERENCE_VIEW),
  preferenceController.getAllPreferences.bind(preferenceController),
);

router.get(
  "/profile/:profileId",
  authMiddleware,
  can(Permission.PREFERENCE_VIEW),
  canAccessProfileByProfileId(),
  preferenceController.getProfilePreferences.bind(preferenceController),
);

// get one preference
router.get(
  "/:id",
  authMiddleware,
  can(Permission.PREFERENCE_VIEW),
  preferenceController.getPreferenceById.bind(preferenceController),
);

// update preference
router.patch(
  "/:id",
  authMiddleware,
  can(Permission.PREFERENCE_UPDATE),
  validate(updatePreferenceSchema),
  preferenceController.updatePreference.bind(preferenceController),
);

// delete preference
router.delete(
  "/:id",
  authMiddleware,
  can(Permission.PREFERENCE_DELETE),
  preferenceController.deletePreference.bind(preferenceController),
);

export default router;
