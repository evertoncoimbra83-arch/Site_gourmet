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

// ✅ Worker de IA para processar dietas em segundo plano
import "../workers/nutriWorker.js";


// ✅ Rate limiters (já existiam mas não estavam sendo usados)
import { globalLimiter, authLimiter, checkoutLimiter } from "../security/rateLimit.js";

// ✅ Security headers e logging (já existiam mas não estavam sendo usados)
import { setupSecurityHeaders, setupSecurityLogging } from "../_core/security-middleware.js";
import { setupMaintenanceMode } from "../_core/maintenance-middleware.js";

const app = express();

app.set("trust proxy", 1);

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
      "https://gourmetsaudavel.com",
      "https://www.gourmetsaudavel.com",
    ],
    credentials: true,
    methods: ["GET", "POST", "OPTIONS", "PUT", "DELETE"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "x-guest-id",
      "x-referral-code",
    ],
  })
);

// ✅ Rate limit global — 200 req / 15 min por IP em todas as rotas
app.use(globalLimiter);

// ✅ Rate limit específico para autenticação — 10 tentativas / 15 min por IP
app.use("/trpc/auth", authLimiter);

// ✅ Rate limit específico para checkout — 5 pedidos / hora por IP
app.use("/trpc/checkout", checkoutLimiter);

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
          method: opts.req.method,
          path: opts.req.path,
          ip: opts.req.ip,
        },
        "[tRPC Call]"
      );

      return createContext(opts);
    },
    onError: ({ path, error }) => {
      logger.error(
        {
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

  app.use(express.static(distPath));
  app.get("*", (req, res) => {
    if (req.path.startsWith("/trpc") || req.path.startsWith("/uploads")) {
      return res.status(404).json({ error: "API route not found" });
    }
    res.sendFile(path.join(distPath, "index.html"));
  });
} else {
  logger.warn("Modo Desenvolvimento: Pasta 'dist' não encontrada. Frontend não será servido pelo Node.");
  app.get("/", (req, res) => {
    res.send("Backend Online - Rodando em modo de desenvolvimento.");
  });
}

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  logger.info(`✅ [READY] Servidor rodando na porta ${PORT}`);
  logger.info(`🔗 Endpoint: http://localhost:${PORT}/trpc`);
  logger.info(`🧠 [AI AGENT] Worker de Nutrição ativo e aguardando tarefas...`);
});
