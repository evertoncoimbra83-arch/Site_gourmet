import { Express, Request, Response } from "express";

// ✅ 1. Conecta com client/src/const.ts
import { COOKIE_NAME, ONE_YEAR_MS } from "@/const";

// ✅ 2. Conecta com server/db.ts
import * as db from "../db";

// ✅ 3. Conecta com server/_core/sdk.ts
import { SDKServer } from "./sdk";
const sdk = new SDKServer();

// ✅ 4. Importa ou define opções de cookie
/**
 * Retorna opções base para o cookie de sessão.
 * FIX: Removido o parâmetro não utilizado para satisfazer o ESLint.
 */
function getSessionCookieOptions() {
  return {}; 
}

// --- Helpers Locais ---

function isLocalhost(req: Request) {
  const host = req.hostname;
  return host === "localhost" || host === "127.0.0.1";
}

function getQueryParam(req: Request, key: string): string | undefined {
  const val = req.query[key];
  return typeof val === "string" ? val : undefined;
}

// --- Rotas OAuth ---

export function registerOAuthRoutes(app: Express) {
  app.get("/api/oauth/callback", async (req: Request, res: Response) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");

    if (!code || !state) {
      res.status(400).json({ error: "code and state are required" });
      return;
    }

    try {
      const tokenResponse = await sdk.exchangeCodeForToken(code, state);
      const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);

      if (!userInfo.openId) {
        res.status(400).json({ error: "openId missing from user info" });
        return;
      }

      await db.upsertUser({
        openId: userInfo.openId,
        name: userInfo.name || null,
        email: userInfo.email ?? null,
        loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
        lastSignedIn: new Date(),
      });

      const sessionToken = await sdk.createSessionToken(userInfo.openId, {
        name: userInfo.name || "",
        expiresInMs: ONE_YEAR_MS,
      });

      // ✅ Chamada ajustada para a nova assinatura sem parâmetros
      const baseOptions = getSessionCookieOptions();

      // --- Lógica de Segurança de Cookie (Blindada) ---
      const localhost = isLocalhost(req);
      const isProduction = !localhost;
      
      const secure = isProduction; 
      const sameSite = isProduction ? "none" : "lax";

      res.cookie(COOKIE_NAME, sessionToken, {
        ...baseOptions,
        maxAge: ONE_YEAR_MS,
        httpOnly: true,
        path: "/",
        sameSite, 
        secure,   
      });

      res.redirect(302, "/");

    } catch (error) {
      console.error("OAuth Error:", error);
      res.status(500).json({ error: "OAuth callback failed" });
    }
  });
}