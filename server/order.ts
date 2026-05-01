// server/order.ts

import { eq, and, inArray } from "drizzle-orm"; 
import { getDb } from "./db";
import { 
  dishes, 
  dishSizes, 
  sizeAccompanimentGroups, 
  accompanimentOptions,
  accompanimentGroups, 
  dishesToSizes
} from "../drizzle/schema/";
import { safeJsonParse, safeNumber } from "./lib/safe-parse";

// --- INTERFACES ---

interface GroupConfig {
  group_id?: number | string;
  groupId?: number | string;
  id?: number | string;
}

// Interface auxiliar para o mapeamento das opções
interface AccompanimentOptionRaw {
  groupsConfig: unknown;
  [key: string]: unknown;
}

export async function getDishDetails(dishId: number) {
  const db = await getDb();
  if (!db) return null;

  try {
    // 1. Busca o prato
    const [dish] = await db.select().from(dishes).where(eq(dishes.id, dishId)).limit(1);
    if (!dish) return null;

    // 2. Busca tamanhos associados
    const sizes = await db
      .select({
        id: dishSizes.id,
        name: dishSizes.name,
        price: dishSizes.price,
        priceModifier: dishSizes.priceModifier,
        mainDishWeight: dishSizes.mainDishWeight,
        isActive: dishSizes.isActive,
        displayOrder: dishSizes.displayOrder
      })
      .from(dishSizes)
      .innerJoin(dishesToSizes, eq(dishSizes.id, dishesToSizes.sizeId))
      .where(and(eq(dishesToSizes.dishId, dishId), eq(dishSizes.isActive, true)))
      .orderBy(dishSizes.displayOrder);

    if (sizes.length === 0) return { ...dish, sizes: [] };

    // 3. Busca todos os grupos de acompanhamento
    const sizeIds = sizes.map(s => s.id);
    const allGroupsRows = await db
      .select({
        pivot: sizeAccompanimentGroups,
        group: accompanimentGroups
      })
      .from(sizeAccompanimentGroups)
      .leftJoin(accompanimentGroups, eq(sizeAccompanimentGroups.accompanimentGroupId, accompanimentGroups.id))
      .where(inArray(sizeAccompanimentGroups.sizeId, sizeIds));

    // 4. Busca todas as opções ativas
    const allOptions = await db.select().from(accompanimentOptions).where(eq(accompanimentOptions.isActive, true));

    // 5. Montagem da estrutura final
    const sizesWithGroups = sizes.map((size) => {
      const relevantGroups = allGroupsRows
        .filter(row => row.pivot.sizeId === size.id)
        .map((row) => {
          const { group, pivot } = row;
          if (!group) return null;

          // ✅ FIX TS2339: Cast seguro para AccompanimentOptionRaw para acessar groupsConfig
          const optionsForGroup = allOptions.filter((opt) => {
            const rawOpt = opt as unknown as AccompanimentOptionRaw;
            
            // Tratamento caso o banco retorne String (JSON) ou Objeto
            let config: GroupConfig[] = [];
            if (typeof rawOpt.groupsConfig === "string") {
              config = safeJsonParse<GroupConfig[]>(rawOpt.groupsConfig, []);
            } else if (Array.isArray(rawOpt.groupsConfig)) {
              config = rawOpt.groupsConfig as GroupConfig[];
            }

            if (!Array.isArray(config)) return false;

            return config.some(c => 
              String(c.group_id || c.groupId || c.id) === String(group.id)
            );
          });

          return {
            id: pivot.id,
            groupId: group.id,
            name: group.name,
            minSelections: pivot.minSelections ?? group.minSelections ?? 0,
            maxSelections: pivot.maxSelections ?? group.maxSelections ?? 1,
            defaultGrammage: safeNumber(group.defaultGrammage, 100),
            options: optionsForGroup
          };
        })
        .filter((g): g is NonNullable<typeof g> => g !== null);

      return { 
        ...size, 
        id: Number(size.id),
        accompanimentGroups: relevantGroups 
      };
    });

    return { 
      ...dish,
      id: Number(dish.id),
      nutritional_info: {
        kcal: safeNumber(dish.energyKcal),
        proteins: safeNumber(dish.proteins),
        carbs: safeNumber(dish.carbs),
        fats: safeNumber(dish.fatTotal)
      },
      sizes: sizesWithGroups 
    };

  } catch (error) {
    console.error("❌ Erro ao buscar detalhes do prato:", error);
    return null;
  }
}
