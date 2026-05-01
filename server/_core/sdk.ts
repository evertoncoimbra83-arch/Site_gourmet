// server/_core/sdk.ts
import { AXIOS_TIMEOUT_MS, COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { ForbiddenError } from "@shared/_core/errors";
import axios, { type AxiosInstance } from "axios";
import { parse as parseCookieHeader } from "cookie";
import type { Request } from "express";
import { SignJWT, jwtVerify } from "jose";
import type { users } from "../../drizzle/schema";
import * as db from "../db";
import * as envModule from "./env";

// --- INTERFACES ---

interface EnvConfig {
  oAuthServerUrl?: string;
  appId?: string;
  cookieSecret?: string;
}

import type {
  ExchangeTokenRequest,
  ExchangeTokenResponse,
  GetUserInfoResponse,
  GetUserInfoWithJwtRequest,
  GetUserInfoWithJwtResponse,
} from "./types/manusTypes";

/** * Interface para os dados brutos da plataforma Manus
 * Incluímos um index signature para evitar erro TS2352
 */
interface RawManusData {
  openId?: string;
  platforms?: string[];
  platform?: string | null;
  loginMethod?: string | null;
  name?: string | null;
  email?: string | null;
  [key: string]: unknown;
}

// --- CONFIGURAÇÃO ---

const rawEnv = (envModule as Record<string, unknown>).ENV || (envModule as Record<string, unknown>).default || envModule;
const ENV = rawEnv as EnvConfig;

type User = typeof users.$inferSelect;

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.length > 0;

export type SessionPayload = {
  openId: string;
  appId: string;
  name: string;
};

const EXCHANGE_TOKEN_PATH = `/webdev.v1.WebDevAuthPublicService/ExchangeToken`;
const GET_USER_INFO_PATH = `/webdev.v1.WebDevAuthPublicService/GetUserInfo`;
const GET_USER_INFO_WITH_JWT_PATH = `/webdev.v1.WebDevAuthPublicService/GetUserInfoWithJwt`;

// ============================================================================
// OAUTH SERVICE
// ============================================================================

class OAuthService {
  constructor(private client: AxiosInstance) {
    if (!ENV?.oAuthServerUrl) {
      console.error("[OAuth] ERROR: OAUTH_SERVER_URL is not configured!");
    }
  }

  async getTokenByCode(code: string, state: string): Promise<ExchangeTokenResponse> {
    const payload: Partial<ExchangeTokenRequest> & Record<string, string> = {
      code,
      state,
      projectId: ENV?.appId ?? "",
    };

    const { data } = await this.client.post<ExchangeTokenResponse>(
      EXCHANGE_TOKEN_PATH,
      payload
    );

    return data;
  }

  async getUserInfoByToken(accessToken: string): Promise<GetUserInfoResponse> {
    const { data } = await this.client.post<GetUserInfoResponse>(
      GET_USER_INFO_PATH,
      { accessToken }
    );
    return data;
  }
}

// ============================================================================
// SDK SERVER
// ============================================================================

export class SDKServer {
  private readonly client: AxiosInstance;
  private readonly oauthService: OAuthService;

  constructor() {
    this.client = axios.create({
      baseURL: ENV?.oAuthServerUrl || "http://localhost:3001",
      timeout: AXIOS_TIMEOUT_MS,
    });
    this.oauthService = new OAuthService(this.client);
  }

  private deriveLoginMethod(platforms: unknown, fallback: string | null | undefined): string | null {
    if (fallback && fallback.length > 0) return fallback;
    if (!Array.isArray(platforms) || platforms.length === 0) return null;
    
    const validPlatforms = platforms.filter((p): p is string => typeof p === "string");
    const set = new Set<string>(validPlatforms);

    if (set.has("REGISTERED_PLATFORM_EMAIL")) return "email";
    if (set.has("REGISTERED_PLATFORM_GOOGLE")) return "google";
    if (set.has("REGISTERED_PLATFORM_APPLE")) return "apple";
    if (set.has("REGISTERED_PLATFORM_MICROSOFT") || set.has("REGISTERED_PLATFORM_AZURE")) return "microsoft";
    if (set.has("REGISTERED_PLATFORM_GITHUB")) return "github";
    
    return validPlatforms[0]?.toLowerCase() || null;
  }

  async exchangeCodeForToken(code: string, state: string): Promise<ExchangeTokenResponse> {
    return this.oauthService.getTokenByCode(code, state);
  }

  async getUserInfo(accessToken: string): Promise<GetUserInfoResponse> {
    const data = await this.oauthService.getUserInfoByToken(accessToken) as unknown as RawManusData;
    
    const loginMethod = this.deriveLoginMethod(
      data.platforms,
      data.platform ?? data.loginMethod
    );

    return {
      ...(data as unknown as GetUserInfoResponse),
      platform: loginMethod,
      loginMethod,
    } as GetUserInfoResponse;
  }

  private parseCookies(cookieHeader: string | undefined) {
    if (!cookieHeader) return new Map<string, string>();
    return new Map(Object.entries(parseCookieHeader(cookieHeader)));
  }

  private getSessionSecret() {
    return new TextEncoder().encode(ENV?.cookieSecret || "default-dev-secret");
  }

  async createSessionToken(openId: string, options: { expiresInMs?: number; name?: string } = {}): Promise<string> {
    const issuedAt = Date.now();
    const expiresInMs = options.expiresInMs ?? ONE_YEAR_MS;
    const expirationSeconds = Math.floor((issuedAt + expiresInMs) / 1000);

    return new SignJWT({
      openId,
      appId: ENV?.appId ?? "",
      name: options.name || "",
    })
      .setProtectedHeader({ alg: "HS256", typ: "JWT" })
      .setExpirationTime(expirationSeconds)
      .sign(this.getSessionSecret());
  }

  async verifySession(token: string | undefined | null): Promise<SessionPayload | null> {
    if (!token) return null;
    try {
      const { payload } = await jwtVerify(token, this.getSessionSecret(), { algorithms: ["HS256"] });
      const { openId, appId, name } = payload as Record<string, unknown>;

      if (!isNonEmptyString(openId) || !isNonEmptyString(appId) || !isNonEmptyString(name)) return null;
      return { openId, appId, name } as SessionPayload;
    } catch {
      return null;
    }
  }

  async getUserInfoWithJwt(jwtToken: string): Promise<GetUserInfoWithJwtResponse> {
    const payload: GetUserInfoWithJwtRequest = {
      jwtToken,
      projectId: ENV?.appId ?? "",
    };

    const { data } = await this.client.post<GetUserInfoWithJwtResponse>(GET_USER_INFO_WITH_JWT_PATH, payload);
    const raw = data as unknown as RawManusData;

    const loginMethod = this.deriveLoginMethod(raw.platforms, raw.platform ?? raw.loginMethod);

    return {
      ...(data as unknown as GetUserInfoWithJwtResponse),
      platform: loginMethod,
      loginMethod,
    } as GetUserInfoWithJwtResponse;
  }

  async authenticateRequest(req: Request): Promise<User> {
    const cookies = this.parseCookies(req.headers.cookie);
    const sessionToken = cookies.get(COOKIE_NAME);
    const session = await this.verifySession(sessionToken);

    if (!session) throw ForbiddenError("Invalid session");

    let user = await db.getUserByOpenId(session.openId);

    if (!user) {
      try {
        const userInfoRaw = await this.getUserInfoWithJwt(sessionToken || "");
        const userInfo = userInfoRaw as unknown as RawManusData;
        
        const rawOpenId = userInfo.openId;

        // ✅ FIX TS2322 DEFINITIVO:
        // Validamos que rawOpenId é string e não está vazia.
        if (typeof rawOpenId !== "string" || !rawOpenId) {
          throw new Error("Vínculo interrompido: openId não retornado pelo provedor.");
        }
        
        const validOpenId: string = rawOpenId;

        await db.upsertUser({
          openId: validOpenId,
          name: (userInfo.name as string | null) || null,
          email: (userInfo.email as string | null) || null,
          loginMethod: (userInfo.loginMethod as string | null) || (userInfo.platform as string | null) || null,
          lastSignedIn: new Date(),
        });
        
        user = await db.getUserByOpenId(validOpenId);
      } catch (err) {
        console.error("[SDK] Authentication/Sync error:", err);
        throw ForbiddenError("Sync failed");
      }
    }

    if (!user) throw ForbiddenError("User not found");

    // ✅ Garantimos que o openId passado para o log de acesso também seja string pura
    await db.upsertUser({ 
      openId: String(user.openId), 
      lastSignedIn: new Date() 
    });

    return user;
  }
}

export const sdk = new SDKServer();