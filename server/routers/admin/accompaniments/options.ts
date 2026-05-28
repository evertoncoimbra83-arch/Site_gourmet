import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { accompanimentOptions, groupToOptions } from "../../../../drizzle/schema/index.js";
import { getAccsWithNutrition } from "../../../../server/accompaniments.js";
import { adminProcedure, router } from "../../../../server/_core/trpc.js";
import { safeNumber } from "../../../lib/safe-parse.js";

type NewOption = typeof accompanimentOptions.$inferInsert;

const generateSlug = (text: string) =>
  text
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "-");

export const adminOptionsRouter = router({
  listAll: adminProcedure.query(async () => {
    return getAccsWithNutrition();
  }),

  upsert: adminProcedure
    .input(
      z
        .object({
          id: z.number().optional(),
          name: z.string().min(1, "O nome é obrigatório"),
          accompanimentCategoryId: z.number().nullable().optional(),
          energyKcal: z.unknown().optional(),
          energyKj: z.unknown().optional(),
          proteins: z.unknown().optional(),
          carbs: z.unknown().optional(),
          fatTotal: z.unknown().optional(),
          fatSaturated: z.unknown().optional(),
          fatTrans: z.unknown().optional(),
          fiber: z.unknown().optional(),
          sodium: z.unknown().optional(),
          calcium: z.unknown().optional(),
          iron: z.unknown().optional(),
          ingredients: z.string().optional().nullable(),
          composition: z.unknown().optional(),
          isActive: z.boolean().optional(),
          showNutrition: z.boolean().optional(),
          priceModifier: z.unknown().optional(),
        })
        .passthrough(),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, composition, ...data } = input;

      const toNum = (val: unknown) => {
        const normalized = typeof val === "string" ? val.replace(",", ".") : val;
        return safeNumber(normalized);
      };

      const toDec = (val: unknown) => {
        const normalized = typeof val === "string" ? val.replace(",", ".") : val;
        const parsed = safeNumber(normalized, Number.NaN);
        return Number.isFinite(parsed) ? parsed.toFixed(2) : "0.00";
      };

      const toRequiredDec = (val: unknown, label: string) => {
        const normalized = typeof val === "string" ? val.replace(",", ".") : val;
        const parsed = safeNumber(normalized, Number.NaN);
        if (!Number.isFinite(parsed)) {
          throw new TRPCError({ code: "BAD_REQUEST", message: `${label} inválido.` });
        }
        return parsed.toFixed(2);
      };

      const nutritionalInfoString =
        typeof composition === "string" ? composition : JSON.stringify(composition || []);

      const payload: NewOption = {
        name: data.name,
        slug: generateSlug(data.name),
        accompanimentCategoryId: data.accompanimentCategoryId,
        energyKcal: Math.round(toNum(data.energyKcal)),
        energyKj: toDec(data.energyKj),
        proteins: toDec(data.proteins),
        carbs: toDec(data.carbs),
        fatTotal: toDec(data.fatTotal),
        fatSaturated: toDec(data.fatSaturated),
        fatTrans: toDec(data.fatTrans),
        fiber: toDec(data.fiber),
        sodium: toDec(data.sodium),
        calcium: toDec(data.calcium),
        iron: toDec(data.iron),
        ingredients: data.ingredients || "",
        nutritionalInfo: nutritionalInfoString,
        isActive: data.isActive ?? true,
        showNutrition: data.showNutrition ?? false,
        priceModifier: toRequiredDec(data.priceModifier || 0, "Preço adicional"),
        updatedAt: new Date(),
      };

      if (id) {
        await ctx.db.update(accompanimentOptions).set(payload).where(eq(accompanimentOptions.id, id));

        return {
          success: true,
          id,
          message: `Acompanhamento "${data.name}" atualizado!`,
        };
      }

      const result = await ctx.db.insert(accompanimentOptions).values({
        ...payload,
        createdAt: new Date(),
      });
      const insertId = result[0]?.insertId;

      if (!insertId) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro operacional: Não foi possível gerar o identificador do registro.",
        });
      }

      return {
        success: true,
        id: insertId,
        message: `"${data.name}" adicionado aos acompanhamentos.`,
      };
    }),

  delete: adminProcedure
    .input(z.object({ id: z.number(), name: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.delete(groupToOptions).where(eq(groupToOptions.optionId, input.id));
      await ctx.db.delete(accompanimentOptions).where(eq(accompanimentOptions.id, input.id));

      return {
        success: true,
        message: input.name ? `"${input.name}" removido com sucesso.` : "Item excluído.",
      };
    }),
});
