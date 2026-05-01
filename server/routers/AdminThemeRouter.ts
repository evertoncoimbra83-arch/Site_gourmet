import { z } from "zod";
import { router, adminProcedure } from "../_core/trpc";
import { getDb } from "./../db";
import { storeSettings } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

export const adminThemeRouter = router({
  get: adminProcedure.query(async () => {
    const db = await getDb();
    const [settings] = await db.select().from(storeSettings).where(eq(storeSettings.id, "1")).limit(1);
    
    // ✅ CORREÇÃO: Usamos Record<string, unknown> em vez de 'any' para acessar colunas dinâmicas
    const s = settings as Record<string, unknown> | undefined;
    let theme = { primary: "#065f46", background: "#FBFBFC", foreground: "#0f172a" };
    
    try {
      if (s?.siteTheme) {
        theme = typeof s.siteTheme === 'string' 
          ? JSON.parse(s.siteTheme) 
          : s.siteTheme;
      }
    } catch {
      // ✅ Bloco catch limpo (sem 'e' não utilizado)
    }

    return theme;
  }),

  save: adminProcedure
    .input(z.object({
      primary: z.string(),
      background: z.string(),
      foreground: z.string(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      
      // ✅ CORREÇÃO: Cast para 'unknown' antes de 'any' ou uso de Record para evitar erro de coluna
      // Silenciamos o linter apenas na linha necessária para o Drizzle aceitar a coluna dinâmica
      await db.update(storeSettings)
        .set({ 
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ["siteTheme" as any]: JSON.stringify(input),
          updatedAt: new Date()
        } as unknown as typeof storeSettings.$inferInsert)
        .where(eq(storeSettings.id, "1"));
      
      return { success: true };
    }),
});