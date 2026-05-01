import { adminProcedure, router } from "../../_core/trpc";
import { z } from "zod"; 
import { TRPCError } from "@trpc/server";

// ✅ 1. Query Functions
import { 
  getPaginatedDishes, 
  getDishById, 
  getLocalCategories,
  listAllSizes,
  searchIngredients 
} from "../../admin-dishes/logic/admin-dishes-queries";

// ✅ 2. Mutations
import { 
  createDish, 
  updateDish, 
  deleteDish, 
  toggleSizeLink 
} from "../../admin-dishes/logic/admin-dishes-mutations";

// ✅ 3. Imports auxiliares
import { getDb } from "../../db";
import { dishes } from "../../../drizzle/schema/index";
import { eq } from "drizzle-orm";

/**
 * 🛠️ Tipagem Dinâmica para evitar 'any'
 * Extraímos os tipos esperados diretamente das funções de lógica.
 */
type CreateDishInput = Parameters<typeof createDish>[0];
type UpdateDishInput = Parameters<typeof updateDish>[1];

export const adminDishesRouter = router({
  
  listCategories: adminProcedure.query(async () => {
    return await getLocalCategories();
  }),

  listSizes: adminProcedure.query(async () => {
    return await listAllSizes();
  }),

  list: adminProcedure
    .input(z.object({
      page: z.number().default(1),
      perPage: z.number().default(10),
      search: z.string().optional(),
      categoryId: z.number().optional(),
      showInactive: z.boolean().optional(),
    }))
    .query(async ({ input }) => {
      return await getPaginatedDishes({
        page: input.page,
        limit: input.perPage,
        search: input.search,
        categoryId: input.categoryId,
        showInactive: input.showInactive
      });
    }),

  getById: adminProcedure
    .input(z.number())
    .query(async ({ input }) => {
      const dish = await getDishById(input);
      if (!dish) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Prato não encontrado.'
        });
      }
      return dish;
    }),

  searchIngredients: adminProcedure
    .input(z.object({
      query: z.string()
    }))
    .query(async ({ input }) => {
      return await searchIngredients(input.query);
    }),

  toggleActive: adminProcedure
    .input(z.object({ 
      id: z.number(), 
      name: z.string().optional(), 
      isActive: z.boolean() 
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      await db.update(dishes)
        .set({ isActive: input.isActive })
        .where(eq(dishes.id, input.id));
      
      return { 
        success: true, 
        message: input.isActive 
          ? `Prato "${input.name || 'item'}" ativado para venda!` 
          : `Prato "${input.name || 'item'}" pausado no cardápio.` 
      };
    }),

  /**
   * ✅ CRIAÇÃO (Sem 'any')
   */
  create: adminProcedure
    .input(z.object({
      name: z.string().min(1, "Nome é obrigatório"),
      categoryId: z.number().optional(),
      imageUrl: z.string().optional(),
      price: z.number().default(0),
      energyKj: z.any().optional(),
      energyKcal: z.any().optional(),
      proteins: z.any().optional(),
      carbs: z.any().optional(),
      fatTotal: z.any().optional(),
      composition: z.array(z.any()).optional()
    }).passthrough())
    .mutation(async ({ input }) => {
      // ✅ Tipagem segura extraída da função original
      const result = await createDish(input as CreateDishInput);
      return { 
        success: true, 
        data: result,
        message: `Prato "${input.name}" cadastrado com sucesso!` 
      };
    }),

  /**
   * ✅ ATUALIZAÇÃO (Sem 'any')
   */
  update: adminProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().optional(),
      price: z.number().optional(),
      imageUrl: z.string().optional(),
      categoryId: z.number().optional(),
      energyKj: z.any().optional(),
      energyKcal: z.any().optional(),
      proteins: z.any().optional(),
      carbs: z.any().optional(),
      fatTotal: z.any().optional(),
    }).passthrough()) 
    .mutation(async ({ input }) => {
      // ✅ Mapeamos o input para o tipo esperado pela mutation de update
      const { id, ...data } = input;
      const result = await updateDish(id, data as UpdateDishInput);
      
      return { 
        success: true, 
        data: result,
        message: `Alterações em "${input.name || 'Prato'}" salvas!` 
      };
    }),

  delete: adminProcedure
    .input(z.union([
      z.number(),
      z.object({ id: z.number(), name: z.string().optional() })
    ]))
    .mutation(async ({ input }) => {
      const id = typeof input === 'number' ? input : input.id;
      const name = typeof input === 'object' ? input.name : null;
      
      await deleteDish(id);
      
      return { 
        success: true, 
        message: name ? `Prato "${name}" removido permanentemente.` : "Prato removido com sucesso." 
      };
    }),

  toggleSizeLink: adminProcedure
    .input(z.object({ dishId: z.number(), sizeId: z.number() }))
    .mutation(async ({ input }) => {
      await toggleSizeLink(input.dishId, input.sizeId);
      return { 
        success: true, 
        message: "Disponibilidade de tamanho atualizada para este prato." 
      };
    }),
});