import "dotenv/config";
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./drizzle/schema/index.ts", // ✅ Apontando para a subpasta
  out: "./drizzle-migrations",         // ✅ Mude o 'out' para uma pasta nova para evitar confusão
  dialect: "mysql",
  dbCredentials: {
    url: process.env.DATABASE_URL || "mysql://root:root@192.168.24.2:3306/gourmet_saudavel",
  },
});