import { adminProcedure, router } from "../../_core/trpc";
import { z } from "zod";
import { getDb } from "../../db";
import { 
    dishComposition, 
    dishes 
} from "../../../drizzle/schema/index"; 
import { eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

// ✅ Definição de interface para os dados extras do item
interface IngredientNutritonDetails {
  fiber?: number | string;
  fatSaturated?: number | string;
  fatTrans?: number | string;
  calcium?: number | string;
  iron?: number | string;
}

export const dishCompositionRouter = router({
  
  /**
   * ✅ BUSCA A COMPOSIÇÃO
   */
  getComposition: adminProcedure
    .input(z.object({ 
      dishId: z.number().optional(), 
      accompanimentOptionId: z.number().optional() 
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      
      if (!input.dishId && !input.accompanimentOptionId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "É necessário informar dishId ou accompanimentOptionId."
        });
      }

      const whereClause = input.dishId 
        ? eq(dishComposition.dishId, input.dishId)
        : eq(dishComposition.accompanimentOptionId, input.accompanimentOptionId!);

      return await db
        .select()
        .from(dishComposition)
        .where(whereClause);
    }),

  /**
   * ✅ SALVA A COMPOSIÇÃO
   */
  save: adminProcedure
    .input(z.object({
      dishId: z.number().optional(),
      accompanimentOptionId: z.number().optional(),
      items: z.array(z.object({
        ingredientId: z.number(),
        quantity: z.number().or(z.string()),
        ingredientName: z.string().optional(),
        energyKcal: z.number().or(z.string()).optional(),
        proteins: z.number().or(z.string()).optional(),
        carbs: z.number().or(z.string()).optional(),
        fatTotal: z.number().or(z.string()).optional(),
        sodium: z.number().or(z.string()).optional(),
      }).passthrough()) 
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database offline" });
      
      return await db.transaction(async (tx) => {
        // 1. Limpeza seletiva
        if (input.dishId) {
          await tx.delete(dishComposition).where(eq(dishComposition.dishId, input.dishId));
        } else if (input.accompanimentOptionId) {
          await tx.delete(dishComposition).where(eq(dishComposition.accompanimentOptionId, input.accompanimentOptionId));
        }

        if (input.items.length === 0) {
            return { 
                success: true, 
                message: "Ficha técnica removida com sucesso." 
            };
        }

        // 2. Inicializa Acumuladores
        const totals = { kcal: 0, pro: 0, carb: 0, fat: 0, fib: 0, sod: 0 };
        const inserts = [];

        // 3. Loop de Inserção
        for (const item of input.items) {
            // ✅ Tipagem segura via cast para a interface definida
            const details = item as unknown as IngredientNutritonDetails;

            const qty = Number(item.quantity);
            const rowKcal = Number(item.energyKcal || 0);
            const rowPro  = Number(item.proteins || 0);
            const rowCarb = Number(item.carbs || 0);
            const rowFat  = Number(item.fatTotal || 0);
            const rowSod  = Number(item.sodium || 0);
            const rowFib  = Number(details.fiber || 0); // ✅ Resolvido

            if (input.dishId) {
                totals.kcal += rowKcal;
                totals.pro += rowPro;
                totals.carb += rowCarb;
                totals.fat += rowFat;
                totals.fib += rowFib;
                totals.sod += rowSod;
            }

            inserts.push({
                dishId: input.dishId || null,
                accompanimentOptionId: input.accompanimentOptionId || null,
                ingredientId: item.ingredientId,
                ingredientName: item.ingredientName || "Item",
                quantity: String(qty),
                energyKcal: String(rowKcal.toFixed(2)),
                proteins: String(rowPro.toFixed(3)),
                carbs: String(rowCarb.toFixed(3)),
                fatTotal: String(rowFat.toFixed(3)),
                sodium: String(rowSod.toFixed(2)),
                fiber: String(rowFib.toFixed(3)),
                fatSaturated: String(Number(details.fatSaturated || 0).toFixed(3)), // ✅ Resolvido
                fatTrans: String(Number(details.fatTrans || 0).toFixed(3)),         // ✅ Resolvido
                calcium: String(Number(details.calcium || 0).toFixed(2)),           // ✅ Resolvido
                iron: String(Number(details.iron || 0).toFixed(2)),                 // ✅ Resolvido
            });
        }

        // 4. Inserção em Batch
        if (inserts.length > 0) {
            await tx.insert(dishComposition).values(inserts);
        }

        // 5. Atualiza Cache no Prato Principal
        if (input.dishId) {
          await tx.update(dishes).set({
            energyKcal: String(totals.kcal.toFixed(2)),
            proteins: String(totals.pro.toFixed(2)),
            carbs: String(totals.carb.toFixed(2)),
            fatTotal: String(totals.fat.toFixed(2)),
            fiber: String(totals.fib.toFixed(2)),
            sodium: String(totals.sod.toFixed(2)),
            updatedAt: new Date()
          }).where(eq(dishes.id, input.dishId));
        }

        const target = input.dishId ? "do prato" : "do acompanhamento";
        return { 
          success: true, 
          message: `Ficha técnica salva! Valores nutricionais ${target} atualizados.` 
        };
      });
    })
});