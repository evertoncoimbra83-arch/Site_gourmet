import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./drizzle/schema/index.ts", // ✅ Apontando para a subpasta
  out: "./drizzle-migrations",         // ✅ Mude o 'out' para uma pasta nova para evitar confusão
  dialect: "mysql",
  dbCredentials: {
    url: "mysql://gourmetadmin:Gourmet2026StrongServer@IP_DO_SERVIDOR:3306/gourmet_saudavel",
  },
});