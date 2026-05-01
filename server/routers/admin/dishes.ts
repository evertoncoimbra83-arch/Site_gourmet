import { z } from "zod";
import { router, adminProcedure } from "../../_core/trpc.js"; 
import * as AdminDishes from "../../admin-dishes.js"; 
import { TRPCError } from "@trpc/server";
import { logAction } from "../../db/lib/audit.js";

const normalizeIdToNumber = (id: any) => {
  const num = Number(id);
  if (isNaN(num)) return 0;
  return num;
};

export const adminDishesRouter = router({
  // LISTAGEM COM PAGINAÇÃO E FILTRO
  list: adminProcedure
    .input(z.object({
      page: z.number().default(1),
      perPage: z.number().default(8),
      search: z.string().nullish(),
      categoryId: z.any().nullish(),
    }).optional())
    .query(async ({ input }) => {
      try {
        return await AdminDishes.getPaginatedDishes({
          page: input?.page ?? 1,
          limit: input?.perPage ?? 8,
          search: input?.search || undefined,
          categoryId: (input?.categoryId === 'all' || !input?.categoryId) 
            ? undefined 
            : normalizeIdToNumber(input.categoryId),
        });
      } catch (error: any) {
        console.error("❌ [TRPC DISH LIST ERROR]:", error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erro ao listar pratos.',
        });
      }
    }),

  // BUSCA POR ID
  getById: adminProcedure
    .input(z.number())
    .query(async ({ input }) => {
      try {
        const dish = await AdminDishes.getDishById(input);
        if (!dish) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Prato não encontrado.' });
        }
        return dish;
      } catch (error: any) {
        console.error("❌ [TRPC getById ERROR]:", error);
        throw new TRPCError({ 
          code: 'INTERNAL_SERVER_ERROR', 
          message: `Erro ao buscar prato: ${error.message}` 
        });
      }
    }),

  // ATIVAR/DESATIVAR PRATO
  toggleActive: adminProcedure
    .input(z.object({
      id: z.number().or(z.string()),
      isActive: z.boolean(),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        const idNum = normalizeIdToNumber(input.id);
        const dish = await AdminDishes.getDishById(idNum);
        const result = await AdminDishes.updateDish(idNum, { isActive: input.isActive });

        await logAction(ctx, "TOGGLE_DISH_VISIBILITY", "dishes", {
          entityId: input.id,
          old: { nome: dish?.name, ativo: !input.isActive },
          new: { nome: dish?.name, ativo: input.isActive }
        });

        return result;
      } catch (error: any) {
        console.error("❌ [TRPC toggleActive ERROR]:", error);
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Erro ao alterar status.' });
      }
    }),
  
  listCategories: adminProcedure.query(async () => {
    try {
      return await AdminDishes.getLocalCategories();
    } catch (error) {
      console.error("❌ [TRPC listCategories ERROR]:", error);
      return [];
    }
  }),

  // CRIAR NOVO PRATO
  create: adminProcedure
    .input(z.object({
      name: z.string(),
      ingredients: z.string().optional().nullable(),
      description: z.string().optional().nullable(),
      price: z.any().optional(),
      salePrice: z.any().optional().nullable(), // ✅ CAMPO ADICIONADO
      categoryId: z.any().optional(),
      isActive: z.boolean().default(true),
      imageUrl: z.string().optional().nullable(),
    }).passthrough()) 
    .mutation(async ({ ctx, input }) => {
      try {
        const result = await AdminDishes.createDish(input);
        await logAction(ctx, "CREATE_DISH", "dishes", {
          entityId: (result as any)?.insertId || input.name,
          new: { nome: input.name, preco: input.price, preco_promo: input.salePrice }
        });
        return result;
      } catch (error: any) {
        console.error("❌ [TRPC create DISH ERROR]:", error);
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Erro ao criar prato.' });
      }
    }),
  
  // ATUALIZAR PRATO
  update: adminProcedure
    .input(z.object({
      id: z.any(),
      name: z.string().optional(),
      price: z.any().optional(),
      salePrice: z.any().optional().nullable(), // ✅ CAMPO ADICIONADO
      ingredients: z.string().optional().nullable(),
    }).passthrough())
    .mutation(async ({ ctx, input }) => {
      try {
        const { id, ...data } = input;
        const idNum = normalizeIdToNumber(id);
        const oldDish = await AdminDishes.getDishById(idNum);
        const result = await AdminDishes.updateDish(idNum, data);

        await logAction(ctx, "UPDATE_DISH", "dishes", {
          entityId: idNum,
          old: { nome: oldDish?.name, preco: oldDish?.price, preco_promo: (oldDish as any)?.salePrice },
          new: { nome: data.name || oldDish?.name, preco: data.price, preco_promo: data.salePrice }
        });

        return result;
      } catch (error: any) {
        console.error("❌ [TRPC update DISH ERROR]:", error);
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Erro ao atualizar prato.' });
      }
    }),
  
  // EXCLUIR PRATO
  delete: adminProcedure
    .input(z.object({ id: z.any() }))
    .mutation(async ({ ctx, input }) => {
      try {
        const idNum = normalizeIdToNumber(input.id);
        const dish = await AdminDishes.getDishById(idNum);
        const result = await AdminDishes.deleteDish(idNum);

        await logAction(ctx, "DELETE_DISH", "dishes", {
          entityId: idNum,
          old: { nome: dish?.name }
        });

        return result;
      } catch (error: any) {
        console.error("❌ [TRPC delete DISH ERROR]:", error);
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Erro ao excluir prato.' });
      }
    }),
});