import express, {Router} from "express";
import allergenController from "../controllers/allergen.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import { can } from "../middleware/permission.middleware";
import { validate } from "../middleware/validateRequest";
import { Permission } from "../types/permissions.dto";
import { createAllergenSchema, updateAllergenSchema } from "../types/allergen.dto";

const router: Router= express.Router();

//create allergen route
router.post("/", authMiddleware, can(Permission.ALLERGEN_CREATE), validate(createAllergenSchema), allergenController.createAllergen.bind(allergenController))

//get all allergens route
router.get(
    "/",
    authMiddleware,
    can(Permission.ALLERGEN_VIEW),
    allergenController.getAllAllergens.bind(allergenController)
)

//get single allergen route
router.get(
    "/:id",
    authMiddleware,
    can(Permission.ALLERGEN_VIEW),
    allergenController.getAllergenById.bind(allergenController)
)

//update allergen route
router.patch(
    "/:id",
    authMiddleware,
    can(Permission.ALLERGEN_UPDATE),
    validate(updateAllergenSchema),
    allergenController.updateAllergen.bind(allergenController)
)

//delete allergen router
router.delete(
    "/:id",
    authMiddleware,
    can(Permission.ALLERGEN_DELETE),
    allergenController.deleteAllergen.bind(allergenController)
)