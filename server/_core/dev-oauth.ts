/**
 * Sistema de Autenticação Local para Desenvolvimento
 * 
 * Simula o OAuth Manus localmente para testes sem precisar do servidor real.
 * NUNCA use em produção!
 */

import { Router } from "express";
import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { upsertUser } from "../db";
import { sdk } from "./sdk";
import type { Request, Response } from "express";

const devOAuthRouter = Router();

// Usuários de teste disponíveis localmente
const DEV_USERS = {
  "user-001": {
    openId: "user-001",
    name: "Usuário Teste",
    email: "user@test.com",
    role: "user" as const,
  },
  "admin-001": {
    openId: "admin-001",
    name: "Admin Teste",
    email: "admin@test.com",
    role: "admin" as const,
  },
};

/**
 * GET /api/dev-oauth/login
 * 
 * Simula o redirecionamento para OAuth
 * Em produção, isso redirecionaria para oauth.manus.im
 * Em desenvolvimento, mostra uma página de seleção de usuário
 */
devOAuthRouter.get("/login", (req: Request, res: Response) => {
  const redirectUri = req.query.redirectUri as string;
  const state = req.query.state as string;

  if (!redirectUri || !state) {
    return res.status(400).json({
      error: "Missing redirectUri or state",
    });
  }

  // Renderizar página HTML para selecionar usuário
  const html = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Dev OAuth - Selecione um Usuário</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }
        
        .container {
          background: white;
          border-radius: 12px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          max-width: 500px;
          width: 100%;
          padding: 40px;
        }
        
        h1 {
          color: #1f2937;
          margin-bottom: 10px;
          font-size: 28px;
        }
        
        .subtitle {
          color: #6b7280;
          margin-bottom: 30px;
          font-size: 14px;
        }
        
        .warning {
          background: #fef3c7;
          border: 1px solid #fcd34d;
          color: #92400e;
          padding: 12px;
          border-radius: 6px;
          margin-bottom: 20px;
          font-size: 13px;
        }
        
        .users-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-bottom: 20px;
        }
        
        .user-button {
          display: block;
          width: 100%;
          padding: 16px;
          border: 2px solid #e5e7eb;
          border-radius: 8px;
          background: white;
          cursor: pointer;
          transition: all 0.2s;
          text-align: left;
          text-decoration: none;
          color: inherit;
        }
        
        .user-button:hover {
          border-color: #667eea;
          background: #f3f4f6;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.1);
        }
        
        .user-name {
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 4px;
        }
        
        .user-email {
          font-size: 13px;
          color: #6b7280;
        }
        
        .user-role {
          display: inline-block;
          margin-top: 8px;
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
        }
        
        .user-role.admin {
          background: #dbeafe;
          color: #1e40af;
        }
        
        .user-role.user {
          background: #dcfce7;
          color: #166534;
        }
        
        .footer {
          text-align: center;
          color: #9ca3af;
          font-size: 12px;
          margin-top: 20px;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>🔐 Dev OAuth</h1>
        <p class="subtitle">Selecione um usuário para fazer login</p>
        
        <div class="warning">
          ⚠️ Isso é apenas para desenvolvimento local. Nunca use em produção!
        </div>
        
        <div class="users-list">
          ${Object.entries(DEV_USERS)
            .map(
              ([userId, user]) => `
            <a href="/api/dev-oauth/callback?code=${userId}&state=${state}" class="user-button">
              <div class="user-name">${user.name}</div>
              <div class="user-email">${user.email}</div>
              <span class="user-role ${user.role}">${user.role}</span>
            </a>
          `
            )
            .join("")}
        </div>
        
        <div class="footer">
          Ambiente de desenvolvimento - Simulação de OAuth
        </div>
      </div>
    </body>
    </html>
  `;

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.send(html);
});

/**
 * GET /api/dev-oauth/callback
 * 
 * Simula o callback do OAuth
 * Em produção, o servidor Manus faria isso
 * Em desenvolvimento, criamos a sessão localmente com JWT assinado
 */
devOAuthRouter.get("/callback", async (req: Request, res: Response) => {
  try {
    const code = req.query.code as string;
    const state = req.query.state as string;

    if (!code || !state) {
      return res.status(400).json({
        error: "Missing code or state",
      });
    }

    // Obter usuário do código (em dev, o código é o userId)
    const user = DEV_USERS[code as keyof typeof DEV_USERS];

    if (!user) {
      return res.status(400).json({
        error: "Invalid user code",
      });
    }

    // Criar/atualizar usuário no banco
    await upsertUser({
      openId: user.openId,
      name: user.name,
      email: user.email,
      role: user.role,
      loginMethod: "dev-oauth",
      lastSignedIn: new Date(),
    });

    // Criar token de sessão assinado (JWT com SDK)
    const sessionToken = await sdk.createSessionToken(user.openId, {
      name: user.name,
      expiresInMs: ONE_YEAR_MS,
    });

    // Gravar cookie com nome correto (COOKIE_NAME)
    // Em desenvolvimento, usamos sameSite: 'lax' para funcionar em localhost (http)
    res.cookie(COOKIE_NAME, sessionToken, {
      httpOnly: true,
      path: "/",
      sameSite: "lax",
      secure: false, // localhost é http, não https
      maxAge: ONE_YEAR_MS,
    });

    // Redirecionar direto para / (não passa por /api/oauth/callback)
    res.redirect(302, "/");
  } catch (error) {
    
    res.status(500).json({
      error: "Internal server error",
    });
  }
});

export default devOAuthRouter;
