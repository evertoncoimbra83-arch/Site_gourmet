import { router, publicProcedure, adminProcedure } from "../../_core/trpc.js";
import * as PaymentMethodsLogic from "../../paymentMethods.js"; // ✅ Ajustado: subindo 2 níveis
import { z } from "zod";
import { TRPCError } from "@trpc/server";

/**
 * 💳 Roteador de Métodos de Pagamento
 * Atende tanto o Storefront (Checkout) quanto o Admin (Gestão).
 */

const paymentMethodSchema = z.object({
  name: z.string().min(1, "O nome é obrigatório"),
  isActive: z.boolean().optional().default(true),
  discountPercentage: z.coerce.number().min(0).max(100).optional().default(0),
  displayOrder: z.coerce.number().int().optional().default(0),
  description: z.string().optional().nullable(),
  icon: z.string().optional().nullable(),
  brandName: z.string().optional().nullable(),
  brandLogoUrl: z.string().optional().nullable(),
  type: z.string().optional().default("cash"),
});

export const paymentMethodsRouter = router({
  
  // --- 🛒 ÁREA DO CLIENTE (Checkout) ---

  /**
   * Listar métodos ativos para o cliente escolher como pagar.
   */
  list: publicProcedure.query(async () => {
    try {
      return await PaymentMethodsLogic.getActivePaymentMethods();
    } catch (error: any) {
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
    }
  }),

  /**
   * Buscar detalhes de um método específico.
   */
  get: publicProcedure
    .input(z.object({ id: z.coerce.number() }))
    .query(async ({ input }) => {
      const method = await PaymentMethodsLogic.getPaymentMethodById(input.id);
      if (!method) throw new TRPCError({ code: "NOT_FOUND", message: "Método não encontrado." });
      return method;
    }),

  // --- ⚙️ ÁREA ADMINISTRATIVA (adminProcedure) ---

  listAll: adminProcedure.query(async () => {
    try {
      return await PaymentMethodsLogic.getAllPaymentMethods();
    } catch (error: any) {
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
    }
  }),

  create: adminProcedure
    .input(paymentMethodSchema)
    .mutation(async ({ input }) => {
      try {
        return await PaymentMethodsLogic.createPaymentMethod(input);
      } catch (error: any) {
        throw new TRPCError({ code: "BAD_REQUEST", message: error.message });
      }
    }),

  update: adminProcedure
    .input(paymentMethodSchema.partial().extend({ id: z.coerce.number() }))
    .mutation(async ({ input }) => {
      try {
        const { id, ...data } = input;
        return await PaymentMethodsLogic.updatePaymentMethod(id, data);
      } catch (error: any) {
        throw new TRPCError({ code: "BAD_REQUEST", message: error.message });
      }
    }),

  delete: adminProcedure
    .input(z.object({ id: z.coerce.number() }))
    .mutation(async ({ input }) => {
      try {
        return await PaymentMethodsLogic.deletePaymentMethod(input.id);
      } catch (error: any) {
        throw new TRPCError({ code: "CONFLICT", message: error.message });
      }
    }),
});