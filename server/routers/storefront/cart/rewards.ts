import { z } from "zod";
import { router, publicProcedure } from "../../../_core/trpc.js";
import { eq, and } from "drizzle-orm";
import { carts, coupons } from "../../../../drizzle/schema/index.js";
import { syncCartState } from "./logic.js";
import { getDb } from "../../../db.js";
import { TRPCError } from "@trpc/server";

// ✅ CORREÇÃO FINAL:
// Usamos Omit para remover as definições originais rígidas de 'discountValue' e 'couponId'.
// Redefinimos ambas para aceitar 'string | number | null', resolvendo o conflito de tipos.
type CartUpdate = Omit<Partial<typeof carts.$inferInsert>, 'discountValue' | 'couponId'> & {
  discount_type?: string | null;
  discountValue?: number | string | null;
  couponId?: string | number | null;
};

async function assertCartOwnership(
  db: Awaited<ReturnType<typeof getDb>>,
  cartId: string,
  userId: string | null,
  guestId: string | null,
) {
  if (!db) throw new Error("Database unavailable");

  const [cart] = await db.select().from(carts).where(eq(carts.id, cartId)).limit(1);
  if (!cart) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Carrinho não encontrado." });
  }

  const ownsAsUser = !!userId && cart.userId === userId;
  const ownsAsGuest = !userId && !!guestId && cart.guestId === guestId;

  if (!ownsAsUser && !ownsAsGuest) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Carrinho não pertence à sessão atual." });
  }
}

export const cartRewardsRouter = router({
  
  /**
   * ✅ APLICAR CUPOM
   */
  applyCoupon: publicProcedure
    .input(z.object({
      cartId: z.string().uuid(),
      code: z.string().min(1)
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const targetUserId = ctx.user?.id ? String(ctx.user.id) : null;
      const targetGuestId = ctx.guestId ? String(ctx.guestId) : null;
      await assertCartOwnership(db, input.cartId, targetUserId, targetGuestId);

      const [coupon] = await db.select()
        .from(coupons)
        .where(
          and(
            eq(coupons.code, input.code.toUpperCase().trim()),
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

      // ✅ Objeto tipado com a nossa definição flexível CartUpdate
      const updateData: CartUpdate = {
        couponCode: coupon.code,
        couponId: coupon.id, // Agora aceita string ou number sem erro
        discountValue: Number(coupon.discountValue || 0),
        discount_type: coupon.discountType 
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await db.update(carts).set(updateData as any).where(eq(carts.id, input.cartId));

      const newState = await syncCartState(db, input.cartId, targetUserId || undefined);

      return {
        ...newState,
        success: true,
        message: `Cupom "${coupon.code}" aplicado com sucesso!`
      };
    }),

  /**
   * ✅ REMOVER CUPOM
   */
  removeCoupon: publicProcedure
    .input(z.object({ cartId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const targetUserId = ctx.user?.id ? String(ctx.user.id) : null;
      const targetGuestId = ctx.guestId ? String(ctx.guestId) : null;
      await assertCartOwnership(db, input.cartId, targetUserId, targetGuestId);

      const updateData: CartUpdate = {
        couponCode: null, 
        couponId: null,
        discountValue: 0,
        discount_type: "fixed"
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await db.update(carts).set(updateData as any).where(eq(carts.id, input.cartId));

      const newState = await syncCartState(db, input.cartId, targetUserId || undefined);

      return {
        ...newState,
        success: true,
        message: "Cupom removido do carrinho."
      };
    }),

  /**
   * ✅ ALTERNAR FIDELIDADE
   */
  toggleLoyalty: publicProcedure
    .input(z.object({
      cartId: z.string().uuid(),
      active: z.boolean()
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const targetUserId = ctx.user?.id ? String(ctx.user.id) : null;
      const targetGuestId = ctx.guestId ? String(ctx.guestId) : null;
      await assertCartOwnership(db, input.cartId, targetUserId, targetGuestId);
      
      const updateData: CartUpdate = {
        usesLoyalty: input.active, 
        updatedAt: new Date()
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await db.update(carts).set(updateData as any).where(eq(carts.id, input.cartId));

      const newState = await syncCartState(db, input.cartId, targetUserId || undefined);

      return {
        ...newState,
        success: true,
        message: input.active 
          ? "Seu saldo de pontos foi aplicado como desconto!" 
          : "Desconto de pontos removido."
      };
    }),
});
