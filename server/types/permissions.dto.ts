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
  "allergen:view",
  "allergen:create",
  "allergen:update",
  "allergen:delete",
  "condition:view",
  "condition:create",
  "condition:update",
  "condition:delete",
  "profile:view-all",
  "profile:view-own",
  "profile:view-own-all",
  "profile:create",
  "profile:update",
  "profile:delete",
  "prompt:view",
  "prompt:create",
  "prompt:update",
  "prompt:delete",
  "product:view",
  "product:create",
  "product:update",
  "product:delete",
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
  //preference permissions
  PREFERENCE_VIEW: "preference:view",
  PREFERENCE_CREATE: "preference:create",
  PREFERENCE_UPDATE: "preference:update",
  PREFERENCE_DELETE: "preference:delete",
  //allergen permissions
  ALLERGEN_VIEW: "allergen:view",
  ALLERGEN_CREATE: "allergen:create",
  ALLERGEN_UPDATE: "allergen:update",
  ALLERGEN_DELETE: "allergen:delete",
  //condition permissions
  CONDITION_VIEW: "condition:view",
  CONDITION_CREATE: "condition:create",
  CONDITION_UPDATE: "condition:update",
  CONDITION_DELETE: "condition:delete",
  //profile permissions
  PROFILE_VIEW_ALL: "profile:view-all",
  PROFILE_VIEW_OWN: "profile:view-own",
  PROFILE_VIEW_OWN_ALL: "profile:view-own-all",
  PROFILE_CREATE: "profile:create",
  PROFILE_UPDATE: "profile:update",
  PROFILE_DELETE: "profile:delete",
  //prompt permissions
  PROMPT_VIEW: "prompt:view",
  PROMPT_CREATE: "prompt:create",
  PROMPT_UPDATE: "prompt:update",
  PROMPT_DELETE: "prompt:delete",
  //product permissions
  PRODUCT_VIEW: "product:view",
  PRODUCT_CREATE: "product:create",
  PRODUCT_UPDATE: "product:update",
  PRODUCT_DELETE: "product:delete",
  //admin access
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
    //permissions to crud all users
    Permission.USER_VIEW_ALL,
    Permission.USER_CREATE,
    Permission.USER_UPDATE_ANY,
    Permission.USER_DELETE_ANY,
    //permissions to crud preference
    Permission.PREFERENCE_VIEW,
    Permission.PREFERENCE_CREATE,
    Permission.PREFERENCE_UPDATE,
    Permission.PREFERENCE_DELETE,
    //permissions to crud allergen
    Permission.ALLERGEN_CREATE,
    Permission.ALLERGEN_UPDATE,
    Permission.ALLERGEN_VIEW,
    Permission.ALLERGEN_DELETE,
    //permissions to crud conditions
    Permission.CONDITION_CREATE,
    Permission.CONDITION_UPDATE,
    Permission.CONDITION_VIEW,
    Permission.CONDITION_DELETE,
    //permissions to crud profile
    Permission.PROFILE_VIEW_ALL,
    Permission.PROFILE_VIEW_OWN_ALL,
    Permission.PROFILE_CREATE,
    Permission.PROFILE_UPDATE,
    Permission.PROFILE_DELETE,
    //permissions to crud prompt
    Permission.PROMPT_VIEW,
    Permission.PROMPT_UPDATE,
    Permission.PROMPT_DELETE,
    Permission.PROMPT_CREATE,
    //permissions to crud product
    Permission.PRODUCT_VIEW,
    Permission.PRODUCT_CREATE,
    Permission.PRODUCT_UPDATE,
    Permission.PRODUCT_DELETE,
    //Admin stuff
    Permission.ADMIN_PANEL_ACCESS,
    Permission.ROLE_MANAGE,
    Permission.SYSTEM_SETTINGS,
  ],
  moderator: [
    Permission.USER_VIEW_ALL,
    Permission.USER_UPDATE_ANY,
    Permission.USER_UPDATE_OWN,
    Permission.USER_DELETE_ANY,
    //Read, Update only for Preference
    Permission.PREFERENCE_VIEW,
    Permission.PREFERENCE_UPDATE,
    //Read, Update only for Allergen
    Permission.ALLERGEN_UPDATE,
    Permission.ALLERGEN_VIEW,
    //Read, Update only for Condition
    Permission.CONDITION_UPDATE,
    Permission.CONDITION_VIEW,
    //Read, Update only for Profile
    Permission.PROFILE_VIEW_ALL,
    Permission.PROFILE_VIEW_OWN_ALL,
    Permission.PROFILE_UPDATE,
    //permissions to crud prompt
    Permission.PROMPT_VIEW,
    //permissions to read/create/update product
    Permission.PRODUCT_VIEW,
    Permission.PRODUCT_CREATE,
    Permission.PRODUCT_UPDATE,
  ],
  user: [
    Permission.USER_VIEW_OWN,
    Permission.USER_UPDATE_OWN,
    Permission.USER_DELETE_OWN,
    //Read only for Preference
    Permission.PREFERENCE_VIEW,
    //Read only for Allergen
    Permission.ALLERGEN_VIEW,
    //Read only for Condition
    Permission.CONDITION_VIEW,
    //permissions to crud own profile
    Permission.PROFILE_VIEW_OWN,
    Permission.PROFILE_VIEW_OWN_ALL,
    Permission.PROFILE_CREATE,
    Permission.PROFILE_UPDATE,
    Permission.PROFILE_DELETE,
    //permissions to read/update product
    Permission.PRODUCT_VIEW,
    Permission.PRODUCT_CREATE,
    Permission.PRODUCT_UPDATE,
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
