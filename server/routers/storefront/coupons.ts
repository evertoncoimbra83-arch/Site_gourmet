import { z } from "zod";
import { router, publicProcedure } from "../../_core/trpc.js";
import { getDb } from "../../db.js";
import { coupons } from "../../../drizzle/schema/index.js";
import { eq, and, gte, lte, or, isNull } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const couponsRouter = router({
  /**
   * 🎟️ VALIDAR: Usado para verificar a existência e regras do cupom.
   * Feedback: O Interceptor Global cuidará do erro caso o cupom falhe.
   */
  validate: publicProcedure
    .input(z.object({ code: z.string().toUpperCase().trim() }))
    .query(async ({ input }) => {
      const db = await getDb();
      const now = new Date();

      const [coupon] = await db.select().from(coupons).where(
        and(
          eq(coupons.code, input.code),
          eq(coupons.isActive, true),
          // Validação de janela temporal (ou nulo para cupons vitalícios)
          or(isNull(coupons.validFrom), lte(coupons.validFrom, now)),
          or(isNull(coupons.validUntil), gte(coupons.validUntil, now))
        )
      ).limit(1);

      if (!coupon) {
        // Dispara o toast.error no frontend via Interceptor
        throw new TRPCError({ 
          code: "NOT_FOUND", 
          message: "Este cupom não é válido, expirou ou não existe." 
        });
      }

      // Sincronização de campos para garantir que o front receba Numbers puros
      return {
        id: coupon.id,
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: Number(coupon.discountValue || 0),
        minOrderValue: Number(coupon.minOrderValue || 0),
        maxDiscount: coupon.maxDiscount ? Number(coupon.maxDiscount) : null,
        description: coupon.description || ""
      };
    }),
});