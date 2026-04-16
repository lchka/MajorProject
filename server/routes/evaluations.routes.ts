import express, { Router } from "express";
import evaluationController from "../controllers/evaluation.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { can } from "../middleware/permission.middleware.js";
import { Permission } from "../types/permissions.dto.js";

const router: Router = express.Router();

router.post(
  "/",
  authMiddleware,
  can(Permission.EVALUATION_CONTEXT_CREATE),
  evaluationController.archiveEvaluation.bind(evaluationController),
);

export default router;
