import { eq, desc, like, or, sql, and, gte, lte, count, sum } from "drizzle-orm";
import { getDb } from "./db";
// ✅ CORREÇÃO: Importa orderItems (camelCase) diretamente
import { orders, orderItems, dishes, users, user_profiles } from "../drizzle/schema"; 
import { ENV } from "./_core/env";
import { date, z } from "zod";

// Tipos base para o status de pedidos (deve coincidir com o schema)
type OrderStatus = "pending" | "processing" | "shipped" | "delivered" | "cancelled";

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

  // Filtro de tempo básico
  const timeFilter = and(
    // ✅ CORREÇÃO DE COLUNA: created_at -> createdAt
    gte(orders.createdAt, startDate), 
    lte(orders.createdAt, endDate)
  );

  // 1. Total de Receita (apenas pedidos concluídos/entregues)
  const [revenueResult] = await db
    .select({
      // ✅ CORREÇÃO DE COLUNA: total_price -> totalPrice
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

  // 2. Análise de Vendas por Dia (Gráfico)
  const salesByDay = await db
    .select({
      // ✅ CORREÇÃO DE COLUNA: created_at -> createdAt
      date: sql<string>`DATE(${orders.createdAt})`, 
      sales: sql<string>`SUM(${orders.total})`,
    })
    .from(orders)
    .where(timeFilter)
    // ✅ CORREÇÃO DE COLUNA: created_at -> createdAt
    .groupBy(sql`DATE(${orders.createdAt})`) 
    .orderBy(sql`DATE(${orders.createdAt})`); 

  // 3. Produtos mais Vendidos
  const topProducts = await db
    .select({
      name: dishes.name,
      quantity: sql<number>`SUM(${orderItems.quantity})`,
    })
    .from(orderItems) // ✅ orderItems (camelCase)
    // ✅ CORREÇÃO DE COLUNA: dish_id -> dishId
    .innerJoin(dishes, eq(orderItems.dishId, dishes.id)) 
    .innerJoin(orders, eq(orderItems.orderId, orders.id))
    .where(timeFilter) // Filtra pelo tempo
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
    // ✅ CORREÇÃO DE COLUNA: created_at -> createdAt
    gte(orders.createdAt, startDate), 
    lte(orders.createdAt, endDate)
  );

  const results = await db
    .select({
      // ✅ CORREÇÃO DE COLUNA: payment_method -> paymentMethod
      paymentMethod: orders.paymentMethod, 
      totalRevenue: sql<string>`SUM(${orders.total})`,
      totalOrders: count(orders.id),
    })
    .from(orders)
    .where(timeFilter)
    // ✅ CORREÇÃO DE COLUNA: payment_method -> paymentMethod
    .groupBy(orders.paymentMethod) 
    .orderBy(desc(sql`SUM(${orders.total})`));

  return results.map(row => ({
    paymentMethod: row.paymentMethod, // Mapeamento final
    totalRevenue: row.totalRevenue,
    totalOrders: row.totalOrders,
  }));
}

export async function getCustomerAcquisitionReport(startDate: Date, endDate: Date) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const timeFilter = and(
    // ✅ CORREÇÃO DE COLUNA: created_at -> createdAt
    gte(orders.createdAt, startDate), 
    lte(orders.createdAt, endDate)
  );
  
  const [result] = await db
    .select({
      // ✅ CORREÇÃO DE COLUNA: user_id -> userId
      totalCustomers: sql<number>`COUNT(DISTINCT ${orders.userId})`, 
      totalRevenue: sql<string>`SUM(${orders.total})`,
    })
    .from(orders)
    .where(timeFilter);

  return {
    totalCustomers: result.totalCustomers || 0,
    totalRevenue: result.totalRevenue || "0.00",
  };
}

export async function getOrderSummary(orderId: number) {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const order = await db
        .select()
        .from(orders)
        .where(eq(orders.id, orderId));

    if (!order.length) return null;

    const items = await db
        .select()
        .from(orderItems) // ✅ orderItems (camelCase)
        .where(eq(orderItems.orderId, orderId));

    return {
        order: order[0],
        items,
    };
}