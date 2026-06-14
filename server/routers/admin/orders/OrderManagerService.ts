// server/routers/admin/orders/OrderManagerService.ts

import { eq, and, sql, isNull, lt, desc, inArray, like } from "drizzle-orm";
import { getDb } from "../../../db";
import * as schema from "../../../../drizzle/schema/index";
import { unseal, getNumericOrderId } from "./AdminOrderHelpers.js";
import { randomUUID } from "crypto";
import { TRPCError } from "@trpc/server";

// ✅ Caminho relativo corrigido para encontrar a pasta workers
import { enqueueBIAnalyticsJob } from "../../../workers/queues/biQueue.js";
import { safeJsonParse, safeNumber } from "../../../lib/safe-parse.js";

// --- INTERFACES ---

interface PaginationParams {
  page: number;
  perPage: number;
  search?: string;
  status?: string;
}

interface AccompanimentItem {
  id?: number | string;
  name?: string;
}

interface OrderOptionsJson {
  accompaniments?: AccompanimentItem[];
  size?: { id: number; name: string };
  [key: string]: unknown;
}



export const FINALIZED_ORDER_STATUSES = ["completed", "cancelled", "delivered"] as const;

function isFinalizedOrderStatus(status: string | null | undefined): boolean {
  return FINALIZED_ORDER_STATUSES.includes(
    String(status || "") as (typeof FINALIZED_ORDER_STATUSES)[number],
  );
}

export const OrderManagerService = {
  async assertOrdersAreMutable(ids: string[]) {
    if (!ids.length) return;

    const db = await getDb();
    const rows = await db
      .select({ id: schema.orders.id, status: schema.orders.status })
      .from(schema.orders)
      .where(inArray(schema.orders.id, ids));

    if (rows.length !== ids.length) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Pedido não encontrado.",
      });
    }

    const blockedOrder = rows.find((row) => isFinalizedOrderStatus(row.status));
    if (blockedOrder) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Pedidos finalizados não podem ser modificados.",
      });
    }
  },

  /**
   * 📋 LISTAGEM DE PEDIDOS COM DESCRIPTOGRAFIA
   */
  async listOrders(input: PaginationParams) {
    const db = await getDb();
    const offset = (input.page - 1) * input.perPage;

    const filters = [];
    if (input.status) {
      filters.push(eq(schema.orders.status, input.status as any));
    }
    if (input.search) {
      filters.push(like(schema.orders.id, `%${input.search.replace("#", "")}%`));
    }
    const whereClause = filters.length > 0 ? and(...filters) : undefined;

    const data = await db.select().from(schema.orders)
      .where(whereClause)
      .limit(input.perPage)
      .offset(offset)
      .orderBy(desc(schema.orders.createdAt));

    const [totalRes] = await db.select({
      count: sql<number>`count(*)`
    }).from(schema.orders)
      .where(whereClause);

    return {
      data: data.map(order => ({
        ...order,
        customerName: unseal(order.customerName),
        customerPhone: unseal(order.customerPhone)
      })),
      total: safeNumber(totalRes?.count)
    };
  },

  /**
   * 🔍 DETALHES COMPLETOS DO PEDIDO (INCLUINDO INGREDIENTES)
   */
  async getById(id: string) {
    const db = await getDb();

    const [order] = await db.select().from(schema.orders).where(eq(schema.orders.id, id)).limit(1);
    if (!order) return null;

    const itemsData = await db
      .select({
        id: schema.orderItems.id,
        orderId: schema.orderItems.orderId,
        dishId: schema.orderItems.dishId,
        name: schema.orderItems.dishName,
        quantity: schema.orderItems.quantity,
        unitPrice: schema.orderItems.unitPrice,
        options: schema.orderItems.options,
        appliedNutrition: schema.orderItems.appliedNutrition,
        mainDishIngredients: sql<string>`(SELECT ingredients FROM dishes WHERE dishes.id = ${schema.orderItems.dishId} LIMIT 1)`
      })
      .from(schema.orderItems)
      .where(eq(schema.orderItems.orderId, id));

    const accompanimentIds = new Set<number>();
    itemsData.forEach(item => {
      try {
        const opts = typeof item.options === 'string'
          ? safeJsonParse<OrderOptionsJson>(item.options, {})
          : safeJsonParse<OrderOptionsJson>(item.options, {});

        if (opts?.accompaniments && Array.isArray(opts.accompaniments)) {
          opts.accompaniments.forEach((acc: AccompanimentItem) => {
            if (acc.id) accompanimentIds.add(safeNumber(acc.id));
          });
        }
      } catch { /* parse fail safe */ }
    });

    const accompMap = new Map<number, string>();
    if (accompanimentIds.size > 0) {
      const accompData = await db
        .select({
          id: schema.accompanimentOptions.id,
          name: schema.accompanimentOptions.name,
          ingredients: schema.accompanimentOptions.ingredients
        })
        .from(schema.accompanimentOptions)
        .where(inArray(schema.accompanimentOptions.id, Array.from(accompanimentIds)));

      accompData.forEach(acc => {
        const text = acc.ingredients ? `${acc.name} (${acc.ingredients})` : acc.name;
        accompMap.set(acc.id, text);
      });
    }

    return {
      ...order,
      customerName: unseal(order.customerName),
      customerPhone: unseal(order.customerPhone),
      items: itemsData.map(item => {
        let accompText = "";
        try {
          const opts = typeof item.options === 'string'
            ? safeJsonParse<OrderOptionsJson>(item.options, {})
            : safeJsonParse<OrderOptionsJson>(item.options, {});

          if (opts?.accompaniments && Array.isArray(opts.accompaniments)) {
            accompText = opts.accompaniments
              .map((acc: AccompanimentItem) => accompMap.get(safeNumber(acc.id)))
              .filter((val): val is string => Boolean(val))
              .join(", ");
          }
        } catch { /* parse fail safe */ }

        return {
          ...item,
          ingredients: item.mainDishIngredients || "",
          accompaniments_ingredients: accompText || "",
          applied_nutrition: item.appliedNutrition
        };
      })
    };
  },

  /**
   * 🔄 ATUALIZAR STATUS E DISPARAR ANALYTICS
   */
  async updateStatus(id: string, status: string, requestId?: string) {
    const db = await getDb();
    await this.assertOrdersAreMutable([id]);

    const result = await db.update(schema.orders)
      .set({ status, updatedAt: new Date() } as typeof schema.orders.$inferInsert)
      .where(eq(schema.orders.id, id));

    const statusForBI = ["completed", "concluded", "shipped", "delivered"];
    if (statusForBI.includes(status)) {
      try {
        await enqueueBIAnalyticsJob(id, {
          removeOnComplete: true,
          attempts: 3,
          backoff: 5000,
        }, requestId);
      } catch (err) {
        console.error("[BI-ANALYTICS] Erro ao disparar fila:", err);
      }
    }

    if (status === "cancelled") {
      const numericId = getNumericOrderId(id.replace("#", ""));
      if (!isNaN(numericId)) {
        await db.delete(schema.biSalesFacts).where(eq(schema.biSalesFacts.orderId, numericId));
        await db.delete(schema.biFinancialFacts).where(eq(schema.biFinancialFacts.orderId, numericId));
      }
    }

    return result;
  },

  /**
   * ❌ EXCLUSÃO DE PEDIDO COM ESTORNO DE PONTOS E LIMPEZA DE BI
   */
  async delete(id: string) {
    const db = await getDb();
    const cleanId = id.replace('#', '');
    const numericId = getNumericOrderId(cleanId);
    await this.assertOrdersAreMutable([cleanId]);

    return await db.transaction(async (tx) => {
      const historyEntries = await tx.select()
        .from(schema.loyaltyHistory)
        .where(eq(schema.loyaltyHistory.orderId, cleanId));

      for (const entry of historyEntries) {
        const refundAmount = -safeNumber(entry.pointsChange);
        if (refundAmount === 0) continue;

        await tx.insert(schema.loyaltyHistory).values({
          id: randomUUID(),
          userId: entry.userId,
          orderId: cleanId,
          pointsChange: refundAmount,
          type: refundAmount > 0 ? "refund_redeem" : "refund_earned",
          reason: "Pedido Excluído (Admin)",
          description: `Estorno automático: Pedido #${cleanId} removido`,
          createdAt: new Date(),
        });

        await tx.update(schema.users)
          .set({ availablePoints: sql`${schema.users.availablePoints} + ${refundAmount}` })
          .where(eq(schema.users.id, entry.userId));
      }

      if (!isNaN(numericId)) {
        await tx.delete(schema.biSalesFacts).where(eq(schema.biSalesFacts.orderId, numericId));
        await tx.delete(schema.biFinancialFacts).where(eq(schema.biFinancialFacts.orderId, numericId));
      }

      await tx.delete(schema.orderItems).where(eq(schema.orderItems.orderId, cleanId));
      await tx.delete(schema.orders).where(eq(schema.orders.id, cleanId));

      return { success: true };
    });
  },

  /**
   * 🛒 BUSCA CARRINHOS ABANDONADOS COM ITENS
   */
  async getAbandonedCarts() {
    const db = await getDb();

    const result = await db.select({
        id: schema.carts.id,
        customerName: schema.users.name,
        customerPhone: schema.users.phone,
        updatedAt: schema.carts.updatedAt,
        subtotal: sql<string>`SUM(${schema.cartItems.unitPrice} * ${schema.cartItems.quantity})`,
        itemCount: sql<number>`COUNT(${schema.cartItems.id})`,
      })
      .from(schema.carts)
      .leftJoin(schema.users, eq(schema.carts.userId, schema.users.id))
      .innerJoin(schema.cartItems, eq(schema.cartItems.cartId, schema.carts.id))
      .where(eq(schema.carts.status, "active"))
      .groupBy(schema.carts.id)
      .orderBy(desc(schema.carts.updatedAt))
      .limit(50);

    return result.map(cart => ({
      ...cart,
      customerName: unseal(cart.customerName) || "Visitante Anônimo",
      customerPhone: unseal(cart.customerPhone),
      total: safeNumber(cart.subtotal)
    }));
  },

  /**
   * 🔍 1. LISTA CARRINHOS ANTIGOS E VAZIOS
   * Usado pelo .query() no router para renderizar o painel sem dar erro.
   */
  async getEmptyOldCarts() {
    const db = await getDb();
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    return db.select({ id: schema.carts.id })
      .from(schema.carts)
      .leftJoin(schema.cartItems, eq(schema.cartItems.cartId, schema.carts.id))
      .where(and(
        isNull(schema.cartItems.id),
        eq(schema.carts.status, "active"),
        lt(schema.carts.updatedAt, oneDayAgo)
      ))
      .groupBy(schema.carts.id)
      .limit(500);
  },

  /**
   * 🧹 2. DELETA CARRINHOS ANTIGOS E VAZIOS
   * Usado pelo .mutation() no router quando você clica em "Limpar"
   */
  async clearEmptyOldCarts() {
    const db = await getDb();
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    await db.delete(schema.carts).where(
      and(
        eq(schema.carts.status, "active"),
        lt(schema.carts.updatedAt, oneDayAgo),
        sql`NOT EXISTS (SELECT 1 FROM cart_items WHERE cart_items.cart_id = ${schema.carts.id})`
      )
    );

    return { success: true };
  },

  /**
   * 🗑️ EXCLUSÃO EM MASSA DE CARRINHOS
   */
  async bulkDeleteCarts(ids: string[]) {
    if (!ids.length) return { success: true, count: 0 };
    const db = await getDb();
    await db.delete(schema.carts).where(inArray(schema.carts.id, ids));
    return { success: true, count: ids.length };
  },
};
