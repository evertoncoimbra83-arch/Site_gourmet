// server/routers/admin/theme.ts

import { z } from "zod";
import { router, adminProcedure } from "../../_core/trpc.js";
import { getDb } from "../../db.js";
import { storeSettings } from "../../../drizzle/schema/index.js";
import { eq } from "drizzle-orm";

export const adminThemeRouter = router({
  get: adminProcedure.query(async () => {
    const db = await getDb();
    const [settings] = await db
      .select()
      .from(storeSettings)
      .where(eq(storeSettings.id, "1"))
      .limit(1);

    if (!settings?.siteTheme) return null;

    try {
      return typeof settings.siteTheme === 'string' 
        ? JSON.parse(settings.siteTheme) 
        : settings.siteTheme;
    } catch {
      return null;
    }
  }),

  // ✅ CORREÇÃO: Nomeado como 'save' e aceitando o objeto dinâmico do frontend
  save: adminProcedure
    .input(z.record(z.string(), z.any())) 
    .mutation(async ({ input }) => {
      const db = await getDb();
      
      await db.update(storeSettings)
        .set({ 
          siteTheme: input, 
          updatedAt: new Date() 
        }) 
        .where(eq(storeSettings.id, "1"));

      return { 
        success: true,
        message: "Identidade visual atualizada com sucesso!"
      };
    }),
});