// types/permissions.ts
export enum Permission {
  // User permissions
  USER_VIEW_ALL = "user:view-all",
  USER_VIEW_OWN = "user:view-own",
  USER_CREATE = "user:create",
  USER_UPDATE_ANY = "user:update-any",
  USER_UPDATE_OWN = "user:update-own",
  USER_DELETE_ANY = "user:delete-any",
  USER_DELETE_OWN = "user:delete-own",
  
  // Admin permissions
  ADMIN_PANEL_ACCESS = "admin:panel-access",
  ROLE_MANAGE = "role:manage",
  SYSTEM_SETTINGS = "system:settings",
}

// Map roles to their permissions
export const rolePermissions: Record<string, Permission[]> = {
  admin: [
    Permission.USER_VIEW_ALL,
    Permission.USER_CREATE,
    Permission.USER_UPDATE_ANY,
    Permission.USER_DELETE_ANY,
    Permission.ADMIN_PANEL_ACCESS,
    Permission.ROLE_MANAGE,
    Permission.SYSTEM_SETTINGS,
  ],
  moderator: [
    Permission.USER_VIEW_ALL,
    Permission.USER_UPDATE_ANY,
    Permission.USER_UPDATE_OWN,
    Permission.USER_DELETE_OWN,
  ],
  user: [
    Permission.USER_VIEW_OWN,
    Permission.USER_UPDATE_OWN,
    Permission.USER_DELETE_OWN,
  ],
};

// Helper to check if role has permission
export const hasPermission = (roleName: string, permission: Permission): boolean => {
  const permissions = rolePermissions[roleName] || [];
  return permissions.includes(permission);
};