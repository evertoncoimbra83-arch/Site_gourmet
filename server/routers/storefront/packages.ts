import { router, publicProcedure } from "../../_core/trpc.js";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { 
  getPackageById, 
  getAllPackages, 
  getAllActiveDishes,
  updatePackageConfig 
} from "../../packages.js"; 
import { getDb } from "../../db.js";
import { 
  accompanimentGroups, 
  accompanimentOptions, 
  sizeAccompanimentGroups,
  dishSizes,
  // ✅ Importamos como 'categories' para manter compatibilidade com o código abaixo
  accompanimentCategories as categories 
} from "../../../drizzle/schema/catalog.js";
import { eq, and, inArray } from "drizzle-orm";

// --- HELPERS DE NORMALIZAÇÃO ---

const toNum = (val: any): number => {
  if (val === null || val === undefined) return 0;
  const n = typeof val === 'string' ? parseFloat(val.replace(',', '.')) : val;
  return isNaN(n) ? 0 : n;
};

const normalizePackage = (pkg: any) => {
  if (!pkg) return null;
  const rawPrice = pkg.price ?? pkg.basePrice ?? pkg.base_price;
  
  return {
    ...pkg, 
    price: toNum(rawPrice),
    basePrice: toNum(rawPrice),
    numberOfOptions: Number(pkg.numberOfOptions || pkg.number_of_options || 0),
    config: typeof pkg.config === 'string' ? JSON.parse(pkg.config) : pkg.config
  };
};

// --- ROUTER ---

export const packagesRouter = router({
  
  // 1. LISTAGEM GERAL
  list: publicProcedure
    .input(z.object({ search: z.string().nullish() }).optional())
    .query(async () => {
      try {
        const result = await getAllPackages();
        if (!result) return [];
        return result.map(normalizePackage);
      } catch (error) {
        console.error("Erro listing packages:", error);
        return [];
      }
    }),

  // 2. BUSCA POR ID (USADO NO DRAWER)
  getById: publicProcedure
    .input(z.object({ 
      id: z.union([z.string(), z.number()]).transform(v => String(v)) 
    }))
    .query(async ({ input }) => {
      try {
        const pkg = await getPackageById(input.id);
        if (!pkg) throw new TRPCError({ code: 'NOT_FOUND', message: "Pacote não encontrado" });
        return normalizePackage(pkg);
      } catch (error: any) {
        throw new TRPCError({ 
          code: 'INTERNAL_SERVER_ERROR', 
          message: error.message || "Erro ao buscar pacote" 
        });
      }
    }),

  /**
   * ✅ LISTAR PRATOS PARA O BUILDER COM ÍCONES NAS CATEGORIAS
   */
  listAllDishes: publicProcedure.query(async () => {
    const db = await getDb();
    
    // Busca dados base
    const allDishes = await getAllActiveDishes();
    
    // ✅ Busca categorias de acompanhamento (onde estão os ícones)
    const allCategories = await db.select().from(categories).where(eq(categories.isActive, true));
    
    if (!allDishes || allDishes.length === 0) return [];

    const sizes = await db
      .select()
      .from(dishSizes)
      .where(eq(dishSizes.isActive, true));

    return await Promise.all(allDishes.map(async (dish: any) => {
      let accompaniments: any[] = [];

      if (dish.allowAccompaniments && sizes.length > 0) {
        const sizeIds = sizes.map(s => s.id);

        // ✅ Busca grupos vinculados aos tamanhos
        const groupLinks = await db
          .select({
            sizeId: sizeAccompanimentGroups.sizeId,
            isRequired: sizeAccompanimentGroups.isRequired,
            id: accompanimentGroups.id,
            name: accompanimentGroups.name,
          })
          .from(sizeAccompanimentGroups)
          .innerJoin(accompanimentGroups, eq(sizeAccompanimentGroups.accompanimentGroupId, accompanimentGroups.id))
          .where(and(
            inArray(sizeAccompanimentGroups.sizeId, sizeIds),
            eq(accompanimentGroups.isActive, true)
          ));

        if (groupLinks.length > 0) {
            const allOptions = await db
                .select()
                .from(accompanimentOptions)
                .where(eq(accompanimentOptions.isActive, true));

            accompaniments = groupLinks.map(link => {
                const filteredOptions = allOptions.map(opt => {
                    const config = typeof opt.groupsConfig === 'string' 
                        ? JSON.parse(opt.groupsConfig) 
                        : (opt.groupsConfig || []);
                    
                    // Comparamos com link.id (extraído do join acima)
                    const specific = config.find((c: any) => Number(c.group_id) === link.id);
                    if (!specific) return null;

                    // ✅ CORREÇÃO DE TIPAGEM: Usamos 'as any' para acessar iconKey e color com segurança
                    // Isso evita o erro TS2339 se o tipo inferido estiver incompleto
                    const categoryData = allCategories.find(c => c.id === opt.accompanimentCategoryId) as any;

                    return {
                        ...opt,
                        priceModifier: specific.price_modifier || "0.00",
                        // ✅ Hidrata o objeto category para o frontend renderizar o ícone
                        category: categoryData ? {
                            id: categoryData.id,
                            name: categoryData.name,
                            iconKey: categoryData.iconKey,
                            color: categoryData.color
                        } : null
                    };
                }).filter(Boolean);

                return {
                    ...link,
                    options: filteredOptions
                };
            });
        }
      }

      return {
        ...dish,
        accompaniments
      };
    }));
  }),

  // 4. ATUALIZAÇÃO DE CONFIGURAÇÃO (ADMIN)
  updateConfig: publicProcedure
    .input(z.object({ 
      id: z.union([z.string(), z.number()]).transform(v => String(v)), 
      config: z.any() 
    }))
    .mutation(async ({ input }) => {
      const configStr = typeof input.config === 'string' ? input.config : JSON.stringify(input.config);
      return await updatePackageConfig(input.id, configStr);
    }),
});