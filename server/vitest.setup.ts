// server/vitest.setup.ts
import { config } from "dotenv";
import path from "path";

// Carrega o .env da raiz do projeto para o ambiente de teste
config({ path: path.resolve(process.cwd(), ".env") });