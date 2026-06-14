import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import { eq, desc } from "drizzle-orm";
import { protectedProcedure } from "../../../../../server/_core/trpc.js";
import { getDb } from "../../../../../server/db.js";
import { prescriptionTemplates, accompanimentOptions, SnapshotMeal } from "../../../../../drizzle/schema/index.js";
import { safeJsonParse, safeNumber } from "../../../../../server/lib/safe-parse.js";

// ✅ Interfaces estritas para eliminar 'any'
interface MacroData {
  kcal?: number;
  energyKcal?: number;
  proteins?: number;
  protein?: number;
  carbs?: number;
  fatTotal?: number;
  fat?: number;
}

interface AccompanimentData {
  id: string | number;
  name: string;
  energyKcal?: number;
  proteins?: number;
  carbs?: number;
  fatTotal?: number;
  [key: string]: unknown;
}

interface BuilderOption {
  dishId: string | number;
  sizeId?: string | number | null;
  name: string;
  multiplier?: string | number;
  price?: number;
  priceAtCreation?: number;
  mainDishWeight?: number;
  macros?: MacroData;
  allowedAccompaniments?: AccompanimentData[];
  nutritionalData?: {
    sizeId?: number | null;
    mainDishWeight?: number;
    baseMacros?: MacroData;
    allowedAccompaniments?: AccompanimentData[];
  };
}

interface BuilderMeal {
  name?: string;
  mealName?: string;
  notes?: string;
  groups?: {
    name: string;
    options: BuilderOption[];
  }[];
}

// ✅ Helper para evitar NaN no Banco
const safeNum = (val: unknown, fallback: number = 0): number => {
  return safeNumber(val, fallback);
};

function countTemplateItemsFromMeals(meals: unknown): number {
  if (!Array.isArray(meals)) return 0;

  return meals.reduce((total, mealItem) => {
    const meal = mealItem as Record<string, unknown>;

    if (Array.isArray(meal.dishes)) return total + meal.dishes.length;
    if (Array.isArray(meal.items)) return total + meal.items.length;
    if (Array.isArray(meal.options)) return total + meal.options.length;

    if (Array.isArray(meal.groups)) {
      return total + meal.groups.reduce((groupTotal, groupItem) => {
        const group = groupItem as Record<string, unknown>;
        return groupTotal + (Array.isArray(group.options) ? group.options.length : 0);
      }, 0);
    }

    return total;
  }, 0);
}

export const templateProcedures = {
  /**
   * SALVA UM MODELO DE DIETA (TEMPLATE)
   */
  saveTemplate: protectedProcedure
    .input(z.object({
      id: z.string().optional().nullable(),
      name: z.string().min(3, "O nome precisa de ao menos 3 caracteres"),
      description: z.string().optional().nullable(),
      data: z.object({
        meals: z.array(z.unknown()),
        totalKcalTarget: z.number().optional(),
        technicalInsight: z.string().optional(),
        macros: z.record(z.string(), z.number()).optional()
      })
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      const mealsData = input.data.meals || [];
      
      const allDbAccs = await db.select().from(accompanimentOptions);

      const dietSnapshot: SnapshotMeal[] = mealsData.map((m, mIdx) => {
        const meal = m as BuilderMeal;
        const flattenedDishes = (meal.groups || []).flatMap((group) => 
          (group.options || []).map((opt) => {
            
            const rawMacros = opt.nutritionalData?.baseMacros || opt.macros || {};
            const tKcal = safeNum(rawMacros.kcal || rawMacros.energyKcal);
            const tProt = safeNum(rawMacros.protein || rawMacros.proteins);
            const tCarb = safeNum(rawMacros.carbs);
            const tFat = safeNum(rawMacros.fat || rawMacros.fatTotal);

            const selectedAccsRaw = opt.allowedAccompaniments || [];
            
            const enrichedAccs = selectedAccsRaw.map(acc => {
              const dbAcc = allDbAccs.find(a => Number(a.id) === Number(acc.id));
              return {
                ...acc,
                energyKcal: dbAcc?.energyKcal || 0,
                proteins: dbAcc?.proteins || 0,
                carbs: dbAcc?.carbs || 0,
                fatTotal: dbAcc?.fatTotal || 0,
              };
            });

            const safeSizeId = safeNum(opt.sizeId || opt.nutritionalData?.sizeId);

            return {
              dishId: safeNum(opt.dishId),
              sizeId: safeSizeId,
              name: opt.name,
              groupName: group.name,
              priceAtCreation: safeNum(opt.priceAtCreation || opt.price), 
              multiplier: String(opt.multiplier || "1.00"),
              nutritionalData: {
                sizeId: safeSizeId,
                mainDishWeight: safeNum(opt.mainDishWeight || opt.nutritionalData?.mainDishWeight),
                baseMacros: { kcal: tKcal, protein: tProt, carbs: tCarb, fat: tFat },
                allowedAccompaniments: enrichedAccs
              },
              allowedAccompaniments: enrichedAccs
            };
          })
        );

        return {
          mealName: meal.name || meal.mealName || "Refeição",
          order: mIdx,
          notes: meal.notes || "",
          dishes: flattenedDishes
        };
      });

      const values = {
        professionalId: ctx.user.id,
        name: input.name,
        description: input.description,
        totalKcalTarget: safeNum(input.data.totalKcalTarget),
        technicalInsight: input.data.technicalInsight || "",
        content: JSON.stringify(dietSnapshot), 
      };

      if (input.id && input.id !== "NEW") {
        await db.update(prescriptionTemplates)
          .set(values)
          .where(eq(prescriptionTemplates.id, input.id));
        
        return { success: true, id: input.id, action: "updated" };
      } else {
        const newId = uuidv4();
        await db.insert(prescriptionTemplates).values({
          id: newId,
          ...values
        });

        return { success: true, id: newId, action: "created" };
      }
    }),

  getMyTemplates: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    const results = await db.query.prescriptionTemplates.findMany({
      where: eq(prescriptionTemplates.professionalId, ctx.user.id),
      orderBy: [desc(prescriptionTemplates.createdAt)],
    });

    return results.map(t => {
      let parsedMeals: SnapshotMeal[] = [];
      try {
        parsedMeals = safeJsonParse<SnapshotMeal[]>(t.content, []);
      } catch {
        console.error(`🔴 Erro JSON no template ${t.id}`);
      }
      const itemsCount = countTemplateItemsFromMeals(parsedMeals);
      return { ...t, meals: parsedMeals, itemsCount, dishesCount: itemsCount };
    });
  }),

  deleteTemplate: protectedProcedure
    .input(z.object({ templateId: z.string() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      await db.delete(prescriptionTemplates).where(eq(prescriptionTemplates.id, input.templateId));
      return { success: true };
    }),
};
