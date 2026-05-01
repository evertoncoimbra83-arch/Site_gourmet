import { z } from "zod";
import { router, adminProcedure } from "../../_core/trpc.js";
import * as StoreLogic from "../../storeSettings.js";
import { TRPCError } from "@trpc/server";
import { logAction } from "../../db/lib/audit.js";

/**
 * 📢 Roteador de Marketing e Regras de Loja (Admin)
 * Rota: admin.marketing.*
 */
export const adminMarketingRouter = router({
  
  /**
   * 🔍 BUSCA AS REGRAS DE VENDA
   */
  getRules: adminProcedure.query(async () => {
    try {
      const settings = await StoreLogic.getStoreSettings() as Record<string, unknown>;
      
      return {
        generalMinOrderAmount: Number(settings?.generalMinOrderAmount || 0),
        minOrderMessage: (settings?.minOrderMessage as string) || "",
      };
    } catch {
      // ✅ Removido 'error' não utilizado para satisfazer o ESLint
      throw new TRPCError({ 
        code: "INTERNAL_SERVER_ERROR", 
        message: "Erro ao buscar regras de venda." 
      });
    }
  }),

  /**
   * ✅ ATUALIZAÇÃO DE REGRAS
   * Atualiza o valor mínimo e a mensagem, gerando log de auditoria.
   */
  updateRules: adminProcedure
    .input(z.object({
      generalMinOrderAmount: z.coerce.number().min(0),
      minOrderMessage: z.string().min(1, "A mensagem é obrigatória")
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        // 1. Captura o estado atual para o log
        const oldSettings = await StoreLogic.getStoreSettings() as Record<string, unknown>;
        
        // 2. Executa a atualização no banco
        const result = await StoreLogic.updateStoreSettings(input);

        // 3. Auditoria
        await logAction(ctx, "UPDATE_MARKETING_RULES", "store_settings", {
          entityId: "global",
          old: {
            minAmount: oldSettings?.generalMinOrderAmount,
            message: oldSettings?.minOrderMessage
          },
          new: input
        });

        // ✅ Formatação de moeda para o feedback visual no Toaster
        const formattedAmount = new Intl.NumberFormat('pt-BR', { 
          style: 'currency', 
          currency: 'BRL' 
        }).format(input.generalMinOrderAmount);

        return {
          success: true,
          data: result,
          message: `Regras atualizadas! Novo pedido mínimo: ${formattedAmount}`
        };
      } catch {
        // ✅ Removido 'error' e 'any' não utilizados
        throw new TRPCError({ 
          code: "INTERNAL_SERVER_ERROR", 
          message: "Falha ao salvar e auditar novas regras." 
        });
      }
    }),
});