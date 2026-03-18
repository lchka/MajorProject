import express, { Router } from "express";
import preferenceController from "../controllers/preference.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { can } from "../middleware/permission.middleware.js";
import { validate } from "../middleware/validateRequest.js";
import { Permission } from "../types/permissions.dto.js";
import { createPreferenceSchema, updatePreferenceSchema } from "../types/preference.dto.js";

const router: Router = express.Router();

router.post(
  "/",
  authMiddleware,
  can(Permission.PREFERENCE_CREATE),
  validate(createPreferenceSchema),
  preferenceController.createPreference.bind(preferenceController),
);

router.get(
  "/",
  authMiddleware,
  can(Permission.PREFERENCE_VIEW),
  preferenceController.getAllPreferences.bind(preferenceController),
);

router.get(
  "/:id",
  authMiddleware,
  can(Permission.PREFERENCE_VIEW),
  preferenceController.getPreferenceById.bind(preferenceController),
);

router.patch(
  "/:id",
  authMiddleware,
  can(Permission.PREFERENCE_UPDATE),
  validate(updatePreferenceSchema),
  preferenceController.updatePreference.bind(preferenceController),
);

router.delete(
  "/:id",
  authMiddleware,
  can(Permission.PREFERENCE_DELETE),
  preferenceController.deletePreference.bind(preferenceController),
);

export default router;
