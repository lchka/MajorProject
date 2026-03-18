import { z } from "zod";

export const permissionSchema = z.enum([
  "user:view-all",
  "user:view-own",
  "user:create",
  "user:update-any",
  "user:update-own",
  "user:delete-any",
  "user:delete-own",
  "preference:view",
  "preference:create",
  "preference:update",
  "preference:delete",
  "admin:panel-access",
  "role:manage",
  "system:settings",
]);

export const Permission = {
  USER_VIEW_ALL: "user:view-all",
  USER_VIEW_OWN: "user:view-own",
  USER_CREATE: "user:create",
  USER_UPDATE_ANY: "user:update-any",
  USER_UPDATE_OWN: "user:update-own",
  USER_DELETE_ANY: "user:delete-any",
  USER_DELETE_OWN: "user:delete-own",
  PREFERENCE_VIEW: "preference:view",
  PREFERENCE_CREATE: "preference:create",
  PREFERENCE_UPDATE: "preference:update",
  PREFERENCE_DELETE: "preference:delete",
  ADMIN_PANEL_ACCESS: "admin:panel-access",
  ROLE_MANAGE: "role:manage",
  SYSTEM_SETTINGS: "system:settings",
} as const;
export type Permission = z.infer<typeof permissionSchema>;

export const roleNameSchema = z.enum(["admin", "moderator", "user"]);
export type RoleName = z.infer<typeof roleNameSchema>;

export const rolePermissionsSchema = z.record(
  roleNameSchema,
  z.array(permissionSchema),
);

// Map roles to their permissions
export const rolePermissions: Record<RoleName, Permission[]> = {
  //admin has permission to do anything
  admin: [
    Permission.USER_VIEW_ALL,
    Permission.USER_CREATE,
    Permission.USER_UPDATE_ANY,
    Permission.USER_DELETE_ANY,
    Permission.PREFERENCE_VIEW,
    Permission.PREFERENCE_CREATE,
    Permission.PREFERENCE_UPDATE,
    Permission.PREFERENCE_DELETE,
    Permission.ADMIN_PANEL_ACCESS,
    Permission.ROLE_MANAGE,
    Permission.SYSTEM_SETTINGS,
  ],
  moderator: [
    Permission.USER_VIEW_ALL,
    Permission.USER_UPDATE_ANY,
    Permission.USER_UPDATE_OWN,
    Permission.USER_DELETE_ANY,
    Permission.PREFERENCE_VIEW,
    Permission.PREFERENCE_UPDATE,
  ],
  user: [
    Permission.USER_VIEW_OWN,
    Permission.USER_UPDATE_OWN,
    Permission.USER_DELETE_OWN,
    Permission.PREFERENCE_VIEW,
  ],
};

rolePermissionsSchema.parse(rolePermissions);

// Helper to check if role has permission
export const hasPermission = (
  roleName: string,
  permission: Permission,
): boolean => {
  const parsedRole = roleNameSchema.safeParse(roleName);

  if (!parsedRole.success) {
    return false;
  }

  const permissions = rolePermissions[parsedRole.data] || [];
  return permissions.includes(permission);
};
