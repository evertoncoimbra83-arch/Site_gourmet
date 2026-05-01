// server/routers/storefront/cart/items.ts

import { z } from "zod";
import {
  router,
  publicProcedure,
  createRateLimitMiddleware,
} from "../../../_core/trpc.js";
import { cartItems, carts, dishes, packages } from "../../../../drizzle/schema/index.js";
import { eq, and, or, desc } from "drizzle-orm";
import crypto from "crypto";
import { TRPCError } from "@trpc/server";

// 🎯 Lógica de Domínio e Sincronização
import { syncCartState } from "./logic.js";
import { validatePackageIntegrity } from "@shared/domain/packages/validator.js";
import { 
  mapToDatabaseNutrition, 
  NutritionData 
} from "@shared/domain/nutrition/nutrition.js";
import { recalculateCartItem } from "../../../orders/logic/recalculateOrder.js";
import { safeInteger, safeNumber } from "../../../lib/safe-parse.js";

// Importamos os tipos gerados pelo Drizzle para as colunas JSON
type CartItemOptions = typeof cartItems.$inferInsert.options;
type AppliedNutrition = typeof cartItems.$inferInsert.appliedNutrition;

const safeFloat = (v: unknown): number => {
  return safeNumber(v);
};

interface BaseProductInfo {
  name: string;
  price: number;
  imageUrl: string | null;
  minItems: number;
  maxItems: number;
}

interface PackageOptionsPayload {
  meals?: unknown[];
  items?: unknown[];
  customName?: string;
  dishId?: string | number;
  packageId?: string | number;
  isPackage?: boolean;
  appliedNutrition?: unknown;
  [key: string]: unknown;
}

function assertCartOwnership(
  cart: typeof carts.$inferSelect | undefined,
  userId: string | null,
  guestId: string | null | undefined,
) {
  if (!cart) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Carrinho não encontrado." });
  }

  const ownsAsUser = !!userId && cart.userId === userId;
  const ownsAsGuest = !userId && !!guestId && cart.guestId === guestId;

  if (!ownsAsUser && !ownsAsGuest) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Carrinho não pertence à sessão atual." });
  }
}

export const cartItemsRouter = router({
  /**
   * ✅ ADICIONAR ITEM (DISH OU PACKAGE)
   */
  addItem: publicProcedure
    .use(
      createRateLimitMiddleware({
        keyPrefix: "cart-add-item",
        limit: 40,
        windowMs: 5 * 60 * 1000,
      }),
    )
    .input(z.object({
        dishId: z.union([z.string(), z.number()]).optional().nullable(),
        packageId: z.union([z.string(), z.number()]).optional().nullable(),
        quantity: z.number().min(1),
        totalUnitPrice: z.number().optional().nullable(),
        optionsPayload: z.record(z.unknown()).optional().nullable(),
        nutritionPayload: z.union([z.record(z.unknown()), z.array(z.unknown())]).optional().nullable(), 
        cartId: z.string().optional().nullable(),
        guestSessionId: z.string().optional().nullable(), 
    }))
    .mutation(async ({ input, ctx }) => {
      const db = ctx.db;
      const userId = ctx.user?.id ? String(ctx.user.id) : null;
      const guestId = ctx.guestId || input.guestSessionId;

      if (!userId && !guestId) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Sessão expirada ou inválida." });
      }

      const optionsClean = (input.optionsPayload ? { ...input.optionsPayload } : {}) as PackageOptionsPayload;
      
      // ✅ Captura a nutrição, suportando dados do frontend (camelCase ou snake_case)
      const rawNutrition = (input.nutritionPayload ?? optionsClean?.appliedNutrition ?? null) as Record<string, unknown> | null;
      if (optionsClean.appliedNutrition) delete optionsClean.appliedNutrition;

      let rawDishId = input.dishId;
      let rawPackageId = input.packageId;

      if (!rawDishId && !rawPackageId) {
        if (optionsClean.dishId) rawDishId = optionsClean.dishId as string;
        if (optionsClean.packageId) rawPackageId = optionsClean.packageId as string;
      }

      const isPackage = !!(rawPackageId || optionsClean.isPackage);
      const finalDishId = !isPackage && rawDishId ? String(rawDishId) : null;
      const finalPackageId = isPackage && rawPackageId ? String(rawPackageId) : null;

      let baseItem: BaseProductInfo | null = null;
      
      if (finalPackageId) {
        const [pkg] = await db.select().from(packages).where(eq(packages.id, finalPackageId)).limit(1);
        if (pkg) {
          const pkgRef = pkg as Record<string, unknown>;
          
          const basePriceValue = safeFloat(pkgRef.price ?? pkgRef.basePrice ?? pkgRef.base_price ?? 0);
          const salePriceValue = safeFloat(pkgRef.salePrice ?? pkgRef.sale_price ?? 0);
          const finalPrice = (salePriceValue > 0 && salePriceValue < basePriceValue) ? salePriceValue : basePriceValue;

          baseItem = { 
            name: pkg.name, 
            price: finalPrice, 
            imageUrl: pkg.imageUrl ?? null,
            minItems: safeInteger(pkg.numberOfOptions, 0),
            maxItems: safeInteger(pkg.numberOfOptions, 0)
          };
        }
      } else if (finalDishId) {
        const dishId = safeInteger(finalDishId, Number.NaN);
        if (!Number.isFinite(dishId)) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Produto invÃ¡lido." });
        }
        const [dish] = await db.select().from(dishes).where(eq(dishes.id, dishId)).limit(1);
        if (dish) {
          const dishRef = dish as Record<string, unknown>;
          const basePrice = safeFloat(dishRef.price ?? dishRef.basePrice ?? 0);
          const salePrice = safeFloat(dishRef.salePrice ?? 0);
          const finalPrice = (salePrice > 0 && salePrice < basePrice) ? salePrice : basePrice;

          baseItem = { 
            name: dish.name ?? "", 
            price: finalPrice,
            imageUrl: dish.imageUrl ?? null,
            minItems: 0,
            maxItems: 0
          };
        }
      }

      if (!baseItem) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Produto não localizado no catálogo." });
      }

      if (isPackage && finalPackageId) {
        const selectedMeals = (optionsClean.meals || optionsClean.items || []) as unknown[];
        const validation = validatePackageIntegrity({
          packageId: finalPackageId,
          itemsCount: selectedMeals.length,
          minItems: baseItem.minItems,
          maxItems: baseItem.maxItems
        });

        if (!validation.isValid) {
          throw new TRPCError({ code: "BAD_REQUEST", message: validation.message });
        }
      }

      const sessionCondition = userId ? eq(carts.userId, userId) : eq(carts.guestId, guestId!);
      const [existing] = await db.select().from(carts).where(
        and(
          sessionCondition, 
          or(eq(carts.status, "open"), eq(carts.status, "active")),
          input.cartId ? eq(carts.id, input.cartId) : undefined
        )
      ).orderBy(desc(carts.updatedAt)).limit(1);

      let currentCartId: string;
      if (existing) {
        currentCartId = String(existing.id);
      } else {
        currentCartId = crypto.randomUUID();
        await db.insert(carts).values({
          id: currentCartId,
          userId,
          guestId: userId ? null : guestId, 
          status: "active",
        });
      }

      const authoritativeItem = await recalculateCartItem({
        dishId: finalDishId,
        packageId: finalPackageId,
        quantity: input.quantity,
        options: optionsClean,
        appliedNutrition: rawNutrition,
      });

      const finalUnitPrice = authoritativeItem.unitPrice;
      const itemName = authoritativeItem.name;

      // ✅ TRATAMENTO BLINDADO DA NUTRIÇÃO
      let finalNutrition: Record<string, unknown> | null = null;
      
      if (rawNutrition) {
        // Verifica suporte para camelCase ou snake_case
        const kcal = safeFloat(rawNutrition.energyKcal ?? rawNutrition.energy_kcal ?? 0);
        
        if (kcal > 0) {
          // Extrai o itemsTrace para não ser perdido na conversão
          const itemsTrace = rawNutrition.itemsTrace ?? null;
          
          // Mapeia para o padrão do banco
          const mappedDbNutrition = mapToDatabaseNutrition(rawNutrition as unknown as NutritionData);
          
          finalNutrition = {
            ...mappedDbNutrition,
          };

          // Re-injeta o itemsTrace
          if (itemsTrace) {
            finalNutrition.itemsTrace = itemsTrace;
          }
        }
      }

      const newItem = {
        id: crypto.randomUUID(),
        cartId: currentCartId,
        dishId: finalDishId, 
        packageId: finalPackageId,
        quantity: input.quantity,
        unitPrice: String(finalUnitPrice), 
        name: itemName,
        imageUrl: baseItem.imageUrl, 
        options: (Object.keys(authoritativeItem.options).length > 0 ? authoritativeItem.options : null) as CartItemOptions, 
        // Conversão final para o tipo do Drizzle (AppliedNutrition)
        appliedNutrition: finalNutrition as unknown as AppliedNutrition, 
      };

      await db.insert(cartItems).values(newItem);

      const newState = await syncCartState(db, currentCartId, userId || undefined);
      return { ...newState, success: true, message: `${itemName} adicionado!` };
    }),

  /**
   * ✅ REMOVER ITEM
   */
  removeItem: publicProcedure
    .input(z.object({ cartItemId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const db = ctx.db;
      const userId = ctx.user?.id ? String(ctx.user.id) : null;
      const guestId = ctx.guestId || null;

      const [item] = await db.select().from(cartItems).where(eq(cartItems.id, input.cartItemId)).limit(1);
      if (!item) throw new TRPCError({ code: "NOT_FOUND", message: "Item não encontrado." });

      const currentCartId = item.cartId;
      const [cart] = await db.select().from(carts).where(eq(carts.id, currentCartId)).limit(1);
      assertCartOwnership(cart, userId, guestId);

      await db.delete(cartItems).where(eq(cartItems.id, input.cartItemId));

      const newState = await syncCartState(db, currentCartId, userId);
      return { ...newState, success: true };
    }),

  /**
   * ✅ ATUALIZAR QUANTIDADE
   */
  updateQuantity: publicProcedure
    .input(z.object({ 
      cartItemId: z.string(), 
      quantity: z.number().min(1) 
    }))
    .mutation(async ({ input, ctx }) => {
      const db = ctx.db;
      const userId = ctx.user?.id ? String(ctx.user.id) : null;
      const guestId = ctx.guestId || null;

      const [item] = await db.select().from(cartItems).where(eq(cartItems.id, input.cartItemId)).limit(1);
      if (!item) throw new TRPCError({ code: "NOT_FOUND", message: "Item não encontrado." });

      const [cart] = await db.select().from(carts).where(eq(carts.id, item.cartId)).limit(1);
      assertCartOwnership(cart, userId, guestId);

      await db.update(cartItems)
        .set({ quantity: input.quantity })
        .where(eq(cartItems.id, input.cartItemId));

      const newState = await syncCartState(db, item.cartId, userId);
      return { ...newState, success: true };
    }),
});
