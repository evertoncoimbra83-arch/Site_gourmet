import { router, publicProcedure, adminProcedure } from "../../_core/trpc.js";
import { z } from "zod";
import { getDb } from "../../db.js";
import { shippingRules, shippingSettings } from "../../../drizzle/schema/index.js"; 
import { eq, asc, and, gte, lte } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { logAction } from "../../db/lib/audit.js";

export const adminShippingRouter = router({
  
  // --- 🏪 CONFIGURAÇÕES DE RETIRADA (PICKUP) ---
  
  getSettings: adminProcedure.query(async () => {
    const db = await getDb();
    const settings = await db.select().from(shippingSettings).limit(1);
    
    if (settings.length === 0) {
      return { pickupEnabled: false, pickupLabel: "Retirada no Balcão", pickupInstruction: "" };
    }

    return {
      ...settings[0],
      pickupEnabled: Boolean(settings[0].pickupEnabled),
      pickupLabel: settings[0].pickupLabel || "Retirada no Balcão",
      pickupInstruction: settings[0].pickupInstruction || ""
    };
  }),

  updateSettings: adminProcedure
    .input(z.object({
      pickupEnabled: z.boolean(),
      pickupLabel: z.string().min(1),
      pickupInstruction: z.string().optional().nullable(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      const existing = await db.select().from(shippingSettings).limit(1);

      const data = {
        // ✅ CORREÇÃO: Passando boolean diretamente (o Drizzle converte para o driver)
        pickupEnabled: input.pickupEnabled, 
        pickupLabel: input.pickupLabel,
        pickupInstruction: input.pickupInstruction || ""
      };

      if (existing.length > 0) {
        await db.update(shippingSettings).set(data).where(eq(shippingSettings.id, existing[0].id));
      } else {
        await db.insert(shippingSettings).values({ id: 'default', ...data });
      }

      await logAction(ctx, "UPDATE_SHIPPING_SETTINGS", "shipping", { new: input });
      return { success: true };
    }),

  // --- 🚚 REGRAS DE ENTREGA ---

  getRules: adminProcedure.query(async () => {
    const db = await getDb();
    const rules = await db.select().from(shippingRules).orderBy(asc(shippingRules.name)); 
    
    return rules.map((rule) => ({
      ...rule,
      price: Number(rule.price || 0),
      active: Boolean(rule.active),
      startZipCode: rule.cepStart || "",
      endZipCode: rule.cepEnd || "",
      description: rule.name || ""
    }));
  }),

  upsertRule: adminProcedure
    .input(z.object({
      id: z.number().optional(),
      description: z.string().min(1),
      startZipCode: z.string().length(8),
      endZipCode: z.string().length(8),
      price: z.number().min(0),
      active: z.boolean().default(true)
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      
      const data = {
        name: input.description,
        type: 'zipcode' as const,
        cepStart: input.startZipCode.replace(/\D/g, ''),
        cepEnd: input.endZipCode.replace(/\D/g, ''),
        price: input.price.toString(),
        // ✅ CORREÇÃO: Usando boolean diretamente em vez de 1/0
        active: input.active 
      };

      try {
        if (input.id) {
          await db.update(shippingRules).set(data).where(eq(shippingRules.id, input.id));
          await logAction(ctx, "UPDATE_SHIPPING_RULE", "shipping", { entityId: String(input.id), new: data });
        } else {
          await db.insert(shippingRules).values(data);
          await logAction(ctx, "CREATE_SHIPPING_RULE", "shipping", { new: data });
        }
        return { success: true };
      } catch (error) {
        console.error("ERRO_UPSERT_SHIPPING:", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Falha ao salvar regra de frete." });
      }
    }),

  deleteRule: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      await db.delete(shippingRules).where(eq(shippingRules.id, input.id));
      await logAction(ctx, "DELETE_SHIPPING_RULE", "shipping", { entityId: String(input.id) });
      return { success: true };
    }),

  // --- 🧮 CÁLCULO PÚBLICO (CHECKOUT) ---

  calculate: publicProcedure
    .input(z.object({ 
      cep: z.string()
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      const cepClean = input.cep.replace(/\D/g, '').substring(0, 8);
      
      const [settings] = await db.select().from(shippingSettings).limit(1);
      
      const matchedRules = await db.select().from(shippingRules).where(
        and(
          // ✅ CORREÇÃO: Comparação usando boolean diretamente
          eq(shippingRules.active, true),
          eq(shippingRules.type, 'zipcode'),
          lte(shippingRules.cepStart, cepClean),
          gte(shippingRules.cepEnd, cepClean)
        )
      ).limit(1);

      return {
        pickup: settings ? {
          enabled: Boolean(settings.pickupEnabled),
          label: settings.pickupLabel,
          instruction: settings.pickupInstruction
        } : null,
        delivery: matchedRules.length > 0 ? {
            price: Number(matchedRules[0].price || 0),
            name: matchedRules[0].name
        } : null 
      };
    }),
});