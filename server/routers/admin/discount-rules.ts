import { z } from "zod";
import { router, adminProcedure } from "../../_core/trpc.js";
import { 
    discountRuleInput, 
    listDiscountRules,
    createDiscountRule,
    updateDiscountRule,
    deleteDiscountRule
} from "../../discountRules.js"; 

/**
 * Roteador de Regras de Desconto (Admin)
 * Gerencia o fluxo de descontos progressivos e automáticos.
 * Rota: admin.discountRules.*
 */
export const adminDiscountRulesRouter = router({
  
  // 1) Listar todas as regras
  list: adminProcedure.query(async () => {
    return await listDiscountRules();
  }),

  // 2) Criar nova regra
  create: adminProcedure
    .input(discountRuleInput) 
    .mutation(async ({ input }) => {
      return await createDiscountRule(input);
    }),

  // 3) Atualizar regra existente
  update: adminProcedure
    .input(
      discountRuleInput.extend({ 
        // Garante que o ID seja tratado como número para o MySQL INT
        id: z.coerce.number() 
      })
    )
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      // O 'id' aqui já chega como number puro
      return await updateDiscountRule(id, data as any);
    }),

  // 4) Deletar regra
  delete: adminProcedure
    .input(z.object({ 
        id: z.coerce.number() 
    }))
    .mutation(async ({ input }) => {
      return await deleteDiscountRule(input.id);
    }),
});