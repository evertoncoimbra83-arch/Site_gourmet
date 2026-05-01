// server/_core/maintenance-middleware.ts
// Middleware de modo de manutenção.
//
// COMO ATIVAR:
//   Opção A (sem reiniciar o servidor): setar no Redis
//     redis-cli SET maintenance:active "1"
//
//   Opção B (reinicia o servidor):
//     MAINTENANCE_MODE=true em .env / PM2 ecosystem config
//
// COMO DESATIVAR:
//     redis-cli DEL maintenance:active
//     ou remover MAINTENANCE_MODE do .env

import type { NextFunction, Request, Response } from "express";
import path from "path";
import { redisConnection } from "../lib/redis.js";
import { logger } from "../logger.js";

// IPs que sempre passam (útil para checar o site durante manutenção)
const ALLOWED_IPS = new Set([
  "127.0.0.1",
  "::1",
  ...(process.env.MAINTENANCE_ALLOWED_IPS?.split(",").map((s) => s.trim()) ?? []),
]);

// Rotas que nunca entram em manutenção (health check, etc.)
const BYPASS_PATHS = ["/trpc/public.health", "/uploads/"];

let cachedMaintenanceState: boolean | null = null;
let lastChecked = 0;
const CACHE_TTL_MS = 10_000; // re-verifica o Redis a cada 10s

async function isMaintenanceActive(): Promise<boolean> {
  // Variável de ambiente tem prioridade total
  if (process.env.MAINTENANCE_MODE === "true") return true;

  // Cache para não bater no Redis em toda requisição
  const now = Date.now();
  if (cachedMaintenanceState !== null && now - lastChecked < CACHE_TTL_MS) {
    return cachedMaintenanceState;
  }

  try {
    const val = await redisConnection.get("maintenance:active");
    cachedMaintenanceState = val === "1" || val === "true";
    lastChecked = now;
    return cachedMaintenanceState;
  } catch {
    // Se o Redis estiver offline, não bloqueia o site por padrão
    return false;
  }
}

export function setupMaintenanceMode(app: import("express").Express, distPath: string) {
  app.use(async (req: Request, res: Response, next: NextFunction) => {
    // Permite IPs autorizados (o admin)
    const clientIp =
      (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
      req.socket?.remoteAddress ||
      "";
    if (ALLOWED_IPS.has(clientIp)) return next();

    // Permite rotas de sistema
    if (BYPASS_PATHS.some((p) => req.path.startsWith(p))) return next();

    const active = await isMaintenanceActive();
    if (!active) return next();

    logger.info({ path: req.path, ip: clientIp }, "[MAINTENANCE] Requisição bloqueada — modo manutenção ativo");

    // API requests recebem JSON
    if (req.path.startsWith("/trpc") || req.headers.accept?.includes("application/json")) {
      return res.status(503).json({
        error: "SERVICE_UNAVAILABLE",
        message: "Sistema em manutenção. Tente novamente em alguns minutos.",
      });
    }

    // Requests de browser recebem a página estática
    const maintenancePage = path.join(distPath, "maintenance.html");
    return res.status(503).sendFile(maintenancePage, (err) => {
      if (err) {
        // Fallback mínimo se o arquivo não existir
        res.status(503).send("<h1>Em manutenção. Volte em breve!</h1>");
      }
    });
  });
}