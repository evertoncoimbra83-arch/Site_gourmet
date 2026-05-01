// server/routers/storefront/nutri/procedures/prescription.ts
import { z } from "zod";
import { protectedProcedure } from "../../../../../server/_core/trpc.js";
import { getDb } from "../../../../../server/db.js";
import { 
  dishes, categories, dishesToSizes, 
  nutriProfiles, dishSizes, sizeAccompanimentGroups, 
  accompanimentGroups, groupToOptions, accompanimentOptions,
  prescriptions,
  prescriptionItems,
  // ✅ IMPORTAÇÃO DO TIPO ESTRITO DO DRIZZLE
  type SnapshotMeal as DbSnapshotMeal 
} from "../../../../../drizzle/schema/index.js";
import { eq, desc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { v4 as uuidv4 } from "uuid";
import { safeJsonParse, safeNumber } from "../../../../../server/lib/safe-parse.js";

// --- INTERFACES ESTRITAS PARA ELIMINAR O 'ANY' NO FRONTEND ---

interface BaseMacros {
  kcal?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
}

interface AccompanimentItem {
  id?: number | string;
  name?: string;
  weight?: number | string;
  energyKcal?: string | number;
  proteins?: string | number;
  carbs?: string | number;
  fatTotal?: string | number;
  [key: string]: unknown;
}

// Interface local usada apenas para leitura e retornos ao React
interface LocalSnapshotDish {
  dishId: number;
  sizeId: number;
  name: string;
  priceAtCreation: number;
  multiplier: string | number;
  nutritionalData: unknown;
  allowedAccompaniments: unknown;
}

interface LocalSnapshotMeal {
  mealName: string;
  order: number;
  notes?: string;
  dishes: LocalSnapshotDish[];
}

interface IncomingOption {
  dishId: string | number;
  sizeId: string | number;
  name: string;
  price?: number;
  priceAtCreation?: number;
  multiplier?: string | number;
  nutritionalData?: {
    baseMacros?: BaseMacros;
    mainDishWeight?: number;
  };
  macros?: BaseMacros;
  allowedAccompaniments?: AccompanimentItem[];
}

interface IncomingMeal {
  name: string;
  mealName?: string;
  notes?: string;
  groups?: Array<{ name: string; options: IncomingOption[] }>;
  dishes?: IncomingOption[];
}

interface IncomingPrescription {
  id?: string; 
  planName: string;
  technicalInsight?: string;
  totalKcalTarget?: number;
  discountPercentage?: number;
  meals: IncomingMeal[];
}

// ✅ HELPER PARA EVITAR O ERRO 'NaN' NO BANCO
const safeNum = (val: unknown, fallback: number = 0): number => {
  return safeNumber(val, fallback);
};

export const prescriptionProcedures = {
  /**
   * BUSCA CATÁLOGO COMPLETO (Builder)
   */
  getAvailableCatalog: protectedProcedure.query(async () => {
    const db = await getDb();
    
    const allDishes = await db
      .select({
        id: dishes.id,
        name: dishes.name,
        imageUrl: dishes.imageUrl,
        categoryName: categories.name,
        energyKcal: dishes.energyKcal,
        proteins: dishes.proteins,
        carbs: dishes.carbs,
        fatTotal: dishes.fatTotal,
        base_price: dishes.basePrice, 
      })
      .from(dishes)
      .leftJoin(categories, eq(dishes.categoryId, categories.id))
      .where(eq(dishes.isActive, true));

    const sizesWithGroups = await db
      .select({
        dishId: dishesToSizes.dishId,
        sizeId: dishSizes.id,
        sizeName: dishSizes.name,
        weight: dishSizes.weight,
        mainDishWeight: dishSizes.mainDishWeight,
        price_modifier: dishSizes.priceModifier,
        groupId: accompanimentGroups.id,
        groupName: accompanimentGroups.name,
        maxSelections: accompanimentGroups.maxSelections,
      })
      .from(dishSizes)
      .innerJoin(dishesToSizes, eq(dishSizes.id, dishesToSizes.sizeId))
      .leftJoin(sizeAccompanimentGroups, eq(dishSizes.id, sizeAccompanimentGroups.sizeId))
      .leftJoin(accompanimentGroups, eq(sizeAccompanimentGroups.accompanimentGroupId, accompanimentGroups.id))
      .where(eq(dishSizes.isActive, true));

    const allOptions = await db
      .select({
        optionId: accompanimentOptions.id,
        optionName: accompanimentOptions.name,
        groupId: groupToOptions.groupId,
        energyKcal: accompanimentOptions.energyKcal,
        proteins: accompanimentOptions.proteins,
        carbs: accompanimentOptions.carbs,
        fatTotal: accompanimentOptions.fatTotal,
      })
      .from(accompanimentOptions)
      .innerJoin(groupToOptions, eq(accompanimentOptions.id, groupToOptions.optionId))
      .where(eq(accompanimentOptions.isActive, true));

    return allDishes.map(dish => {
      const dishSizesRaw = sizesWithGroups.filter(s => s.dishId === dish.id);
      const uniqueSizeIds = Array.from(new Set(dishSizesRaw.map(s => s.sizeId)));
      
      const availableSizes = uniqueSizeIds.map(sId => {
        const sizeInfo = dishSizesRaw.find(s => s.sizeId === sId)!;
        return {
          id: sizeInfo.sizeId,
          name: sizeInfo.sizeName,
          weight: sizeInfo.weight,
          mainDishWeight: sizeInfo.mainDishWeight,
          price_modifier: sizeInfo.price_modifier || "1.00",
          accompanimentGroups: dishSizesRaw
            .filter(s => s.sizeId === sId && s.groupId)
            .map(g => ({
              id: g.groupId,
              name: g.groupName,
              maxSelections: g.maxSelections,
              options: allOptions
                .filter(opt => opt.groupId === g.groupId)
                .map(opt => ({ 
                  id: opt.optionId, 
                  name: opt.optionName,
                  energyKcal: opt.energyKcal,
                  proteins: opt.proteins,
                  carbs: opt.carbs,
                  fatTotal: opt.fatTotal
                }))
            }))
        };
      });

      return { ...dish, availableSizes };
    });
  }),

  /**
   * BUSCA TODOS OS ACOMPANHAMENTOS (Builder)
   */
  getAvailableAccompaniments: protectedProcedure.query(async () => {
    const db = await getDb();
    return await db
      .select({
        id: accompanimentOptions.id,
        name: accompanimentOptions.name,
        energyKcal: accompanimentOptions.energyKcal,
        proteins: accompanimentOptions.proteins,
        carbs: accompanimentOptions.carbs,
        fatTotal: accompanimentOptions.fatTotal,
      })
      .from(accompanimentOptions)
      .where(eq(accompanimentOptions.isActive, true));
  }),

  /**
   * ATRIBUI A PRESCRIÇÃO AO CLIENTE
   */
  assignPrescription: protectedProcedure
    .input(z.object({ 
      clientId: z.string(), 
      prescription: z.custom<IncomingPrescription>() 
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      const { clientId, prescription } = input;
      
      const profile = await db.query.nutriProfiles.findFirst({ 
        where: eq(nutriProfiles.userId, ctx.user.id) 
      });

      if (!profile) throw new TRPCError({ code: "UNAUTHORIZED", message: "Perfil Nutri não encontrado." });

      const allDbAccs = await db.select().from(accompanimentOptions);

      return await db.transaction(async (tx) => {
        let pId = prescription.id;
        const typedDietSnapshot: DbSnapshotMeal[] = prescription.meals.map((meal, mealIndex) => {
          const mealOptions = meal.dishes || meal.groups?.flatMap((group) => group.options) || [];

          return {
            mealName: meal.name || meal.mealName || "",
            order: mealIndex,
            notes: meal.notes,
            dishes: mealOptions.map((dish) => ({
              dishId: safeNum(dish.dishId),
              sizeId: safeNum(dish.sizeId),
              name: String(dish.name),
              priceAtCreation: safeNum(dish.priceAtCreation ?? dish.price),
              multiplier: dish.multiplier ?? 1,
              nutritionalData: {
                mainDishWeight: safeNum(dish.nutritionalData?.mainDishWeight),
                baseMacros: {
                  kcal: safeNum(dish.nutritionalData?.baseMacros?.kcal),
                  protein: safeNum(dish.nutritionalData?.baseMacros?.protein),
                  carbs: safeNum(dish.nutritionalData?.baseMacros?.carbs),
                  fat: safeNum(dish.nutritionalData?.baseMacros?.fat),
                },
              },
            })),
          };
        });

        // 2. Capa da Prescrição
        if (pId && pId !== "NEW") {
          await tx.update(prescriptions)
            .set({
              planName: prescription.planName || "Plano Alimentar",
              technicalInsight: prescription.technicalInsight || "",
              totalKcalTarget: safeNum(prescription.totalKcalTarget),
              dietSnapshot: typedDietSnapshot, 
              updatedAt: new Date(),
            })
            .where(eq(prescriptions.id, pId));
        } else {
          pId = uuidv4();
          await tx.insert(prescriptions).values({
            id: pId,
            clientId: clientId,
            professionalId: profile.id,
            planName: prescription.planName || "Plano Alimentar",
            technicalInsight: prescription.technicalInsight || "",
            totalKcalTarget: safeNum(prescription.totalKcalTarget), 
            discountPercentage: safeNum(profile.discountPercentage), 
            dietSnapshot: typedDietSnapshot,
            status: 'active'
          });
        }

        // 3. Limpeza dos Itens Espelhos Anteriores
        await tx.delete(prescriptionItems).where(eq(prescriptionItems.prescriptionId, pId!));

        // 4. Mapeamento e Inserção dos Itens com Cálculo de Macros
        const itemsToInsert = prescription.meals.flatMap((meal, mIdx) => {
          const dishesInMeal = meal.groups?.flatMap(g => g.options) || meal.dishes || [];
          
          return dishesInMeal.map(dish => {
            const baseMacros: BaseMacros = dish.nutritionalData?.baseMacros || dish.macros || { kcal: 0, protein: 0, carbs: 0, fat: 0 };
            
            let totalKcal = safeNum(baseMacros.kcal);
            let totalProtein = safeNum(baseMacros.protein);
            let totalCarbs = safeNum(baseMacros.carbs);
            let totalFat = safeNum(baseMacros.fat);

            const selectedAccsRaw: AccompanimentItem[] = dish.allowedAccompaniments || [];
            
            const enrichedAccs = selectedAccsRaw.map(acc => {
              const dbAcc = allDbAccs.find(a => Number(a.id) === Number(acc.id));
              
              if (dbAcc) {
                totalKcal += safeNum(dbAcc.energyKcal);
                totalProtein += safeNum(dbAcc.proteins);
                totalCarbs += safeNum(dbAcc.carbs);
                totalFat += safeNum(dbAcc.fatTotal);
              }

              return {
                ...acc,
                energyKcal: dbAcc?.energyKcal || 0,
                proteins: dbAcc?.proteins || 0,
                carbs: dbAcc?.carbs || 0,
                fatTotal: dbAcc?.fatTotal || 0,
              };
            });

            const finalMacros = {
              kcal: totalKcal,
              protein: totalProtein,
              carbs: totalCarbs,
              fat: totalFat
            };

            return {
              id: uuidv4(),
              prescriptionId: pId!,
              dishId: safeNum(dish.dishId), 
              sizeId: safeNum(dish.sizeId),
              dishName: dish.name || "Prato",
              mealName: meal.name || meal.mealName || `Refeição ${mIdx + 1}`,
              order: mIdx,
              fixedPrice: String(safeNum(dish.priceAtCreation || dish.price)),
              multiplier: String(safeNum(dish.multiplier, 1)),
              accompanimentsJson: JSON.stringify(enrichedAccs), 
              macrosJson: JSON.stringify(finalMacros), 
            };
          });
        });

        if (itemsToInsert.length > 0) {
          await tx.insert(prescriptionItems).values(itemsToInsert);
        }

        return { success: true, id: pId };
      });
    }),

  /**
   * DASHBOARD DO PACIENTE (Leitura via Itens Espelho)
   */
  getDashboard: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    const allPrescs = await db.select().from(prescriptions).where(eq(prescriptions.clientId, ctx.user.id)).orderBy(desc(prescriptions.updatedAt));
    if (!allPrescs.length) return [];

    return await Promise.all(allPrescs.map(async (presc) => {
      const items = await db.select().from(prescriptionItems).where(eq(prescriptionItems.prescriptionId, presc.id)).orderBy(prescriptionItems.order);
      const mealMap = new Map<string, LocalSnapshotMeal>();

      items.forEach(item => {
        const mName = item.mealName;
        if (!mealMap.has(mName)) {
          mealMap.set(mName, { mealName: mName, order: item.order ?? 0, dishes: [] });
        }

        const accs = safeJsonParse<AccompanimentItem[]>(item.accompanimentsJson, []);
        const macros = safeJsonParse<BaseMacros>(item.macrosJson, {});

        mealMap.get(mName)!.dishes.push({
          dishId: item.dishId,
          sizeId: item.sizeId,
          name: item.dishName || "Prato",
          priceAtCreation: safeNumber(item.fixedPrice),
          multiplier: item.multiplier || "1.00",
          allowedAccompaniments: accs, 
          nutritionalData: { 
            baseMacros: macros, 
            allowedAccompaniments: accs 
          },
        });
      });
      return { ...presc, meals: Array.from(mealMap.values()) };
    }));
  }),

  /**
   * APAGAR PRESCRIÇÃO
   */
  deletePrescription: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      await db.delete(prescriptions).where(eq(prescriptions.id, input.id));
      return { success: true };
    }),

  /**
   * DETALHES DA PRESCRIÇÃO
   */
  getPrescriptionDetails: protectedProcedure
    .input(z.object({ clientId: z.string(), prescriptionId: z.string().optional() }))
    .query(async ({ input }) => {
      const db = await getDb();
      const queryWhere = input.prescriptionId 
        ? eq(prescriptions.id, input.prescriptionId)
        : eq(prescriptions.clientId, input.clientId);

      const allPrescs = await db.select().from(prescriptions).where(queryWhere).orderBy(desc(prescriptions.createdAt));
      
      return Promise.all(allPrescs.map(async (presc) => {
        const items = await db.select().from(prescriptionItems).where(eq(prescriptionItems.prescriptionId, presc.id));
        
        const mealMap = new Map<string, { mealName: string; order: number; groups: { name: string; options: Record<string, unknown>[] }[] }>();
        
        items.forEach(item => {
          if (!mealMap.has(item.mealName)) {
            mealMap.set(item.mealName, { 
              mealName: item.mealName, 
              order: item.order ?? 0, 
              groups: [{ name: "Opções da Semana", options: [] }] 
            });
          }

          const accs = safeJsonParse<AccompanimentItem[]>(item.accompanimentsJson, []);
          const macros = safeJsonParse<BaseMacros>(item.macrosJson, {});

          mealMap.get(item.mealName)!.groups[0].options.push({
            ...item,
            dishId: item.dishId,
            name: item.dishName,
            priceAtCreation: safeNumber(item.fixedPrice),
            multiplier: item.multiplier,
            allowedAccompaniments: accs,
            nutritionalData: { baseMacros: macros, allowedAccompaniments: accs }
          });
        });
        return { ...presc, meals: Array.from(mealMap.values()) };
      }));
    }),
};
