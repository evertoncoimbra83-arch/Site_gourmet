// server/routers/storefront/cart/index.ts

import { z } from "zod";
import { router, publicProcedure } from "../../../_core/trpc.js";
import { eq, and, or, desc } from "drizzle-orm"; 
import { carts } from "../../../../drizzle/schema/index.js"; 
import crypto from "crypto";
import { TRPCError } from "@trpc/server";

import { cartItemsRouter } from "./items.js";
import { cartRewardsRouter } from "./rewards.js";
import { syncCartState } from "./logic.js";
import { promoteCart } from "../../../auth.js";

export const cartRouter = router({
  items: cartItemsRouter, 
  applyCoupon: cartRewardsRouter.applyCoupon,
  removeCoupon: cartRewardsRouter.removeCoupon,

  toggleLoyalty: publicProcedure
    .input(z.object({ 
      cartId: z.string().optional(), 
      active: z.boolean() 
    }))
    .mutation(async ({ ctx, input }) => {
      const db = ctx.db; 
      const userId = ctx.user?.id ? String(ctx.user.id) : null;
      const guestId = ctx.guestId ? String(ctx.guestId) : null;
      
      const searchCondition = userId 
        ? eq(carts.userId, userId)
        : guestId ? eq(carts.guestId, guestId) : null;

      if (!searchCondition) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Sessão inválida" });
      }

      const [cart] = await db.select().from(carts).where(
        and(
          or(eq(carts.status, "active"), eq(carts.status, "open")),
          searchCondition,
          input.cartId ? eq(carts.id, input.cartId) : undefined 
        )
      ).orderBy(desc(carts.updatedAt)).limit(1);

      if (!cart) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Carrinho não encontrado" });
      }

      await db.update(carts)
        .set({ 
          usesLoyalty: input.active, 
          updatedAt: new Date() 
        })
        .where(eq(carts.id, cart.id));

      return await syncCartState(db, cart.id, userId || undefined);
    }),

  getSummary: publicProcedure
    .query(async ({ ctx }) => {
      const db = ctx.db;
      const userId = ctx.user?.id ? String(ctx.user.id) : null;
      const guestId = ctx.guestId ? String(ctx.guestId) : null; 

      if (!userId && !guestId) return null; 

      // ✅ Merge em background — não bloqueia nem falha o getSummary
      // se duas chamadas paralelas tentarem fazer merge ao mesmo tempo.
      if (userId && guestId) {
        try {
          await promoteCart(guestId, userId);
        } catch (mergeErr) {
          console.warn("[Cart] merge race condition ignorada:", mergeErr);
        }
      }

      const searchCondition = userId ? eq(carts.userId, userId) : eq(carts.guestId, guestId!);

      let [cart] = await db.select().from(carts).where(
        and(
          or(eq(carts.status, "active"), eq(carts.status, "open")),
          searchCondition
        )
      ).orderBy(desc(carts.updatedAt)).limit(1);

      // Se não existe carrinho ativo, cria um novo
      if (!cart) {
        const newCartId = crypto.randomUUID();
        const now = new Date();
        await db.insert(carts).values({
          id: newCartId,
          userId: userId,
          guestId: userId ? null : guestId,
          sessionId: guestId, // Mantendo rastro da sessão original
          status: "active",
          createdAt: now,
          updatedAt: now
        });
        
        const [newCart] = await db.select().from(carts).where(eq(carts.id, newCartId)).limit(1);
        cart = newCart;
      }

      if (!cart) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const result = await syncCartState(db, cart.id, userId || undefined);

      return {
        ...result,
        cartId: cart.id,
        usesLoyalty: !!cart.usesLoyalty // Garante booleano puro
      };
    }),

  getOrCreateCart: publicProcedure
    .mutation(async ({ ctx }) => {
      const db = ctx.db;
      const userId = ctx.user?.id ? String(ctx.user.id) : null;
      const guestId = ctx.guestId ? String(ctx.guestId) : null;

      if (!userId && !guestId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Sessão não identificada." });
      }

      // ✅ Merge em background — não bloqueia nem falha o getSummary
      // se duas chamadas paralelas tentarem fazer merge ao mesmo tempo.
      if (userId && guestId) {
        try {
          await promoteCart(guestId, userId);
        } catch (mergeErr) {
          console.warn("[Cart] merge race condition ignorada:", mergeErr);
        }
      }

      const searchCondition = userId ? eq(carts.userId, userId) : eq(carts.guestId, guestId!);

      const [cart] = await db.select().from(carts).where(
        and(or(eq(carts.status, "active"), eq(carts.status, "open")), searchCondition)
      ).orderBy(desc(carts.updatedAt)).limit(1);

      if (!cart) {
        const newCartId = crypto.randomUUID();
        await db.insert(carts).values({
          id: newCartId,
          userId: userId,
          guestId: userId ? null : guestId,
          sessionId: guestId,
          status: "active",
        });
        return { cartId: newCartId }; 
      }

      return { cartId: cart.id };
    }),
});