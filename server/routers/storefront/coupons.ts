import { z } from "zod";
import { router, publicProcedure } from "../../_core/trpc.js";
import { getDb } from "../../db.js";
import { coupons } from "../../../drizzle/schema/index.js";
import { eq, and, gte, lte, or, isNull } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const couponsRouter = router({
  /**
   * 🎟️ VALIDAR: Usado no checkout/carrinho para aplicar desconto
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
          // Verifica se a data atual está entre validFrom e validUntil (ou se são nulos)
          or(isNull(coupons.validFrom), lte(coupons.validFrom, now)),
          or(isNull(coupons.validUntil), gte(coupons.validUntil, now))
        )
      ).limit(1);

      if (!coupon) {
        throw new TRPCError({ 
          code: "NOT_FOUND", 
          message: "Cupom inválido, expirado ou inexistente." 
        });
      }

      return {
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: Number((coupon as any).discount_value || 0),
        minOrderValue: Number(coupon.minOrderValue || 0),
        maxDiscount: coupon.maxDiscount ? Number(coupon.maxDiscount) : null
      };
    }),
});