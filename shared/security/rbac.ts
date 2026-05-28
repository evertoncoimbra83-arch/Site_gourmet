export const ADMIN_ROLES = ["super_admin", "admin", "operator"] as const;
export const APP_ROLES = [...ADMIN_ROLES, "user", "nutri", "customer"] as const;

export type AdminRole = (typeof ADMIN_ROLES)[number];
export type AppRole = (typeof APP_ROLES)[number];

export type AdminPermission =
  | "admin:access"
  | "orders:operate"
  | "production:operate"
  | "pdv:operate"
  | "catalog:manage"
  | "media:manage"
  | "marketing:manage"
  | "loyalty:manage"
  | "customers:manage"
  | "finance:view"
  | "settings:critical"
  | "integrations:manage"
  | "backups:manage"
  | "audit:read"
  | "admins:manage"
  | "roles:manage";

const ADMIN_ROLE_SET = new Set<string>(ADMIN_ROLES);
const APP_ROLE_SET = new Set<string>(APP_ROLES);

const ADMIN_PERMISSIONS: Record<AdminRole, ReadonlySet<AdminPermission>> = {
  super_admin: new Set<AdminPermission>([
    "admin:access",
    "orders:operate",
    "production:operate",
    "pdv:operate",
    "catalog:manage",
    "media:manage",
    "marketing:manage",
    "loyalty:manage",
    "customers:manage",
    "finance:view",
    "settings:critical",
    "integrations:manage",
    "backups:manage",
    "audit:read",
    "admins:manage",
    "roles:manage",
  ]),
  admin: new Set<AdminPermission>([
    "admin:access",
    "orders:operate",
    "production:operate",
    "pdv:operate",
    "catalog:manage",
    "media:manage",
    "marketing:manage",
    "loyalty:manage",
    "customers:manage",
  ]),
  operator: new Set<AdminPermission>([
    "admin:access",
    "orders:operate",
    "production:operate",
    "pdv:operate",
  ]),
};

export function normalizeRole(role: unknown): AppRole {
  const normalized = String(role || "user").toLowerCase().trim();
  return APP_ROLE_SET.has(normalized) ? (normalized as AppRole) : "user";
}

export function isAdminRole(role: unknown): role is AdminRole {
  return ADMIN_ROLE_SET.has(normalizeRole(role));
}

export function hasAdminPermission(
  role: unknown,
  permission: AdminPermission,
): boolean {
  const normalized = normalizeRole(role);
  if (!isAdminRole(normalized)) return false;
  return ADMIN_PERMISSIONS[normalized].has(permission);
}

export function canManageAdminRole(actorRole: unknown, targetRole: unknown) {
  return (
    normalizeRole(actorRole) === "super_admin" &&
    isAdminRole(targetRole)
  );
}
