import { describe, it, expect, vi, beforeEach } from "vitest";

const dbMock = vi.hoisted(() => {
  const values = vi.fn();
  const insert = vi.fn(() => ({ values }));
  return { insert, values };
});

vi.mock("../db.js", () => ({
  getDb: vi.fn(async () => ({ insert: dbMock.insert })),
}));

import { AuditLogService } from "./AuditLogService.js";

describe("AuditLogService", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    dbMock.insert.mockClear();
    dbMock.values.mockClear();
  });

  describe("sanitizeData", () => {
    it("should redact LGPD keys case-insensitively and in nested PT-BR payloads", () => {
      const input = {
        CPF: "123.456.789-09",
        senha: "minha-senha",
        token: "secret-token",
        contato: {
          CEP: "12345-678",
          chave_pix: "cliente@example.com",
        },
      };

      const result = AuditLogService.sanitizeData(input) as any;

      expect(result.CPF).toBe("123******09");
      expect(result.senha).toBe("[redacted]");
      expect(result.token).toBe("[redacted]");
      expect(result.contato.CEP).toBe("12****78");
      expect(result.contato.chave_pix).toBe("[redacted]");
    });

    it("should remove base64 strings and massive arrays", () => {
      const input = {
        name: "Test Name",
        avatar: "data:image/png;base64,iVBORw0KGgoAAAANS",
        hugeText: "a".repeat(2005),
        items: Array.from({ length: 25 }, (_, i) => i),
      };

      const result = AuditLogService.sanitizeData(input) as any;

      expect(result.name).toBe("Test Name");
      expect(result.avatar).toContain("IMAGE_OR_BINARY_REMOVED");
      expect(result.hugeText).toContain("IMAGE_OR_BINARY_REMOVED");
      expect(result.items._summary).toContain("Array com 25 itens recortado");
    });
  });

  describe("recordError", () => {
    it("should truncate stack trace to 10 lines and record properly", async () => {
      const recordSpy = vi.spyOn(AuditLogService, "record").mockResolvedValue(undefined);

      const complexStack = new Array(25).fill("    at context (file.ts:1:1)").join("\n");
      const err = new Error("Test Exception message");
      err.stack = "Error: Test Exception message\n" + complexStack;

      await AuditLogService.recordError({
        module: "test",
        source: "unit-test",
        error: err,
        actor: { userId: "user-123", ipAddress: "1.1.1.1" },
        requestId: "req-abc",
        route: "/api/test",
        metadata: { debug: true },
      });

      expect(recordSpy).toHaveBeenCalledTimes(1);
      const callArg = recordSpy.mock.calls[0][0];

      expect(callArg.module).toBe("test");
      expect(callArg.action).toBe("ERROR");
      expect(callArg.severity).toBe("critical");
      expect(callArg.actor.userId).toBe("user-123");
      expect(callArg.actor.requestId).toBe("req-abc");

      const newVals = callArg.newValues as any;
      expect(newVals.message).toBe("Test Exception message");
      expect(newVals.source).toBe("unit-test");
      expect(newVals.route).toBe("/api/test");
      expect(newVals.meta.debug).toBe(true);

      // Verify stack length is truncated to at most 10 lines
      const lines = newVals.stack.split("\n");
      expect(lines.length).toBeLessThanOrEqual(10);
    });

    it("should skip expected tRPC validation and auth spam", async () => {
      const recordSpy = vi.spyOn(AuditLogService, "record").mockResolvedValue(undefined);

      await AuditLogService.recordError({
        module: "trpc",
        source: "trpc",
        error: new Error("Invalid input"),
        severity: "warning",
        metadata: { trpcCode: "BAD_REQUEST" },
      });

      await AuditLogService.recordError({
        module: "trpc",
        source: "trpc",
        error: new Error("Unauthorized"),
        severity: "warning",
        metadata: { trpcCode: "UNAUTHORIZED" },
      });

      expect(recordSpy).not.toHaveBeenCalled();
    });

    it("should persist internal tRPC errors as critical", async () => {
      const recordSpy = vi.spyOn(AuditLogService, "record").mockResolvedValue(undefined);

      await AuditLogService.recordError({
        module: "trpc",
        source: "trpc",
        error: new Error("Database exploded"),
        severity: "critical",
        metadata: { trpcCode: "INTERNAL_SERVER_ERROR" },
      });

      expect(recordSpy).toHaveBeenCalledTimes(1);
      expect(recordSpy.mock.calls[0][0].severity).toBe("critical");
    });
  });

  describe("record", () => {
    it("should store only relevant changed fields in before/after", async () => {
      await AuditLogService.record({
        actor: { userId: "admin-1", requestId: "req-diff" },
        module: "orders",
        action: "UPDATE_STATUS",
        entityType: "orders",
        entityId: "order-1",
        oldValues: {
          status: "pending",
          total: "100.00",
          updatedAt: "2026-05-27T10:00:00.000Z",
        },
        newValues: {
          status: "preparing",
          total: "100.00",
          updatedAt: "2026-05-27T10:01:00.000Z",
        },
      });

      expect(dbMock.values).toHaveBeenCalledTimes(1);
      const row = dbMock.values.mock.calls[0][0];

      expect(row.entity).toBe("order");
      expect(JSON.parse(row.oldValues)).toEqual({ status: "pending" });
      expect(JSON.parse(row.newValues)).toEqual({ status: "preparing" });
    });

    it("should skip updates where only ignored timestamp fields changed", async () => {
      await AuditLogService.record({
        actor: { userId: "admin-1", requestId: "req-empty-diff" },
        module: "settings",
        action: "UPDATE_SETTINGS",
        entityType: "settings",
        entityId: "global",
        oldValues: { updatedAt: "2026-05-27T10:00:00.000Z" },
        newValues: { updatedAt: "2026-05-27T10:01:00.000Z" },
      });

      expect(dbMock.values).not.toHaveBeenCalled();
    });

    it("should skip duplicate action/entity logs in the same request", async () => {
      const baseInput = {
        actor: { userId: "admin-1", requestId: "req-dedupe" },
        module: "marketing",
        action: "UPDATE_COUPON",
        entityType: "coupons",
        entityId: "coupon-1",
        oldValues: { code: "OLD" },
        newValues: { code: "NEW" },
      };

      await AuditLogService.record(baseInput);
      await AuditLogService.record(baseInput);

      expect(dbMock.values).toHaveBeenCalledTimes(1);
    });
  });
});
