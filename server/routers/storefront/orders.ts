// ROTA: /storefront/orders
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, publicProcedure, protectedProcedure } from "../../_core/trpc.js";
import { getDb } from "../../db.js";
import { orders, orderItems, dishes, packages } from "../../../drizzle/schema/index.js"; 
import { eq, inArray, desc } from "drizzle-orm";
import { safeJsonParse as parseJsonSafe, safeNumber } from "../../lib/safe-parse.js";
import { logger } from "../../logger.js";

type DbClient = Awaited<ReturnType<typeof getDb>>;

// --- Interfaces de Tipagem Estrita ---

interface OrderItemParsed {
  id: string;
  orderId: string;
  dishId: number | null;
  packageId: number | null;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  options: Record<string, unknown>;
  appliedNutrition: Record<string, unknown> | null;
  dishName: string;
  sizeName: string | null;
  imageUrl?: string | null;
}

/**
 * ✅ HELPER: Parse seguro de JSON sem o uso de 'any'
 */
function safeJsonParse(value: unknown): Record<string, unknown> {
  if (!value) return {};
  if (typeof value !== "string") {
    return (value && typeof value === "object") 
      ? (value as Record<string, unknown>) 
      : {};
  }
  try {
    const parsed = parseJsonSafe<unknown>(value, {});
    return (parsed && typeof parsed === "object") ? (parsed as Record<string, unknown>) : {};
  } catch (e) {
    console.error("❌ Erro ao parsear JSON no backend:", e);
    return {};
  }
}

/**
 * 📦 Busca detalhes completos de um pedido com itens
 */
async function fetchOrderWithItems(db: NonNullable<DbClient>, orderId: string) {
  const [order] = await db
    .select()
    .from(orders)
    .where(eq(orders.id, orderId))
    .limit(1);

  if (!order) throw new TRPCError({ code: "NOT_FOUND", message: "Pedido não encontrado." });

  const itemsRaw = await db
    .select({
      id: orderItems.id,
      orderId: orderItems.orderId,
      dishId: orderItems.dishId,
      packageId: orderItems.packageId,
      dishName: orderItems.dishName,
      sizeName: orderItems.sizeName,
      quantity: orderItems.quantity,
      unitPrice: orderItems.unitPrice,
      discountAmount: orderItems.discountAmount,
      totalPrice: orderItems.totalPrice,
      options: orderItems.options,
      appliedNutrition: orderItems.appliedNutrition,
      dishImage: dishes.imageUrl,
      packageImage: packages.imageUrl,
    })
    .from(orderItems)
    .leftJoin(dishes, eq(orderItems.dishId, dishes.id))
    .leftJoin(packages, eq(orderItems.packageId, packages.id))
    .where(eq(orderItems.orderId, order.id));

  const items: OrderItemParsed[] = itemsRaw.map((i) => ({
    ...i,
    dishId: i.dishId ? Number(i.dishId) : null,
    packageId: i.packageId ? Number(i.packageId) : null,
    quantity: safeNumber(i.quantity, 1),
    unitPrice: safeNumber(i.unitPrice),
    totalPrice: safeNumber(i.totalPrice),
    options: safeJsonParse(i.options),
    appliedNutrition: safeJsonParse(i.appliedNutrition),
    imageUrl: i.dishImage || i.packageImage || null,
  }));

  return {
    ...order,
    total: safeNumber(order.total),
    subtotal: safeNumber(order.subtotal),
    shippingCost: safeNumber(order.shippingCost),
    totalDiscount: safeNumber(order.totalDiscount),
    pointsEarned: safeNumber(order.pointsEarned),
    pointsUsed: safeNumber(order.pointsUsed),
    items
  };
}

export const ordersRouter = router({
  /**
   * 📋 Lista pedidos do usuário logado (Protegido)
   */
  list: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Banco indisponível" });
    
    const userId = String(ctx.user.id);

    const baseOrders = await db
      .select()
      .from(orders)
      .where(eq(orders.userId, userId))
      .orderBy(desc(orders.createdAt))
      .limit(50);

    if (baseOrders.length === 0) return [];

    const orderIds = baseOrders.map((o) => o.id);
    const allItemsRaw = await db
      .select({
        id: orderItems.id,
        orderId: orderItems.orderId,
        dishId: orderItems.dishId,
        packageId: orderItems.packageId,
        dishName: orderItems.dishName,
        sizeName: orderItems.sizeName,
        quantity: orderItems.quantity,
        unitPrice: orderItems.unitPrice,
        discountAmount: orderItems.discountAmount,
        totalPrice: orderItems.totalPrice,
        options: orderItems.options,
        appliedNutrition: orderItems.appliedNutrition,
        dishImage: dishes.imageUrl,
        packageImage: packages.imageUrl,
      })
      .from(orderItems)
      .leftJoin(dishes, eq(orderItems.dishId, dishes.id))
      .leftJoin(packages, eq(orderItems.packageId, packages.id))
      .where(inArray(orderItems.orderId, orderIds));

    return baseOrders.map((o) => {
      const orderItemsFiltered: OrderItemParsed[] = allItemsRaw
        .filter((item) => item.orderId === o.id)
        .map((item) => ({
          ...item,
          dishId: item.dishId ? Number(item.dishId) : null,
          packageId: item.packageId ? Number(item.packageId) : null,
          quantity: safeNumber(item.quantity, 1),
          unitPrice: safeNumber(item.unitPrice), 
          totalPrice: safeNumber(item.totalPrice),
          options: safeJsonParse(item.options),
          appliedNutrition: safeJsonParse(item.appliedNutrition),
          imageUrl: item.dishImage || item.packageImage || null,
        }));

      return {
        ...o,
        // ✅ CORREÇÃO CODEX: Coerção total aplicada no list para manter consistência com o fetch individual
        total: safeNumber(o.total),
        subtotal: safeNumber(o.subtotal),
        shippingCost: safeNumber(o.shippingCost),
        totalDiscount: safeNumber(o.totalDiscount),
        pointsEarned: safeNumber(o.pointsEarned),
        pointsUsed: safeNumber(o.pointsUsed),
        items: orderItemsFiltered,
      };
    });
  }),

  getPublicDetail: protectedProcedure
    .input(z.object({ orderId: z.string() }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const order = await fetchOrderWithItems(db, input.orderId);
      if (String(order.userId) !== String(ctx.user.id)) {
        logger.warn(
          {
            orderId: input.orderId,
            userId: ctx.user.id,
            ownerId: order.userId,
            ip: ctx.req?.ip,
          },
          "[SECURITY] Tentativa invalida de acesso a pedido",
        );
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Pedido nao pertence ao usuario.",
        });
      }
      return order;
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const order = await fetchOrderWithItems(db, input.id);
      if (String(order.userId) !== String(ctx.user.id)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Pedido não pertence ao usuário." });
      }
      return order;
    }),
});
