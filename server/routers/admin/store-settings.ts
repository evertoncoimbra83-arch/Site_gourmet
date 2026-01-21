import { z } from "zod";
import { router, adminProcedure } from "../../_core/trpc.js";
import { getDb } from "../../db.js";
import { storeSettings } from "../../../drizzle/schema/index.js";
import { sql } from "drizzle-orm";

export const adminStoreSettingsRouter = router({
  /**
   * ✅ ROTA FALTANTE: get
   * Esta é a rota que o seu erro 404 diz que não existe.
   */
  get: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Procura a primeira linha de configurações
    const result = await db.select().from(storeSettings).limit(1);
    
    // Retorna os dados ou um objeto padrão se estiver vazio
    return result[0] || {
      companyName: "",
      accessibility: { vLibrasActive: false, highContrastActive: false }
    };
  }),

  // Outras rotas como update, exportKernel, downloadBackup permanecem abaixo...
  update: adminProcedure
    .input(z.any()) // Ajuste conforme a necessidade
    .mutation(async ({ input }) => {
      // Lógica de update aqui
    }),
});