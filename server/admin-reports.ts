import { eq, desc, or, sql, and, gte, lte, count } from "drizzle-orm";
import { getDb } from "./db";
import { orders, orderItems, dishes } from "../drizzle/schema/index"; 

// =========================================================================
// 1. RELATÓRIOS GERAIS DE VENDAS
// =========================================================================

export async function getDashboardSummary(timeframe: "day" | "week" | "month") {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  let startDate: Date;
  const endDate = new Date();

  switch (timeframe) {
    case "day":
      startDate = new Date(endDate);
      startDate.setDate(endDate.getDate() - 1);
      break;
    case "week":
      startDate = new Date(endDate);
      startDate.setDate(endDate.getDate() - 7);
      break;
    case "month":
      startDate = new Date(endDate);
      startDate.setMonth(endDate.getMonth() - 1);
      break;
    default:
      throw new Error("Timeframe inválido.");
  }

  const timeFilter = and(
    gte(orders.createdAt, startDate), 
    lte(orders.createdAt, endDate)
  );

  // 1. Total de Receita
  const [revenueResult] = await db
    .select({
      revenue: sql<string>`SUM(${orders.total})`,
      count: count(orders.id),
    })
    .from(orders)
    .where(
      and(
        timeFilter,
        or(
          eq(orders.status, "delivered"),
          eq(orders.status, "completed")
        )
      )
    );

  // 2. Análise de Vendas por Dia
  const salesByDay = await db
    .select({
      date: sql<string>`DATE(${orders.createdAt})`, 
      sales: sql<string>`SUM(${orders.total})`,
    })
    .from(orders)
    .where(timeFilter)
    .groupBy(sql`DATE(${orders.createdAt})`) 
    .orderBy(sql`DATE(${orders.createdAt})`); 

  // 3. Produtos mais Vendidos
  const topProducts = await db
    .select({
      name: dishes.name,
      quantity: sql<number>`SUM(${orderItems.quantity})`,
    })
    .from(orderItems)
    .innerJoin(dishes, eq(orderItems.dishId, dishes.id)) 
    .innerJoin(orders, eq(orderItems.orderId, orders.id))
    .where(timeFilter)
    .groupBy(dishes.name)
    .orderBy(sql`SUM(${orderItems.quantity}) DESC`)
    .limit(5);

  return {
    totalRevenue: revenueResult.revenue || "0.00",
    totalOrders: revenueResult.count,
    salesByDay,
    topProducts,
  };
}

// =========================================================================
// 2. RELATÓRIOS DE DETALHE
// =========================================================================

export async function getPaymentMethodReport(startDate: Date, endDate: Date) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const timeFilter = and(
    gte(orders.createdAt, startDate), 
    lte(orders.createdAt, endDate)
  );

  const results = await db
    .select({
      paymentMethod: orders.paymentMethod, 
      totalRevenue: sql<string>`SUM(${orders.total})`,
      totalOrders: count(orders.id),
    })
    .from(orders)
    .where(timeFilter)
    .groupBy(orders.paymentMethod) 
    .orderBy(desc(sql`SUM(${orders.total})`));

  return results;
}

/**
 * Busca o resumo de um pedido específico
 */
export async function getOrderSummary(orderId: string) {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const order = await db
        .select()
        .from(orders)
        .where(eq(orders.id, orderId))
        .limit(1);

    if (!order.length) return null;

    const items = await db
        .select()
        .from(orderItems) 
        .where(eq(orderItems.orderId, orderId));

    return {
        order: order[0],
        items,
    };
}