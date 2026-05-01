import { z } from "zod";
import { router, adminProcedure, publicProcedure } from "../../_core/trpc.js";

// ✅ Importações corrigidas para os seus arquivos reais
import { 
  getAllDishSizes, 
  upsertDishSize, 
  deleteDishSize, 
  toggleSizeGroupLink 
} from "../../admin-sizes.js"; 
import { getAccsWithNutrition } from "../../accompaniments.js"; 

export const sizesRouter = router({
  
  // 1. TAMANHOS (DISH SIZES)
  
  /**
   * Lista todos os tamanhos (P, M, G) para a vitrine ou admin
   */
  list: publicProcedure.query(async () => {
    return await getAllDishSizes();
  }),

  /**
   * Cria ou Atualiza um tamanho (Usa sua função upsert)
   */
  upsert: adminProcedure
    .input(z.object({
      id: z.number().optional().nullable(),
      name: z.string().min(1, "Nome é obrigatório"),
      priceModifier: z.union([z.string(), z.number()]).default("0.00"),
      mainDishWeight: z.union([z.string(), z.number()]).default(200),
      isActive: z.boolean().default(true),
      groupsOrder: z.array(z.number()).optional(),
    }).passthrough())
    .mutation(async ({ input }) => {
      const result = await upsertDishSize(input);
      return {
        ...result,
        success: true,
        message: input.id ? "Tamanho atualizado!" : "Novo tamanho criado com sucesso! 📏"
      };
    }),

  /**
   * Remove um tamanho e seus vínculos (Transação garantida)
   */
  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await deleteDishSize(input.id);
      return {
        success: true,
        message: "Tamanho removido com sucesso."
      };
    }),

  // 2. ACOMPANHAMENTOS E NUTRIÇÃO

  /**
   * Busca as opções de acompanhamento com dados nutricionais completos
   */
  listOptionsWithNutrition: adminProcedure.query(async () => {
    return await getAccsWithNutrition();
  }),

  // 3. VÍNCULOS (Link entre Tamanho e Grupo)

  /**
   * Liga ou desliga um grupo de um tamanho específico
   */
  toggleLink: adminProcedure
    .input(z.object({ 
      sizeId: z.number(), 
      groupId: z.number() 
    }))
    .mutation(async ({ input }) => {
      const result = await toggleSizeGroupLink(input.sizeId, input.groupId);
      return {
        ...result,
        message: result.linked ? "Grupo vinculado! 🔗" : "Vínculo removido."
      };
    }),
});