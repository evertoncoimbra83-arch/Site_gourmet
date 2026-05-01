import { z } from "zod";
import { router, adminProcedure } from "../../../_core/trpc.js";
import { getDb } from "../../../db.js";
import { shippingZones, shippingSettings } from "../../../../drizzle/schema/index.js";
import { eq, asc, or, notLike, isNull, and, like } from "drizzle-orm";

const shippingRuleSchema = z.object({
  id: z.number().optional(), 
  name: z.string().min(1),
  price: z.coerce.number().min(0),
  active: z.boolean().default(true),
  type: z.enum(["zipcode", "polygon", "circle"]),
  cepStart: z.string().optional().nullable(),
  cepEnd: z.string().optional().nullable(),
  polygonCoords: z.string().optional().nullable(),
  storeSlug: z.string().optional().default("default"),
});

export const shippingRulesRouter = router({
  
  getSettings: adminProcedure.query(async () => {
    const db = await getDb();
    const [s] = await db.select().from(shippingSettings).limit(1);
    return s || { 
      pickupEnabled: false, 
      pickupLabel: "Retirada no Balcão", 
      pickupInstruction: "" 
    };
  }),

  updateSettings: adminProcedure
    .input(z.object({
      pickupEnabled: z.boolean().optional(),
      pickupLabel: z.string().optional(),
      pickupInstruction: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      const existing = await db.select().from(shippingSettings).limit(1);

      if (existing.length === 0) {
        await db.insert(shippingSettings).values({
          pickupEnabled: input.pickupEnabled ?? false,
          pickupLabel: input.pickupLabel ?? "Retirada no Balcão",
          pickupInstruction: input.pickupInstruction ?? "",
        });
      } else {
        await db.update(shippingSettings)
          .set({ ...input, updatedAt: new Date() })
          .where(eq(shippingSettings.id, existing[0].id));
      }
      return { success: true };
    }),

  /**
   * ✅ BUSCA REGRAS (Flexível: Loja Selecionada + Default)
   */
  getRules: adminProcedure
    .input(z.object({ storeSlug: z.string().optional().default("default") }))
    .query(async ({ input }) => {
      const db = await getDb();
      
      return await db.select({
        id: shippingZones.id,
        name: shippingZones.name,
        description: shippingZones.description,
        type: shippingZones.type,
        zipCodeStart: shippingZones.zipCodeStart,
        zipCodeEnd: shippingZones.zipCodeEnd,
        shippingCost: shippingZones.shippingCost,
        polygonCoords: shippingZones.polygonCoords,
        isActive: shippingZones.isActive,
        estimatedDays: shippingZones.estimatedDays,
        storeSlug: shippingZones.storeSlug,
      })
      .from(shippingZones)
      .where(
        and(
          // 🟢 Filtro de Unidade: Carrega a selecionada OU registros 'default'
          or(
            eq(shippingZones.storeSlug, input.storeSlug),
            eq(shippingZones.storeSlug, 'default'),
            isNull(shippingZones.storeSlug)
          ),
          // Filtro de Descrição: Evita poluir com CEPs individuais do radar
          or(
            eq(shippingZones.description, 'Regra Mestra'),
            isNull(shippingZones.description),
            notLike(shippingZones.description, 'via polígono:%')
          )
        )
      )
      .orderBy(asc(shippingZones.name));
    }),

  /**
   * ✅ UPSERT: Cria ou Atualiza
   */
  createRule: adminProcedure
    .input(shippingRuleSchema)
    .mutation(async ({ input }) => {
      const db = await getDb();
      
      const payload = {
        name: input.name,
        type: input.type,
        shippingCost: String(input.price), 
        isActive: input.active, 
        zipCodeStart: input.type === "zipcode" ? (input.cepStart || "00000000") : "00000000",
        zipCodeEnd: input.type === "zipcode" ? (input.cepEnd || "99999999") : "99999999",
        polygonCoords: input.polygonCoords,
        description: "Regra Mestra",
        storeSlug: input.storeSlug,
      };

      if (input.id) {
        await db.update(shippingZones)
          .set({ ...payload, updatedAt: new Date() })
          .where(eq(shippingZones.id, input.id));
      } else {
        await db.insert(shippingZones).values(payload);
      }
      
      return { success: true };
    }),

  deleteRule: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      
      const [rule] = await db.select()
        .from(shippingZones)
        .where(eq(shippingZones.id, input.id))
        .limit(1);
      
      if (!rule) return { success: false, error: "Regra não encontrada" };

      await db.delete(shippingZones).where(eq(shippingZones.id, input.id));
      await db.delete(shippingZones)
        .where(like(shippingZones.description, `via polígono: ${rule.name}%`));

      return { success: true };
    }),
});
