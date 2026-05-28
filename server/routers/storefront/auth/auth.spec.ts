import { describe, it, expect, vi, beforeEach } from "vitest";

const dbMock = vi.hoisted(() => {
  const select = vi.fn();
  const update = vi.fn();
  const deleteFn = vi.fn();
  const insert = vi.fn();
  return { select, update, delete: deleteFn, insert };
});

vi.mock("../../../db.js", () => ({
  getDb: vi.fn(async () => dbMock),
}));

vi.mock("../../../services/AuditLogService.js", () => ({
  AuditLogService: {
    record: vi.fn(),
    recordError: vi.fn(),
  },
}));

vi.mock("../../../auth.js", () => ({
  lucia: {
    invalidateSession: vi.fn(),
    invalidateUserSessions: vi.fn(),
    createBlankSessionCookie: vi.fn(() => ({
      serialize: vi.fn(() => "blank-cookie"),
      attributes: {},
    })),
  },
}));

import { authRouter } from "./index.js";
import { lucia } from "../../../auth.js";
import { AuditLogService } from "../../../services/AuditLogService.js";

describe("Sprint Auth P2 — Active Sessions & Security Logs Tests", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    dbMock.select.mockReset();
    dbMock.update.mockReset();
    dbMock.delete.mockReset();
    dbMock.insert.mockReset();
    vi.mocked(AuditLogService.record).mockReset();
    vi.mocked(lucia.invalidateSession).mockClear();
    vi.mocked(lucia.invalidateUserSessions).mockClear();
    vi.mocked(lucia.createBlankSessionCookie).mockClear();
  });

  describe("listSessions", () => {
    it("deve retornar sessões ativas do usuário e registrar visualização", async () => {
      const mockSessions = [
        {
          id: "sess-1",
          userId: "user-1",
          referralCode: null,
          guestId: null,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          userAgent: "Mozilla Chrome",
          ipAddress: "192.168.1.5",
        },
      ];

      dbMock.select.mockReturnValue({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockResolvedValue(mockSessions),
      });

      const ctx = {
        user: { id: "user-1", role: "user" },
        session: { id: "sess-1" },
        req: { ip: "127.0.0.1", headers: {} },
        res: {},
        db: dbMock,
      } as any;

      const caller = authRouter.createCaller(ctx);
      const res = await caller.listSessions();

      expect(res).toHaveLength(1);
      expect(res[0].sessionId).toBe("sess-1");
      expect(res[0].currentSession).toBe(true);
      expect(res[0].userAgent).toBe("Mozilla Chrome");
      expect(res[0].ip).toBe("192.168.1.5");
      expect(AuditLogService.record).toHaveBeenCalledWith(
        expect.objectContaining({
          action: "SESSION_VIEWED",
          module: "auth",
        })
      );
    });
  });

  describe("logoutOtherSessions", () => {
    it("deve invalidar todas as sessões exceto a atual", async () => {
      const mockOtherSessions = [{ id: "sess-2" }, { id: "sess-3" }];

      dbMock.select.mockReturnValue({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue(mockOtherSessions),
      });

      const ctx = {
        user: { id: "user-1", role: "user" },
        session: { id: "sess-1" },
        req: { ip: "127.0.0.1", headers: {} },
        res: {},
        db: dbMock,
      } as any;

      const caller = authRouter.createCaller(ctx);
      const res = await caller.logoutOtherSessions();

      expect(res).toBe(2);
      expect(lucia.invalidateSession).toHaveBeenCalledTimes(2);
      expect(lucia.invalidateSession).toHaveBeenNthCalledWith(1, "sess-2");
      expect(lucia.invalidateSession).toHaveBeenNthCalledWith(2, "sess-3");
      expect(AuditLogService.record).toHaveBeenCalledWith(
        expect.objectContaining({
          action: "LOGOUT_OTHER_SESSIONS",
        })
      );
    });
  });

  describe("logoutAllSessions", () => {
    it("deve invalidar todas as sessões e remover cookie", async () => {
      const mockSessions = [{ id: "sess-1" }, { id: "sess-2" }];

      dbMock.select.mockReturnValue({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue(mockSessions),
      });

      const ctx = {
        user: { id: "user-1", role: "user" },
        session: { id: "sess-1" },
        req: { ip: "127.0.0.1", headers: {} },
        res: { appendHeader: vi.fn() },
        db: dbMock,
      } as any;

      const caller = authRouter.createCaller(ctx);
      const res = await caller.logoutAllSessions();

      expect(res.success).toBe(true);
      expect(lucia.invalidateUserSessions).toHaveBeenCalledWith("user-1");
      expect(ctx.res.appendHeader).toHaveBeenCalledWith("Set-Cookie", "blank-cookie");
      expect(AuditLogService.record).toHaveBeenCalledWith(
        expect.objectContaining({
          action: "LOGOUT_ALL_SESSIONS",
        })
      );
    });
  });

  describe("logoutSession", () => {
    it("deve revogar sessão específica se ela pertencer ao usuário", async () => {
      dbMock.select.mockReturnValue({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([{ id: "sess-2", userId: "user-1" }]),
      });

      const ctx = {
        user: { id: "user-1", role: "user" },
        session: { id: "sess-1" },
        req: { ip: "127.0.0.1", headers: {} },
        res: {},
        db: dbMock,
      } as any;

      const caller = authRouter.createCaller(ctx);
      const res = await caller.logoutSession({ sessionId: "sess-2" });

      expect(res.success).toBe(true);
      expect(lucia.invalidateSession).toHaveBeenCalledWith("sess-2");
      expect(AuditLogService.record).toHaveBeenCalledWith(
        expect.objectContaining({
          action: "SESSION_REVOKED",
          entityId: "sess-2",
        })
      );
    });

    it("deve falhar se a sessão não pertencer ao usuário", async () => {
      dbMock.select.mockReturnValue({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([]), // não encontrada
      });

      const ctx = {
        user: { id: "user-1", role: "user" },
        session: { id: "sess-1" },
        req: { ip: "127.0.0.1", headers: {} },
        res: {},
        db: dbMock,
      } as any;

      const caller = authRouter.createCaller(ctx);
      await expect(caller.logoutSession({ sessionId: "sess-foreign" })).rejects.toThrow("Sessão não encontrada");
    });
  });

  describe("recentAuthActivity", () => {
    it("deve listar logs de autenticação do usuário", async () => {
      const mockLogs = [
        {
          id: 1,
          action: "LOGIN_PASSWORD_SUCCESS",
          module: "auth",
          severity: "info",
          createdAt: new Date(),
          ipAddress: "127.0.0.1",
          userAgent: "Mozilla",
          newValues: JSON.stringify({ reason: "session_cookie" }),
        },
      ];

      dbMock.select.mockReturnValue({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue(mockLogs),
      });

      const ctx = {
        user: { id: "user-1", role: "user" },
        session: { id: "sess-1" },
        req: { ip: "127.0.0.1", headers: {} },
        res: {},
        db: dbMock,
      } as any;

      const caller = authRouter.createCaller(ctx);
      const res = await caller.recentAuthActivity();

      expect(res).toHaveLength(1);
      expect(res[0].action).toBe("LOGIN_PASSWORD_SUCCESS");
      expect(res[0].reason).toBe("session_cookie");
    });
  });
});
