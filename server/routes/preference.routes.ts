import express, { Router } from "express";
import preferenceController from "../controllers/preference.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validateRequest.js";
import { createPreferenceSchema, updatePreferenceSchema } from "../types/preference.dto.js";

const router: Router = express.Router();

router.post(
  "/",
  authMiddleware,
  validate(createPreferenceSchema),
  preferenceController.createPreference.bind(preferenceController),
);

router.get(
  "/",
  authMiddleware,
  preferenceController.getAllPreferences.bind(preferenceController),
);

router.get(
  "/:id",
  authMiddleware,
  preferenceController.getPreferenceById.bind(preferenceController),
);

router.patch(
  "/:id",
  authMiddleware,
  validate(updatePreferenceSchema),
  preferenceController.updatePreference.bind(preferenceController),
);

router.delete(
  "/:id",
  authMiddleware,
  preferenceController.deletePreference.bind(preferenceController),
);

export default router;
