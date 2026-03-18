import express, {Router} from"express";
import conditionController from "../controllers/condition.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import { can } from "../middleware/permission.middleware";
import { validate } from "../middleware/validateRequest";
import { Permission } from "../types/permissions.dto";
import { createConditionSchema, updateConditionSchema } from "../types/condition.dto";

const router: Router= express.Router();

//create condition route
router.post(
    "/",
    authMiddleware,
    validate(createConditionSchema),
    can(Permission.CONDITION_CREATE),
    conditionController.createCondition.bind(conditionController)
)

//get all conditions route
router.get(
    "/",
    authMiddleware,
    can(Permission.CONDITION_VIEW),
    conditionController.getAllConditions.bind(conditionController)
)

//get single condition route
router.get(
    "/:id",
    authMiddleware,
    can(Permission.CONDITION_VIEW),
    conditionController.getConditionById.bind(conditionController)
)

//update condition route
router.patch(
    "/:id",
    authMiddleware,
    validate(updateConditionSchema),
    can(Permission.CONDITION_UPDATE),
    conditionController.updateCondition.bind(conditionController)
)

//delete condition route
router.delete(
    "/:id",
    authMiddleware,
    can(Permission.CONDITION_DELETE),
    conditionController.deleteCondition.bind(conditionController)
)
export default router;