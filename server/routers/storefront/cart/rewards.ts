import { z } from "zod";
import { router, publicProcedure } from "../../../_core/trpc.js";
import { eq, and } from "drizzle-orm";
import { carts, coupons } from "../../../../drizzle/schema/index.js";
import { syncCartState } from "./logic.js";
import { getDb } from "../../../db.js";
import { TRPCError } from "@trpc/server";

export const cartRewardsRouter = router({
  
  // 1. APLICAR CUPOM
  applyCoupon: publicProcedure
    .input(z.object({
      cartId: z.string().uuid(),
      code: z.string().min(1)
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const [coupon] = await db.select()
        .from(coupons)
        .where(
          and(
            eq(coupons.code, input.code.toUpperCase()),
            eq(coupons.isActive, true)
          )
        )
        .limit(1);

      if (!coupon) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Cupom inválido ou expirado."
        });
      }

      await db.update(carts)
        .set({ 
          couponCode: coupon.code,
          couponId: coupon.id,
          discountValue: String(coupon.discountValue || "0"),
          discountType: coupon.discountType,
          discount_type: coupon.discountType 
        } as any)
        .where(eq(carts.id, input.cartId));

      // ✅ Atualizado para usar apenas ctx.user.id
      const targetUserId = ctx.user?.id;
      return await syncCartState(db, input.cartId, targetUserId ? String(targetUserId) : undefined);
    }),

  // 2. REMOVER CUPOM
  removeCoupon: publicProcedure
    .input(z.object({ cartId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      await db.update(carts)
        .set({ 
          couponCode: null, 
          couponId: null,
          discountValue: "0",
          discountType: "fixed",
          discount_type: "fixed"
        } as any)
        .where(eq(carts.id, input.cartId));

      // ✅ Atualizado para usar apenas ctx.user.id
      const targetUserId = ctx.user?.id;
      return await syncCartState(db, input.cartId, targetUserId ? String(targetUserId) : undefined);
    }),

  // 3. ALTERNAR USO DE PONTOS (Fidelidade)
  toggleLoyalty: publicProcedure
    .input(z.object({
      cartId: z.string().uuid(),
      active: z.boolean()
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      
      await db.update(carts)
        .set({ 
          usesLoyalty: input.active, 
          updatedAt: new Date()
        } as any)
        .where(eq(carts.id, input.cartId));

      // ✅ Atualizado para usar apenas ctx.user.id
      const targetUserId = ctx.user?.id;
      
      // 🔥 O syncCartState agora usará o ID correto para buscar o saldo de pontos
      return await syncCartState(db, input.cartId, targetUserId ? String(targetUserId) : undefined);
    }),
});