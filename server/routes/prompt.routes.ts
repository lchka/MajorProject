import express, { Router } from "express";
import promptController from "../controllers/prompt.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import { can } from "../middleware/permission.middleware";
import { validate } from "../middleware/validateRequest";
import { Permission } from "../types/permissions.dto";
import { createPromptSchema, updatePromptSchema } from "../types/prompt.dto";

const router: Router = express.Router();

//create prompt route
router.post(
	"/",
	authMiddleware,
	validate(createPromptSchema),
	can(Permission.PROMPT_CREATE),
	promptController.createPrompt.bind(promptController),
);

//get all prompt route
router.get("/", authMiddleware, can(Permission.PROMPT_VIEW),promptController.getAllPrompts.bind(promptController))


//get single prompt route
router.get(
	"/:id",
	authMiddleware,
	can(Permission.PROMPT_VIEW),
	promptController.getPromptById.bind(promptController),
)

//update prompt route
router.patch("/:id",authMiddleware, validate(updatePromptSchema),can(Permission.PROMPT_UPDATE),promptController.updatePrompt.bind(promptController))

//delete prompt route
router.delete("/:id", authMiddleware,can(Permission.PROMPT_DELETE),promptController.deletePrompt.bind(promptController))


export default router;
