import { z } from "zod";
import { router, adminProcedure } from "../../_core/trpc";
import { TRPCError } from "@trpc/server";
// ✅ Removido import de discountRules (eslint: no-unused-vars)
import { 
    discountRuleInput, 
    listDiscountRules,
    createDiscountRule,
    updateDiscountRule,
    deleteDiscountRule
} from "../../discountRules"; 

/**
 * 🏷️ Roteador de Regras de Desconto (Admin)
 */
export const adminDiscountRulesRouter = router({
  
  list: adminProcedure.query(async () => {
    try {
      return await listDiscountRules();
    } catch {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Erro ao listar regras de desconto.",
      });
    }
  }),

  create: adminProcedure
    .input(discountRuleInput) 
    .mutation(async ({ input }) => {
      try {
        const result = await createDiscountRule(input);
        return {
          success: true,
          data: result,
          message: `Regra "${input.name}" criada com sucesso!`
        };
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Erro ao criar regra";
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message });
      }
    }),

  update: adminProcedure
    .input(
      discountRuleInput.extend({ 
        id: z.coerce.number() 
      })
    )
    .mutation(async ({ input }) => {
      try {
        /**
         * ✅ CORREÇÃO TS2339:
         * Se o seu 'discountRuleInput' já usa 'type' e 'value',
         * não precisamos tentar ler 'discountType'.
         * A desestruturação abaixo garante que passamos o objeto limpo para a função.
         */
        const { id, ...data } = input;

        // ✅ CORREÇÃO ESLint: Tipamos o data para evitar o 'any'
        const result = await updateDiscountRule(id, data as Parameters<typeof updateDiscountRule>[1]);
        
        return {
          success: true,
          data: result,
          message: `Regra de desconto "${input.name}" atualizada!`
        };
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Erro ao atualizar regra";
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message });
      }
    }),

  delete: adminProcedure
    .input(z.object({ 
        id: z.coerce.number(),
        name: z.string().optional() 
    }))
    .mutation(async ({ input }) => {
      try {
        await deleteDiscountRule(input.id);
        return {
          success: true,
          message: input.name 
            ? `Regra "${input.name}" removida.` 
            : "Regra de desconto excluída com sucesso."
        };
      } catch {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao excluir a regra de desconto.",
        });
      }
    }),
});