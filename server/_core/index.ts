import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import * as trpcExpress from "@trpc/server/adapters/express";
// ✅ CORREÇÃO (Erro 2307): Importando de _app.js que é o roteador mestre
import { appRouter } from "../routers/_app.js";
import { createContext } from "./context.js";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" }
  })
);

app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:3000"],
    credentials: true,
    methods: ["GET", "POST", "OPTIONS", "PUT", "DELETE"],
  })
);

const UPLOADS_PATH = path.join(process.cwd(), "public", "uploads");
app.use("/uploads", express.static(UPLOADS_PATH));

app.get("/", (req, res) => res.send("🚀 Backend Gourmet Online"));


try {
  // tRPC v10+ usa _def.procedures ou _def.record
  const procedures = (appRouter as any)._def.procedures || (appRouter as any)._def.record || {};
  const rootKeys = Object.keys(procedures);
  console.log("📂 Rotas registradas no tRPC:", rootKeys);
} catch (e) {
  console.log("⚠️ Não foi possível listar as rotas automaticamente, mas o roteador foi carregado.");
}
console.log("--------------------------------------------------\n");

app.use(
  "/trpc",
  trpcExpress.createExpressMiddleware({
    router: appRouter,
    createContext,
    // ✅ CORREÇÃO (Erro 7031): Tipagem explícita para evitar o erro de 'any' implícito
    onError: ({ path, error }: { path: string | undefined; error: any }) => {
      if (error.code === 'NOT_FOUND') {
        console.error(`🚨 [tRPC 404] Rota não encontrada: "${path}"`);
      } else {
        console.error(`❌ [tRPC Error] em "${path || 'desconhecido'}":`, error.message);
      }
    },
  })
);

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`✅ Servidor rodando na porta ${PORT}`);
});