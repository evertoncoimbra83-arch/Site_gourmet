// client/src/server/routers/storefront/packages.router.ts

import { router, publicProcedure } from "../../_core/trpc.js";
import { z } from "zod";
import { getPackageById, getAllPackages } from "../../packages.js"; 
import { getDb } from "../../db.js";
import { 
  dishSizes,
  dishes
} from "../../../drizzle/schema/index.js"; 
import { eq, sql } from "drizzle-orm";
import { safeInteger, safeJsonParse, safeNumber } from "../../lib/safe-parse.js";

// --- INTERFACES ---
interface DishNutritionalInfo {
  ingredients?: string;
  [key: string]: unknown;
}

interface Dish {
  id: string | number;
  name: string;
  price: string | number;
  ingredients?: string;
  nutritionalInfo?: string | DishNutritionalInfo;
  nutritional_info?: DishNutritionalInfo;
  nutrition?: string | DishNutritionalInfo;
  isActive?: boolean;
  accompaniments?: unknown[];
}

interface PackageSlot {
  dishes: Dish[];
  [key: string]: unknown;
}

interface PackageResult {
  id: string | number;
  name: string;
  description?: string | null;
  highlights?: string | string[] | null; // ✅ Adicionado
  category?: string | null;               // ✅ Adicionado
  isPopular?: boolean | number | null;    // ✅ Adicionado
  options: PackageSlot[];
  [key: string]: unknown;
}

export const packagesRouter = router({
  
  /**
   * 📦 LIST: Lista todos os pacotes/kits ativos para a vitrine
   */
  list: publicProcedure.query(async () => {
    try {
      const result = await getAllPackages() as unknown as PackageResult[];
      if (!result) return [];

      // ✅ Mapeia os pacotes garantindo que os novos campos cheguem tratados ao frontend
      return result.map(pkg => ({
        ...pkg,
        // Garante que o frontend receba booleano para isPopular (MySQL retorna 0/1)
        isPopular: pkg.isPopular === true || pkg.isPopular === 1 || pkg.is_popular === 1,
        // Highlights e Category já vão como string/null para o frontend lidar no PackageCard
      }));
    } catch (error) {
      console.error("Erro ao listar pacotes no storefront:", error);
      return [];
    }
  }),

  /**
   * 🔍 GET BY ID: Detalhes do pacote e seus Slots para o Wizard
   */
  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      try {
        const result = await getPackageById(input.id) as unknown as PackageResult; 
        if (!result) return null;

        return {
          ...result,
          // ✅ Tratamento dos novos campos também no detalhe (caso precise no drawer)
          isPopular: result.isPopular === true || result.isPopular === 1 || result.is_popular === 1,
          options: (result.options || []).map((slot) => ({
            ...slot,
            dishes: (slot.dishes || []).map((dish) => ({
              ...dish,
              ingredients: dish.ingredients || (dish.nutritional_info?.ingredients) || ""
            }))
          }))
        };
      } catch (error) {
        console.error(`Erro ao buscar pacote ${input.id}:`, error);
        return null;
      }
    }),

  /**
   * 📏 GET AVAILABLE SIZES: Busca os tamanhos configurados (P, M, G)
   */
  getAvailableSizes: publicProcedure.query(async () => {
    try {
      const db = await getDb();
      if (!db) return [];
      
      const result = await db
        .select({
          id: dishSizes.id,
          name: dishSizes.name,
          mainDishWeight: sql<number>`CAST(COALESCE(${dishSizes.mainDishWeight}, 0) AS UNSIGNED)`,
          isActive: dishSizes.isActive,
        })
        .from(dishSizes)
        .where(eq(dishSizes.isActive, true));
      
      return result || [];
    } catch {
      return [];
    }
  }),

  /**
   * 🥗 LIST ALL DISHES: Busca pratos para preencher os slots dos kits
   */
  listAllDishes: publicProcedure.query(async () => {
    try {
      const db = await getDb();
      if (!db) return [];
      
      const dishesRaw = await db.select().from(dishes).where(eq(dishes.isActive, true)) as unknown as Dish[];

      return dishesRaw.map((dish) => {
        const rawNutri = dish.nutritionalInfo || dish.nutritional_info || dish.nutrition;
        
        let nutInfo: DishNutritionalInfo = {};
        if (typeof rawNutri === 'string') {
          nutInfo = safeJsonParse<DishNutritionalInfo>(rawNutri, {});
        } else {
          nutInfo = (rawNutri as DishNutritionalInfo) || {};
        }

        return {
          ...dish,
          id: safeInteger(dish.id),
          price: safeNumber(dish.price),
          nutritional_info: {
            ...nutInfo,
            ingredients: dish.ingredients || nutInfo.ingredients || ""
          },
          accompaniments: dish.accompaniments || [] 
        };
      });
    } catch {
      return [];
    }
  }),
});
