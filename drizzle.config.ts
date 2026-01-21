// drizzle.config.ts
import "dotenv/config"; // ✅ Isso carrega o .env automaticamente para o Drizzle Kit
import { defineConfig } from "drizzle-kit";

if (!process.env.DATABASE_URL) {
  throw new Error("❌ DATABASE_URL não encontrada no arquivo .env");
}

export default defineConfig({
  schema: "./drizzle/schema/index.ts", // ✅ Aponte para o index.ts do seu schema refatorado
  out: "./drizzle",
  dialect: "mysql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  }, // ✅ Agora a chave está fechada corretamente
});