import { and, eq, inArray, lte, or } from "drizzle-orm";
import {
  orders,
  orderItems,
  cartItems,
  carts,
  loyaltyHistory,
} from "../../../../drizzle/schema/index.js";
import { decrypt, encrypt } from "../../../encryption.js";
import crypto from "crypto";
import { MySqlTransaction } from "drizzle-orm/mysql-core";
import { ExtractTablesWithRelations } from "drizzle-orm";
import * as schema from "../../../../drizzle/schema/index.js";
import { MySql2PreparedQueryHKT, MySql2QueryResultHKT } from "drizzle-orm/mysql2";
import { safeJsonParse, safeNumber } from "../../../lib/safe-parse.js";

// --- TIPAGENS ---

type TransactionType = MySqlTransaction<
  MySql2QueryResultHKT, 
  MySql2PreparedQueryHKT, 
  typeof schema, 
  ExtractTablesWithRelations<typeof schema>
>;

type NewOrderItem = typeof orderItems.$inferInsert;
type NewLoyaltyHistory = typeof loyaltyHistory.$inferInsert;

interface AddressSnapshot {
  street?: string;
  address?: string;
  text?: string;
  number?: string;
  neighborhood?: string;
  complement?: string;
  city?: string;
  state?: string;
  zipCode?: string; // ✅ Padronizado para camelCase
  zip?: string;
  price?: number | string;
}

export type VerifiedOrderItem = {
  dishId?: string | null;
  packageId?: string | null;
  name?: string;
  unitPrice?: number | string;
  totalPrice?: number | string;
  quantity?: number;
  options?: Record<string, unknown>;
  appliedNutrition?: unknown;
};

type CartItemLike = {
  dishId?: string | null;
  packageId?: string | null;
  name?: string;
  unitPrice?: number | string;
  quantity?: number;
  options?: string | Record<string, unknown>;
  appliedNutrition?: string | Record<string, unknown>;
};

interface CartItemRow extends CartItemLike {
  cart_items?: CartItemLike;
  cartItems?: CartItemLike;
}

/**
 * ✅ GERAÇÃO DE ID AMIGÁVEL
 */
function generateFriendlyOrderId() {
  const date = new Date();
  const year = String(date.getFullYear()).slice(-2);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const random = crypto.randomBytes(2).toString("hex").toUpperCase();
  return `GS-${year}${month}-${random}`;
}

export function computeFinalNet(subtotal: number, shipping: number, discounts: number) {
  return Math.max(0, safeNumber((subtotal + shipping - discounts).toFixed(2)));
}

function safeDecrypt(value: unknown): string {
  if (!value || typeof value !== "string") return String(value ?? "");
  if (value.includes(":")) {
    try {
      const decrypted = decrypt(value);
      return decrypted || value;
    } catch {
      return value;
    }
  }
  return value;
}

function safeJsonParseRecord(value: unknown): Record<string, unknown> {
  if (!value) return {};
  const parsed = safeJsonParse<Record<string, unknown>>(value, {});
  return parsed && typeof parsed === "object" && !Array.isArray(parsed)
    ? parsed
    : {};
}

function toNumber(v: number | string | undefined | null, fallback = 0): number {
  return safeNumber(v, fallback);
}

/**
 * 📦 PERSISTÊNCIA DO PEDIDO
 */
export async function createOrderWithItems(params: {
  tx: TransactionType;
  userId: string;
  input: {
    shippingType: "delivery" | "pickup";
    customerName: string;
    customerDocument: string;
    customerPhone: string;
    notes?: string | null;
  };
  shippingCost: number;
  totals: {
    subtotal: number | string;
    totalDiscounts: number | string;
    loyaltyDiscount?: number | string;
  };
  details: Record<string, unknown>;
  addressSnap: AddressSnapshot;
  payMethod: { name: string } | undefined;
  verifiedItems: VerifiedOrderItem[];
  pointsUsed: number;
  pointsEarned: number;
  finalNet: number;
}) {
  const {
    tx,
    userId,
    input,
    shippingCost,
    totals,
    details,
    addressSnap,
    payMethod,
    verifiedItems,
    pointsUsed,
    pointsEarned,
    finalNet,
  } = params;

  const newOrderId = generateFriendlyOrderId();

  // Descriptografa campos do snapshot caso venham criptografados (ex: de um endereço salvo anteriormente)
  const street = safeDecrypt(addressSnap.street || addressSnap.address || addressSnap.text || (input.shippingType === "pickup" ? "Retirada" : ""));
  const number = safeDecrypt(addressSnap.number);
  const neighborhood = safeDecrypt(addressSnap.neighborhood);
  const complement = safeDecrypt(addressSnap.complement);
  const city = safeDecrypt(addressSnap.city);
  const state = safeDecrypt(addressSnap.state);
  const zip = safeDecrypt(addressSnap.zipCode || addressSnap.zip);

  const orderValues: typeof orders.$inferInsert = {
    id: newOrderId,
    userId: userId,
    status: "pending",
    subtotal: toNumber(totals.subtotal).toFixed(2),
    shippingCost: toNumber(shippingCost).toFixed(2),
    totalDiscount: toNumber(totals.totalDiscounts).toFixed(2),
    total: toNumber(finalNet).toFixed(2),
    paymentMethod: payMethod?.name || "Não informado",
    paymentStatus: "pending",
    // ✅ Campos de endereço são BLOB/Encrypted no DB, usamos encrypt()
    shippingAddress: encrypt(street),
    shippingAddressNumber: encrypt(number),
    shippingAddressComplement: encrypt(complement),
    shippingNeighborhood: encrypt(neighborhood),
    shippingCity: city,
    shippingState: state,
    shippingZipCode: zip,
    customerName: encrypt(input.customerName),
    customerDocument: encrypt(input.customerDocument),
    customerPhone: encrypt(input.customerPhone),
    discountsSnapshot: JSON.stringify({ ...details, totals }),
    notes: input.notes || "",
  };

  await tx.insert(orders).values(orderValues);

  if (userId) {
    try {
      const historyEntries: NewLoyaltyHistory[] = [];

      if (pointsUsed > 0) {
        historyEntries.push({
          id: crypto.randomUUID(),
          userId: userId,
          pointsChange: -Math.abs(pointsUsed),
          type: "redeemed",
          reason: "order_redemption",
          orderId: newOrderId,
        });
      }

      if (pointsEarned > 0) {
        historyEntries.push({
          id: crypto.randomUUID(),
          userId: userId,
          pointsChange: Math.abs(pointsEarned),
          type: "earned",
          reason: "order_cashback",
          orderId: newOrderId,
        });
      }

      if (historyEntries.length > 0) {
        await tx.insert(loyaltyHistory).values(historyEntries);
      }
    } catch (err) {
      console.error(`Erro fidelidade ${newOrderId}:`, err);
    }
  }

  if (verifiedItems?.length) {
    const itemsToInsert: NewOrderItem[] = verifiedItems.map((cItem) => {
      const opts = safeJsonParseRecord(cItem.options);
      const unitPrice = toNumber(cItem.unitPrice);
      const qty = Math.max(1, toNumber(cItem.quantity, 1));
      const totalPrice = toNumber(cItem.totalPrice, unitPrice * qty);

      const dishName =
        (typeof opts.dishName === "string" && opts.dishName) ||
        (typeof opts.packageName === "string" && opts.packageName) ||
        cItem.name ||
        "Item";

      return {
        id: `ITM-${crypto.randomBytes(3).toString("hex").toUpperCase()}`,
        orderId: newOrderId,
        dishId: cItem.dishId ? String(cItem.dishId) : null,
        packageId: cItem.packageId ? String(cItem.packageId) : null,
        dishName: dishName,
        quantity: qty,
        unitPrice: unitPrice.toFixed(2),
        totalPrice: totalPrice.toFixed(2),
        options: JSON.stringify(opts),
        appliedNutrition: cItem.appliedNutrition
          ? typeof cItem.appliedNutrition === "string"
            ? cItem.appliedNutrition
            : JSON.stringify(cItem.appliedNutrition)
          : null,
      };
    });

    await tx.insert(orderItems).values(itemsToInsert);
  }

  return newOrderId;
}

/**
 * 🧹 LIMPEZA DE CARRINHO
 */
export async function cleanupCart(tx: TransactionType, cartId: string) {
  if (!cartId) return;
  await tx.delete(cartItems).where(eq(cartItems.cartId, cartId));
  await tx.update(carts).set({
    status: "completed",
    discountsJson: null,
    couponCode: null,
    updatedAt: new Date(),
  }).where(eq(carts.id, cartId));
}

export async function cleanupCheckoutCarts(
  tx: TransactionType,
  params: {
    cartId: string;
    userId: string;
    guestId?: string | null;
    closedBefore: Date;
  },
) {
  const cartIds = new Set<string>([params.cartId]);

  const ownerConditions = [eq(carts.userId, params.userId)];
  if (params.guestId) {
    ownerConditions.push(eq(carts.guestId, params.guestId));
    ownerConditions.push(eq(carts.sessionId, params.guestId));
  }

  const activeCarts = await tx
    .select({ id: carts.id })
    .from(carts)
    .where(
      and(
        or(eq(carts.status, "active"), eq(carts.status, "open")),
        or(...ownerConditions),
        lte(carts.updatedAt, params.closedBefore),
      ),
    );

  for (const cart of activeCarts) {
    cartIds.add(String(cart.id));
  }

  const ids = Array.from(cartIds);
  if (ids.length === 0) return;

  await tx.delete(cartItems).where(inArray(cartItems.cartId, ids));
  await tx
    .update(carts)
    .set({
      status: "completed",
      discountsJson: null,
      couponCode: null,
      updatedAt: new Date(),
    })
    .where(inArray(carts.id, ids));
}
