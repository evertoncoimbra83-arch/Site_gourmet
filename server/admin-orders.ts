import { getDb } from "./db.js";
import { orders, orderItems, users } from "../drizzle/schema/index.js"; 
import { eq } from "drizzle-orm";

/**
 * Busca detalhes completos de um pedido específico.
 * ✅ orderId alterado para string para suportar os novos UUIDs.
 */
export async function getOrderDetails(orderId: string) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível");

  const [orderRaw] = await db
    .select({
      id: orders.id,
      status: orders.status,
      total: orders.total,
      subtotal: orders.subtotal,
      shippingCost: orders.shippingCost, 
      paymentMethod: orders.paymentMethod,
      createdAt: orders.createdAt,
      userId: orders.userId,
      // Dados do cliente (Snapshot do Pedido + Cadastro)
      customerName: orders.customerName, // ✅ Prioriza o snapshot gravado no pedido
      customerEmail: users.email,
      customerPhone: orders.customerPhone, // ✅ Prioriza o snapshot do pedido
      shippingAddress: orders.shippingAddress, 
      customerDocument: orders.customerDocument, 
      notes: orders.notes
    })
    .from(orders)
    /** ✅ Join utilizando IDs em formato String */
    .leftJoin(users, eq(orders.userId, users.id))
    .where(eq(orders.id, orderId))
    .limit(1);

  if (!orderRaw) throw new Error("Pedido não encontrado");

  /** ✅ Busca itens vinculados usando o orderId (string) */
  const itemsRaw = await db
    .select()
    .from(orderItems)
    .where(eq(orderItems.orderId, orderId));

  /**
   * NOTA: Como você usa o 'encryptedText' no seu schema de orders,
   * o Drizzle descriptografa automaticamente os campos customerName, 
   * shippingAddress e phone ao ler do banco.
   */
  return { 
    order: orderRaw, 
    items: itemsRaw.map(item => ({
      ...item,
      id: String(item.id),
      orderId: String(item.orderId),
      unitPrice: Number(item.unitPrice),
      totalPrice: Number(item.totalPrice)
    })) 
  };
}