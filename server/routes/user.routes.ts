// routes/user.routes.ts
import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import cors from "cors";

import {
  can,
  canModifyUser,
  canViewUser,
  canDeleteUser,
} from "../middleware/permission.middleware.js";
import { Permission } from "../types/permissions.dto.js";
import userController from "../controllers/user.controller.js";
import { validate } from "../middleware/validateRequest.js";
import { updateUserSchema } from "../utils/validators/userValidator.js";

const router = Router();

// Public - no authentication needed
// (none for users, only auth routes)
router.options("/:id/force", cors());

// Force delete - admin only
router.delete(
  "/:id/force",
  authMiddleware,
  can(Permission.USER_DELETE_ANY),
  userController.forceDeleteUser,
);
// View all users - requires USER_VIEW_ALL permission (admin/moderator)
router.get(
  "/",
  authMiddleware,
  can(Permission.USER_VIEW_ALL),
  userController.getAllUsers,
);

// View specific user - admin/moderator can view all, users can view themselves
router.get("/:id", authMiddleware, canViewUser, userController.getUserById);

// Update user - admin can update anyone, users can update themselves
router.patch(
  "/:id",
  authMiddleware,
  canModifyUser,
  validate(updateUserSchema),
  userController.updateUser,
);


// Soft delete - admin can delete anyone, moderators/users can delete themselves
router.delete(
  "/:id",
  authMiddleware,
  canDeleteUser,
  userController.softDeleteUser,
);



// Restore user - admin only
router.post(
  "/:id/restore",
  authMiddleware,
  can(Permission.USER_DELETE_ANY),
  userController.restoreUser,
);

export default router;
