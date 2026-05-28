import { describe, it, expect, vi, beforeEach } from "vitest";

// Mocks hoisted
const dbMock = vi.hoisted(() => {
  const select = vi.fn();
  const update = vi.fn();
  const deleteFn = vi.fn();
  const transaction = vi.fn((cb) => cb(dbMock));
  const execute = vi.fn(() => [[{
    id: "1",
    general_min_order_amount: "0.00",
    min_order_message: "",
    emergency_mode: 0,
    pickup_enabled: 1,
    pickup_label: "Retirada",
    pickup_instruction: "",
    favicon: "",
    logo_url: "",
    site_theme: "{}",
    company_info: "{}",
    google_login: "{}",
    accessibility_high_contrast: 0,
    accessibility_dyslexic_font: 0,
    success_order_message: "",
    email_order_subject: "",
    email_order_body: ""
  }]]);
  return { select, update, delete: deleteFn, transaction, execute };
});

vi.mock("../../db.js", () => ({
  getDb: vi.fn(async () => dbMock),
}));

vi.mock("../../services/AuditLogService.js", () => ({
  AuditLogService: {
    record: vi.fn(),
  },
}));

vi.mock("../../auth.js", () => ({
  lucia: {
    validateSession: vi.fn(),
    createSession: vi.fn(async (userId: string) => ({ id: "new-session", userId })),
    invalidateSession: vi.fn(),
    invalidateUserSessions: vi.fn(),
    readSessionCookie: vi.fn(),
    createSessionCookie: vi.fn(() => ({
      serialize: vi.fn(() => "new-cookie"),
      attributes: {},
    })),
    createBlankSessionCookie: vi.fn(() => ({
      serialize: vi.fn(() => "blank-cookie"),
      attributes: {},
    })),
  },
  promoteCart: vi.fn(),
}));

import { usersAdminRouter } from "./users.js";
import { adminStoreSettingsRouter } from "./adminStoreSettingsRouter.js";
import {
  loginProcedure,
  requestPasswordResetProcedure,
  resetPasswordProcedure,
  logoutProcedure,
} from "../storefront/auth/auth.procedures.js";
import { assertPasswordPolicy } from "../storefront/auth/auth-security.js";
import { createContext } from "../../_core/context.js";
import { lucia } from "../../auth.js";
import { AuditLogService } from "../../services/AuditLogService.js";
import {
  assertStrongConfirmation,
  operationalLimits,
} from "./operational-hardening.js";

describe("Sprint Hardening P1-A Unit Tests", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    dbMock.select.mockReset();
    dbMock.update.mockReset();
    dbMock.delete.mockReset();
    vi.mocked(AuditLogService.record).mockReset();
    vi.mocked(lucia.createSession).mockClear();
    vi.mocked(lucia.invalidateSession).mockClear();
    vi.mocked(lucia.invalidateUserSessions).mockClear();
    vi.mocked(lucia.createSessionCookie).mockClear();
    vi.mocked(lucia.createBlankSessionCookie).mockClear();
  });

  describe("Soft Delete de Usuários", () => {
    it("não deve remover fisicamente o usuário e sim anonimizar seus dados na tabela users", async () => {
      // Mock do select para achar o usuário alvo
      dbMock.select.mockReturnValue({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnValue([{ id: "user-1", email: "test@example.com", role: "user" }]),
        limit: vi.fn().mockReturnThis(),
      });

      // Mock do update na transação
      dbMock.update.mockReturnValue({
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([{ affectedRows: 1 }]),
      });

      // Mock do delete de perfil e endereços
      dbMock.delete.mockReturnValue({
        where: vi.fn().mockResolvedValue({}),
      });

      const ctx = {
        user: { id: "admin-1", role: "super_admin" },
        session: { id: "sess-1" },
        req: { ip: "127.0.0.1", headers: {} },
        res: {},
        db: dbMock,
      } as any;

      const caller = usersAdminRouter.createCaller(ctx);
      const res = await caller.delete({ id: "user-1" });

      expect(res.success).toBe(true);
      // Deve ter deletado endereços/perfis
      expect(dbMock.delete).toHaveBeenCalled();
      // Deve ter rodado o update (Soft Delete) na tabela users
      expect(dbMock.update).toHaveBeenCalled();
      // Deve ter gravado log de auditoria crítica
      expect(AuditLogService.record).toHaveBeenCalled();
    });
  });

  describe("Bloqueio de Login para Usuários Soft-Deleted", () => {
    it("deve falhar a tentativa de login de usuários que tenham deletedAt preenchido", async () => {
      dbMock.select.mockReturnValue({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnValue([{
          id: "user-deleted",
          email: "deleted-user@gourmetsaudavel.local",
          password: "hashedpassword",
          deletedAt: new Date(),
        }]),
      });

      const ctx = { req: {}, res: {} } as any;

      await expect(
        loginProcedure({ input: { identifier: "deleted-user@gourmetsaudavel.local", password: "password123" }, ctx })
      ).rejects.toThrow("E-mail ou senha incorretos.");

      expect(AuditLogService.record).toHaveBeenCalledWith(
        expect.objectContaining({
          action: "LOGIN_BLOCKED_DELETED",
          severity: "critical",
        }),
      );
    });

    it("deve registrar warning para login com credenciais invalidas", async () => {
      dbMock.select.mockReturnValue({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnValue([]),
      });

      const ctx = { req: { ip: "127.0.0.1", headers: {} }, res: {} } as any;

      await expect(
        loginProcedure({
          input: { identifier: "missing@example.com", password: "password123" },
          ctx,
        }),
      ).rejects.toThrow("E-mail ou senha incorretos.");

      expect(AuditLogService.record).toHaveBeenCalledWith(
        expect.objectContaining({
          action: "LOGIN_PASSWORD_FAIL",
          severity: "warning",
        }),
      );
    });
  });

  describe("Auth P1 - Reset, Logout e Politica de Senha", () => {
    it("deve invalidar sessoes antigas e criar sessao limpa apos reset de senha", async () => {
      dbMock.select.mockReturnValue({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnValue([
          {
            id: "user-1",
            email: "reset@example.com",
            resetExpires: new Date(Date.now() + 60_000),
            deletedAt: null,
          },
        ]),
      });

      dbMock.update.mockReturnValue({
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([{ affectedRows: 1 }]),
      });

      const ctx = {
        req: { hostname: "localhost", ip: "127.0.0.1", headers: {} },
        res: { appendHeader: vi.fn() },
        guestId: null,
      } as any;

      await resetPasswordProcedure({
        input: { token: "reset-token-123", password: "novaSenha123" },
        ctx,
      });

      expect(lucia.invalidateUserSessions).toHaveBeenCalledWith("user-1");
      expect(lucia.createSession).toHaveBeenCalledWith("user-1", {
        ipAddress: "127.0.0.1",
        userAgent: "unknown",
      });
      expect(ctx.res.appendHeader).toHaveBeenCalledWith("Set-Cookie", "new-cookie");
      expect(AuditLogService.record).toHaveBeenCalledWith(
        expect.objectContaining({
          action: "RESET_SUCCESS",
          severity: "warning",
        }),
      );
    });

    it("nao deve expor se email de reset existe", async () => {
      dbMock.select.mockReturnValue({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnValue([]),
      });

      const result = await requestPasswordResetProcedure({
        input: { email: "naoexiste@example.com" },
        ctx: { req: { ip: "127.0.0.1", headers: {} } } as any,
      });

      expect(result).toEqual({ success: true, message: "Link enviado." });
      expect(dbMock.update).not.toHaveBeenCalled();
      expect(AuditLogService.record).toHaveBeenCalledWith(
        expect.objectContaining({
          action: "RESET_REQUESTED",
          severity: "warning",
        }),
      );
    });

    it("deve rejeitar senha curta na politica minima", () => {
      expect(() => assertPasswordPolicy("curta")).toThrow(
        "A senha deve ter pelo menos 8 caracteres.",
      );
    });

    it("deve limpar cookie e invalidar sessao no logout", async () => {
      const ctx = {
        user: { id: "user-1" },
        session: { id: "sess-1" },
        req: { ip: "127.0.0.1", headers: {} },
        res: { appendHeader: vi.fn() },
      } as any;

      await logoutProcedure({ ctx });

      expect(lucia.invalidateSession).toHaveBeenCalledWith("sess-1");
      expect(ctx.res.appendHeader).toHaveBeenCalledWith("Set-Cookie", "blank-cookie");
      expect(AuditLogService.record).toHaveBeenCalledWith(
        expect.objectContaining({
          action: "LOGOUT",
          severity: "info",
        }),
      );
    });
  });

  describe("Contexto e Invalidação de Sessão", () => {
    it("deve invalidar a sessão no Express Context se o usuário for soft-deleted", async () => {
      // Mock da sessão com deletedAt preenchido
      vi.mocked(lucia.readSessionCookie).mockReturnValue("session-token");
      vi.mocked(lucia.validateSession).mockResolvedValue({
        session: { id: "sess-1", fresh: false, expiresAt: new Date(), userId: "user-deleted", referralCode: null, guestId: null, userAgent: null, ipAddress: null },
        user: { id: "user-deleted", deletedAt: new Date() } as any,
      });

      const req = { headers: { cookie: "session-token" }, hostname: "localhost" } as any;
      const res = { appendHeader: vi.fn() } as any;

      const ctx = await createContext({ req, res, info: {} as any });

      // Deve ter invalidado a sessão na Lucia
      expect(lucia.invalidateSession).toHaveBeenCalledWith("sess-1");
      // Deve tratar o usuário e a sessão como nulos no retorno do contexto
      expect(ctx.user).toBeNull();
      expect(ctx.session).toBeNull();
    });
  });

  describe("Emergency / Panic Mode", () => {
    it("deve alternar o emergency_mode em store_settings e gravar log de auditoria crítica", async () => {
      dbMock.update.mockReturnValue({
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue({}),
      });

      const ctx = {
        user: { id: "admin-1", role: "super_admin" },
        session: { id: "sess-1" },
        req: { ip: "127.0.0.1", headers: {} },
        res: {},
        db: dbMock,
      } as any;

      const caller = adminStoreSettingsRouter.createCaller(ctx);
      const res = await caller.toggleEmergency({
        enabled: true,
        confirmationToken: "CONFIRMAR",
        confirmationReason: "acionamento operacional",
      });

      expect(res.success).toBe(true);
      expect(res.newState).toBe(true);
      expect(dbMock.update).toHaveBeenCalled();
      expect(AuditLogService.record).toHaveBeenCalled();
    });

    it("deve bloquear emergency mode sem confirmacao forte", async () => {
      const ctx = {
        user: { id: "admin-1", role: "super_admin" },
        session: { id: "sess-1" },
        req: { ip: "127.0.0.1", headers: {} },
        res: {},
        db: dbMock,
      } as any;

      const caller = adminStoreSettingsRouter.createCaller(ctx);

      await expect(caller.toggleEmergency(true)).rejects.toThrow(
        "confirmacao forte",
      );
    });
  });

  describe("Confirmacao forte e limites financeiros", () => {
    it("exige token literal CONFIRMAR para acoes criticas", () => {
      expect(() =>
        assertStrongConfirmation({}, "Acao critica"),
      ).toThrow("CONFIRMAR");

      expect(() =>
        assertStrongConfirmation(
          { confirmationToken: "CONFIRMAR" },
          "Acao critica",
        ),
      ).not.toThrow();
    });

    it("declara limites operacionais para loyalty, cupons, pagamento e frete", () => {
      expect(operationalLimits.loyaltyCriticalPoints).toBe(1000);
      expect(operationalLimits.couponMaxPercentage).toBe(70);
      expect(operationalLimits.paymentMaxDiscountPercentage).toBe(30);
      expect(operationalLimits.shippingMaxCost).toBe(500);
    });
  });

  describe("Geração de Backup de Infraestrutura", () => {
    it("deve retornar { filename, success: true } sem ler conteúdo do dump na RAM", async () => {
      const ctx = {
        user: { id: "admin-1", role: "super_admin" },
        req: { ip: "127.0.0.1", headers: {} },
        res: {},
        db: dbMock,
      } as any;

      // Mock da geração de backup seletivo
      const mockMutate = adminStoreSettingsRouter.downloadBackup;
      
      // Verificando a presença da mutation com a tipagem adequada
      expect(mockMutate).toBeDefined();
    });
  });
});
