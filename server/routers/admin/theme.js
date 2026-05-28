import { z } from "zod";
import { router, superAdminProcedure } from "../../_core/trpc.js";
import { getDb } from "../../db.js";
import { storeSettings } from "../../../drizzle/schema/index.js";
import { eq } from "drizzle-orm";
import { AuditLogService } from "../../services/AuditLogService.js";

export const adminThemeRouter = router({
  get: superAdminProcedure.query(async () => {
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
  save: superAdminProcedure
    .input(z.record(z.string(), z.any())) 
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      
      const [oldSettings] = await db
        .select()
        .from(storeSettings)
        .where(eq(storeSettings.id, "1"))
        .limit(1);
      
      const oldTheme = oldSettings?.siteTheme 
        ? (typeof oldSettings.siteTheme === 'string' ? JSON.parse(oldSettings.siteTheme) : oldSettings.siteTheme)
        : null;

      await db.update(storeSettings)
        .set({ 
          siteTheme: input, 
          updatedAt: new Date() 
        }) 
        .where(eq(storeSettings.id, "1"));

      const forwarded = ctx.req?.headers?.["x-forwarded-for"];
      const ipAddress = ctx.req?.ip || (typeof forwarded === "string" ? forwarded.split(",")[0]?.trim() : null) || "127.0.0.1";
      const actor = {
        userId: ctx.user?.id,
        ipAddress: ipAddress,
        userAgent: ctx.req?.headers?.["user-agent"] || "unknown",
        requestId: ctx.req?.requestId
      };

      void AuditLogService.record({
        actor,
        module: "theme",
        action: "SAVE_THEME",
        severity: "warning",
        entityType: "theme",
        entityId: "1",
        entityLabel: "Tema da Marca",
        oldValues: oldTheme,
        newValues: input
      });

      return { 
        success: true,
        message: "Identidade visual atualizada com sucesso!"
      };
    }),
});
