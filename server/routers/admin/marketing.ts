import { z } from "zod";
import { router, adminProcedure } from "../../_core/trpc.js";
import * as StoreLogic from "../../storeSettings.js";
import { TRPCError } from "@trpc/server";
import { logAction } from "../../db/lib/audit.js";

/**
 * Roteador de Marketing e Regras de Loja (Admin)
 * Rota: admin.marketing.*
 */
export const adminMarketingRouter = router({
  // Busca as regras de venda (Pedido Mínimo, etc)
  getRules: adminProcedure.query(async () => {
    try {
      const settings = await StoreLogic.getStoreSettings();
      return {
        generalMinOrderAmount: Number(settings.generalMinOrderAmount || 0),
        minOrderMessage: settings.minOrderMessage || "",
      };
    } catch (error) {
      throw new TRPCError({ 
        code: "INTERNAL_SERVER_ERROR", 
        message: "Erro ao buscar regras de venda." 
      });
    }
  }),

  // Atualiza as regras com Auditoria Integrada
  updateRules: adminProcedure
    .input(z.object({
      // Coerce garante a conversão de String -> Number antes de salvar
      generalMinOrderAmount: z.coerce.number().min(0),
      minOrderMessage: z.string().min(1, "A mensagem é obrigatória")
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        // 1. 🔍 Captura o estado atual para o log
        const oldSettings = await StoreLogic.getStoreSettings();
        
        // 2. 📝 Executa a atualização no banco
        const result = await StoreLogic.updateStoreSettings(input);

        // 3. 🛡️ Auditoria: Registra a alteração de política comercial
        await logAction(ctx, "UPDATE_MARKETING_RULES", "store_settings", {
          entityId: "global",
          old: {
            minAmount: oldSettings.generalMinOrderAmount,
            message: oldSettings.minOrderMessage
          },
          new: input
        });

        return result;
      } catch (error: any) {
        console.error("❌ [MARKETING ERROR]:", error);
        throw new TRPCError({ 
          code: "INTERNAL_SERVER_ERROR", 
          message: "Falha ao salvar e auditar novas regras." 
        });
      }
    }),
});