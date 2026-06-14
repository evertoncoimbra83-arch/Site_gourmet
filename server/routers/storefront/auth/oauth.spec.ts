import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Hoisted DB and Google OAuth Mocks
const dbMock = vi.hoisted(() => {
  const select = vi.fn();
  const insert = vi.fn();
  const update = vi.fn();
  const deleteFn = vi.fn();
  const transaction = vi.fn();
  const findFirst = vi.fn();

  return {
    select,
    insert,
    update,
    delete: deleteFn,
    transaction,
    query: {
      guests: {
        findFirst,
      },
    },
  };
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
  generateGoogleAuthUrl: vi.fn(),
}));

import { authRouter } from "./index.js";
import {
  exchangeCodeForTokens,
  verifyGoogleIdToken,
  generateGoogleAuthUrl,
} from "../../../auth/oauth/google.js";
import { AuditLogService } from "../../../services/AuditLogService.js";
import {
  generateCodeChallenge,
  generateCodeVerifier,
} from "../../../auth/oauth/pkce.js";
import { generateState } from "../../../auth/oauth/state.js";
import { generateNonce } from "../../../auth/oauth/nonce.js";
import { signLinkingToken, verifyLinkingToken } from "../../../auth/oauth/linkingToken.js";

const createLinkingPayload = (overrides: Record<string, unknown> = {}) => ({
  userId: "user-local-1",
  provider: "google",
  providerUserId: "google-sub-1",
  email: "user@domain.com",
  emailVerified: true,
  expiresAt: Date.now() + 5 * 60 * 1000,
  ...overrides,
});

describe("Sprint OAuth P1 — Google Login Foundation Layer Tests", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.stubEnv("NODE_ENV", "test");
    vi.stubEnv("DB_ENCRYPTION_KEY", "");

    const queryResult = {
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([]),
      orderBy: vi.fn().mockReturnThis(),
    };
    dbMock.select.mockReturnValue(queryResult);

    const insertResult = {
      values: vi.fn().mockResolvedValue({}),
    };
    dbMock.insert.mockReturnValue(insertResult);

    const updateResult = {
      set: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue({}),
    };
    dbMock.update.mockReturnValue(updateResult);

    const deleteResult = {
      where: vi.fn().mockResolvedValue({}),
    };
    dbMock.delete.mockReturnValue(deleteResult);

    dbMock.transaction.mockImplementation(async (callback) => {
      return callback(dbMock);
    });

    dbMock.query.guests.findFirst.mockResolvedValue(null);

    vi.mocked(AuditLogService.record).mockReset();
    vi.mocked(exchangeCodeForTokens).mockReset();
    vi.mocked(verifyGoogleIdToken).mockReset();
    vi.mocked(generateGoogleAuthUrl).mockReset();
    vi.mocked(generateGoogleAuthUrl).mockImplementation(async (args: any) => "https://accounts.google.com/o/oauth2/v2/auth?mocked=true&state=" + args.state);
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



  describe("OAuth linking token safety", () => {
    afterEach(() => {
      vi.unstubAllEnvs();
    });

    it("falha em producao sem DB_ENCRYPTION_KEY", () => {
      vi.stubEnv("NODE_ENV", "production");
      vi.stubEnv("DB_ENCRYPTION_KEY", "");

      expect(() => signLinkingToken(createLinkingPayload())).toThrow(
        "DB_ENCRYPTION_KEY is required",
      );
    });

    it("usa segredo fixo somente em teste quando DB_ENCRYPTION_KEY esta ausente", () => {
      vi.stubEnv("NODE_ENV", "test");
      vi.stubEnv("DB_ENCRYPTION_KEY", "");

      const payload = createLinkingPayload();
      const token = signLinkingToken(payload);

      expect(verifyLinkingToken(token)).toMatchObject(payload);
    });

    it("rejeita token expirado", () => {
      const token = signLinkingToken(
        createLinkingPayload({ expiresAt: Date.now() - 1000 }),
      );

      expect(verifyLinkingToken(token)).toBeNull();
    });

    it("rejeita token malformado", () => {
      expect(verifyLinkingToken("not-a-valid-linking-token")).toBeNull();
    });

    it("rejeita assinatura invalida", () => {
      const token = signLinkingToken(createLinkingPayload());
      const parsed = JSON.parse(Buffer.from(token, "base64").toString("utf-8"));
      parsed.signature = "00".repeat(32);
      const tamperedToken = Buffer.from(JSON.stringify(parsed)).toString(
        "base64",
      );

      expect(verifyLinkingToken(tamperedToken)).toBeNull();
    });
  });

  describe("oauthLink mutation", () => {
    it("deve rejeitar se o token de vinculação for inválido", async () => {
      const ctx = {
        user: { id: "user-local-1", role: "user" },
        session: { id: "session-1" },
        req: { ip: "127.0.0.1", headers: {} },
        db: dbMock,
      } as any;

      const caller = authRouter.createCaller(ctx);
      await expect(
        caller.oauthLink({
          linkingToken: "invalid-token",
          confirm: true,
        })
      ).rejects.toThrow("O link de vinculação expirou ou é inválido");
    });

    it("deve rejeitar se o token de vinculação pertencer a outro usuário", async () => {
      const linkingToken = signLinkingToken({
        userId: "user-local-2", // Outro usuário
        provider: "google",
        providerUserId: "google-sub-1",
        email: "user@domain.com",
        emailVerified: true,
        expiresAt: Date.now() + 5 * 60 * 1000,
      });

      const ctx = {
        user: { id: "user-local-1", role: "user" },
        session: { id: "session-1" },
        req: { ip: "127.0.0.1", headers: {} },
        db: dbMock,
      } as any;

      const caller = authRouter.createCaller(ctx);
      await expect(
        caller.oauthLink({
          linkingToken,
          confirm: true,
        })
      ).rejects.toThrow("Token de vinculação não pertence à sua sessão ativa");
    });

    it("deve rejeitar se a conta social já foi vinculada a outro usuário", async () => {
      const linkingToken = signLinkingToken({
        userId: "user-local-1",
        provider: "google",
        providerUserId: "google-sub-1",
        email: "user@domain.com",
        emailVerified: true,
        expiresAt: Date.now() + 5 * 60 * 1000,
      });

      dbMock.select.mockReturnValue({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([{ id: "link-1", userId: "user-local-3" }]),
      });

      const ctx = {
        user: { id: "user-local-1", role: "user" },
        session: { id: "session-1" },
        req: { ip: "127.0.0.1", headers: {} },
        db: dbMock,
      } as any;

      const caller = authRouter.createCaller(ctx);
      await expect(
        caller.oauthLink({
          linkingToken,
          confirm: true,
        })
      ).rejects.toThrow("Esta conta já foi vinculada a outro perfil de usuário");
    });

    it("deve vincular a conta social com sucesso com parâmetros corretos", async () => {
      const linkingToken = signLinkingToken({
        userId: "user-local-1",
        provider: "google",
        providerUserId: "google-sub-1",
        email: "user@domain.com",
        emailVerified: true,
        expiresAt: Date.now() + 5 * 60 * 1000,
      });

      dbMock.select.mockReturnValue({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([]), // Não vinculada ainda
      });

      dbMock.insert.mockReturnValue({
        values: vi.fn().mockResolvedValue({}),
      });

      const ctx = {
        user: { id: "user-local-1", role: "user" },
        session: { id: "session-1" },
        req: { ip: "127.0.0.1", headers: {} },
        db: dbMock,
      } as any;

      const caller = authRouter.createCaller(ctx);
      const res = await caller.oauthLink({
        linkingToken,
        confirm: true,
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

  describe("oauthGoogleStart mutation", () => {
    it("deve gerar a URL de autorização correta e registrar OAUTH_START", async () => {
      const ctx = {
        user: null,
        req: { ip: "127.0.0.1", headers: {} },
        db: dbMock,
      } as any;

      const caller = authRouter.createCaller(ctx);
      const res = await caller.oauthGoogleStart({ provider: "google" });

      expect(res.url).toBeDefined();
      expect(res.url).toContain("accounts.google.com");
      expect(res.url).toContain("state=" + res.state);
      expect(res.state).toBeDefined();
      expect(res.nonce).toBeDefined();
      expect(res.codeVerifier).toBeDefined();
      expect(res.codeChallenge).toBeDefined();
      expect(AuditLogService.record).toHaveBeenCalledWith(
        expect.objectContaining({
          action: "OAUTH_START",
        })
      );
    });
  });

  describe("oauthGoogleComplete mutation", () => {
    it("deve bloquear se state for inválido", async () => {
      const ctx = {
        user: null,
        req: { ip: "127.0.0.1", headers: {} },
        db: dbMock,
      } as any;

      const caller = authRouter.createCaller(ctx);
      await expect(
        caller.oauthGoogleComplete({
          provider: "google",
          code: "code",
          state: "state-received",
          expectedState: "state-different",
          expectedNonce: "nonce-expected",
          codeVerifier: "verifier",
        })
      ).rejects.toThrow("State inválido");
    });

    it("deve realizar login se a conta Google já estiver vinculada", async () => {
      vi.mocked(exchangeCodeForTokens).mockResolvedValue({
        accessToken: "access-token",
        idToken: "id-token",
        expiresIn: 3600,
      });

      vi.mocked(verifyGoogleIdToken).mockResolvedValue({
        sub: "google-sub-abc",
        email: "user@domain.com",
        email_verified: true,
        name: "Google User",
      } as any);

      // Mapeamento existente
      dbMock.select
        // Primeira query: busca em userOauthAccounts -> mapeamento existe
        .mockReturnValueOnce({
          from: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue([{ id: "link-1", userId: "user-local-1" }]),
        })
        // Segunda query: busca em users pelo ID -> usuário local existe
        .mockReturnValueOnce({
          from: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue([{ id: "user-local-1", email: "user@domain.com", name: "Google User" }]),
        });

      dbMock.insert.mockReturnValue({
        values: vi.fn().mockResolvedValue({}),
      });

      const ctx = {
        user: null,
        req: { ip: "127.0.0.1", headers: {} },
        res: { appendHeader: vi.fn() },
        db: dbMock,
      } as any;

      const caller = authRouter.createCaller(ctx);
      const res = await caller.oauthGoogleComplete({
        provider: "google",
        code: "code",
        state: "state-ok",
        expectedState: "state-ok",
        expectedNonce: "nonce-ok",
        codeVerifier: "verifier",
      });

      expect(res.success).toBe(true);
      expect(res.status).toBe("SUCCESS");
      expect(res.user?.id).toBe("user-local-1");
      expect(AuditLogService.record).toHaveBeenCalledWith(
        expect.objectContaining({
          action: "OAUTH_LOGIN_SUCCESS",
        })
      );
    });

    it("deve bloquear login/cadastro automático se houver colisão de e-mail local (Takeover Prevention)", async () => {
      vi.mocked(exchangeCodeForTokens).mockResolvedValue({
        accessToken: "access-token",
        idToken: "id-token",
        expiresIn: 3600,
      });

      vi.mocked(verifyGoogleIdToken).mockResolvedValue({
        sub: "google-sub-abc",
        email: "user@domain.com",
        email_verified: true,
        name: "Google User",
      } as any);

      dbMock.select
        // Primeira query: busca em userOauthAccounts -> não cadastrado
        .mockReturnValueOnce({
          from: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue([]),
        })
        // Segunda query: busca em users pelo e-mail -> já existe um usuário com esse e-mail
        .mockReturnValueOnce({
          from: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue([{ id: "user-local-2", email: "user@domain.com" }]),
        });

      const ctx = {
        user: null,
        req: { ip: "127.0.0.1", headers: {} },
        db: dbMock,
      } as any;

      const caller = authRouter.createCaller(ctx);
      await expect(
        caller.oauthGoogleComplete({
          provider: "google",
          code: "code",
          state: "state-ok",
          expectedState: "state-ok",
          expectedNonce: "nonce-ok",
          codeVerifier: "verifier",
        })
      ).rejects.toThrow("Este e-mail já está associado a uma conta existente");
    });

    it("deve realizar auto-registro com sucesso se não houver colisão", async () => {
      vi.mocked(exchangeCodeForTokens).mockResolvedValue({
        accessToken: "access-token",
        idToken: "id-token",
        expiresIn: 3600,
      });

      vi.mocked(verifyGoogleIdToken).mockResolvedValue({
        sub: "google-sub-abc",
        email: "newuser@domain.com",
        email_verified: true,
        name: "New Google User",
      } as any);

      dbMock.select
        // Primeira query: busca em userOauthAccounts -> não cadastrado
        .mockReturnValueOnce({
          from: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue([]),
        })
        // Segunda query: busca em users pelo e-mail -> não cadastrado
        .mockReturnValueOnce({
          from: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue([]),
        });

      dbMock.insert.mockReturnValue({
        values: vi.fn().mockResolvedValue({}),
      });

      const ctx = {
        user: null,
        req: { ip: "127.0.0.1", headers: {} },
        res: { appendHeader: vi.fn() },
        db: dbMock,
      } as any;

      const caller = authRouter.createCaller(ctx);
      const res = await caller.oauthGoogleComplete({
        provider: "google",
        code: "code",
        state: "state-ok",
        expectedState: "state-ok",
        expectedNonce: "nonce-ok",
        codeVerifier: "verifier",
      });

      expect(res.success).toBe(true);
      expect(res.status).toBe("SUCCESS");
      expect(AuditLogService.record).toHaveBeenCalledWith(
        expect.objectContaining({
          action: "OAUTH_REGISTER_SUCCESS",
        })
      );
    });

    it("deve retornar REQUIRES_CONFIRMATION se usuário estiver autenticado e iniciar vinculação", async () => {
      vi.mocked(exchangeCodeForTokens).mockResolvedValue({
        accessToken: "access-token",
        idToken: "id-token",
        expiresIn: 3600,
      });

      vi.mocked(verifyGoogleIdToken).mockResolvedValue({
        sub: "google-sub-abc",
        email: "user@domain.com",
        email_verified: true,
        name: "Google User",
      } as any);

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
        session: { id: "session-1", createdAt: new Date() },
        req: { ip: "127.0.0.1", headers: {} },
        db: dbMock,
      } as any;

      const caller = authRouter.createCaller(ctx);
      const res = await caller.oauthGoogleComplete({
        provider: "google",
        code: "code",
        state: "state-ok",
        expectedState: "state-ok",
        expectedNonce: "nonce-ok",
        codeVerifier: "verifier",
      });

      expect(res.success).toBe(false);
      expect(res.status).toBe("REQUIRES_CONFIRMATION");
      expect(res.linkingToken).toBeDefined();
    });
  });

  describe("unlinkOAuthAccount mutation", () => {
    it("listOAuthAccounts nao retorna tokens sensiveis", async () => {
      const createdAt = new Date("2026-01-01T00:00:00.000Z");
      const lastUsedAt = new Date("2026-01-02T00:00:00.000Z");

      dbMock.select.mockReturnValueOnce({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([
          {
            provider: "google",
            email: "user@domain.com",
            createdAt,
            lastUsedAt,
            accessToken: "secret-access-token",
            refreshToken: "secret-refresh-token",
            providerUserId: "google-sub-1",
          },
        ]),
      });

      const ctx = {
        user: { id: "user-local-1", role: "user" },
        session: { id: "session-1" },
        req: { ip: "127.0.0.1", headers: {} },
        db: dbMock,
      } as any;

      const caller = authRouter.createCaller(ctx);
      const res = await caller.listOAuthAccounts();

      expect(res).toEqual([
        {
          provider: "google",
          email: "user@domain.com",
          createdAt,
          lastUsedAt,
        },
      ]);
      expect(res[0]).not.toHaveProperty("accessToken");
      expect(res[0]).not.toHaveProperty("refreshToken");
      expect(res[0]).not.toHaveProperty("providerUserId");
    });

    it("deve bloquear desvinculação se o usuário não possuir senha local e esta for a única conta vinculada", async () => {
      dbMock.select
        // Primeira query: retorna password nula para o usuário
        .mockReturnValueOnce({
          from: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue([{ password: null }]),
        })
        // Segunda query: retorna apenas 1 conta social vinculada
        .mockReturnValueOnce({
          from: vi.fn().mockReturnThis(),
          where: vi.fn().mockImplementation(() => {
            return Promise.resolve([{ id: "link-1", provider: "google" }]);
          }),
        });

      const ctx = {
        user: { id: "user-local-1", role: "user" },
        session: { id: "session-1" },
        req: { ip: "127.0.0.1", headers: {} },
        db: dbMock,
      } as any;

      const caller = authRouter.createCaller(ctx);
      await expect(
        caller.unlinkOAuthAccount({
          provider: "google",
          confirm: true,
        })
      ).rejects.toThrow("Você não pode desvincular seu único método de acesso");
    });

    it("deve desvincular com sucesso se o usuário possuir senha local", async () => {
      dbMock.select
        .mockReturnValueOnce({
          from: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue([{ password: "local-password-hash" }]),
        })
        .mockReturnValueOnce({
          from: vi.fn().mockReturnThis(),
          where: vi.fn().mockImplementation(() => {
            return Promise.resolve([{ id: "link-1", provider: "google" }]);
          }),
        });

      const ctx = {
        user: { id: "user-local-1", role: "user" },
        session: { id: "session-1" },
        req: { ip: "127.0.0.1", headers: {} },
        db: dbMock,
      } as any;

      const caller = authRouter.createCaller(ctx);
      const res = await caller.unlinkOAuthAccount({
        provider: "google",
        confirm: true,
      });

      expect(res.success).toBe(true);
      expect(AuditLogService.record).toHaveBeenCalledWith(
        expect.objectContaining({
          action: "OAUTH_UNLINK",
        })
      );
    });
  });
});
