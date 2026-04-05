import express, { Router } from "express";
import evaluationContextController from "../controllers/evaluationContext.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import { can, canAccessEvaluationContextById } from "../middleware/permission.middleware";
import { validate } from "../middleware/validateRequest";
import {
	createEvaluationContextSchema,
	evaluateProductRequestSchema,
	updateEvaluationContextSchema,
} from "../types/evaluationContext.dto";
import { Permission } from "../types/permissions.dto";

const router: Router = express.Router();

// create evaluation context manually
router.post(
	"/",
	authMiddleware,
	can(Permission.EVALUATION_CONTEXT_CREATE),
	validate(createEvaluationContextSchema),
	evaluationContextController.createEvaluationContext.bind(evaluationContextController),
);

// evaluate product against profile and store context
router.post(
	"/evaluate",
	authMiddleware,
	can(Permission.EVALUATION_CONTEXT_CREATE),
	validate(evaluateProductRequestSchema),
	evaluationContextController.evaluateProduct.bind(evaluationContextController),
);

// list all evaluation contexts
router.get(
	"/",
	authMiddleware,
	can(Permission.EVALUATION_CONTEXT_VIEW),
	evaluationContextController.getAllEvaluationContexts.bind(evaluationContextController),
);

// list current user's evaluation contexts
router.get(
	"/me",
	authMiddleware,
	can(Permission.EVALUATION_CONTEXT_VIEW),
	evaluationContextController.getEvaluationContextsForUser.bind(evaluationContextController),
);

// list by profile
router.get(
	"/profile/:profileId",
	authMiddleware,
	can(Permission.EVALUATION_CONTEXT_VIEW),
	evaluationContextController.getEvaluationContextsByProfileId.bind(evaluationContextController),
);

// list by product
router.get(
	"/product/:productId",
	authMiddleware,
	can(Permission.EVALUATION_CONTEXT_VIEW),
	evaluationContextController.getEvaluationContextsByProductId.bind(evaluationContextController),
);

// re-evaluate an existing context
router.post(
	"/:id/reevaluate",
	authMiddleware,
	can(Permission.EVALUATION_CONTEXT_UPDATE),
	canAccessEvaluationContextById({ paramKey: "id" }),
	evaluationContextController.reevaluateEvaluationContext.bind(evaluationContextController),
);

// get single evaluation context
router.get(
	"/:id",
	authMiddleware,
	can(Permission.EVALUATION_CONTEXT_VIEW),
	evaluationContextController.getEvaluationContextById.bind(evaluationContextController),
);

// update evaluation context
router.patch(
	"/:id",
	authMiddleware,
	can(Permission.EVALUATION_CONTEXT_UPDATE),
	canAccessEvaluationContextById({ paramKey: "id" }),
	validate(updateEvaluationContextSchema),
	evaluationContextController.updateEvaluationContext.bind(evaluationContextController),
);

// delete evaluation context
router.delete(
	"/:id",
	authMiddleware,
	can(Permission.EVALUATION_CONTEXT_DELETE),
	evaluationContextController.deleteEvaluationContext.bind(evaluationContextController),
);

export default router;
