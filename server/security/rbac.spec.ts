import { describe, expect, it } from "vitest";
import {
  canManageAdminRole,
  hasAdminPermission,
  isAdminRole,
  normalizeRole,
} from "../../shared/security/rbac";

describe("RBAC admin hierarchy", () => {
  it("normalizes known and unknown roles safely", () => {
    expect(normalizeRole("SUPER_ADMIN")).toBe("super_admin");
    expect(normalizeRole("admin")).toBe("admin");
    expect(normalizeRole("operator")).toBe("operator");
    expect(normalizeRole("unknown")).toBe("user");
  });

  it("treats all administrative roles as admin-family access", () => {
    expect(isAdminRole("super_admin")).toBe(true);
    expect(isAdminRole("admin")).toBe(true);
    expect(isAdminRole("operator")).toBe(true);
    expect(isAdminRole("nutri")).toBe(false);
    expect(isAdminRole("user")).toBe(false);
  });

  it("allows super admins to use critical modules", () => {
    expect(hasAdminPermission("super_admin", "backups:manage")).toBe(true);
    expect(hasAdminPermission("super_admin", "integrations:manage")).toBe(true);
    expect(hasAdminPermission("super_admin", "audit:read")).toBe(true);
    expect(hasAdminPermission("super_admin", "roles:manage")).toBe(true);
  });

  it("blocks regular admins from escalation and sensitive modules", () => {
    expect(hasAdminPermission("admin", "catalog:manage")).toBe(true);
    expect(hasAdminPermission("admin", "orders:operate")).toBe(true);
    expect(hasAdminPermission("admin", "backups:manage")).toBe(false);
    expect(hasAdminPermission("admin", "roles:manage")).toBe(false);
    expect(canManageAdminRole("admin", "super_admin")).toBe(false);
  });

  it("limits operators to daily operation permissions", () => {
    expect(hasAdminPermission("operator", "orders:operate")).toBe(true);
    expect(hasAdminPermission("operator", "production:operate")).toBe(true);
    expect(hasAdminPermission("operator", "pdv:operate")).toBe(true);
    expect(hasAdminPermission("operator", "catalog:manage")).toBe(false);
    expect(hasAdminPermission("operator", "finance:view")).toBe(false);
  });

  it("only lets super admins manage administrative roles", () => {
    expect(canManageAdminRole("super_admin", "admin")).toBe(true);
    expect(canManageAdminRole("super_admin", "operator")).toBe(true);
    expect(canManageAdminRole("super_admin", "user")).toBe(false);
    expect(canManageAdminRole("operator", "admin")).toBe(false);
  });
});
