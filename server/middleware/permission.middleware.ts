// middleware/permission.middleware.ts
import { Request, Response, NextFunction } from "express";
import { HttpError } from "../utils/HttpError.js";
import { Permission, hasPermission } from "../types/permissions.dto.js";

// Check if user has specific permission(s)
export const can = (...requiredPermissions: Permission[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new HttpError(401, "Unauthorized");
    }

    const userRole = req.user.role.name;

    const hasAllPermissions = requiredPermissions.every((permission) =>
      hasPermission(userRole, permission),
    );

    if (!hasAllPermissions) {
      throw new HttpError(
        403,
        "Forbidden - You don't have permission to perform this action",
      );
    }

    next();
  };
};

// Check if user can modify specific resource (ownership-based)
export const canModifyUser = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (!req.user) {
    throw new HttpError(401, "Unauthorized");
  }

  const targetUserId = req.params.id as string;
  const currentUserId = req.user.id;
  const userRole = req.user.role.name;

  // Admin can modify anyone
  if (hasPermission(userRole, Permission.USER_UPDATE_ANY)) {
    return next();
  }

  // User can modify themselves if they have permission
  if (
    targetUserId === currentUserId &&
    hasPermission(userRole, Permission.USER_UPDATE_OWN)
  ) {
    return next();
  }

  throw new HttpError(403, "Forbidden - You can only modify your own account");
};

// Check if user can view specific resource
export const canViewUser = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (!req.user) {
    throw new HttpError(401, "Unauthorized");
  }

  const targetUserId = req.params.id as string;
  const currentUserId = req.user.id;
  const userRole = req.user.role.name;

  // Can view all users
  if (hasPermission(userRole, Permission.USER_VIEW_ALL)) {
    return next();
  }

  // Can view own profile
  if (
    targetUserId === currentUserId &&
    hasPermission(userRole, Permission.USER_VIEW_OWN)
  ) {
    return next();
  }

  throw new HttpError(
    403,
    "Forbidden - You don't have permission to view this user",
  );
};

// Check if user can delete specific resource
export const canDeleteUser = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (!req.user) {
    throw new HttpError(401, "Unauthorized");
  }

  const targetUserId = req.params.id as string;
  const currentUserId = req.user.id;
  const userRole = req.user.role.name;

  // Admin can delete anyone
  if (hasPermission(userRole, Permission.USER_DELETE_ANY)) {
    return next();
  }

  // User can delete themselves if they have permission
  if (
    targetUserId === currentUserId &&
    hasPermission(userRole, Permission.USER_DELETE_OWN)
  ) {
    return next();
  }

  throw new HttpError(
    403,
    "Forbidden - You don't have permission to delete this user",
  );
};
