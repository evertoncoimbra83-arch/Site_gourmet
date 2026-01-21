import type { Express, Request, Response, NextFunction } from "express";
import crypto from "crypto";

/**
 * Configuração de segurança para headers HTTP
 */
export function setupSecurityHeaders(app: Express) {
  app.use((req: Request, res: Response, next: NextFunction) => {
    // Previne clickjacking
    res.setHeader("X-Frame-Options", "SAMEORIGIN");

    // Previne MIME type sniffing
    res.setHeader("X-Content-Type-Options", "nosniff");

    // Ativa proteção XSS no navegador
    res.setHeader("X-XSS-Protection", "1; mode=block");

    // Content Security Policy - mais permissivo em desenvolvimento
    if (process.env.NODE_ENV === 'development') {
      // Em desenvolvimento, permite tudo para Vite funcionar
      res.setHeader(
        "Content-Security-Policy",
        "default-src * 'unsafe-inline' 'unsafe-eval' data: blob:; " +
          "script-src * 'unsafe-inline' 'unsafe-eval'; " +
          "style-src * 'unsafe-inline'; " +
          "img-src * data: blob:; " +
          "font-src * data:; " +
          "connect-src * ws: wss:; "
      );
    } else {
      // Produção - restritivo
      res.setHeader(
        "Content-Security-Policy",
        "default-src 'self'; " +
          "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
          "style-src 'self' 'unsafe-inline'; " +
          "img-src 'self' data: https:; " +
          "font-src 'self' data:; " +
          "connect-src 'self' https:; " +
          "frame-ancestors 'self'; " +
          "base-uri 'self'; " +
          "form-action 'self'"
      );
    }

    // Referrer Policy - proteção de privacidade
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");

    // Permissions Policy (antigo Feature-Policy)
    res.setHeader(
      "Permissions-Policy",
      "geolocation=(), microphone=(), camera=(), payment=()"
    );

    next();
  });
}

/**
 * Proteção contra CSRF com tokens
 */
export function setupCsrfProtection(app: Express) {
  // Armazena tokens CSRF em memória (em produção, use Redis)
  const csrfTokens = new Map<string, { token: string; expires: number }>();

  // Limpa tokens expirados a cada 1 hora
  setInterval(() => {
    const now = Date.now();
    const keysToDelete: string[] = [];
    csrfTokens.forEach((value, key) => {
      if (value.expires < now) {
        keysToDelete.push(key);
      }
    });
    keysToDelete.forEach((key) => csrfTokens.delete(key));
  }, 60 * 60 * 1000);

  // Middleware para gerar/validar tokens CSRF
  app.use((req: Request, res: Response, next: NextFunction) => {
    const sessionId = (req.cookies?.["session"] as string) || "";

    // GET requests recebem um novo token CSRF
    if (req.method === "GET" && sessionId) {
      const token = crypto.randomBytes(32).toString("hex");
      csrfTokens.set(sessionId, {
        token,
        expires: Date.now() + 24 * 60 * 60 * 1000, // 24 horas
      });
      res.locals.csrfToken = token;
    }

    // POST/PUT/DELETE/PATCH requerem validação do token
    if (["POST", "PUT", "DELETE", "PATCH"].includes(req.method)) {
      const token =
        req.body?.csrfToken ||
        req.headers["x-csrf-token"] ||
        req.query?.csrfToken;

      const stored = csrfTokens.get(sessionId);

      if (!token || !stored || stored.token !== token) {
        console.warn(
          `[CSRF] Token inválido ou ausente | Session: ${sessionId} | Method: ${req.method}`
        );
        return res.status(403).json({ error: "CSRF token validation failed" });
      }

      // Consome o token (one-time use)
      csrfTokens.delete(sessionId);
    }

    next();
  });
}

/**
 * Rate limiting básico por IP
 */
export function setupRateLimiting(app: Express) {
  const requestCounts = new Map<string, { count: number; resetTime: number }>();

  // Limpa contadores expirados a cada 5 minutos
  setInterval(() => {
    const now = Date.now();
    const keysToDelete: string[] = [];
    requestCounts.forEach((value, key) => {
      if (value.resetTime < now) {
        keysToDelete.push(key);
      }
    });
    keysToDelete.forEach((key) => requestCounts.delete(key));
  }, 5 * 60 * 1000);

  app.use((req: Request, res: Response, next: NextFunction) => {
    // Não aplica rate limiting em desenvolvimento ou a assets estáticos
    if (process.env.NODE_ENV === "development" || req.path.startsWith("/public/") || req.path.startsWith("/.")) {
      return next();
    }

    const clientIp = getClientIp(req);
    const now = Date.now();
    const windowMs = 15 * 60 * 1000; // 15 minutos
    const maxRequests = 100; // máximo de requisições por janela

    let record = requestCounts.get(clientIp);

    if (!record || record.resetTime < now) {
      record = { count: 0, resetTime: now + windowMs };
      requestCounts.set(clientIp, record);
    }

    record.count++;

    // Headers informativos
    res.setHeader("X-RateLimit-Limit", maxRequests.toString());
    res.setHeader(
      "X-RateLimit-Remaining",
      Math.max(0, maxRequests - record.count).toString()
    );
    res.setHeader(
      "X-RateLimit-Reset",
      new Date(record.resetTime).toISOString()
    );

    if (record.count > maxRequests) {
      console.warn(
        `[RATE_LIMIT] Limite excedido | IP: ${clientIp} | Requests: ${record.count}`
      );
      return res.status(429).json({
        error: "Too many requests",
        retryAfter: Math.ceil((record.resetTime - now) / 1000),
      });
    }

    next();
  });
}

/**
 * Logging de segurança
 */
export function setupSecurityLogging(app: Express) {
  app.use((req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();

    res.on("finish", () => {
      const duration = Date.now() - start;
      const clientIp = getClientIp(req);

      // Log apenas de requisições suspeitas ou erros
      if (res.statusCode >= 400) {
        console.log(
          `[SECURITY] ${req.method} ${req.path} | Status: ${res.statusCode} | IP: ${clientIp} | Duration: ${duration}ms`
        );
      }
    });

    next();
  });
}

/**
 * Extrai o IP real do cliente, considerando proxies
 */
function getClientIp(req: Request): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string") {
    return forwarded.split(",")[0].trim();
  }
  return req.socket?.remoteAddress || "unknown";
}

/**
 * Aplica todas as proteções de segurança
 */
export function setupAllSecurityMiddleware(app: Express) {
  setupSecurityHeaders(app);
  setupRateLimiting(app);
  setupSecurityLogging(app);
  // CSRF é opcional - descomente se necessário
  // setupCsrfProtection(app);
}
