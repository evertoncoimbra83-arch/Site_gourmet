import { z } from "zod";
import { router, adminProcedure } from "../../_core/trpc.js"; 
import { getDb } from "../../db.js"; 
import { TRPCError } from "@trpc/server";
import { eq, desc, like, or, sql } from "drizzle-orm";
import { decrypt } from "../../encryption.js";
import { logAction } from "../../db/lib/audit.js";

import { 
  orders, 
  orderItems, 
  users, 
  loyaltyHistory, 
  couponUsage,
  appConfigs
} from "../../../drizzle/schema/index.js";

// --- HELPERS ---
const safeDecrypt = (val: any): string => {
  if (!val) return "";
  try {
    const str = String(val).trim();
    if (str.includes(':')) {
      const decrypted = decrypt(str);
      return decrypted || str;
    }
    return str;
  } catch (err) {
    return String(val);
  }
};

const safeJsonParse = (val: any): any => {
  if (!val || val === "null") return null;
  if (typeof val === 'object') return val;
  try {
    return JSON.parse(String(val));
  } catch { return null; }
};

const resolveCustomerName = (orderName: string | null, userName: string | null) => {
  const decryptedOrderName = safeDecrypt(orderName || "");
  if (!decryptedOrderName || decryptedOrderName === "Cliente WP") {
    return safeDecrypt(userName || "") || "Cliente Visitante";
  }
  return decryptedOrderName;
};

export const ordersAdminRouter = router({
  
  // ✅ 1. BUSCAR CONFIGURAÇÃO (Corrigido para aceitar chave específica)
  getConfig: adminProcedure
    .input(z.object({ key: z.string().optional() }).optional())
    .query(async ({ input }) => {
      const db = await getDb();
      if (input?.key) {
        const [config] = await db.select().from(appConfigs).where(eq(appConfigs.configKey, input.key)).limit(1);
        return config || null;
      }
      
      const configs = await db.select().from(appConfigs);
      const configObj: Record<string, any> = {};
      configs.forEach(c => { 
        configObj[c.configKey] = c.configValue; 
      });
      return configObj;
    }),

  // ✅ 2. SALVAR CONFIGURAÇÃO (Corrigido para bater com os tipos do logAction)
  setConfig: adminProcedure
    .input(z.object({ key: z.string(), value: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      const existing = await db.select().from(appConfigs).where(eq(appConfigs.configKey, input.key)).limit(1);
      
      if (existing.length > 0) {
        await db.update(appConfigs)
          .set({ configValue: input.value, updatedAt: new Date() })
          .where(eq(appConfigs.configKey, input.key));
      } else {
        await db.insert(appConfigs).values({
          configKey: input.key,
          configValue: input.value,
          updatedAt: new Date()
        });
      }

      // ✅ CORREÇÃO AQUI: Passando 'key' dentro de 'new' ou como 'entityId'
      await logAction(ctx, "SET_CONFIG", "app_configs", { 
        entityId: input.key, // Usamos a chave como ID da entidade
        new: { value: input.value } 
      });

      return { success: true };
    }),

  // ✅ 3. BUSCA RÁPIDA (Search)
  search: adminProcedure
    .input(z.object({ 
      query: z.string().optional(),
      limit: z.number().default(50) 
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      const whereClause = input.query 
        ? or(
            eq(orders.id, input.query),
            like(sql`CAST(${orders.id} AS CHAR)`, `%${input.query}%`),
            like(orders.customerName, `%${input.query}%`)
          )
        : undefined;

      const results = await db.select()
        .from(orders)
        .leftJoin(users, eq(orders.userId, users.id))
        .where(whereClause)
        .limit(input.limit)
        .orderBy(desc(orders.createdAt));

      return results.map(({ orders: o, users: u }) => ({
        ...o,
        id: String(o.id),
        customerName: resolveCustomerName(o.customerName, u?.name || null),
        userName: safeDecrypt(u?.name || "") 
      }));
    }),

  // ✅ 4. LISTAGEM GERAL
  list: adminProcedure
    .input(z.object({ 
      page: z.number().default(1), 
      limit: z.number().default(20), 
      search: z.string().optional() 
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      const offset = (input.page - 1) * input.limit;
      
      const whereClause = input.search 
        ? or(
            like(sql`CAST(${orders.id} AS CHAR)`, `%${input.search}%`),
            like(orders.customerName, `%${input.search}%`)
          )
        : undefined;

      const [totalResult] = await db.select({ count: sql<number>`count(*)` })
        .from(orders)
        .where(whereClause);

      const baseOrders = await db.select()
        .from(orders)
        .leftJoin(users, eq(orders.userId, users.id))
        .where(whereClause)
        .orderBy(desc(orders.createdAt))
        .limit(input.limit)
        .offset(offset);

      return {
        orders: baseOrders.map(({ orders: o, users: u }) => ({
          ...o,
          id: String(o.id),
          customerName: resolveCustomerName(o.customerName, u?.name || null),
          customerPhone: safeDecrypt(o.customerPhone || "") || safeDecrypt(u?.phone || ""),
          total: Number(o.total || 0),
        })),
        meta: {
          totalItems: Number(totalResult?.count || 0),
          totalPages: Math.ceil(Number(totalResult?.count || 0) / input.limit),
          currentPage: input.page
        }
      };
    }),

  // ✅ 5. DETALHES COMPLETOS (GetById)
  getById: adminProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      const rows = await db.select()
        .from(orders)
        .leftJoin(users, eq(orders.userId, users.id))
        .where(eq(orders.id, input.id))
        .limit(1);

      if (!rows.length) throw new TRPCError({ code: "NOT_FOUND", message: "Pedido não encontrado" });
      
      const { orders: row, users: userRow } = rows[0];
      const itemsRaw = await db.select().from(orderItems).where(eq(orderItems.orderId, input.id));

      return {
        ...row,
        id: String(row.id),
        customerName: resolveCustomerName(row.customerName, userRow?.name || null),
        customerEmail: userRow?.email || "E-mail não disponível",
        userName: safeDecrypt(userRow?.name || ""), 
        customerPhone: safeDecrypt(row.customerPhone || "") || safeDecrypt(userRow?.phone || ""),
        customerDocument: safeDecrypt(row.customerDocument || ""),
        shippingAddress: safeDecrypt(row.shippingAddress || ""),
        shippingAddressNumber: safeDecrypt(row.shippingAddressNumber || ""),
        shippingAddressComplement: safeDecrypt(row.shippingAddressComplement || ""),
        shippingNeighborhood: safeDecrypt(row.shippingNeighborhood || ""),
        shippingCity: safeDecrypt(row.shippingCity || ""),
        shippingState: safeDecrypt(row.shippingState || ""),
        items: itemsRaw.map(item => ({ 
          ...item, 
          id: String(item.id),
          options: safeJsonParse(item.options), 
          accompaniments: safeJsonParse(item.accompaniments),
          appliedNutrition: safeJsonParse(item.appliedNutrition)
        }))
      };
    }),

  // ✅ 6. ATUALIZAR PEDIDO (UpdateOrder)
  updateOrder: adminProcedure
    .input(z.object({
      id: z.string(),
      customerName: z.string().optional(),
      customerPhone: z.string().optional(),
      shippingAddress: z.string().optional(),
      shippingAddressNumber: z.string().optional(),
      shippingNeighborhood: z.string().optional(),
      total: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      const { id, total, ...data } = input;

      const updateData: any = { ...data, updatedAt: new Date() };

      // Converte total (number) para string para satisfazer o Drizzle Decimal
      if (total !== undefined) {
        updateData.total = String(total);
      }

      await db.update(orders)
        .set(updateData)
        .where(eq(orders.id, id));

      await logAction(ctx, "UPDATE_ORDER_FULL", "orders", { entityId: id, new: input });
      return { success: true };
    }),

  // ✅ 7. STATUS E DELETE
  updateStatus: adminProcedure
    .input(z.object({ id: z.string(), status: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      const [oldOrder] = await db.select().from(orders).where(eq(orders.id, input.id)).limit(1);
      await db.update(orders).set({ status: input.status as any, updatedAt: new Date() }).where(eq(orders.id, input.id));
      await logAction(ctx, "UPDATE_ORDER_STATUS", "orders", { entityId: input.id, old: { status: oldOrder?.status }, new: { status: input.status } });
      return { success: true };
    }),

  delete: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      await db.transaction(async (tx) => {
        await tx.delete(loyaltyHistory).where(eq(loyaltyHistory.orderId, input.id));
        await tx.delete(couponUsage).where(eq(couponUsage.orderId, input.id));
        await tx.delete(orderItems).where(eq(orderItems.orderId, input.id));
        await tx.delete(orders).where(eq(orders.id, input.id));
      });
      await logAction(ctx, "DELETE_ORDER", "orders", { entityId: input.id });
      return { success: true };
    })
});