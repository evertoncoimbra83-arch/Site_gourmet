import { TRPCError } from "@trpc/server";
import { eq, and } from "drizzle-orm";
import {
  carts,
  cartItems,
  dishes,
  packages,
  coupons,
} from "../../../../drizzle/schema/index.js";
import { MySqlTransaction } from "drizzle-orm/mysql-core";
import { safeJsonParse, safeNumber } from "../../../lib/safe-parse.js";

function num(value: unknown): number {
  return safeNumber(value);
}

export async function loadCartAndSnapshot(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  tx: MySqlTransaction<any, any, any, any>,
  userId: string | null,
  cartId?: string,
) {
  const cartQuery = tx
    .select({
      id: carts.id,
      userId: carts.userId,
      status: carts.status,
      couponCode: carts.couponCode,
      couponId: carts.couponId,
      shippingValue: carts.shippingValue,
      discountsJson: carts.discountsJson,
      usesLoyalty: carts.usesLoyalty,
      couponBannerColor: coupons.bannerColor,
      couponLogoUrl: coupons.logoUrl,
      couponDescription: coupons.description,
    })
    .from(carts)
    .leftJoin(coupons, eq(carts.couponId, coupons.id));

  if (cartId) {
    cartQuery.where(eq(carts.id, cartId));
  } else if (userId) {
    cartQuery.where(and(eq(carts.userId, userId), eq(carts.status, "active")));
  } else {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Carrinho nao identificado.",
    });
  }

  const [cart] = await cartQuery.limit(1);
  if (!cart) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Carrinho nao encontrado." });
  }

  let totals = {
    subtotal: 0,
    shipping: 0,
    autoDiscount: 0,
    couponDiscount: 0,
    loyaltyDiscount: 0,
    total: 0,
    couponError: null as string | null,
  };

  if (cart.discountsJson) {
    const parsed = safeJsonParse<Record<string, unknown>>(cart.discountsJson, {});
    const t = (parsed.totals || parsed) as Record<string, unknown>;

    totals = {
      subtotal: num(t.subtotal),
      shipping: num(t.shipping || cart.shippingValue),
      autoDiscount: num(t.autoDiscount),
      couponDiscount: num(t.couponDiscount),
      loyaltyDiscount: num(t.loyaltyDiscount || 0),
      total: num(t.total || t.final),
      couponError: (t.couponError as string) || null,
    };
  }

  const items = await tx
    .select({
      id: cartItems.id,
      dishId: cartItems.dishId,
      packageId: cartItems.packageId,
      quantity: cartItems.quantity,
      unitPrice: cartItems.unitPrice,
      options: cartItems.options,
      appliedNutrition: cartItems.appliedNutrition,
      dishName: dishes.name,
      packageName: packages.name,
      dishPrice: dishes.basePrice,
      packagePrice: packages.price,
    })
    .from(cartItems)
    .leftJoin(dishes, eq(cartItems.dishId, dishes.id))
    .leftJoin(packages, eq(cartItems.packageId, packages.id))
    .where(eq(cartItems.cartId, cart.id));

  if (!items.length) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Sacola vazia." });
  }

  const normalizedItems = items.map((item) => {
    const opts = safeJsonParse<Record<string, unknown>>(item.options, {});
    const finalName =
      (opts.dishName as string) ||
      (opts.packageName as string) ||
      item.dishName ||
      item.packageName ||
      "Item";
    const finalUnitPrice = num(
      item.unitPrice || opts.totalUnitPrice || item.dishPrice || item.packagePrice,
    );

    return {
      ...item,
      name: finalName,
      options: opts,
      unitPrice: finalUnitPrice,
      totalItemPrice: safeNumber((finalUnitPrice * num(item.quantity)).toFixed(2)),
    };
  });

  return {
    cart,
    items: normalizedItems,
    totals: {
      ...totals,
      totalDiscounts: safeNumber(
        (
          totals.autoDiscount +
          totals.couponDiscount +
          totals.loyaltyDiscount
        ).toFixed(2),
      ),
    },
    details: {
      couponCode: cart.couponCode,
      couponError: totals.couponError,
      autoDiscountName:
        (cart as Record<string, unknown>).autoDiscountName || "Desconto Progressivo",
      couponBannerColor: cart.couponBannerColor || null,
      couponLogoUrl: cart.couponLogoUrl || null,
      couponDescription:
        cart.couponDescription || (cart.couponCode ? "Cupom Aplicado" : null),
    },
  };
}
