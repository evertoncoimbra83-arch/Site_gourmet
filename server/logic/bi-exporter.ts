// server/logic/bi-exporter.ts

import { getDb } from "../db"; 
import { orders, orderItems } from "../../drizzle/schema"; 
import { and, gte, lte, inArray, asc } from "drizzle-orm";

/**
 * Interface para garantir a tipagem dos dados formatados
 */
export interface BIExportResult {
  financial: {
    order_id: string;
    payment_method: string | null;
    gross_total: string | number;
    net_total: string | number;
    delivery_fee: string | number;
    discount_total: string | number;
    created_at: Date | null;
    status: string;
  };
  sales: Array<{
    order_id: string;
    dish_id: string | null;
    dish_name: string;
    quantity: number;
    unit_price: string | number;
    created_at: Date | null;
  }>;
}

/**
 * Busca e formata pedidos históricos para sincronização com o BI
 */
export async function getHistoricalOrdersForBI(startDate: string, endDate: string): Promise<BIExportResult[]> {
  // Inicializa o db a partir da função importada
  const db = await getDb();

  try {
    // 1. Buscamos as ordens filtrando por data e status de sucesso
    const historicalOrders = await db.select().from(orders)
      .where(
        and(
          gte(orders.createdAt, new Date(startDate)),
          lte(orders.createdAt, new Date(endDate)),
          inArray(orders.status, ['completed', 'delivered', 'shipped'])
        )
      )
      .orderBy(asc(orders.createdAt));

    if (historicalOrders.length === 0) return [];

    // 2. Extraímos os IDs para buscar os itens
    const orderIds = historicalOrders.map((o) => o.id);

    const items = await db.select().from(orderItems)
      .where(inArray(orderItems.orderId, orderIds));

    // 3. Mapeamento e estruturação dos dados
    return historicalOrders.map((order) => {
      const filteredItems = items.filter((i) => i.orderId === order.id);

      return {
        financial: {
          order_id: order.id,
          payment_method: order.paymentMethod,
          gross_total: order.subtotal,
          net_total: order.total,
          delivery_fee: order.shippingCost,
          discount_total: order.totalDiscount,
          created_at: order.createdAt,
          status: order.status
        },
        sales: filteredItems.map((item) => ({
          order_id: order.id,
          dish_id: item.dishId,
          dish_name: item.dishName ?? "Prato não identificado",
          quantity: item.quantity,
          unit_price: item.unitPrice,
          created_at: order.createdAt
        }))
      };
    });
  } catch (error) {
    console.error("❌ Erro na exportação histórica para BI:", error);
    throw new Error("Falha ao gerar dados para o BI.");
  }
}