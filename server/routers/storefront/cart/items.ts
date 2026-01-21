import { z } from "zod";
import { router, publicProcedure } from "../../../_core/trpc.js";
import { cartItems, carts, dishes, packages } from "../../../../drizzle/schema/index.js";
import { eq, and, or, desc } from "drizzle-orm";
import crypto from "crypto";
import { TRPCError } from "@trpc/server";

// 🎯 Lógica centralizada para totais e descontos
import { syncCartState } from "./logic.js";

const safeFloat = (v: any): number => {
  const n = parseFloat(String(v));
  return isNaN(n) ? 0 : n;
};

export const cartItemsRouter = router({
  addItem: publicProcedure
    .input(z.object({
        dishId: z.union([z.string(), z.number()]).optional().nullable(),
        packageId: z.union([z.string(), z.number()]).optional().nullable(),
        quantity: z.number().min(1),
        totalUnitPrice: z.number().optional().nullable(),
        optionsPayload: z.any().optional().nullable(),
        nutritionPayload: z.any().optional().nullable(),
        cartId: z.string().optional().nullable(),
        guestSessionId: z.string().optional().nullable(), 
    }))
    .mutation(async ({ input, ctx }) => {
      // ✅ Usando o DB do contexto injetado no createContext
      const db = ctx.db;
      const userId = ctx.user?.id ? String(ctx.user.id) : null;
      // ✅ Prioriza o guestId do contexto (header) mas aceita o do input como fallback
      const guestId = input.guestSessionId || ctx.guestId;

      if (!userId && !guestId) {
        throw new TRPCError({ 
          code: "BAD_REQUEST", 
          message: "Identificação de visitante ausente. Tente recarregar a página." 
        });
      }

      // --- 1. PREPARAÇÃO E LIMPEZA DOS DADOS ---
      const optionsClean = input.optionsPayload ? { ...input.optionsPayload } : {};
      const nutritionToSave = input.nutritionPayload ?? optionsClean?.appliedNutrition ?? null;

      if (optionsClean.appliedNutrition) {
        delete optionsClean.appliedNutrition;
      }

      // --- 2. IDENTIFICAÇÃO DO TIPO DE ITEM ---
      let finalDishId: string | null = null;
      let finalPackageId: string | null = null;
      const isPackage = !!(optionsClean.packageName || optionsClean.meals || input.packageId);

      if (isPackage) {
        const rawId = input.packageId || input.dishId;
        finalPackageId = rawId ? String(rawId) : null;
      } else {
        finalDishId = input.dishId ? String(input.dishId) : null;
      }

      // --- 3. GESTÃO DA SESSÃO/CARRINHO ---
      let currentCartId = input.cartId;

      if (!currentCartId) {
        // ✅ Busca carrinho ativo usando a nova lógica de guestId
        const searchCondition = userId 
          ? eq(carts.userId, userId) 
          : eq(carts.guestId, guestId!);

        const [existing] = await db.select().from(carts).where(
          and(
            searchCondition,
            or(eq(carts.status, "open"), eq(carts.status, "active"))
          )
        ).orderBy(desc(carts.updatedAt)).limit(1);

        if (existing) {
          currentCartId = String(existing.id);
        } else {
          const newId = crypto.randomUUID();
          await db.insert(carts).values({
            id: newId,
            userId: userId,
            // ✅ Salva explicitamente no guestId para garantir a persistência anônima
            guestId: userId ? null : guestId, 
            sessionId: guestId, // Mantido para compatibilidade legado
            status: "active",
          } as any);
          currentCartId = newId;
        }
      }

      // --- 4. VALIDAÇÃO DO PRODUTO BASE ---
      let baseItem: any = null;
      if (finalPackageId) {
        const [pkg] = await db.select().from(packages).where(eq(packages.id, finalPackageId)).limit(1);
        baseItem = pkg;
      } else if (finalDishId) {
        // ✅ Corrigido: Busca pratos usando o ID convertido para string/number conforme seu schema
        const [dish] = await db.select().from(dishes).where(eq(dishes.id, finalDishId as any)).limit(1);
        baseItem = dish;
      }

      if (!baseItem) throw new TRPCError({ code: "NOT_FOUND", message: "Produto não encontrado." });

      // --- 5. PERSISTÊNCIA NO BANCO ---
      const unitPrice = safeFloat(input.totalUnitPrice ?? optionsClean?.totalUnitPrice ?? baseItem.price ?? 0);
      const newItemId = crypto.randomUUID();
      const optionsString = JSON.stringify(optionsClean);

      await db.insert(cartItems).values({
        id: newItemId,
        cartId: currentCartId as string,
        dishId: finalDishId, 
        packageId: finalPackageId,
        quantity: input.quantity,
        unitPrice: String(unitPrice), 
        name: optionsClean.packageName || optionsClean.dishName || baseItem.name || "Item",
        imageUrl: baseItem.imageUrl || baseItem.image || null, 
        options: optionsString, 
        appliedNutrition: nutritionToSave ? JSON.stringify(nutritionToSave) : null,
        accompaniments: optionsString, 
      } as any);

      // --- 6. ATUALIZAÇÃO DE TOTAIS ---
      return await syncCartState(db, currentCartId as string, userId || undefined);
    }),

  removeItem: publicProcedure
    .input(z.object({ cartItemId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const db = ctx.db;
      const userId = ctx.user?.id ? String(ctx.user.id) : null;
      const [item] = await db.select().from(cartItems).where(eq(cartItems.id, input.cartItemId)).limit(1);
      
      if (!item) throw new TRPCError({ code: "NOT_FOUND", message: "Item não encontrado." });
      
      await db.delete(cartItems).where(eq(cartItems.id, input.cartItemId));
      return await syncCartState(db, item.cartId, userId || undefined);
    }),

  updateQuantity: publicProcedure
    .input(z.object({ cartItemId: z.string(), quantity: z.number().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const db = ctx.db;
      const userId = ctx.user?.id ? String(ctx.user.id) : null;
      const [item] = await db.select().from(cartItems).where(eq(cartItems.id, input.cartItemId)).limit(1);
      
      if (!item) throw new TRPCError({ code: "NOT_FOUND", message: "Item não encontrado." });
      
      await db.update(cartItems).set({ quantity: input.quantity } as any).where(eq(cartItems.id, input.cartItemId));
      return await syncCartState(db, item.cartId, userId || undefined);
    }),
});