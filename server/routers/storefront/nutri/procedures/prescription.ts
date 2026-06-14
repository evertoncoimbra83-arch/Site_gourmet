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
  professionalClients,
  users,
  type SnapshotMeal as DbSnapshotMeal
} from "../../../../../drizzle/schema/index.js";
import { and, eq, desc, inArray } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { v4 as uuidv4 } from "uuid";
import {
  safeJsonParse,
  safeJsonStringifyForDb,
  safeNumber,
  safeString,
} from "../../../../../server/lib/safe-parse.js";
import { calculateMealNutritionCanonical } from "../../../../../shared/domain/nutrition/nutrition.js";

// --- INTERFACES ESTRITAS ---

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
  isNoAccompaniment?: boolean;
  is_no_accompaniment?: boolean;
  [key: string]: unknown;
}

interface LocalSnapshotDish {
  dishId: number;
  sizeId: number;
  name: string;
  sizeName?: string | null;
  weight?: string | number | null;
  sizeWeight?: string | number | null;
  mainDishWeight?: number | null;
  noAccompanimentsMessage?: string | null;
  priceAtCreation: number;
  multiplier: string | number;
  nutritionalData: {
    mainDishWeight?: number;
    baseMacros?: BaseMacros;
    [key: string]: unknown;
  } | unknown;
  allowedAccompaniments: unknown;
}

interface LocalSnapshotMeal {
  mealName: string;
  order: number;
  notes?: string;
  dishes: LocalSnapshotDish[];
}

interface DashboardPrescriptionDish extends LocalSnapshotDish {
  id: string;
  prescriptionId: string;
  prescriptionItemId: string;
  source: "prescription";
  fixedPrice: number;
  discountPercentage: number;
  selectedAccompaniments: AccompanimentItem[];
  accompanimentGroups: Array<Record<string, unknown>>;
  groups: Array<Record<string, unknown>>;
  legacySizeMissing: boolean;
  appliedNutrition: BaseMacros;
}

interface IncomingOption {
  dishId: string | number;
  sizeId: string | number;
  name: string;
  price?: number;
  priceAtCreation?: number;
  multiplier?: string | number;
  sizeName?: string | null;
  weight?: string | number | null;
  sizeWeight?: string | number | null;
  mainDishWeight?: number | null;
  noAccompanimentsMessage?: string | null;
  nutritionalData?: {
    baseMacros?: BaseMacros;
    mainDishWeight?: number;
    recipeWeight?: number | string;
    sizeId?: string | number | null;
    sizeName?: string | null;
    weight?: string | number | null;
    sizeWeight?: string | number | null;
    noAccompanimentsMessage?: string | null;
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

const safeNum = (val: unknown, fallback: number = 0): number => {
  return safeNumber(val, fallback);
};

const DIET_SNAPSHOT_FALLBACK = {
  items: [],
  meals: [],
  source: "nutri",
  version: 1,
};

const safeTextOrNull = (value: unknown): string | null => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
};

const safeWeightOrNull = (value: unknown): string | number | null => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) return value;
  return null;
};

const collectUnsafeJsonKinds = (
  value: unknown,
  path = "$",
  seen = new WeakSet<object>(),
  issues: string[] = [],
): string[] => {
  if (value === undefined) {
    issues.push(`${path}:undefined`);
    return issues;
  }

  if (typeof value === "number" && !Number.isFinite(value)) {
    issues.push(`${path}:${Number.isNaN(value) ? "NaN" : "Infinity"}`);
    return issues;
  }

  if (typeof value === "bigint") {
    issues.push(`${path}:BigInt`);
    return issues;
  }

  if (value === null || typeof value !== "object") return issues;
  if (seen.has(value)) {
    issues.push(`${path}:circular`);
    return issues;
  }

  seen.add(value);

  if (Array.isArray(value)) {
    value.forEach((item, index) =>
      collectUnsafeJsonKinds(item, `${path}[${index}]`, seen, issues),
    );
    return issues;
  }

  Object.entries(value).forEach(([key, item]) =>
    collectUnsafeJsonKinds(item, `${path}.${key}`, seen, issues),
  );

  return issues;
};

const logDietSnapshotDiagnostics = (
  value: unknown,
  jsonString: string,
  context: { mealCount: number; dishCount: number },
) => {
  if (process.env.NODE_ENV === "production") return;

  let stringifyError: string | null = null;
  try {
    JSON.stringify(value);
  } catch (error) {
    stringifyError = error instanceof Error ? error.message : String(error);
  }

  const unsafeKinds = collectUnsafeJsonKinds(value).slice(0, 20);

  console.warn("[nutri.assignPrescription] dietSnapshot serialization", {
    type: typeof value,
    isArray: Array.isArray(value),
    stringifyError,
    unsafeKinds,
    jsonLength: jsonString.length,
    mealCount: context.mealCount,
    dishCount: context.dishCount,
  });
};

type DbType = Awaited<ReturnType<typeof getDb>>;

async function getCurrentNutriProfile(db: DbType, userId: string) {
  const profile = await db.query.nutriProfiles.findFirst({
    where: eq(nutriProfiles.userId, userId),
  });

  if (!profile) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Perfil Nutri não encontrado." });
  }

  return profile;
}

async function assertClientBelongsToProfile(
  db: DbType,
  profile: typeof nutriProfiles.$inferSelect,
  clientId: string,
) {
  const referralCode = profile.referralCode?.trim();
  if (!referralCode) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Perfil profissional sem código de vínculo ativo.",
    });
  }

  const [client] = await db
    .select({ id: users.id })
    .from(professionalClients)
    .innerJoin(users, eq(professionalClients.clientId, users.id))
    .where(and(
      eq(professionalClients.professionalId, profile.id),
      eq(professionalClients.clientId, clientId),
      eq(professionalClients.status, "active"),
    ))
    .limit(1);

  if (client) return;

  const [legacyClient] = await db
    .select({ id: users.id })
    .from(users)
    .where(and(eq(users.id, clientId), eq(users.referralCode, referralCode)))
    .limit(1);

  if (legacyClient) {
    await db.insert(professionalClients).values({
      id: uuidv4(),
      professionalId: profile.id,
      clientId,
      status: "active",
    });
    return;
  }

  if (!client) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Paciente não vinculado a este nutricionista.",
    });
  }
}

async function assertPrescriptionBelongsToProfile(
  db: DbType,
  profileId: string,
  prescriptionId: string,
  clientId?: string,
) {
  const [prescription] = await db
    .select()
    .from(prescriptions)
    .where(
      and(
        eq(prescriptions.id, prescriptionId),
        eq(prescriptions.professionalId, profileId),
        clientId ? eq(prescriptions.clientId, clientId) : undefined,
      ),
    )
    .limit(1);

  if (!prescription) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Prescrição não pertence a este nutricionista.",
    });
  }

  return prescription;
}

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
        noAccompanimentsMessage: dishSizes.noAccompanimentsMessage,
        price: dishSizes.price,
        price_modifier: dishSizes.priceModifier,
        displayOrder: dishSizes.displayOrder,
        groupId: accompanimentGroups.id,
        groupName: accompanimentGroups.name,
        defaultGrammage: accompanimentGroups.defaultGrammage,
        minSelections: sizeAccompanimentGroups.minSelections,
        maxSelections: sizeAccompanimentGroups.maxSelections,
        groupMinSelections: accompanimentGroups.minSelections,
        groupMaxSelections: accompanimentGroups.maxSelections,
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
        isNoAccompaniment: accompanimentOptions.isNoAccompaniment,
      })
      .from(accompanimentOptions)
      .innerJoin(groupToOptions, eq(accompanimentOptions.id, groupToOptions.optionId))
      .where(eq(accompanimentOptions.isActive, true));

    return allDishes.map(dish => {
      const dishSizesRaw = sizesWithGroups.filter(s => s.dishId === dish.id);
      const uniqueSizeIds = Array.from(new Set(dishSizesRaw.map(s => s.sizeId)));

      const availableSizes = uniqueSizeIds.map(sId => {
        const sizeInfo = dishSizesRaw.find(s => s.sizeId === sId)!;
        const groups = dishSizesRaw
          .filter(s => s.sizeId === sId && s.groupId)
          .map(g => ({
            id: g.groupId,
            name: g.groupName,
            defaultGrammage: g.defaultGrammage,
            minSelections: g.minSelections ?? g.groupMinSelections ?? null,
            maxSelections: g.maxSelections ?? g.groupMaxSelections ?? null,
            isRequired: Number(g.minSelections ?? g.groupMinSelections ?? 0) > 0,
            options: allOptions
              .filter(opt => opt.groupId === g.groupId)
              .map(opt => ({
                id: opt.optionId,
                name: opt.optionName,
                energyKcal: opt.energyKcal,
                proteins: opt.proteins,
                carbs: opt.carbs,
                fatTotal: opt.fatTotal,
                isActive: true,
                isNoAccompaniment: opt.isNoAccompaniment,
                is_no_accompaniment: opt.isNoAccompaniment,
              }))
          }));

        return {
          id: sizeInfo.sizeId,
          name: sizeInfo.sizeName,
          weight: sizeInfo.weight,
          mainDishWeight: sizeInfo.mainDishWeight,
          noAccompanimentsMessage: sizeInfo.noAccompanimentsMessage,
          price: sizeInfo.price,
          price_modifier: sizeInfo.price_modifier || "1.00",
          displayOrder: sizeInfo.displayOrder,
          groups,
          accompanimentGroups: groups,
        };
      }).sort((a, b) => Number(a.displayOrder || 0) - Number(b.displayOrder || 0));

      return { ...dish, availableSizes, sizes: availableSizes };
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
        isNoAccompaniment: accompanimentOptions.isNoAccompaniment,
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

      const profile = await getCurrentNutriProfile(db, ctx.user.id);
      await assertClientBelongsToProfile(db, profile, clientId);

      if (prescription.id && prescription.id !== "NEW") {
        await assertPrescriptionBelongsToProfile(db, profile.id, prescription.id, clientId);
      }

      const prescriptionMeals = Array.isArray(prescription.meals)
        ? prescription.meals
        : [];

      const allDbAccs = await db.select().from(accompanimentOptions);

      // Buscar todos os tamanhos e seus grupos de acompanhamentos no catálogo ativo
      const sizeIds = Array.from(
        new Set(
          prescriptionMeals
            .flatMap((meal) => meal.dishes || meal.groups?.flatMap((g) => g.options) || [])
            .map((d) => safeNum(d.sizeId))
            .filter(Boolean),
        ),
      );

      const catalogGroups = sizeIds.length > 0
        ? await db
            .select({
              sizeId: dishSizes.id,
              groupId: accompanimentGroups.id,
              groupName: accompanimentGroups.name,
              defaultGrammage: accompanimentGroups.defaultGrammage,
              minSelections: sizeAccompanimentGroups.minSelections,
              maxSelections: sizeAccompanimentGroups.maxSelections,
              groupMinSelections: accompanimentGroups.minSelections,
              groupMaxSelections: accompanimentGroups.maxSelections,
            })
            .from(dishSizes)
            .leftJoin(sizeAccompanimentGroups, eq(dishSizes.id, sizeAccompanimentGroups.sizeId))
            .leftJoin(accompanimentGroups, eq(sizeAccompanimentGroups.accompanimentGroupId, accompanimentGroups.id))
            .where(inArray(dishSizes.id, sizeIds))
        : [];

      const activeGroupIds = catalogGroups.map(g => g.groupId).filter(Boolean) as number[];
      const groupOptions = activeGroupIds.length > 0
        ? await db
            .select({
              groupId: groupToOptions.groupId,
              optionId: groupToOptions.optionId,
            })
            .from(groupToOptions)
            .where(inArray(groupToOptions.groupId, activeGroupIds))
        : [];

      try {
        return await db.transaction(async (tx) => {
          let pId = prescription.id;
          const typedDietSnapshot: DbSnapshotMeal[] = prescriptionMeals.map((meal, mealIndex) => {
            const mealOptions = meal.dishes || meal.groups?.flatMap((group) => group.options) || [];

            return {
              mealName: safeString(meal.name || meal.mealName, `Refeição ${mealIndex + 1}`),
              order: mealIndex,
              notes: safeString(meal.notes, ""),
              dishes: mealOptions.map((dish) => ({
                dishId: safeNum(dish.dishId),
                sizeId: safeNum(dish.sizeId),
                name: safeString(dish.name, "Prato"),
                sizeName: dish.sizeName
                  ? safeTextOrNull(dish.sizeName)
                  : safeTextOrNull(dish.nutritionalData?.sizeName),
                weight: safeWeightOrNull(
                  dish.weight ?? dish.sizeWeight ?? dish.nutritionalData?.weight,
                ),
                sizeWeight: dish.sizeWeight
                  ? safeWeightOrNull(dish.sizeWeight)
                  : safeWeightOrNull(dish.weight ?? dish.nutritionalData?.sizeWeight),
                mainDishWeight: safeNum(
                  dish.mainDishWeight ?? dish.nutritionalData?.mainDishWeight,
                ),
                noAccompanimentsMessage: safeTextOrNull(
                  dish.noAccompanimentsMessage ??
                  dish.nutritionalData?.noAccompanimentsMessage,
                ),
                priceAtCreation: safeNum(dish.priceAtCreation ?? dish.price),
                multiplier: safeNum(dish.multiplier, 1),
                nutritionalData: {
                  sizeId: safeNum(dish.sizeId),
                  sizeName: dish.sizeName
                    ? safeTextOrNull(dish.sizeName)
                    : safeTextOrNull(dish.nutritionalData?.sizeName),
                  weight: safeWeightOrNull(
                    dish.weight ?? dish.sizeWeight ?? dish.nutritionalData?.weight,
                  ),
                  sizeWeight: dish.sizeWeight
                    ? safeWeightOrNull(dish.sizeWeight)
                    : safeWeightOrNull(dish.weight ?? dish.nutritionalData?.sizeWeight),
                  mainDishWeight: safeNum(
                    dish.mainDishWeight ?? dish.nutritionalData?.mainDishWeight,
                  ),
                  noAccompanimentsMessage: safeTextOrNull(
                    dish.noAccompanimentsMessage ??
                    dish.nutritionalData?.noAccompanimentsMessage,
                  ),
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

          const dietSnapshotJson = safeJsonStringifyForDb(
            typedDietSnapshot,
            DIET_SNAPSHOT_FALLBACK,
          );
          const dishCount = typedDietSnapshot.reduce(
            (total, meal) => total + meal.dishes.length,
            0,
          );

          logDietSnapshotDiagnostics(typedDietSnapshot, dietSnapshotJson, {
            mealCount: typedDietSnapshot.length,
            dishCount,
          });

          if (pId && pId !== "NEW") {
            await tx.update(prescriptions)
              .set({
                planName: prescription.planName || "Plano Alimentar",
                technicalInsight: prescription.technicalInsight || "",
                totalKcalTarget: safeNum(prescription.totalKcalTarget),
                dietSnapshot: dietSnapshotJson as any,
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
              dietSnapshot: dietSnapshotJson as any,
              status: 'active'
            });
          }

          await tx.delete(prescriptionItems).where(eq(prescriptionItems.prescriptionId, pId!));

          const itemsToInsert = prescriptionMeals.flatMap((meal, mIdx) => {
            const dishesInMeal = meal.groups?.flatMap(g => g.options) || meal.dishes || [];

            return dishesInMeal.map(dish => {
              const selectedAccsRaw: AccompanimentItem[] = Array.isArray(
                dish.allowedAccompaniments,
              )
                ? dish.allowedAccompaniments
                : [];

              const enrichedAccs = selectedAccsRaw.map(acc => {
                const dbAcc = allDbAccs.find(a => Number(a.id) === Number(acc.id));
                const raw = acc as Record<string, unknown>;
                const legacyGroupId = raw.groupId ?? raw.sourceGroupId ?? null;

                const catalogGroup = catalogGroups.find(
                  (cg) =>
                    Number(cg.sizeId) === Number(dish.sizeId) &&
                    cg.groupId &&
                    ((legacyGroupId !== null && String(cg.groupId) === String(legacyGroupId)) ||
                      groupOptions.some(
                        (go) =>
                          Number(go.groupId) === Number(cg.groupId) &&
                          Number(go.optionId) === Number(acc.id),
                      )),
                );

                // ✅ P0 FIX: Normalizar legado sourceGroupId → groupId
                const normalizedGroupId = catalogGroup?.groupId ?? raw.groupId ?? raw.sourceGroupId ?? null;
                const normalizedGroupName = catalogGroup?.groupName ?? raw.groupName ?? raw.sourceGroupName ?? null;
                // defaultGrammage do acompanhamento — nunca usa mainDishWeight ou sizeWeight
                const normalizedDefaultGrammage = safeNum(
                  catalogGroup?.defaultGrammage ?? raw.defaultGrammage ?? raw.weight ?? null,
                  100,
                );
                // weight = defaultGrammage (gramagem do acompanhamento, não do prato)
                const normalizedWeight = normalizedDefaultGrammage;

                return {
                  ...acc,
                  groupId: normalizedGroupId,
                  groupName: normalizedGroupName,
                  sourceGroupId: raw.sourceGroupId ?? normalizedGroupId,
                  sourceGroupName: raw.sourceGroupName ?? normalizedGroupName,
                  defaultGrammage: normalizedDefaultGrammage,
                  weight: normalizedWeight,
                  minSelections: catalogGroup?.minSelections ?? raw.minSelections ?? null,
                  maxSelections: catalogGroup?.maxSelections ?? raw.maxSelections ?? null,
                  energyKcal: safeNum(dbAcc?.energyKcal),
                  proteins: safeNum(dbAcc?.proteins),
                  carbs: safeNum(dbAcc?.carbs),
                  fatTotal: safeNum(dbAcc?.fatTotal),
                  isNoAccompaniment: Boolean(dbAcc?.isNoAccompaniment),
                  is_no_accompaniment: Boolean(dbAcc?.isNoAccompaniment),
                };
              });

              const baseMacros: BaseMacros = dish.nutritionalData?.baseMacros || dish.macros || { kcal: 0, protein: 0, carbs: 0, fat: 0 };
              const calculated = calculateMealNutritionCanonical({
                dish: {
                  energyKcal: safeNum(baseMacros.kcal),
                  proteins: safeNum(baseMacros.protein),
                  carbs: safeNum(baseMacros.carbs),
                  fatTotal: safeNum(baseMacros.fat),
                },
                recipeWeight: dish.nutritionalData?.recipeWeight,
                targetMainDishWeight: dish.nutritionalData?.mainDishWeight,
                accompaniments: enrichedAccs,
              }).nutrition;

              const finalMacros = {
                kcal: safeNum(calculated.energyKcal),
                protein: safeNum(calculated.proteins),
                carbs: safeNum(calculated.carbs),
                fat: safeNum(calculated.fatTotal)
              };

              return {
                id: uuidv4(),
                prescriptionId: pId!,
                dishId: safeNum(dish.dishId),
                sizeId: safeNum(dish.sizeId),
                dishName: safeString(dish.name, "Prato"),
                mealName: meal.name || meal.mealName || `Refeição ${mIdx + 1}`,
                order: mIdx,
                fixedPrice: String(safeNum(dish.priceAtCreation ?? dish.price)),
                multiplier: String(safeNum(dish.multiplier, 1)),
                accompanimentsJson: safeJsonStringifyForDb(enrichedAccs, []),
                macrosJson: safeJsonStringifyForDb(finalMacros, {
                  kcal: 0,
                  protein: 0,
                  carbs: 0,
                  fat: 0,
                }),
              };
            });
          });

          if (itemsToInsert.length > 0) {
            await tx.insert(prescriptionItems).values(itemsToInsert);
          }

          return { success: true, id: pId };
        });
      } catch (error) {
        console.error("[nutri.assignPrescription] save failed", {
          message: error instanceof Error ? error.message : String(error),
          code:
            typeof error === "object" && error !== null && "code" in error
              ? String((error as { code?: unknown }).code)
              : undefined,
          clientIdPresent: Boolean(clientId),
          prescriptionId:
            prescription.id && prescription.id !== "NEW" ? prescription.id : "NEW",
          mealCount: prescriptionMeals.length,
        });

        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "Não foi possível salvar a prescrição porque os dados nutricionais estão incompletos. Revise os pratos e tente novamente.",
        });
      }
    }),

  /**
   * DASHBOARD DO PACIENTE
   */
  getDashboard: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    const allPrescs = await db
      .select()
      .from(prescriptions)
      .where(and(eq(prescriptions.clientId, ctx.user.id), eq(prescriptions.status, "active")))
      .orderBy(desc(prescriptions.updatedAt));
    if (!allPrescs.length) return [];

    return await Promise.all(allPrescs.map(async (presc) => {
      const items = await db.select().from(prescriptionItems).where(eq(prescriptionItems.prescriptionId, presc.id)).orderBy(prescriptionItems.order);
      const dishIds = Array.from(new Set(items.map((item) => item.dishId).filter(Boolean)));
      const sizeIds = Array.from(new Set(items.map((item) => item.sizeId).filter(Boolean)));

      const snapshotMeals =
        typeof presc.dietSnapshot === "string"
          ? safeJsonParse<LocalSnapshotMeal[]>(presc.dietSnapshot, [])
          : Array.isArray(presc.dietSnapshot)
            ? (presc.dietSnapshot as LocalSnapshotMeal[])
            : [];

      const sizeRows = sizeIds.length > 0
        ? await db
          .select({
            id: dishSizes.id,
            name: dishSizes.name,
            weight: dishSizes.weight,
            mainDishWeight: dishSizes.mainDishWeight,
            noAccompanimentsMessage: dishSizes.noAccompanimentsMessage,
          })
          .from(dishSizes)
          .where(inArray(dishSizes.id, sizeIds))
        : [];

      const sizesWithGroups = dishIds.length > 0
        ? await db
          .select({
            dishId: dishesToSizes.dishId,
            sizeId: dishSizes.id,
            sizeName: dishSizes.name,
            weight: dishSizes.weight,
            mainDishWeight: dishSizes.mainDishWeight,
            noAccompanimentsMessage: dishSizes.noAccompanimentsMessage,
            groupId: accompanimentGroups.id,
            groupName: accompanimentGroups.name,
            defaultGrammage: accompanimentGroups.defaultGrammage,
            minSelections: sizeAccompanimentGroups.minSelections,
            maxSelections: sizeAccompanimentGroups.maxSelections,
            groupMinSelections: accompanimentGroups.minSelections,
            groupMaxSelections: accompanimentGroups.maxSelections,
          })
          .from(dishSizes)
          .innerJoin(dishesToSizes, eq(dishSizes.id, dishesToSizes.sizeId))
          .leftJoin(sizeAccompanimentGroups, eq(dishSizes.id, sizeAccompanimentGroups.sizeId))
          .leftJoin(accompanimentGroups, eq(sizeAccompanimentGroups.accompanimentGroupId, accompanimentGroups.id))
          .where(inArray(dishesToSizes.dishId, dishIds))
        : [];

      const allOptions = await db
        .select({
          optionId: accompanimentOptions.id,
          optionName: accompanimentOptions.name,
          groupId: groupToOptions.groupId,
          energyKcal: accompanimentOptions.energyKcal,
          proteins: accompanimentOptions.proteins,
          carbs: accompanimentOptions.carbs,
          fatTotal: accompanimentOptions.fatTotal,
          isNoAccompaniment: accompanimentOptions.isNoAccompaniment,
        })
        .from(accompanimentOptions)
        .innerJoin(groupToOptions, eq(accompanimentOptions.id, groupToOptions.optionId))
        .where(eq(accompanimentOptions.isActive, true));

      const findSnapshotDish = (item: typeof items[number]) =>
        snapshotMeals
          .flatMap((meal) => meal.dishes || [])
          .find(
            (dish) =>
              Number(dish.dishId) === Number(item.dishId) &&
              Number(dish.sizeId) === Number(item.sizeId),
          );

      const buildSelectedSizeGroups = (dishId: number, sizeId: number) =>
        sizesWithGroups
          .filter((group) => Number(group.dishId) === Number(dishId) && Number(group.sizeId) === Number(sizeId) && group.groupId)
          .map((group) => ({
            id: group.groupId,
            groupId: group.groupId,
            name: group.groupName,
            groupName: group.groupName,
            defaultGrammage: group.defaultGrammage,
            minSelections: group.minSelections ?? group.groupMinSelections ?? null,
            maxSelections: group.maxSelections ?? group.groupMaxSelections ?? null,
            options: allOptions
              .filter((option) => Number(option.groupId) === Number(group.groupId))
              .map((option) => ({
                id: option.optionId,
                name: option.optionName,
                groupId: group.groupId,
                groupName: group.groupName,
                defaultGrammage: group.defaultGrammage,
                minSelections: group.minSelections ?? group.groupMinSelections ?? null,
                maxSelections: group.maxSelections ?? group.groupMaxSelections ?? null,
                energyKcal: option.energyKcal,
                proteins: option.proteins,
                carbs: option.carbs,
                fatTotal: option.fatTotal,
                isNoAccompaniment: option.isNoAccompaniment,
                is_no_accompaniment: option.isNoAccompaniment,
              })),
          }));

      const enrichSelectedAccs = (
        accs: AccompanimentItem[],
        groups: ReturnType<typeof buildSelectedSizeGroups>,
      ) =>
        accs.map((acc) => {
          const raw = acc as Record<string, unknown>;
          // ✅ P0 FIX: buscar grupo por groupId ou sourceGroupId (legado) antes do fallback por optionId
          const legacyGroupId = raw.groupId ?? raw.sourceGroupId ?? null;
          const group = groups.find((candidate) =>
            (legacyGroupId !== null && String(candidate.groupId) === String(legacyGroupId)) ||
            candidate.options.some((option) => Number(option.id) === Number(acc.id)),
          );
          const option = group?.options.find((candidate) => Number(candidate.id) === Number(acc.id));
          // Acc inexistente no catálogo atual → marcar como indisponível
          const legacyAccMissing = !option && !Boolean(acc.isNoAccompaniment);

          const resolvedGroupId = group?.groupId ?? raw.groupId ?? raw.sourceGroupId ?? null;
          const resolvedGroupName = raw.groupName ?? group?.groupName ?? raw.sourceGroupName ?? null;
          // weight = defaultGrammage real do catálogo; preservar se já vem correto
          const resolvedDefaultGrammage =
            safeNum(raw.defaultGrammage ?? group?.defaultGrammage ?? null, 100);
          const resolvedWeight =
            safeNum(raw.defaultGrammage ?? raw.weight ?? group?.defaultGrammage ?? null, 100);

          return {
            ...acc,
            id: acc.id,
            name: acc.name ?? option?.name ?? "Acompanhamento",
            groupId: resolvedGroupId,
            groupName: resolvedGroupName,
            sourceGroupId: raw.sourceGroupId ?? resolvedGroupId,
            sourceGroupName: raw.sourceGroupName ?? resolvedGroupName,
            minSelections: raw.minSelections ?? group?.minSelections ?? null,
            maxSelections: raw.maxSelections ?? group?.maxSelections ?? null,
            defaultGrammage: resolvedDefaultGrammage,
            weight: resolvedWeight,
            energyKcal: acc.energyKcal ?? option?.energyKcal ?? 0,
            proteins: acc.proteins ?? option?.proteins ?? 0,
            carbs: acc.carbs ?? option?.carbs ?? 0,
            fatTotal: acc.fatTotal ?? option?.fatTotal ?? 0,
            isNoAccompaniment: Boolean(acc.isNoAccompaniment ?? acc.is_no_accompaniment ?? option?.isNoAccompaniment),
            is_no_accompaniment: Boolean(acc.isNoAccompaniment ?? acc.is_no_accompaniment ?? option?.isNoAccompaniment),
            legacyAccMissing,
          };
        });

      const mealMap = new Map<string, { mealName: string; order: number; dishes: DashboardPrescriptionDish[] }>();

      items.forEach(item => {
        const mName = item.mealName;
        if (!mealMap.has(mName)) {
          mealMap.set(mName, { mealName: mName, order: item.order ?? 0, dishes: [] });
        }

        const accs = safeJsonParse<AccompanimentItem[]>(item.accompanimentsJson, []);
        const macros = safeJsonParse<BaseMacros>(item.macrosJson, {});
        const matchedSize = sizeRows.find((size) => Number(size.id) === Number(item.sizeId));
        const snapshotDish = findSnapshotDish(item);
        const snapshotNutrition =
          snapshotDish?.nutritionalData && typeof snapshotDish.nutritionalData === "object"
            ? (snapshotDish.nutritionalData as Record<string, unknown>)
            : {};
        const groups = buildSelectedSizeGroups(item.dishId, item.sizeId);
        const enrichedAccs = enrichSelectedAccs(accs, groups) as AccompanimentItem[];
        const mainDishWeight = matchedSize
          ? safeNumber(matchedSize.mainDishWeight)
          : safeNumber(snapshotDish?.mainDishWeight ?? snapshotNutrition.mainDishWeight);
        const sizeName = safeTextOrNull(
          matchedSize?.name ?? snapshotDish?.sizeName ?? snapshotNutrition.sizeName,
        );
        const sizeWeight = safeWeightOrNull(
          matchedSize?.weight ??
          snapshotDish?.sizeWeight ??
          snapshotDish?.weight ??
          snapshotNutrition.sizeWeight ??
          snapshotNutrition.weight,
        );
        const noAccompanimentsMessage = safeTextOrNull(
          matchedSize?.noAccompanimentsMessage ??
          snapshotDish?.noAccompanimentsMessage ??
          snapshotNutrition.noAccompanimentsMessage,
        );
        const legacySizeMissing = Boolean(item.sizeId && !matchedSize);

        mealMap.get(mName)!.dishes.push({
          id: item.id,
          prescriptionId: presc.id,
          prescriptionItemId: item.id,
          source: "prescription",
          dishId: item.dishId,
          sizeId: item.sizeId,
          sizeName,
          weight: sizeWeight,
          sizeWeight,
          mainDishWeight,
          noAccompanimentsMessage,
          name: item.dishName || "Prato",
          priceAtCreation: safeNumber(item.fixedPrice),
          fixedPrice: safeNumber(item.fixedPrice),
          discountPercentage: safeNumber(presc.discountPercentage),
          multiplier: item.multiplier || "1.00",
          selectedAccompaniments: enrichedAccs,
          allowedAccompaniments: enrichedAccs,
          accompanimentGroups: groups,
          groups,
          legacySizeMissing,
          nutritionalData: {
            ...snapshotNutrition,
            sizeId: item.sizeId,
            sizeName,
            weight: sizeWeight,
            sizeWeight,
            mainDishWeight,
            noAccompanimentsMessage,
            baseMacros: macros,
            allowedAccompaniments: enrichedAccs,
            selectedAccompaniments: enrichedAccs,
          },
          appliedNutrition: macros,
        });
      });

      if (process.env.NODE_ENV !== "production") {
        console.info("[NUTRI_DASHBOARD_DEBUG]", {
          prescriptionId: presc.id,
          prescriptionItemsCount: items.length,
          items: items.map(item => {
            const matchedSize = sizeRows.find((size) => Number(size.id) === Number(item.sizeId));
            const snapshotDish = findSnapshotDish(item);
            const snapshotNutrition =
              snapshotDish?.nutritionalData && typeof snapshotDish.nutritionalData === "object"
                ? (snapshotDish.nutritionalData as Record<string, unknown>)
                : {};
            const groups = buildSelectedSizeGroups(item.dishId, item.sizeId);
            const accs = safeJsonParse<AccompanimentItem[]>(item.accompanimentsJson, []);
            const enrichedAccs = enrichSelectedAccs(accs, groups) as AccompanimentItem[];
            const sizeName = safeTextOrNull(
              matchedSize?.name ?? snapshotDish?.sizeName ?? snapshotNutrition.sizeName,
            );
            return {
              dishId: item.dishId,
              dishName: item.dishName,
              sizeId: item.sizeId,
              sizeName,
              selectedAccompanimentsLength: enrichedAccs.length,
              allowedAccompanimentsLength: enrichedAccs.length,
              accompanimentGroupsLength: groups.length,
              groupsLength: groups.length,
              firstSelectedAccompaniment: enrichedAccs[0] || null,
              firstAllowedAccompaniment: enrichedAccs[0] || null
            };
          })
        });
      }

      return { ...presc, source: "prescription", meals: Array.from(mealMap.values()) };
    }));
  }),

  /**
   * APAGAR PRESCRIÇÃO
   */
  deletePrescription: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      const profile = await getCurrentNutriProfile(db, ctx.user.id);
      await assertPrescriptionBelongsToProfile(db, profile.id, input.id);

      return await db.transaction(async (tx) => {
        // Deleting a prescription must not remove the professional-client link.
        await tx
          .delete(prescriptionItems)
          .where(eq(prescriptionItems.prescriptionId, input.id));

        // 3. Deleta a prescrição definitivamente
        await tx
          .delete(prescriptions)
          .where(and(eq(prescriptions.id, input.id), eq(prescriptions.professionalId, profile.id)));

        return { success: true };
      });
    }),

  /**
   * DETALHES DA PRESCRIÇÃO
   */
  getPrescriptionDetails: protectedProcedure
    .input(z.object({ clientId: z.string(), prescriptionId: z.string().optional() }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      const profile = await getCurrentNutriProfile(db, ctx.user.id);
      await assertClientBelongsToProfile(db, profile, input.clientId);
      if (input.prescriptionId) {
        await assertPrescriptionBelongsToProfile(db, profile.id, input.prescriptionId, input.clientId);
      }

      const queryWhere = input.prescriptionId
        ? and(eq(prescriptions.id, input.prescriptionId), eq(prescriptions.professionalId, profile.id))
        : and(eq(prescriptions.clientId, input.clientId), eq(prescriptions.professionalId, profile.id));

      const allPrescs = await db.select().from(prescriptions).where(queryWhere).orderBy(desc(prescriptions.createdAt));

      return Promise.all(allPrescs.map(async (presc) => {
        const items = await db.select().from(prescriptionItems).where(eq(prescriptionItems.prescriptionId, presc.id));
        const dishIds = Array.from(new Set(items.map((item) => item.dishId).filter(Boolean)));
        const sizeIds = Array.from(new Set(items.map((item) => item.sizeId).filter(Boolean)));

        const sizeRows = sizeIds.length > 0
          ? await db
            .select({
              id: dishSizes.id,
              name: dishSizes.name,
              weight: dishSizes.weight,
              mainDishWeight: dishSizes.mainDishWeight,
              noAccompanimentsMessage: dishSizes.noAccompanimentsMessage,
              price: dishSizes.price,
              price_modifier: dishSizes.priceModifier,
              displayOrder: dishSizes.displayOrder,
            })
            .from(dishSizes)
            .where(inArray(dishSizes.id, sizeIds))
          : [];

        const sizesWithGroups = dishIds.length > 0
          ? await db
            .select({
              dishId: dishesToSizes.dishId,
              sizeId: dishSizes.id,
              sizeName: dishSizes.name,
              weight: dishSizes.weight,
              mainDishWeight: dishSizes.mainDishWeight,
              noAccompanimentsMessage: dishSizes.noAccompanimentsMessage,
              price: dishSizes.price,
              price_modifier: dishSizes.priceModifier,
              displayOrder: dishSizes.displayOrder,
              groupId: accompanimentGroups.id,
              groupName: accompanimentGroups.name,
              defaultGrammage: accompanimentGroups.defaultGrammage,
              minSelections: sizeAccompanimentGroups.minSelections,
              maxSelections: sizeAccompanimentGroups.maxSelections,
              groupMinSelections: accompanimentGroups.minSelections,
              groupMaxSelections: accompanimentGroups.maxSelections,
            })
            .from(dishSizes)
            .innerJoin(dishesToSizes, eq(dishSizes.id, dishesToSizes.sizeId))
            .leftJoin(sizeAccompanimentGroups, eq(dishSizes.id, sizeAccompanimentGroups.sizeId))
            .leftJoin(accompanimentGroups, eq(sizeAccompanimentGroups.accompanimentGroupId, accompanimentGroups.id))
            .where(inArray(dishesToSizes.dishId, dishIds))
          : [];

        const allOptions = await db
          .select({
            optionId: accompanimentOptions.id,
            optionName: accompanimentOptions.name,
            groupId: groupToOptions.groupId,
            energyKcal: accompanimentOptions.energyKcal,
            proteins: accompanimentOptions.proteins,
            carbs: accompanimentOptions.carbs,
            fatTotal: accompanimentOptions.fatTotal,
            isNoAccompaniment: accompanimentOptions.isNoAccompaniment,
          })
          .from(accompanimentOptions)
          .innerJoin(groupToOptions, eq(accompanimentOptions.id, groupToOptions.optionId))
          .where(eq(accompanimentOptions.isActive, true));

        const buildAvailableSizesForDish = (dishId: number) => {
          const dishSizesRaw = sizesWithGroups.filter((size) => size.dishId === dishId);
          const uniqueSizeIds = Array.from(new Set(dishSizesRaw.map((size) => size.sizeId)));

          return uniqueSizeIds
            .map((sizeId) => {
              const sizeInfo = dishSizesRaw.find((size) => size.sizeId === sizeId)!;
              const groups = dishSizesRaw
                .filter((size) => size.sizeId === sizeId && size.groupId)
                .map((group) => ({
                  id: group.groupId,
                  name: group.groupName,
                  defaultGrammage: group.defaultGrammage,
                  minSelections: group.minSelections ?? group.groupMinSelections ?? null,
                  maxSelections: group.maxSelections ?? group.groupMaxSelections ?? null,
                  isRequired: Number(group.minSelections ?? group.groupMinSelections ?? 0) > 0,
                  options: allOptions
                    .filter((option) => option.groupId === group.groupId)
                    .map((option) => ({
                      id: option.optionId,
                      name: option.optionName,
                      energyKcal: option.energyKcal,
                      proteins: option.proteins,
                      carbs: option.carbs,
                      fatTotal: option.fatTotal,
                      isActive: true,
                      isNoAccompaniment: option.isNoAccompaniment,
                      is_no_accompaniment: option.isNoAccompaniment,
                    })),
                }));

              return {
                id: sizeInfo.sizeId,
                name: sizeInfo.sizeName,
                weight: sizeInfo.weight,
                mainDishWeight: sizeInfo.mainDishWeight,
                noAccompanimentsMessage: sizeInfo.noAccompanimentsMessage,
                price: sizeInfo.price,
                price_modifier: sizeInfo.price_modifier || "1.00",
                displayOrder: sizeInfo.displayOrder,
                groups,
                accompanimentGroups: groups,
              };
            })
            .sort((a, b) => Number(a.displayOrder || 0) - Number(b.displayOrder || 0));
        };

        const snapshotMeals =
          typeof presc.dietSnapshot === "string"
            ? safeJsonParse<LocalSnapshotMeal[]>(presc.dietSnapshot, [])
            : Array.isArray(presc.dietSnapshot)
              ? (presc.dietSnapshot as LocalSnapshotMeal[])
              : [];

        const findSnapshotDish = (item: typeof items[number]) =>
          snapshotMeals
            .flatMap((meal) => meal.dishes || [])
            .find(
              (dish) =>
                Number(dish.dishId) === Number(item.dishId) &&
                Number(dish.sizeId) === Number(item.sizeId),
            );

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
          const matchedSize = sizeRows.find((size) => Number(size.id) === Number(item.sizeId));
          const snapshotDish = findSnapshotDish(item);
          const snapshotNutrition =
            snapshotDish?.nutritionalData && typeof snapshotDish.nutritionalData === "object"
              ? (snapshotDish.nutritionalData as Record<string, unknown>)
              : {};
          const mainDishWeight = matchedSize
            ? safeNumber(matchedSize.mainDishWeight)
            : safeNumber(snapshotDish?.mainDishWeight ?? snapshotNutrition.mainDishWeight);
          const sizeName = matchedSize?.name ?? snapshotDish?.sizeName ?? null;
          const sizeWeight =
            matchedSize?.weight ??
            snapshotDish?.sizeWeight ??
            snapshotDish?.weight ??
            snapshotNutrition.sizeWeight ??
            snapshotNutrition.weight ??
            null;
          const noAccompanimentsMessage =
            matchedSize?.noAccompanimentsMessage ??
            snapshotDish?.noAccompanimentsMessage ??
            snapshotNutrition.noAccompanimentsMessage ??
            null;
          const availableSizes = buildAvailableSizesForDish(item.dishId);
          const legacySizeMissing = Boolean(item.sizeId && !matchedSize);

          mealMap.get(item.mealName)!.groups[0].options.push({
            ...item,
            dishId: item.dishId,
            name: item.dishName,
            sizeId: item.sizeId,
            sizeName,
            mainDishWeight,
            weight: sizeWeight,
            sizeWeight,
            noAccompanimentsMessage,
            priceAtCreation: safeNumber(item.fixedPrice),
            multiplier: item.multiplier,
            availableSizes,
            legacySizeMissing,
            allowedAccompaniments: accs,
            nutritionalData: {
              ...snapshotNutrition,
              sizeId: item.sizeId,
              sizeName,
              weight: sizeWeight,
              sizeWeight,
              mainDishWeight,
              noAccompanimentsMessage,
              baseMacros: macros,
              allowedAccompaniments: accs,
            }
          });
        });
        return { ...presc, meals: Array.from(mealMap.values()) };
      }));
    }),

  /**
   * DUPLICA UMA PRESCRIÇÃO
   */
  duplicatePrescription: protectedProcedure
    .input(z.object({
      prescriptionId: z.string(),
      targetClientId: z.string()
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      const profile = await getCurrentNutriProfile(db, ctx.user.id);
      await assertClientBelongsToProfile(db, profile, input.targetClientId);

      const [originalPresc] = await db
        .select()
        .from(prescriptions)
        .where(and(eq(prescriptions.id, input.prescriptionId), eq(prescriptions.professionalId, profile.id)))
        .limit(1);

      if (!originalPresc) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Dieta de origem não encontrada."
        });
      }

      const originalItems = await db
        .select()
        .from(prescriptionItems)
        .where(eq(prescriptionItems.prescriptionId, input.prescriptionId));

      const dishIds = Array.from(new Set(originalItems.map(item => item.dishId)));
      if (dishIds.length === 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "A dieta selecionada está vazia."
        });
      }

      const catalogData = await db
        .select({
          dishId: dishes.id,
          basePrice: dishes.basePrice,
          energyKcal: dishes.energyKcal,
          proteins: dishes.proteins,
          carbs: dishes.carbs,
          fatTotal: dishes.fatTotal,
        })
        .from(dishes)
        .where(inArray(dishes.id, dishIds));

      const sizeData = await db
        .select({
          sizeId: dishSizes.id,
          price: dishSizes.price,
          priceModifier: dishSizes.priceModifier,
        })
        .from(dishSizes);

      const allDbAccs = await db.select().from(accompanimentOptions);

      const newPrescriptionId = uuidv4();

      return await db.transaction(async (tx) => {
        let cleanTechnicalInsight = originalPresc.technicalInsight || "";
        if (originalPresc.clientId !== input.targetClientId) {
          cleanTechnicalInsight = "";
        }

        let parsedSnapshot: any[] = [];
        if (originalPresc.dietSnapshot) {
          if (typeof originalPresc.dietSnapshot === "string") {
            parsedSnapshot = safeJsonParse<any[]>(originalPresc.dietSnapshot, []);
          } else {
            parsedSnapshot = originalPresc.dietSnapshot as any[];
          }
        }

        const updatedSnapshot = parsedSnapshot.map((meal: any) => {
          return {
            ...meal,
            dishes: (meal.dishes || []).map((dish: any) => {
              const matchedDish = catalogData.find(d => Number(d.dishId) === Number(dish.dishId));
              const matchedSize = sizeData.find(s => Number(s.sizeId) === Number(dish.sizeId));

              const basePrice = matchedDish ? safeNum(matchedDish.basePrice) : 0;
              const sizePrice = matchedSize ? safeNum(matchedSize.price) : 0;
              const modifier = matchedSize ? safeNum(matchedSize.priceModifier, 1) : 1;

              const newUnitPrice = sizePrice > 0 ? sizePrice : basePrice * (modifier === 0 ? 1 : modifier);

              return {
                ...dish,
                priceAtCreation: newUnitPrice,
                price: newUnitPrice
              };
            })
          };
        });

        await tx.insert(prescriptions).values({
          id: newPrescriptionId,
          clientId: input.targetClientId,
          professionalId: originalPresc.professionalId,
          planName: `${originalPresc.planName} (Cópia)`,
          status: "active",
          technicalInsight: cleanTechnicalInsight,
          totalKcalTarget: originalPresc.totalKcalTarget,
          discountPercentage: originalPresc.discountPercentage,
          dietSnapshot: JSON.stringify(updatedSnapshot) as any,
        });

        const newItems = originalItems.map(item => {
          const matchedDish = catalogData.find(d => Number(d.dishId) === Number(item.dishId));
          const matchedSize = sizeData.find(s => Number(s.sizeId) === Number(item.sizeId));

          const basePrice = matchedDish ? safeNum(matchedDish.basePrice) : 0;
          const sizePrice = matchedSize ? safeNum(matchedSize.price) : 0;
          const modifier = matchedSize ? safeNum(matchedSize.priceModifier, 1) : 1;

          const newUnitPrice = sizePrice > 0 ? sizePrice : basePrice * (modifier === 0 ? 1 : modifier);

          const baseKcal = matchedDish ? safeNum(matchedDish.energyKcal) : 0;
          const baseProt = matchedDish ? safeNum(matchedDish.proteins) : 0;
          const baseCarb = matchedDish ? safeNum(matchedDish.carbs) : 0;
          const baseFat = matchedDish ? safeNum(matchedDish.fatTotal) : 0;

          let totalKcal = baseKcal;
          let totalProtein = baseProt;
          let totalCarbs = baseCarb;
          let totalFat = baseFat;

          const selectedAccsRaw = safeJsonParse<AccompanimentItem[]>(item.accompanimentsJson, []);
          const enrichedAccs = selectedAccsRaw.map(acc => {
            const dbAcc = allDbAccs.find(a => Number(a.id) === Number(acc.id));
            if (dbAcc && !dbAcc.isNoAccompaniment) {
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
              isNoAccompaniment: Boolean(dbAcc?.isNoAccompaniment),
              is_no_accompaniment: Boolean(dbAcc?.isNoAccompaniment),
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
            prescriptionId: newPrescriptionId,
            dishId: item.dishId,
            sizeId: item.sizeId,
            dishName: item.dishName,
            mealName: item.mealName,
            order: item.order,
            fixedPrice: String(newUnitPrice),
            multiplier: item.multiplier || "1.00",
            accompanimentsJson: JSON.stringify(enrichedAccs),
            macrosJson: JSON.stringify(finalMacros),
          };
        });

        if (newItems.length > 0) {
          await tx.insert(prescriptionItems).values(newItems);
        }

        return {
          success: true,
          newPrescriptionId,
          message: "Os preços foram updated conforme o catálogo vigente."
        };
      });
    }),
}
