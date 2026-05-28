// server/_core/security-middleware.ts
// ✅ CSP Atualizada para permitir Google Analytics, OneSignal e Fontes externas.

import type { Express, NextFunction, Request, Response } from "express";
import crypto from "crypto";
import { logger } from "../logger.js";

const CSRF_TTL_SECONDS = 24 * 60 * 60; // 24h
const CSRF_COOKIE_NAME = "gourmet_csrf_token";
const CSRF_HEADER_NAME = "x-csrf-token";

export function setupSecurityHeaders(app: Express) {
  app.use((req: Request, res: Response, next: NextFunction) => {
    res.setHeader("X-Frame-Options", "SAMEORIGIN");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-XSS-Protection", "1; mode=block");

    if (process.env.NODE_ENV === "development") {
      res.setHeader(
        "Content-Security-Policy",
        "default-src * 'unsafe-inline' 'unsafe-eval' data: blob:; " +
          "script-src * 'unsafe-inline' 'unsafe-eval'; " +
          "style-src * 'unsafe-inline'; " +
          "img-src * data: blob:; " +
          "font-src * data:; " +
          "connect-src * ws: wss:; " +
          "worker-src * blob:;"
      );
    } else {
      // ✅ CSP de produção corrigida para liberar scripts e estilos externos
      const productionCSP = `
        default-src 'self';
        script-src 'self' 'unsafe-inline' 'unsafe-eval' 
          https://www.googletagmanager.com 
          https://www.google-analytics.com 
          https://cdn.onesignal.com 
          https://api.onesignal.com 
          https://*.onesignal.com 
          https://www.google.com 
          blob:;
        style-src 'self' 'unsafe-inline' 
          https://fonts.googleapis.com 
          https://fonts.cdnfonts.com;
        font-src 'self' data: 
          https://fonts.gstatic.com 
          https://fonts.googleapis.com 
          https://fonts.cdnfonts.com;
        img-src 'self' data: https: http://localhost:3001;
        connect-src 'self' https: wss: 
          https://www.google-analytics.com 
          https://analytics.google.com
          https://stats.g.doubleclick.net
          https://api.onesignal.com 
          https://*.onesignal.com;
        worker-src 'self' blob:;
        frame-ancestors 'self';
        base-uri 'self';
        form-action 'self';
      `.replace(/\s+/g, " ").trim();

      res.setHeader("Content-Security-Policy", productionCSP);
    }

    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    res.setHeader(
      "Permissions-Policy",
      "geolocation=(), microphone=(), camera=(), payment=()"
    );

    next();
  });
}

export function setupCsrfProtection(app: Express) {
  const cookieOptions = {
    httpOnly: false,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    maxAge: CSRF_TTL_SECONDS * 1000,
  };

  const issueToken = (req: Request, res: Response) => {
    const existing = getCookieValue(req, CSRF_COOKIE_NAME);
    const token =
      existing && /^[a-f0-9]{64}$/i.test(existing)
        ? existing
        : crypto.randomBytes(32).toString("hex");
    res.cookie(CSRF_COOKIE_NAME, token, cookieOptions);
    return token;
  };

  app.get("/api/csrf-token", (req: Request, res: Response) => {
    const token = issueToken(req, res);
    res.json({ csrfToken: token });
  });

  app.use((req: Request, res: Response, next: NextFunction) => {
    if (req.method === "GET" || req.method === "HEAD" || req.method === "OPTIONS") {
      if (req.path.startsWith("/trpc")) {
        issueToken(req, res);
      }
      return next();
    }

    if (["POST", "PUT", "DELETE", "PATCH"].includes(req.method)) {
      if (hasBearerAuthorization(req)) {
        return next();
      }

      const headerToken = req.headers[CSRF_HEADER_NAME];
      const token =
        (Array.isArray(headerToken) ? headerToken[0] : headerToken) ||
        req.body?.csrfToken ||
        req.query?.csrfToken;
      const cookieToken = getCookieValue(req, CSRF_COOKIE_NAME);

      if (!token || !cookieToken || cookieToken !== token) {
        logger.warn(
          { method: req.method, path: req.path, ip: getClientIp(req) },
          "[SECURITY] Falha na validacao do Token CSRF",
        );
        return res.status(403).json({ error: "CSRF token validation failed" });
      }
    }

    next();
  });
}

export function setupRateLimiting(app: Express) {
  const requestCounts = new Map<string, { count: number; resetTime: number }>();

  setInterval(() => {
    const now = Date.now();
    requestCounts.forEach((value, key) => {
      if (value.resetTime < now) requestCounts.delete(key);
    });
  }, 5 * 60 * 1000);

  app.use((req: Request, res: Response, next: NextFunction) => {
    if (
      process.env.NODE_ENV === "development" ||
      req.path.startsWith("/public/") ||
      req.path.startsWith("/.") ||
      isLocalRequest(req)
    ) {
      return next();
    }

    const clientIp = getClientIp(req);
    const now = Date.now();
    const windowMs = 15 * 60 * 1000;
    const maxRequests = 100;

    let record = requestCounts.get(clientIp);

    if (!record || record.resetTime < now) {
      record = { count: 0, resetTime: now + windowMs };
      requestCounts.set(clientIp, record);
    }

    record.count += 1;

    res.setHeader("X-RateLimit-Limit", maxRequests.toString());
    res.setHeader("X-RateLimit-Remaining", Math.max(0, maxRequests - record.count).toString());
    res.setHeader("X-RateLimit-Reset", new Date(record.resetTime).toISOString());

    if (record.count > maxRequests) {
      logger.warn(
        { ip: clientIp, requestCount: record.count, path: req.path },
        "[SECURITY] Limite de requisicoes excedido (Rate Limit)"
      );
      return res.status(429).json({
        error: "Too many requests",
        retryAfter: Math.ceil((record.resetTime - now) / 1000),
      });
    }

    next();
  });
}

export function setupSecurityLogging(app: Express) {
  app.use((req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();

    res.on("finish", () => {
      const duration = Date.now() - start;
      const clientIp = getClientIp(req);

      if (res.statusCode >= 500) {
        logger.error(
          { method: req.method, path: req.path, status: res.statusCode, ip: clientIp, durationMs: duration },
          "[SECURITY] Erro de servidor detectado"
        );
        return;
      }

      if (isLocalRequest(req)) return;

      const isSecurityRelevant = res.statusCode === 401 || res.statusCode === 403 || res.statusCode === 429;

      if (isSecurityRelevant) {
        logger.warn(
          { method: req.method, path: req.path, status: res.statusCode, ip: clientIp, durationMs: duration },
          "[SECURITY] Requisicao bloqueada"
        );
      }
    });

    next();
  });
}

function getClientIp(req: Request): string {
  const forwarded = req.headers["x-forwarded-for"];
  const rawIp =
    typeof forwarded === "string"
      ? forwarded.split(",")[0].trim()
      : req.socket?.remoteAddress || "unknown";

  return rawIp.startsWith("::ffff:") ? rawIp.replace("::ffff:", "") : rawIp;
}

function isLocalRequest(req: Request) {
  const clientIp = getClientIp(req);
  return clientIp === "127.0.0.1" || clientIp === "::1" || clientIp === "localhost";
}

function getCookieValue(req: Request, name: string): string | null {
  const parsedCookie = (req as Request & { cookies?: Record<string, unknown> }).cookies?.[name];
  if (typeof parsedCookie === "string") return parsedCookie;

  const cookieHeader = req.headers.cookie || "";
  const cookies = cookieHeader.split(";").map((part) => part.trim());
  const prefix = `${name}=`;
  const match = cookies.find((part) => part.startsWith(prefix));
  return match ? decodeURIComponent(match.slice(prefix.length)) : null;
}

function hasBearerAuthorization(req: Request): boolean {
  const authorization = req.headers.authorization;
  return typeof authorization === "string" && authorization.startsWith("Bearer ");
}

export function setupAllSecurityMiddleware(app: Express) {
  setupSecurityHeaders(app);
  setupRateLimiting(app);
  setupSecurityLogging(app);
}
