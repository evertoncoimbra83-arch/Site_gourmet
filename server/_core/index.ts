// server/_core/index.ts
import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import * as trpcExpress from "@trpc/server/adapters/express";
import { appRouter } from "../routers/_app.js";
import { createContext } from "./context.js";
import path from "path";
import fs from "fs";
import { logger } from "../../server/logger.js";
import { handleAdminBackupDownload } from "../routers/admin/backups.js";
import { AuditLogService } from "../services/AuditLogService.js";
import { setupHealthRoutes } from "./health.js";
import { requestIdMiddleware } from "./request-id.js";

// ✅ Rate limiters (já existiam mas não estavam sendo usados)
import { globalLimiter, authLimiter, checkoutLimiter } from "../security/rateLimit.js";

// ✅ Security headers e logging (já existiam mas não estavam sendo usados)
import { setupCsrfProtection, setupSecurityHeaders, setupSecurityLogging } from "../_core/security-middleware.js";
import { setupMaintenanceMode } from "../_core/maintenance-middleware.js";

const app = express();

app.set("trust proxy", 1);

app.use(requestIdMiddleware);

logger.info(`🚀 Iniciando servidor em: ${new Date().toLocaleString()}`);
logger.debug({ cwd: process.cwd() }, "Informações do ambiente de execução");

// ✅ Body limit reduzido de 50mb para 5mb (uploads de imagem vão direto pro Cloudinary)
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ limit: "5mb", extended: true }));

// ✅ Helmet com CSP ativado para produção
app.use(
  helmet({
    contentSecurityPolicy: false,      // já gerenciado pelo setupSecurityHeaders abaixo
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

// ✅ Security headers (X-Frame-Options, CSP, Referrer-Policy, Permissions-Policy)
setupSecurityHeaders(app);

// ✅ Logging de requisições suspeitas (4xx/5xx)
setupSecurityLogging(app);

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://127.0.0.1:5173",
      "http://192.168.24.2:5173",
      "http://192.168.24.7:5173",
      "http://192.168.24.8:5173",
      "http://192.168.24.2:3001",
      "http://192.168.24.7:3001",
      "http://192.168.24.8:3001",
      "http://192.168.24.2",
      "http://192.168.24.7",
      "http://192.168.24.8",
      "https://gourmetsaudavel.com",
      "https://www.gourmetsaudavel.com",
    ],
    credentials: true,
    methods: ["GET", "POST", "OPTIONS", "PUT", "DELETE"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "x-csrf-token",
      "x-guest-id",
      "x-referral-code",
      "x-request-id",
      "x-correlation-id",
    ],
  })
);

// ✅ Rate limit global — 200 req / 15 min por IP em todas as rotas
// Rotas publicas de saude ficam antes de rate limit, CSRF, tRPC e static.
setupHealthRoutes(app);

app.use(globalLimiter);

// ✅ Rate limit específico para autenticação — 10 tentativas / 15 min por IP
app.use("/trpc/auth", authLimiter);

// ✅ Rate limit específico para checkout — 5 pedidos / hora por IP
app.use("/trpc/checkout", checkoutLimiter);

// CSRF double-submit para chamadas mutantes via cookie de sessao/browser.
setupCsrfProtection(app);

const UPLOADS_PATH = path.join(process.cwd(), "public", "uploads");
if (!fs.existsSync(UPLOADS_PATH)) {
  fs.mkdirSync(UPLOADS_PATH, { recursive: true });
  logger.info({ path: UPLOADS_PATH }, "Pasta de uploads criada com sucesso");
}
app.use("/uploads", express.static(UPLOADS_PATH));
app.get("/api/admin/backups/:filename", handleAdminBackupDownload);

app.use(
  "/trpc",
  trpcExpress.createExpressMiddleware({
    router: appRouter,
    createContext: (opts) => {
      const gId = opts.req.headers["x-guest-id"];
      const rRef = opts.req.headers["x-referral-code"];

      if (gId || rRef) {
        logger.debug({ guestId: gId, referral: rRef }, "Headers de auditoria capturados");
      }

      logger.info(
        {
          requestId: (opts.req as any).requestId,
          method: opts.req.method,
          path: opts.req.path,
          ip: opts.req.ip,
        },
        "[tRPC Call]"
      );

      return createContext(opts);
    },
    onError: ({ path, error, req }) => {
      logger.error(
        {
          requestId: (req as any)?.requestId,
          path,
          message: error.message,
          code: error.code,
        },
        `❌ Erro na execução do tRPC`
      );
    },
  })
);

const distPath = path.join(process.cwd(), "dist", "public");

if (fs.existsSync(distPath)) {
  logger.info({ staticPath: distPath }, "Servindo Frontend estático");

  // ✅ Modo manutenção — ativo via Redis ou MAINTENANCE_MODE=true no .env
  setupMaintenanceMode(app, distPath);

  app.use(
    express.static(distPath, {
      maxAge: "0",
      setHeaders: (res, filepath) => {
        const fileNormalized = filepath.replace(/\\/g, "/");
        const isAsset = fileNormalized.includes("/assets/");
        const isVersionJson = fileNormalized.endsWith("version.json");
        const isHtml = fileNormalized.endsWith(".html");

        if (isVersionJson || isHtml) {
          res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
          res.setHeader("Pragma", "no-cache");
          res.setHeader("Expires", "0");
        } else if (isAsset) {
          res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
        }
      },
    })
  );
  app.get("*", (req, res) => {
    if (req.path.startsWith("/trpc") || req.path.startsWith("/uploads")) {
      return res.status(404).json({ error: "API route not found" });
    }
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    res.sendFile(path.join(distPath, "index.html"));
  });
} else {
  logger.warn("Modo Desenvolvimento: Pasta 'dist' não encontrada. Frontend não será servido pelo Node.");
  app.get("/", (req, res) => {
    res.send("Backend Online - Rodando em modo de desenvolvimento.");
  });
}

// Middleware global de tratamento de erro do Express (captura exceções não tratadas nas rotas Express)
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  const requestId = (req as any).requestId || req.headers?.["x-request-id"] || req.headers?.["x-correlation-id"];

  const actor = {
    userId: (req as any).user?.id || "system",
    ipAddress: req.ip || (req.headers?.["x-forwarded-for"] as string)?.split(",")[0]?.trim() || "127.0.0.1",
    userAgent: req.headers?.["user-agent"] || "unknown",
  };

  void AuditLogService.recordError({
    module: "system",
    source: "express",
    error: err,
    actor,
    requestId,
    route: req.originalUrl || req.url,
    severity: "critical",
    metadata: {
      method: req.method,
      query: req.query,
    }
  });

  logger.error(
    {
      requestId,
      method: req.method,
      route: req.originalUrl || req.url,
    },
    "Erro nao tratado em rota Express",
  );

  res.status(500).json({
    error: "Internal Server Error",
    message: "Ocorreu um erro interno no servidor.",
    requestId,
  });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  logger.info(`✅ [READY] Servidor rodando na porta ${PORT}`);
  logger.info(`🔗 Endpoint: http://localhost:${PORT}/trpc`);
});
