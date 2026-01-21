import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, publicProcedure, protectedProcedure } from "../../_core/trpc.js";
import { getDb } from "../../db.js";
import { orders, orderItems } from "../../../drizzle/schema/index.js";
import { eq, inArray, desc } from "drizzle-orm";
import { mailer } from "../lib/mailer.js";

/**
 * ✅ Roteador de Pedidos (Storefront)
 */
export const ordersRouter = router({
  
  // 1. LISTAR PEDIDOS
  list: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "BD indisponível" });

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
      .select()
      .from(orderItems)
      .where(inArray(orderItems.orderId, orderIds));

    return baseOrders.map((o) => {
      const items = allItemsRaw
        .filter((item) => item.orderId === o.id)
        .map((item) => ({
          ...item,
          quantity: Number(item.quantity || 1),
          price: Number((item as any).price || 0),
          totalPrice: Number(item.totalPrice || 0),
          options: typeof item.options === 'string' ? JSON.parse(item.options) : item.options,
          appliedNutrition: typeof item.appliedNutrition === 'string' ? JSON.parse(item.appliedNutrition) : item.appliedNutrition,
        }));

      return {
        ...o,
        total: Number(o.total || 0),
        subtotal: Number(o.subtotal || 0),
        shippingCost: Number(o.shippingCost || 0),
        totalDiscount: Number(o.totalDiscount || 0),
        items,
      };
    });
  }),

  // 2. CHECKOUT (Criação do Pedido)
  checkout: publicProcedure
    .input(z.object({
      customerName: z.string(),
      customerEmail: z.string().email(),
      userId: z.string().nullable().optional(), 
      subtotal: z.number(),
      shippingCost: z.number(),
      totalDiscount: z.number(),
      total: z.number(),
      items: z.array(z.object({
        name: z.string(),
        quantity: z.number(),
        price: z.number(),
        options: z.any(),
        nutrition: z.any().optional()
      }))
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "BD indisponível" });

      try {
        // 1. Inserir Pedido Principal
        // ✅ SOLUÇÃO PARA ERRO 2769: Construímos o objeto e usamos 'as any' 
        // para evitar que o TS brigue com a união de tipos do Drizzle (SQL | String | Placeholder)
        const orderValues: any = {
          customerName: input.customerName,
          customerEmail: input.customerEmail,
          subtotal: String(input.subtotal),
          shippingCost: String(input.shippingCost),
          totalDiscount: String(input.totalDiscount),
          total: String(input.total),
          status: "pending",
        };

        // Só injetamos o userId se ele existir, evitando o erro de passar 'null' ou 'undefined'
        if (input.userId) {
          orderValues.userId = String(input.userId);
        }

        const [result]: any = await db.insert(orders).values(orderValues);
        const generatedOrderId = result.insertId;

        // 2. Inserir Itens do Pedido
        // ✅ CORREÇÃO: Certificamos que o objeto bate com as colunas do banco
        const itemsToInsert: any[] = input.items.map(item => ({
          orderId: String(generatedOrderId),
          dishName: item.name,
          quantity: item.quantity,
          price: String(item.price), 
          totalPrice: String(item.price * item.quantity),
          options: JSON.stringify(item.options),
          appliedNutrition: JSON.stringify(item.nutrition || {})
        }));

        await db.insert(orderItems).values(itemsToInsert);

        // 3. 🚀 DISPARO DE E-MAIL
        const emailItems = input.items.map((item) => {
          let details = "";
          if (item.options?._type === "multi") {
            details = item.options.meals.map((m: any) => 
              `• ${m.dishName}: ${m.selectedAccompaniments.map((a: any) => a.name).join(", ")}`
            ).join("<br/>");
          } else if (item.options?._type === "single") {
             const accs = item.options.selectedAccompaniments?.map((a: any) => a.name).join(", ");
             details = accs ? `Acomp: ${accs}` : "Tradicional";
          }
          return { name: item.name, details };
        });

        if (mailer) {
          mailer.sendOrderConfirmation(input.customerEmail, {
            id: String(generatedOrderId),
            customerName: input.customerName,
            total: input.total,
            items: emailItems
          }).catch((err: any) => console.error("📧 Erro SMTP Checkout:", err));
        }

        return {
          success: true,
          orderId: String(generatedOrderId)
        };

      } catch (error: any) {
        console.error("❌ Erro no Checkout:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Falha ao processar pedido: " + error.message
        });
      }
    }),

  // 3. DETALHE PÚBLICO
  getPublicDetail: publicProcedure
    .input(z.object({ orderId: z.string().min(1) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "BD indisponível" });

      const [row] = await db
        .select()
        .from(orders)
        .where(eq(orders.id, input.orderId))
        .limit(1);

      if (!row) throw new TRPCError({ code: "NOT_FOUND", message: "Pedido não encontrado" });

      return {
        ...row,
        total: Number(row.total || 0),
        subtotal: Number(row.subtotal || 0),
        shippingCost: Number(row.shippingCost || 0),
      };
    }),
});