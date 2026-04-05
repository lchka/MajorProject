// middleware/permission.middleware.ts
import { Request, Response, NextFunction } from "express";
import { HttpError } from "../utils/HttpError.js";
import { Permission, hasPermission } from "../types/permissions.dto.js";
import prisma from "../lib/prisma.js";

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

// Check if user can view specific profile
export const canViewProfile = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (!req.user) {
    throw new HttpError(401, "Unauthorized");
  }

  const targetUserId = (req.params.userId || req.params.id) as string;
  const currentUserId = req.user.id;
  const userRole = req.user.role.name;

  // Admin/moderator can view any profile
  if (hasPermission(userRole, Permission.PROFILE_VIEW_ALL)) {
    return next();
  }

  // User can only view their own profile
  if (
    targetUserId === currentUserId &&
    hasPermission(userRole, Permission.PROFILE_VIEW_OWN)
  ) {
    return next();
  }

  throw new HttpError(
    403,
    "Forbidden - You don't have permission to view this profile",
  );
};

type ProfileParamOptions = {
  paramKey?: string;
};

export const canAccessProfileByProfileId = ({ paramKey = "profileId" }: ProfileParamOptions = {}) => {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      throw new HttpError(401, "Unauthorized");
    }

    const profileIdParam = req.params[paramKey];
    const profileId = Array.isArray(profileIdParam)
      ? profileIdParam[0]
      : profileIdParam;

    if (!profileId) {
      throw new HttpError(400, "Profile id is required");
    }

    const userRole = req.user.role.name;

    if (hasPermission(userRole, Permission.PROFILE_VIEW_ALL)) {
      return next();
    }

    const profile = await prisma.profile.findUnique({
      where: { id: profileId },
      select: { userId: true },
    });

    if (!profile) {
      throw new HttpError(404, "Profile not found");
    }

    if (profile.userId === req.user.id && hasPermission(userRole, Permission.PROFILE_VIEW_OWN)) {
      return next();
    }

    throw new HttpError(403, "Forbidden - You don't have permission to view this profile");
  };
};

export const canDeleteProfileByProfileId = ({ paramKey = "profileId" }: ProfileParamOptions = {}) => {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      throw new HttpError(401, "Unauthorized");
    }

    const profileIdParam = req.params[paramKey];
    const profileId = Array.isArray(profileIdParam)
      ? profileIdParam[0]
      : profileIdParam;

    if (!profileId) {
      throw new HttpError(400, "Profile id is required");
    }

    const userRole = req.user.role.name;

    if (hasPermission(userRole, Permission.PROFILE_VIEW_ALL)) {
      return next();
    }

    const profile = await prisma.profile.findUnique({
      where: { id: profileId },
      select: { userId: true },
    });

    if (!profile) {
      throw new HttpError(404, "Profile not found");
    }

    if (profile.userId === req.user.id && hasPermission(userRole, Permission.PROFILE_DELETE)) {
      return next();
    }

    throw new HttpError(403, "Forbidden - You don't have permission to delete this profile");
  };
};

export const canUpdateProfileByProfileId = ({ paramKey = "profileId" }: ProfileParamOptions = {}) => {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      throw new HttpError(401, "Unauthorized");
    }

    const profileIdParam = req.params[paramKey];
    const profileId = Array.isArray(profileIdParam)
      ? profileIdParam[0]
      : profileIdParam;

    if (!profileId) {
      throw new HttpError(400, "Profile id is required");
    }

    const userRole = req.user.role.name;

    if (hasPermission(userRole, Permission.PROFILE_VIEW_ALL)) {
      return next();
    }

    const profile = await prisma.profile.findUnique({
      where: { id: profileId },
      select: { userId: true },
    });

    if (!profile) {
      throw new HttpError(404, "Profile not found");
    }

    if (profile.userId === req.user.id && hasPermission(userRole, Permission.PROFILE_UPDATE)) {
      return next();
    }

    throw new HttpError(403, "Forbidden - You don't have permission to update this profile");
  };
};

type EvaluationContextParamOptions = {
  paramKey?: string;
};

export const canAccessEvaluationContextById = ({ paramKey = "id" }: EvaluationContextParamOptions = {}) => {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      throw new HttpError(401, "Unauthorized");
    }

    const contextIdParam = req.params[paramKey];
    const contextId = Array.isArray(contextIdParam)
      ? contextIdParam[0]
      : contextIdParam;

    if (!contextId) {
      throw new HttpError(400, "Evaluation context id is required");
    }

    const userRole = req.user.role.name;

    if (hasPermission(userRole, Permission.EVALUATION_CONTEXT_VIEW)) {
      // Continue to ownership check below for non-admins.
    }

    if (hasPermission(userRole, Permission.PROFILE_VIEW_ALL)) {
      return next();
    }

    const context = await prisma.evaluationContext.findUnique({
      where: { id: contextId },
      select: { profile: { select: { userId: true } } },
    });

    if (!context) {
      throw new HttpError(404, "Evaluation context not found");
    }

    if (context.profile?.userId === req.user.id) {
      return next();
    }

    throw new HttpError(403, "Forbidden - You don't have permission to access this evaluation context");
  };
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
