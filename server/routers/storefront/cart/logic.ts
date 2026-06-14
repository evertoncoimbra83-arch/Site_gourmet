import { asc, eq, and, sql } from "drizzle-orm";
import {
  cartItems,
  carts,
  coupons,
  couponUsage,
  discountRules,
  loyaltySettings,
} from "../../../../drizzle/schema/index.js";
import * as Loyalty from "../../../loyalty.js";
import { getDb } from "../../../db.js";
import { calculatePricing } from "@shared/domain/cart/pricing";
import { CartItem as DomainCartItem } from "@shared/domain/cart/types";
import { TRPCError } from "@trpc/server";
import { recalculateCartItem } from "../../../orders/logic/recalculateOrder.js";
import { safeNumber } from "../../../lib/safe-parse.js";

type DbType = Awaited<ReturnType<typeof getDb>>;

interface CouponStylingData {
  couponBannerColor?: string | null;
  couponLogoUrl?: string | null;
  couponDescription?: string | null;
}

function safeFloat(val: unknown): number {
  if (val === null || val === undefined || val === "") return 0;
  if (typeof val === "number") return val;
  let str = String(val).trim().replace("R$", "").trim();
  if (str.includes(",")) str = str.replace(/\./g, "").replace(",", ".");
  const num = Number(str);
  return Number.isNaN(num) ? 0 : num;
}

function roundMoney(value: number): number {
  return safeNumber(value.toFixed(2));
}

function isSameJson(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

export async function syncCartState(db: DbType, cartId: string, userId?: string | null) {
  try {
    const [cartData] = await db
      .select({
        id: carts.id,
        userId: carts.userId,
        couponCode: carts.couponCode,
        couponId: carts.couponId,
        usesLoyalty: carts.usesLoyalty,
        shippingValue: carts.shippingValue,
        couponBannerColor: coupons.bannerColor,
        couponLogoUrl: coupons.logoUrl,
        couponDescription: coupons.description,
      })
      .from(carts)
      .leftJoin(coupons, eq(carts.couponId, coupons.id))
      .where(eq(carts.id, cartId))
      .limit(1);

    if (!cartData) return null;

    const activeUserId = userId || cartData.userId || null;
    const itemsRaw = await db
      .select()
      .from(cartItems)
      .where(eq(cartItems.cartId, cartId))
      .orderBy(asc(cartItems.createdAt));

    const validItems: Array<(typeof itemsRaw)[number] & { totalItemPrice: number }> = [];
    const removedInvalidItems: string[] = [];

    for (const item of itemsRaw) {
      try {
        const authoritativeItem = await recalculateCartItem({
          dishId: item.dishId,
          packageId: item.packageId,
          quantity: safeNumber(item.quantity, 1),
          options: item.options || {},
          appliedNutrition: item.appliedNutrition,
        });

        const authoritativeOptions = authoritativeItem.options;
        const authoritativeUnitPrice = roundMoney(authoritativeItem.unitPrice);
        const authoritativeName = authoritativeItem.name;

        const needsUpdate =
          roundMoney(safeFloat(item.unitPrice)) !== authoritativeUnitPrice ||
          String(item.name || "") !== authoritativeName ||
          !isSameJson(item.options || {}, authoritativeOptions);

        if (needsUpdate) {
          await db
            .update(cartItems)
            .set({
              unitPrice: authoritativeUnitPrice.toFixed(2),
              name: authoritativeName,
              options: authoritativeOptions,
            })
            .where(eq(cartItems.id, item.id));
        }

        validItems.push({
          ...item,
          unitPrice: authoritativeUnitPrice.toFixed(2),
          name: authoritativeName,
          options: authoritativeOptions,
          totalItemPrice: roundMoney(authoritativeUnitPrice * safeNumber(item.quantity, 1)),
        });
      } catch (error) {
        const shouldRemove =
          error instanceof TRPCError &&
          (error.code === "BAD_REQUEST" || error.code === "NOT_FOUND");

        if (!shouldRemove) throw error;

        await db.delete(cartItems).where(eq(cartItems.id, item.id));
        removedInvalidItems.push(String(item.id));
      }
    }

    if (validItems.length === 0) {
      const emptyTotals = {
        subtotal: 0,
        shipping: safeFloat(cartData.shippingValue),
        autoDiscount: 0,
        couponDiscount: 0,
        loyaltyDiscount: 0,
        totalDiscounts: 0,
        total: safeFloat(cartData.shippingValue),
        couponCode: cartData.couponCode || null,
        couponError: null as string | null,
      };

      await db
        .update(carts)
        .set({
          discountsJson: JSON.stringify({
            totals: emptyTotals,
            autoDiscountName: null,
            couponError: null,
            removedInvalidItems,
          }),
          discountValue: "0.00",
          userId: activeUserId,
          updatedAt: new Date(),
        })
        .where(eq(carts.id, cartId));

      return {
        cartId,
        totals: emptyTotals,
        items: [],
        usesLoyalty: !!cartData.usesLoyalty,
        autoDiscountName: null,
        couponBannerColor: cartData.couponBannerColor,
        couponLogoUrl: cartData.couponLogoUrl,
        couponDescription: cartData.couponDescription,
        couponError: null,
        removedInvalidItems,
      };
    }

    const rulesRaw = await db
      .select()
      .from(discountRules)
      .where(eq(discountRules.isActive, true))
      .orderBy(asc(discountRules.minQuantity));

    const domainItems: DomainCartItem[] = validItems.map((item) => ({
      id: String(item.id),
      price: safeFloat(item.unitPrice),
      quantity: safeNumber(item.quantity, 1),
      name: item.name || "",
    }));

    const pricingResult = calculatePricing(domainItems, rulesRaw);
    const subtotal = roundMoney(pricingResult.subtotal);

    let autoDiscount = 0;
    let autoDiscountName: string | null = null;
    let couponDiscount = 0;
    let couponError: string | null = null;
    let loyaltyDiscount = 0;

    if (cartData.usesLoyalty && activeUserId) {
      // 1. Fidelidade vence: zera autoDiscount e couponDiscount
      autoDiscount = 0;
      autoDiscountName = null;
      couponDiscount = 0;

      try {
        const loyaltyData = await Loyalty.getUserPoints(activeUserId);
        const points = Math.max(
          0,
          safeNumber(loyaltyData?.current_points ?? loyaltyData?.points, 0),
        );
        const [settings] = await db.select().from(loyaltySettings).limit(1);

        if (settings?.enabled && points > 0) {
          const pointsWorthMoney =
            (points / safeFloat(settings.redemptionRatePoints)) *
            safeFloat(settings.redemptionRateMoney);
          const remainder = subtotal;

          loyaltyDiscount = Math.min(
            pointsWorthMoney,
            remainder,
            safeFloat(settings.maxDiscountAmount),
          );
          loyaltyDiscount = roundMoney(loyaltyDiscount);
        }
      } catch (error) {
        console.error("Erro ao recalcular fidelidade do carrinho:", error);
      }
    } else if (cartData.couponCode) {
      // 2. Cupom vence: zera autoDiscount e loyalty
      autoDiscount = 0;
      autoDiscountName = null;
      loyaltyDiscount = 0;

      const [dbCoupon] = await db
        .select()
        .from(coupons)
        .where(eq(coupons.code, cartData.couponCode))
        .limit(1);

      if (!dbCoupon) {
        couponError = "Cupom inválido ou expirado.";
      } else {
        const minRequired = safeFloat(dbCoupon.minOrderValue);
        if (subtotal < minRequired) {
          couponError = `Faltam R$ ${(minRequired - subtotal)
            .toFixed(2)
            .replace(".", ",")} para ativar este cupom.`;
        } else {
          // Check maxUsesPerCustomer
          let reachedLimit = false;
          if (activeUserId && dbCoupon.maxUsesPerCustomer) {
            const [userUsageRes] = await db
              .select({ count: sql<number>`count(*)` })
              .from(couponUsage)
              .where(and(
                eq(couponUsage.couponId, dbCoupon.id),
                eq(couponUsage.userId, activeUserId)
              ));
            if (safeNumber(userUsageRes.count) >= dbCoupon.maxUsesPerCustomer) {
              couponError = "Limite de uso por cliente atingido.";
              reachedLimit = true;
            }
          }

          if (!reachedLimit) {
            const discountValue = safeFloat(dbCoupon.discountValue);
            const isPercent = String(dbCoupon.discountType)
              .toLowerCase()
              .includes("percent");
            const baseCalc = subtotal;

            couponDiscount = isPercent ? baseCalc * (discountValue / 100) : discountValue;

            const maxDiscount = safeFloat(dbCoupon.maxDiscount);
            if (maxDiscount > 0 && couponDiscount > maxDiscount) couponDiscount = maxDiscount;
            if (couponDiscount > baseCalc) couponDiscount = baseCalc;
            couponDiscount = roundMoney(couponDiscount);
          }
        }
      }
    } else {
      // 3. Progressivo vence
      autoDiscount = roundMoney(pricingResult.discounts);
      autoDiscountName = pricingResult.appliedRule?.name || null;
      couponDiscount = 0;
      loyaltyDiscount = 0;
    }

    const shipping = roundMoney(safeFloat(cartData.shippingValue));
    const totalDiscounts = roundMoney(autoDiscount + couponDiscount + loyaltyDiscount);
    const finalTotal = roundMoney(Math.max(0, subtotal + shipping - totalDiscounts));

    const totals = {
      subtotal,
      shipping,
      autoDiscount,
      couponDiscount,
      loyaltyDiscount,
      totalDiscounts,
      total: finalTotal,
      couponCode: cartData.couponCode || null,
      couponError,
    };

    const styling: CouponStylingData = {
      couponBannerColor: cartData.couponBannerColor || null,
      couponLogoUrl: cartData.couponLogoUrl || null,
      couponDescription:
        cartData.couponDescription || (cartData.couponCode ? "Cupom aplicado" : null),
    };

    await db
      .update(carts)
      .set({
        discountsJson: JSON.stringify({
          totals,
          autoDiscountName,
          couponError,
          ...styling,
          removedInvalidItems,
        }),
        discountValue: totals.totalDiscounts.toFixed(2),
        userId: activeUserId,
        updatedAt: new Date(),
      })
      .where(eq(carts.id, cartId));

    return {
      cartId,
      totals,
      items: validItems,
      usesLoyalty: !!cartData.usesLoyalty,
      autoDiscountName,
      couponBannerColor: cartData.couponBannerColor,
      couponLogoUrl: cartData.couponLogoUrl,
      couponDescription: cartData.couponDescription,
      couponError,
      removedInvalidItems,
    };
  } catch (error) {
    console.error("Erro crítico syncCartState:", error);
    return null;
  }
}
