import { z } from "zod";
import { adminProcedure, operatorProcedure, router } from "../../_core/trpc.js";
import { inArray, eq, sql, InferSelectModel } from "drizzle-orm"; // ✅ Adicionado InferSelectModel
import { TRPCError } from "@trpc/server";
import { getDb } from "../../db.js";
import * as schema from "../../../drizzle/schema/index.js";
import { compileToZPL, LabelData } from "../../utils/label-compiler.js";

// ✅ Extraímos o tipo do status diretamente do modelo da tabela de pedidos
// Isso evita erros de "Property data does not exist" e mantém o ESLint feliz
type Order = InferSelectModel<typeof schema.orders>;
type OrderStatus = Order["status"];

export const adminLabelsRouter = router({
  
  /**
   * 1. Busca todos os templates de etiquetas salvos
   */
  getTemplates: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB indisponível" });
    return await db.select().from(schema.labelTemplates);
  }),

  /**
   * 2. Busca pedidos que precisam de impressão (Fila de Produção)
   */
  getPending: operatorProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB indisponível" });

    // ✅ Tipagem estrita usando o OrderStatus extraído do Schema
    const validStatuses: OrderStatus[] = [
      'pending', 
      'preparing', 
      'shipped', 
      'delivered', 
      'cancelled', 
      'completed'
    ];

    try {
      return await db
        .select({
          id: schema.orders.id,
          customerName: schema.orders.customerName,
          status: schema.orders.status,
          createdAt: schema.orders.createdAt,
          // ✅ Subquery para somar as marmitas sem depender de colunas inexistentes
          totalItems: sql<number>`(SELECT SUM(quantity) FROM order_items WHERE order_id = ${schema.orders.id})`.mapWith(Number),
        })
        .from(schema.orders)
        .where(
          inArray(schema.orders.status, validStatuses)
        )
        .orderBy(sql`${schema.orders.createdAt} DESC`);
    } catch (err) {
      console.error("Erro ao buscar fila de etiquetas:", err);
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Erro ao carregar fila." });
    }
  }),

  /**
   * 📄 3. Gera o ZPL em lote para os pedidos selecionados
   */
  generateBatchZPL: operatorProcedure
    .input(z.object({
      orderIds: z.array(z.string().min(1)),
      templateId: z.number()
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB indisponível" });

      const [template] = await db
        .select()
        .from(schema.labelTemplates)
        .where(eq(schema.labelTemplates.id, input.templateId))
        .limit(1);

      if (!template) throw new TRPCError({ code: "NOT_FOUND", message: "Template não encontrado" });

      const orders = await db
        .select()
        .from(schema.orders)
        .where(inArray(schema.orders.id, input.orderIds));

      if (orders.length === 0) throw new TRPCError({ code: "NOT_FOUND", message: "Pedidos não encontrados" });

      let fullZPL = "";

      for (const order of orders) {
        const items = await db
          .select({
            orderItem: schema.orderItems,
            dish: schema.dishes
          })
          .from(schema.orderItems)
          .leftJoin(schema.dishes, eq(schema.orderItems.dishId, schema.dishes.id))
          .where(eq(schema.orderItems.orderId, order.id));

        const totalItemsInOrder = items.reduce((acc, i) => acc + (i.orderItem.quantity || 1), 0);
        let currentLabelIndex = 1;

        for (const item of items) {
          const qty = item.orderItem.quantity || 1;
          
          const labelData: LabelData = {
            dishName: item.orderItem.dishName || "Marmita Gourmet",
            customerName: order.customerName || "Cliente",
            ingredients: item.dish?.ingredients || "Consultar site.",
            kcal: String(item.dish?.energyKcal || 0),
            carbs: String(item.dish?.carbs || 0),
            prots: String(item.dish?.proteins || 0),
            fats: String(item.dish?.fatTotal || 0),
            orderId: order.id,
            itemIndex: currentLabelIndex,
            totalItems: totalItemsInOrder
          };

          for (let i = 0; i < qty; i++) {
            fullZPL += compileToZPL(template.elements, labelData) + "\n";
            currentLabelIndex++;
          }
        }
      }

      return { success: true, zplCode: fullZPL, count: orders.length };
    }),

  /**
   * 4. CRUD: Salva ou Atualiza Layouts do Studio
   */
  upsertTemplate: adminProcedure
    .input(z.object({
      id: z.number().optional(),
      name: z.string().min(1),
      width: z.number(),
      height: z.number(),
      elements: z.string(),
      isDefault: z.boolean().optional()
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB indisponível" });
      
      const values = {
        name: input.name,
        width: input.width,
        height: input.height,
        elements: input.elements,
        isDefault: input.isDefault ?? false,
      };

      try {
        if (input.id) {
          await db.update(schema.labelTemplates).set(values).where(eq(schema.labelTemplates.id, input.id));
          return { id: input.id, updated: true };
        }
        
        const [res] = await db.insert(schema.labelTemplates).values(values);
        return { id: res.insertId, updated: false };
      } catch (err) {
        console.error("Erro no upsert:", err);
        throw new TRPCError({ code: "BAD_REQUEST", message: "Erro ao salvar template." });
      }
    }),

  deleteTemplate: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB indisponível" });

      try {
        await db.delete(schema.labelTemplates).where(eq(schema.labelTemplates.id, input.id));
        return { success: true };
      } catch (err) {
        console.error("Erro ao excluir template:", err);
        throw new TRPCError({ code: "BAD_REQUEST", message: "Erro ao excluir template." });
      }
    }),
});
