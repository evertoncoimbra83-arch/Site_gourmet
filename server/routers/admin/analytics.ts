// server/routers/admin/analytics.ts

import { z } from "zod";
import { superAdminProcedure, router } from "../../_core/trpc.js";
import { sql, gte, lte, desc, inArray, and, gt, asc, eq, isNull } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { getDb } from "../../db.js";
import * as schema from "../../../drizzle/schema/index.js";
import { biSalesFacts, biFinancialFacts } from "../../../drizzle/schema/analytics.js";
import { logger } from "../../logger.js";
import { enqueueBIAnalyticsJob, ensureBIWorkerRunning } from "../../workers/queues/biQueue.js";
import { safeInteger, safeNumber } from "../../lib/safe-parse.js";

const biAccResultSchema = z
  .object({
    name: z.string(),
    count: z.coerce.number(),
    revenue: z.coerce.number().default(0),
  })
  .strict();

const biCouponResultSchema = z
  .object({
    name: z.string(),
    usage_count: z.coerce.number(),
    value: z.coerce.number().default(0),
  })
  .strict();

const biPaymentResultSchema = z
  .object({
    name: z.string(),
    count: z.coerce.number(),
    value: z.coerce.number().default(0),
  })
  .strict();

function parseRawQueryRows<T extends z.ZodTypeAny>(
  rawResult: unknown,
  schema: T,
  context: string,
): Array<z.infer<T>> {
  const rows = Array.isArray(rawResult) ? rawResult : [];
  const parsed = z.array(schema).safeParse(rows);

  if (!parsed.success) {
    console.warn(`analytics.ts: invalid ${context} query result`, parsed.error.flatten());
    return [];
  }

  return parsed.data;
}

export const adminAnalyticsRouter = router({
  /**
   * 📊 Retorna os dados consolidados do Dashboard de BI
   */
  getDashboardStats: superAdminProcedure
    .input(z.object({
      preset: z.enum(["today", "7d", "30d", "90d", "current_month", "custom", "all"]).optional(),
      period: z.enum(["7d", "30d", "90d", "all"]).optional(), // Para retrocompatibilidade
      startDate: z.string().optional(),
      endDate: z.string().optional(),
    }).optional())
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB indisponível" });

      const preset = input?.preset || (input?.period as any) || "30d";
      const now = new Date();
      
      const tzFormatter = new Intl.DateTimeFormat("sv-SE", {
        timeZone: "America/Sao_Paulo",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });
      const spDateStr = tzFormatter.format(now); // "YYYY-MM-DD"

      let dateLimitStart: number;
      let dateLimitEnd: number | undefined = undefined;
      let dateLimitObjStart: Date;
      let dateLimitObjEnd: Date | undefined = undefined;
      let periodLabel = "Últimos 30 dias";

      if (preset === "today") {
        const todayInt = safeInteger(spDateStr.replace(/-/g, ""));
        dateLimitStart = todayInt;
        dateLimitEnd = todayInt;
        dateLimitObjStart = new Date(`${spDateStr}T00:00:00-03:00`);
        dateLimitObjEnd = new Date(`${spDateStr}T23:59:59.999-03:00`);
        periodLabel = "Hoje";
      } else if (preset === "7d") {
        const limitDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const limitDateStr = tzFormatter.format(limitDate);
        dateLimitStart = safeInteger(limitDateStr.replace(/-/g, ""));
        dateLimitObjStart = new Date(`${limitDateStr}T00:00:00-03:00`);
        periodLabel = "Últimos 7 dias";
      } else if (preset === "90d" || preset === "3m") {
        const limitDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        const limitDateStr = tzFormatter.format(limitDate);
        dateLimitStart = safeInteger(limitDateStr.replace(/-/g, ""));
        dateLimitObjStart = new Date(`${limitDateStr}T00:00:00-03:00`);
        periodLabel = "Últimos 90 dias";
      } else if (preset === "current_month") {
        const firstDayStr = `${spDateStr.slice(0, 8)}01`; // "YYYY-MM-01"
        dateLimitStart = safeInteger(firstDayStr.replace(/-/g, ""));
        dateLimitObjStart = new Date(`${firstDayStr}T00:00:00-03:00`);
        periodLabel = "Mês atual";
      } else if (preset === "custom") {
        if (!input?.startDate || !input?.endDate) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "startDate e endDate são obrigatórios para o período personalizado",
          });
        }
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(input.startDate) || !dateRegex.test(input.endDate)) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Formato de data inválido. Use YYYY-MM-DD",
          });
        }
        dateLimitStart = safeInteger(input.startDate.replace(/-/g, ""));
        dateLimitEnd = safeInteger(input.endDate.replace(/-/g, ""));
        dateLimitObjStart = new Date(`${input.startDate}T00:00:00-03:00`);
        dateLimitObjEnd = new Date(`${input.endDate}T23:59:59.999-03:00`);
        periodLabel = "Período personalizado";
      } else if (preset === "all") {
        dateLimitStart = 0;
        dateLimitObjStart = new Date(0); // Epoch
        periodLabel = "Sempre";
      } else {
        const limitDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const limitDateStr = tzFormatter.format(limitDate);
        dateLimitStart = safeInteger(limitDateStr.replace(/-/g, ""));
        dateLimitObjStart = new Date(`${limitDateStr}T00:00:00-03:00`);
        periodLabel = "Últimos 30 dias";
      }

      // Build general query filters for Drizzle
      const biWhereConditions = [];
      if (dateLimitStart > 0) {
        biWhereConditions.push(gte(biFinancialFacts.dateId, dateLimitStart));
      }
      if (dateLimitEnd) {
        biWhereConditions.push(lte(biFinancialFacts.dateId, dateLimitEnd));
      }
      const biWhere = biWhereConditions.length > 0 ? and(...biWhereConditions) : undefined;

      const biSalesWhereConditions = [];
      if (dateLimitStart > 0) {
        biSalesWhereConditions.push(gte(biSalesFacts.dateId, dateLimitStart));
      }
      if (dateLimitEnd) {
        biSalesWhereConditions.push(lte(biSalesFacts.dateId, dateLimitEnd));
      }
      const biSalesWhere = biSalesWhereConditions.length > 0 ? and(...biSalesWhereConditions) : undefined;

      try {
        const financials = await db
          .select({
            grossRevenue: sql<number>`CAST(SUM(${biFinancialFacts.grossTotal}) AS DECIMAL(10,2))`,
            netRevenue: sql<number>`CAST(SUM(${biFinancialFacts.netTotal}) AS DECIMAL(10,2))`,
            coupon: sql<number>`CAST(SUM(${biFinancialFacts.discountCoupon}) AS DECIMAL(10,2))`,
            loyalty: sql<number>`CAST(SUM(${biFinancialFacts.discountLoyalty}) AS DECIMAL(10,2))`,
            auto: sql<number>`CAST(SUM(${biFinancialFacts.discountAuto}) AS DECIMAL(10,2))`,
            totalDiscounts: sql<number>`CAST(SUM(
              COALESCE(${biFinancialFacts.discountCoupon}, 0) + 
              COALESCE(${biFinancialFacts.discountLoyalty}, 0) + 
              COALESCE(${biFinancialFacts.discountAuto}, 0)
            ) AS DECIMAL(10,2))`
          })
          .from(biFinancialFacts)
          .where(biWhere);

        const fin = financials[0] || { grossRevenue: 0, netRevenue: 0, coupon: 0, loyalty: 0, auto: 0, totalDiscounts: 0 };

        const timeline = await db
          .select({
            dateId: biFinancialFacts.dateId,
            Faturamento: sql<number>`CAST(SUM(${biFinancialFacts.netTotal}) AS DECIMAL(10,2))`,
            Pedidos: sql<number>`CAST(COUNT(${biFinancialFacts.orderId}) AS SIGNED)`,
            Ticket: sql<number>`CAST(SUM(${biFinancialFacts.netTotal}) / COUNT(${biFinancialFacts.orderId}) AS DECIMAL(10,2))`,
            Descontos: sql<number>`CAST(SUM(
              COALESCE(${biFinancialFacts.discountCoupon}, 0) + 
              COALESCE(${biFinancialFacts.discountLoyalty}, 0) + 
              COALESCE(${biFinancialFacts.discountAuto}, 0)
            ) AS DECIMAL(10,2))`
          })
          .from(biFinancialFacts)
          .where(biWhere)
          .groupBy(biFinancialFacts.dateId)
          .orderBy(biFinancialFacts.dateId);

        const topDishes = await db
          .select({
            dishId: biSalesFacts.dishId,
            name: sql<string>`COALESCE(JSON_UNQUOTE(JSON_EXTRACT(${biSalesFacts.itemsDetail}, '$[0].name')), CONCAT('Prato ', ${biSalesFacts.dishId}))`,
            count: sql<number>`SUM(${biSalesFacts.quantity})`
          })
          .from(biSalesFacts)
          .where(biSalesWhere)
          .groupBy(biSalesFacts.dishId)
          .orderBy(desc(sql`SUM(${biSalesFacts.quantity})`))
          .limit(10);

        const topAccs = await db.execute(sql`
          SELECT name, SUM(count) as count FROM (
            SELECT jt.accName as name, SUM(quantity) as count
            FROM bi_sales_facts,
            JSON_TABLE(items_detail, '$[*].accompaniments[*]' COLUMNS (accName VARCHAR(255) PATH '$.name')) AS jt
            WHERE date_id >= ${dateLimitStart} ${dateLimitEnd ? sql`AND date_id <= ${dateLimitEnd}` : sql``} AND jt.accName IS NOT NULL
            GROUP BY jt.accName
            UNION ALL
            SELECT jt2.accName as name, SUM(quantity) as count
            FROM bi_sales_facts,
            JSON_TABLE(items_detail, '$[*].meals[*].accompaniments[*]' COLUMNS (accName VARCHAR(255) PATH '$.name')) AS jt2
            WHERE date_id >= ${dateLimitStart} ${dateLimitEnd ? sql`AND date_id <= ${dateLimitEnd}` : sql``} AND jt2.accName IS NOT NULL
            GROUP BY jt2.accName
          ) AS consolidated_accs
          GROUP BY name ORDER BY count DESC LIMIT 10
        `);
        const accRows = parseRawQueryRows(
          Array.isArray(topAccs[0]) ? topAccs[0] : topAccs,
          biAccResultSchema,
          "topAccs",
        );

        const topCouponsQuery = await db.execute(sql`
          SELECT coupon_code as name, SUM(discount_coupon) as value, COUNT(*) as usage_count
          FROM bi_financial_facts
          WHERE date_id >= ${dateLimitStart} ${dateLimitEnd ? sql`AND date_id <= ${dateLimitEnd}` : sql``} AND coupon_code IS NOT NULL AND coupon_code != ''
          GROUP BY coupon_code ORDER BY value DESC LIMIT 5
        `);
        const couponRows = parseRawQueryRows(
          Array.isArray(topCouponsQuery[0]) ? topCouponsQuery[0] : topCouponsQuery,
          biCouponResultSchema,
          "topCouponsQuery",
        );

        const paymentMethodsQuery = await db.execute(sql`
          SELECT payment_method as name, SUM(net_total) as value, COUNT(*) as count
          FROM bi_financial_facts
          WHERE date_id >= ${dateLimitStart} ${dateLimitEnd ? sql`AND date_id <= ${dateLimitEnd}` : sql``} AND payment_method IS NOT NULL
          GROUP BY payment_method ORDER BY value DESC
        `);
        const paymentRows = parseRawQueryRows(
          Array.isArray(paymentMethodsQuery[0])
            ? paymentMethodsQuery[0]
            : paymentMethodsQuery,
          biPaymentResultSchema,
          "paymentMethodsQuery",
        );

        const customerConditions = [
          eq(schema.users.role, "user"),
          isNull(schema.users.deletedAt)
        ];
        if (preset !== "all") {
          customerConditions.push(gte(schema.users.createdAt, dateLimitObjStart));
          if (dateLimitObjEnd) {
            customerConditions.push(lte(schema.users.createdAt, dateLimitObjEnd));
          }
        }

        const customers = await db.select({ total: sql<number>`count(*)` })
          .from(schema.users)
          .where(and(...customerConditions));

        const totalOrders = await db.select({ count: sql<number>`count(*)` })
          .from(biFinancialFacts)
          .where(biWhere);

        const ordersCount = safeNumber(totalOrders[0]?.count);

        const newCustomersByDay = await db
          .select({
            dateStr: sql<string>`DATE_FORMAT(${schema.users.createdAt}, '%Y%m%d')`,
            count: sql<number>`COUNT(*)`
          })
          .from(schema.users)
          .where(and(...customerConditions))
          .groupBy(sql`DATE_FORMAT(${schema.users.createdAt}, '%Y%m%d')`);

        const customersMap = new Map<string, number>();
        for (const row of newCustomersByDay) {
          if (row.dateStr) {
            customersMap.set(row.dateStr, safeNumber(row.count));
          }
        }

        return {
          financials: {
            grossRevenue: safeNumber(fin.grossRevenue),
            netRevenue: safeNumber(fin.netRevenue),
          },
          discountBreakdown: [
            { name: "Cupons", value: safeNumber(fin.coupon) },
            { name: "Fidelidade", value: safeNumber(fin.loyalty) },
            { name: "Qtd/Automático", value: safeNumber(fin.auto) },
          ],
          totalGivenDiscounts: safeNumber(fin.totalDiscounts),
          chartData: timeline.map(t => {
            const s = String(t.dateId);
            const Clientes = customersMap.get(s) || 0;
            return {
              date: `${s.slice(6, 8)}/${s.slice(4, 6)}`,
              Faturamento: safeNumber(t.Faturamento),
              Pedidos: safeNumber((t as any).Pedidos),
              Ticket: safeNumber((t as any).Ticket),
              Clientes,
              Descontos: safeNumber((t as any).Descontos),
            };
          }),
          paymentMethods: paymentRows.map(p => ({
            name: String(p.name),
            value: safeNumber(p.value),
            count: safeNumber(p.count)
          })), 
          topDishes: topDishes.map(d => ({ dishId: safeNumber(d.dishId), name: d.name, count: safeNumber(d.count) })),
          topAccompaniments: accRows.map(a => ({ name: String(a.name), count: safeNumber(a.count) })),
          topCoupons: couponRows.map(c => ({
            coupon: String(c.name),
            usage_count: safeNumber(c.usage_count),
            total_discounted: safeNumber(c.value)
          })),
          newCustomers: safeNumber(customers[0]?.total),
          avgTicket: ordersCount > 0 ? (safeNumber(fin.netRevenue) / ordersCount) : 0,
          topDishesInPackages: [],
          metadata: {
            periodLabel,
            startDate: preset === "custom" && input?.startDate ? input.startDate : tzFormatter.format(dateLimitObjStart),
            endDate: preset === "custom" && input?.endDate ? input.endDate : (dateLimitObjEnd ? tzFormatter.format(dateLimitObjEnd) : spDateStr),
            timezone: "America/Sao_Paulo",
          }
        };
      } catch (error) {
        logger.error({ err: error }, "Erro no Dashboard de BI");
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Erro ao carregar analytics." });
      }
    }),

  /**
   * 🔄 Sincronização por Lotes (Batch Sync)
   */
  syncHistory: superAdminProcedure
    .input(z.object({
      cursor: z.string().optional(),
      limit: z.number().min(1).max(500).default(100)
    }).optional())
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB indisponível" });

      // ✅ FIX: Array tipado para bater exatamente com o Enum da tabela Orders
      const validStatuses = ['shipped', 'delivered', 'completed'] as const;
      const batchLimit = input?.limit ?? 100;

      const batch = await db
        .select({ id: schema.orders.id })
        .from(schema.orders)
        .where(
          and(
            // @ts-expect-error - Drizzle às vezes reclama de Enums mesmo com 'as const'
            inArray(schema.orders.status, validStatuses),
            input?.cursor ? gt(schema.orders.id, input.cursor) : undefined
          )
        )
        .orderBy(asc(schema.orders.id))
        .limit(batchLimit);

      if (batch.length === 0) {
        return { success: true, processed: 0, nextCursor: null, hasMore: false };
      }

      logger.info(`🚀 BI: Enfileirando lote de ${batch.length} pedidos.`);

      const workerReady = await ensureBIWorkerRunning();
      if (!workerReady) {
        logger.warn("BI syncHistory skipped: Redis/worker not ready.");
        return {
          success: false,
          processed: 0,
          skipped: batch.length,
          nextCursor: null,
          hasMore: true,
        };
      }

      let skipped = 0;
      for (const order of batch) {
        const queued = await enqueueBIAnalyticsJob(order.id, {
          removeOnComplete: true,
          attempts: 2,
          jobId: `sync-${order.id}`,
          priority: 10,
        }, (ctx.req as any)?.requestId);

        if (!queued) skipped += 1;
      }

      const nextCursor = batch[batch.length - 1].id;

      return {
        success: true,
        processed: batch.length - skipped,
        skipped,
        nextCursor,
        hasMore: batch.length === batchLimit,
      };
    }),
});
