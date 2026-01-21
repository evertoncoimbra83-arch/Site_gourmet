import { z } from "zod";
import { router, adminProcedure } from "../../_core/trpc.js";
import * as AdminSizes from "../../admin-sizes-accompaniments.js";

/**
 * 📏 ADMIN SIZES ROUTER
 * Este roteador deve ser montado como 'dishSizes' ou 'sizes' no router pai.
 */
export const adminSizesRouter = router({
  
  // 1. Lista todos os tamanhos
  list: adminProcedure.query(async () => {
    return await AdminSizes.getAllDishSizes();
  }),

  // 2. Busca todos os vínculos da tabela pivot
  getAccompanimentGroups: adminProcedure.query(async () => {
    return await AdminSizes.getAllLinks(); 
  }),

  // 3. Cria o vínculo entre Tamanho e Grupo
  linkAccompanimentToSize: adminProcedure
    .input(z.object({ 
      sizeId: z.number(), 
      groupId: z.number() 
    }))
    .mutation(async ({ input }) => {
      return await AdminSizes.linkAccompanimentToSize(input);
    }),

  // 4. Remove o vínculo
  unlinkAccompanimentFromSize: adminProcedure
    .input(z.object({ 
      sizeId: z.number(), 
      groupId: z.number() 
    }))
    .mutation(async ({ input }) => {
      return await AdminSizes.unlinkAccompanimentFromSize(input.sizeId, input.groupId);
    }),

  // 5. Cadastrar novo tamanho
  create: adminProcedure
    .input(z.object({
      name: z.string(),
      weight: z.string().optional().nullable(),
      description: z.string().optional().nullable(),
      iconKey: z.string().optional().nullable(), // ✅ Adicionado campo FAQ
      priceModifier: z.union([z.string(), z.number()]).optional(),
      displayOrder: z.number().optional(),
      isActive: z.boolean().optional()
    }))
    .mutation(async ({ input }) => {
      return await AdminSizes.createDishSize(input);
    }),

  // 6. Atualizar tamanho existente
  // ✅ REVISADO: Agora desestrutura corretamente para o seu catalog logic
  update: adminProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().optional(),
      weight: z.string().optional().nullable(),
      description: z.string().optional().nullable(), // ✅ Adicionado campo FAQ
      priceModifier: z.union([z.string(), z.number()]).optional(),
      displayOrder: z.number().optional(),
      isActive: z.boolean().optional()
    }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      return await AdminSizes.updateDishSize(id, data);
    }),

  // 7. Excluir tamanho
  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      return await AdminSizes.deleteDishSize(input.id);
    }),
});