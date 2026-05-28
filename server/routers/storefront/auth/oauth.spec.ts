import { describe, it, expect, vi, beforeEach } from "vitest";

// Hoisted DB and Google OAuth Mocks
const dbMock = vi.hoisted(() => {
  const select = vi.fn();
  const insert = vi.fn();
  return { select, insert };
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

vi.mock("../../../auth/oauth/google.js", () => ({
  exchangeCodeForTokens: vi.fn(),
  verifyGoogleIdToken: vi.fn(),
}));

import { authRouter } from "./index.js";
import { exchangeCodeForTokens, verifyGoogleIdToken } from "../../../auth/oauth/google.js";
import { AuditLogService } from "../../../services/AuditLogService.js";
import { generateCodeChallenge, generateCodeVerifier } from "../../../auth/oauth/pkce.js";
import { generateState } from "../../../auth/oauth/state.js";
import { generateNonce } from "../../../auth/oauth/nonce.js";

describe("Sprint OAuth P1 — Google Login Foundation Layer Tests", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    dbMock.select.mockReset();
    dbMock.insert.mockReset();
    vi.mocked(AuditLogService.record).mockReset();
    vi.mocked(exchangeCodeForTokens).mockReset();
    vi.mocked(verifyGoogleIdToken).mockReset();
  });

  describe("PKCE, State, and Nonce Generators", () => {
    it("deve gerar code verifier e code challenge PKCE compatíveis", () => {
      const verifier = generateCodeVerifier();
      expect(verifier).toBeDefined();
      expect(typeof verifier).toBe("string");
      expect(verifier.length).toBeGreaterThanOrEqual(43);

      const challenge = generateCodeChallenge(verifier);
      expect(challenge).toBeDefined();
      expect(typeof challenge).toBe("string");
    });

    it("deve gerar strings seguras e distintas para state e nonce", () => {
      const state1 = generateState();
      const state2 = generateState();
      expect(state1).not.toBe(state2);
      expect(state1.length).toBe(64); // hex encoded 32 bytes

      const nonce1 = generateNonce();
      const nonce2 = generateNonce();
      expect(nonce1).not.toBe(nonce2);
      expect(nonce1.length).toBe(64);
    });
  });

  describe("oauthStart mutation", () => {
    it("deve gerar parâmetros de início de fluxo OAuth e registrar auditoria", async () => {
      const ctx = {
        user: null,
        req: { ip: "127.0.0.1", headers: {} },
        db: dbMock,
      } as any;

      const caller = authRouter.createCaller(ctx);
      const res = await caller.oauthStart({ provider: "google" });

      expect(res.state).toBeDefined();
      expect(res.nonce).toBeDefined();
      expect(res.codeVerifier).toBeDefined();
      expect(res.codeChallenge).toBeDefined();
      expect(AuditLogService.record).toHaveBeenCalledWith(
        expect.objectContaining({
          action: "OAUTH_START",
          module: "auth",
        })
      );
    });
  });

  describe("oauthCallback mutation", () => {
    it("deve rejeitar se state retornado for diferente de expectedState", async () => {
      const ctx = {
        user: null,
        req: { ip: "127.0.0.1", headers: {} },
        db: dbMock,
      } as any;

      const caller = authRouter.createCaller(ctx);
      await expect(
        caller.oauthCallback({
          provider: "google",
          code: "google-code",
          state: "state-received",
          expectedState: "state-different",
          expectedNonce: "nonce-expected",
          codeVerifier: "verifier-123",
        })
      ).rejects.toThrow("State inválido");

      expect(AuditLogService.record).toHaveBeenCalledWith(
        expect.objectContaining({
          action: "OAUTH_ERROR",
          newValues: expect.objectContaining({ reason: "state_mismatch" }),
        })
      );
    });

    it("deve processar callback com sucesso quando tokens do Google forem válidos", async () => {
      vi.mocked(exchangeCodeForTokens).mockResolvedValue({
        accessToken: "access-token-123",
        idToken: "id-token-jwt",
        expiresIn: 3600,
      });

      vi.mocked(verifyGoogleIdToken).mockResolvedValue({
        sub: "google-user-id-abc",
        email: "test@gourmet.com",
        email_verified: true,
        name: "Google Test User",
        picture: "http://image.com/pic.jpg",
      } as any);

      const ctx = {
        user: null,
        req: { ip: "127.0.0.1", headers: {} },
        db: dbMock,
      } as any;

      const caller = authRouter.createCaller(ctx);
      const res = await caller.oauthCallback({
        provider: "google",
        code: "google-code",
        state: "state-ok",
        expectedState: "state-ok",
        expectedNonce: "nonce-ok",
        codeVerifier: "verifier-123",
      });

      expect(res.provider).toBe("google");
      expect(res.providerUserId).toBe("google-user-id-abc");
      expect(res.email).toBe("test@gourmet.com");
      expect(res.emailVerified).toBe(true);
      expect(res.name).toBe("Google Test User");
      expect(res.picture).toBe("http://image.com/pic.jpg");

      expect(AuditLogService.record).toHaveBeenCalledWith(
        expect.objectContaining({
          action: "OAUTH_CALLBACK",
        })
      );
    });
  });

  describe("oauthLink mutation", () => {
    it("deve bloquear vínculo se emailVerified for false", async () => {
      const ctx = {
        user: { id: "user-local-1", role: "user" },
        req: { ip: "127.0.0.1", headers: {} },
        db: dbMock,
      } as any;

      const caller = authRouter.createCaller(ctx);
      await expect(
        caller.oauthLink({
          provider: "google",
          providerUserId: "google-sub-1",
          email: "takeover@domain.com",
          emailVerified: false,
          forceConfirm: true,
        })
      ).rejects.toThrow("O e-mail da conta do Google precisa estar verificado");

      expect(AuditLogService.record).toHaveBeenCalledWith(
        expect.objectContaining({
          action: "OAUTH_LINK_DENIED",
          newValues: expect.objectContaining({ reason: "email_not_verified" }),
        })
      );
    });

    it("deve bloquear se a conta Google já estiver vinculada a outro usuário local", async () => {
      dbMock.select.mockReturnValue({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([{ id: "link-1", userId: "user-local-2" }]),
      });

      const ctx = {
        user: { id: "user-local-1", role: "user" },
        req: { ip: "127.0.0.1", headers: {} },
        db: dbMock,
      } as any;

      const caller = authRouter.createCaller(ctx);
      await expect(
        caller.oauthLink({
          provider: "google",
          providerUserId: "google-sub-1",
          email: "user@domain.com",
          emailVerified: true,
          forceConfirm: true,
        })
      ).rejects.toThrow("Esta conta do Google já está vinculada a outro usuário");

      expect(AuditLogService.record).toHaveBeenCalledWith(
        expect.objectContaining({
          action: "OAUTH_LINK_DENIED",
          newValues: expect.objectContaining({ reason: "social_account_already_linked_to_other_user" }),
        })
      );
    });

    it("deve exigir confirmação explícita se o e-mail coincidido pertencer ao usuário logado", async () => {
      dbMock.select
        // Primeira query: busca em userOauthAccounts -> não cadastrado
        .mockReturnValueOnce({
          from: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue([]),
        })
        // Segunda query: busca em users pelo e-mail -> coincide com o usuário logado
        .mockReturnValueOnce({
          from: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue([{ id: "user-local-1", email: "user@domain.com" }]),
        });

      const ctx = {
        user: { id: "user-local-1", role: "user" },
        req: { ip: "127.0.0.1", headers: {} },
        db: dbMock,
      } as any;

      const caller = authRouter.createCaller(ctx);
      const res = await caller.oauthLink({
        provider: "google",
        providerUserId: "google-sub-1",
        email: "user@domain.com",
        emailVerified: true,
        forceConfirm: false, // Sem confirmação
      });

      expect(res.success).toBe(false);
      expect(res.status).toBe("REQUIRES_CONFIRMATION");
      expect(AuditLogService.record).toHaveBeenCalledWith(
        expect.objectContaining({
          action: "OAUTH_LINK_ATTEMPT",
          newValues: expect.objectContaining({ reason: "needs_explicit_confirmation" }),
        })
      );
    });

    it("deve bloquear se o e-mail coincidir com outro usuário local", async () => {
      dbMock.select
        .mockReturnValueOnce({
          from: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue([]),
        })
        .mockReturnValueOnce({
          from: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue([{ id: "user-local-2", email: "user@domain.com" }]),
        });

      const ctx = {
        user: { id: "user-local-1", role: "user" },
        req: { ip: "127.0.0.1", headers: {} },
        db: dbMock,
      } as any;

      const caller = authRouter.createCaller(ctx);
      await expect(
        caller.oauthLink({
          provider: "google",
          providerUserId: "google-sub-1",
          email: "user@domain.com",
          emailVerified: true,
          forceConfirm: true,
        })
      ).rejects.toThrow("O e-mail dessa conta Google é utilizado por outro perfil");

      expect(AuditLogService.record).toHaveBeenCalledWith(
        expect.objectContaining({
          action: "OAUTH_LINK_DENIED",
          newValues: expect.objectContaining({ reason: "email_belongs_to_other_user" }),
        })
      );
    });

    it("deve vincular conta com sucesso quando todas as regras forem satisfeitas", async () => {
      dbMock.select
        .mockReturnValueOnce({
          from: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue([]),
        })
        .mockReturnValueOnce({
          from: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue([{ id: "user-local-1", email: "user@domain.com" }]),
        });

      dbMock.insert.mockReturnValue({
        values: vi.fn().mockResolvedValue({}),
      });

      const ctx = {
        user: { id: "user-local-1", role: "user" },
        req: { ip: "127.0.0.1", headers: {} },
        db: dbMock,
      } as any;

      const caller = authRouter.createCaller(ctx);
      const res = await caller.oauthLink({
        provider: "google",
        providerUserId: "google-sub-1",
        email: "user@domain.com",
        emailVerified: true,
        forceConfirm: true,
      });

      expect(res.success).toBe(true);
      expect(dbMock.insert).toHaveBeenCalled();
      expect(AuditLogService.record).toHaveBeenCalledWith(
        expect.objectContaining({
          action: "OAUTH_LINK_SUCCESS",
        })
      );
    });
  });
});
