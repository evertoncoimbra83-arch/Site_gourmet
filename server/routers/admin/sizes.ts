import { z } from "zod";
import { router, adminProcedure } from "../../_core/trpc.js";
import * as AdminSizes from "../../admin-sizes-accompaniments.js";

/**
 * 📏 ADMIN SIZES ROUTER
 * Gerencia a engenharia de tamanhos, incluindo pesos, ícones,
 * ordens dos tamanhos e agora a ORDEM DOS GRUPOS dentro de cada tamanho.
 */
export const adminSizesRouter = router({
  
  // 1. Lista todos os tamanhos
  list: adminProcedure.query(async () => {
    return await AdminSizes.getAllDishSizes();
  }),

  // 2. Busca vínculos da tabela pivot (Size <-> AccompanimentGroup)
  getAccompanimentGroups: adminProcedure.query(async () => {
    return await AdminSizes.getAllLinks(); 
  }),

  // 3. Cria vínculo entre Tamanho e Grupo
  linkAccompanimentToSize: adminProcedure
    .input(z.object({ 
      sizeId: z.number(), 
      groupId: z.number() 
    }))
    .mutation(async ({ input }) => {
      return await AdminSizes.linkAccompanimentToSize(input);
    }),

  // 4. Remove vínculo
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
      name: z.string().min(1, "O nome é obrigatório"),
      weight: z.union([z.string(), z.number()]).optional().nullable(),
      description: z.string().optional().nullable(),
      iconKey: z.string().optional().nullable(),
      priceModifier: z.union([z.string(), z.number()]).optional().default(0),
      displayOrder: z.coerce.number().optional().default(0),
      isActive: z.boolean().optional().default(true),
      // ✅ Adicionado para o novo campo de ordem
      groupsOrder: z.array(z.number()).optional().default([])
    }))
    .mutation(async ({ input }) => {
      return await AdminSizes.createDishSize(input);
    }),

  // 6. Atualizar tamanho existente (Usado no onBlur e no Drag and Drop)
  update: adminProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().optional(),
      weight: z.union([z.string(), z.number()]).optional().nullable(),
      description: z.string().optional().nullable(),
      iconKey: z.string().optional().nullable(),
      priceModifier: z.union([z.string(), z.number()]).optional(),
      displayOrder: z.coerce.number().optional(),
      isActive: z.boolean().optional(),
      // ✅ ESSENCIAL: Permite salvar a nova ordem dos grupos vinda do DND
      groupsOrder: z.array(z.number()).optional()
    }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      
      // Tratamento extra para garantir que o priceModifier vá como string para o Drizzle (se for decimal no banco)
      const payload = {
        ...data,
        ...(data.priceModifier !== undefined && { 
          priceModifier: String(data.priceModifier) 
        })
      };

      return await AdminSizes.updateDishSize(id, payload);
    }),

  // 7. Excluir tamanho
  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      return await AdminSizes.deleteDishSize(input.id);
    }),
});