// server/routers/admin/api.ts
import { randomBytes } from "node:crypto";
import { internalProcedure, router, superAdminProcedure } from "../../_core/trpc.js";
import { z } from "zod";
import { appConfigs, orders, orderItems, dishes, packages, categories, loyaltyHistory, users } from "../../../drizzle/schema/index.js";
import { biFinancialFacts, biDishIntelligence } from "../../../drizzle/schema/analytics.js";
import { encrypt } from "../../encryption.js";
import { desc, eq, gte, lte, and, sql, count, sum } from "drizzle-orm";
import { safeJsonParse, safeNumber } from "../../lib/safe-parse.js";

function createIntegrationToken() {
  return `gia_${randomBytes(24).toString("hex")}`;
}

function toSafeNumber(value: unknown, fallback = 0): number {
  return safeNumber(value, fallback);
}

// ─── helpers ────────────────────────────────────────────────────────────────

function parseDateRange(input: { start?: string; end?: string }) {
  const start = input.start ? new Date(input.start) : (() => { const d = new Date(); d.setDate(d.getDate() - 30); return d; })();
  const end   = input.end   ? new Date(input.end)   : new Date();
  return { start, end };
}

const dateRangeInput = z.object({
  start: z.string().optional(), // ISO date, ex: "2024-01-01"
  end:   z.string().optional(),
}).optional();

// ─── router ─────────────────────────────────────────────────────────────────

export const adminApiRouter = router({

  // ══════════════════════════════════════════════════════════════
  // 🔑 TOKEN — geração pelo admin, leitura pelo sistema interno
  // ══════════════════════════════════════════════════════════════

  generateToken: superAdminProcedure.mutation(async ({ ctx }) => {
    const token = createIntegrationToken();
    const encryptedToken = encrypt(token) || token;

    await ctx.db
      .insert(appConfigs)
      .values({ configKey: "BRIDGE_TOKEN", configValue: encryptedToken })
      .onDuplicateKeyUpdate({ set: { configValue: encryptedToken, updatedAt: new Date() } });

    return {
      token,
      generatedAt: new Date().toISOString(),
      message: "Nova chave do GourmetIA Bridge gerada. Atualize o serviço externo para usar o token atual.",
    };
  }),

  // ══════════════════════════════════════════════════════════════
  // 📦 CATÁLOGO — leitura pelo app Python
  // ══════════════════════════════════════════════════════════════

  /**
   * GET /trpc/admin.api.catalog
   * Retorna cardápio completo com macros e categorias.
   * Fonte principal para o SmartGenerator Python.
   */
  catalog: internalProcedure.query(async ({ ctx }) => {
    const dishRows = await ctx.db
      .select({
        id:          dishes.id,
        name:        dishes.name,
        categoryId:  dishes.categoryId,
        category:    categories.name,
        price:       dishes.basePrice,
        isActive:    dishes.isActive,
        energyKcal:  dishes.energyKcal,
        proteins:    dishes.proteins,
        carbs:       dishes.carbs,
        fatTotal:    dishes.fatTotal,
        fiber:       dishes.fiber,
        sodium:      dishes.sodium,
      })
      .from(dishes)
      .leftJoin(categories, eq(dishes.categoryId, categories.id))
      .where(eq(dishes.isActive, true))
      .orderBy(dishes.name);

    return dishRows.map(d => ({
      ...d,
      id:         toSafeNumber(d.id),
      categoryId: d.categoryId ? toSafeNumber(d.categoryId) : null,
      price:      toSafeNumber(d.price),
      energyKcal: toSafeNumber(d.energyKcal),
      proteins:   toSafeNumber(d.proteins),
      carbs:      toSafeNumber(d.carbs),
      fatTotal:   toSafeNumber(d.fatTotal),
      fiber:      toSafeNumber(d.fiber),
      sodium:     toSafeNumber(d.sodium),
    }));
  }),

  /**
   * GET /trpc/admin.api.packages
   * Retorna pacotes ativos com estrutura de slots.
   */
  packages: internalProcedure.query(async ({ ctx }) => {
    const rows = await ctx.db
      .select({
        id:              packages.id,
        name:            packages.name,
        price:           packages.price,
        salePrice:       packages.salePrice,
        isActive:        packages.isActive,
        numberOfOptions: packages.numberOfOptions,
        config:          packages.config,
      })
      .from(packages)
      .where(eq(packages.isActive, true))
      .orderBy(packages.name);

    return rows.map(p => ({
      ...p,
      price:     toSafeNumber(p.price),
      salePrice: p.salePrice ? toSafeNumber(p.salePrice) : null,
      config:    safeJsonParse<Record<string, unknown>>(p.config, {}),
    }));
  }),

  // ══════════════════════════════════════════════════════════════
  // 📊 VENDAS — BI de pedidos para o app Python
  // ══════════════════════════════════════════════════════════════

  /**
   * GET /trpc/admin.api.salesSummary
   * Resumo de vendas por período: total, ticket médio, quantidade.
   */
  salesSummary: internalProcedure
    .input(dateRangeInput)
    .query(async ({ ctx, input }) => {
      const { start, end } = parseDateRange(input ?? {});

      const [result] = await ctx.db
        .select({
          totalOrders:   count(orders.id),
          totalRevenue:  sum(orders.total),
          totalDiscount: sum(orders.totalDiscount),
          totalShipping: sum(orders.shippingCost),
        })
        .from(orders)
        .where(
          and(
            gte(orders.createdAt, start),
            lte(orders.createdAt, end),
            sql`${orders.status} NOT IN ('cancelled')`,
          )
        );

      const totalRev  = toSafeNumber(result.totalRevenue);
      const totalOrd  = toSafeNumber(result.totalOrders);

      return {
        period: { start: start.toISOString(), end: end.toISOString() },
        totalOrders:    totalOrd,
        totalRevenue:   totalRev,
        totalDiscount:  toSafeNumber(result.totalDiscount),
        totalShipping:  toSafeNumber(result.totalShipping),
        averageTicket:  totalOrd > 0 ? +(totalRev / totalOrd).toFixed(2) : 0,
      };
    }),

  /**
   * GET /trpc/admin.api.salesByDay
   * Vendas agrupadas por dia — ideal para gráfico de série temporal.
   */
  salesByDay: internalProcedure
    .input(dateRangeInput)
    .query(async ({ ctx, input }) => {
      const { start, end } = parseDateRange(input ?? {});

      const rows = await ctx.db
        .select({
          day:     sql<string>`DATE(${orders.createdAt})`,
          orders:  count(orders.id),
          revenue: sum(orders.total),
        })
        .from(orders)
        .where(
          and(
            gte(orders.createdAt, start),
            lte(orders.createdAt, end),
            sql`${orders.status} NOT IN ('cancelled')`,
          )
        )
        .groupBy(sql`DATE(${orders.createdAt})`)
        .orderBy(sql`DATE(${orders.createdAt})`);

      return rows.map(r => ({
        day:     r.day,
        orders:  toSafeNumber(r.orders),
        revenue: toSafeNumber(r.revenue),
      }));
    }),

  /**
   * GET /trpc/admin.api.topDishes
   * Pratos mais vendidos no período com receita gerada.
   */
  topDishes: internalProcedure
    .input(z.object({
      start:  z.string().optional(),
      end:    z.string().optional(),
      limit:  z.number().min(1).max(100).default(20),
    }).optional())
    .query(async ({ ctx, input }) => {
      const { start, end } = parseDateRange(input ?? {});
      const limit = input?.limit ?? 20;

      const rows = await ctx.db
        .select({
          dishId:   orderItems.dishId,
          dishName: dishes.name,
          quantity: sum(orderItems.quantity),
          revenue:  sum(orderItems.totalPrice),
        })
        .from(orderItems)
        .leftJoin(orders, eq(orderItems.orderId, orders.id))
        .leftJoin(dishes, eq(orderItems.dishId, sql`CAST(${dishes.id} AS CHAR)`))
        .where(
          and(
            gte(orders.createdAt, start),
            lte(orders.createdAt, end),
            sql`${orders.status} NOT IN ('cancelled')`,
          )
        )
        .groupBy(orderItems.dishId, dishes.name)
        .orderBy(desc(sum(orderItems.quantity)))
        .limit(limit);

      return rows.map(r => ({
        dishId:   r.dishId,
        dishName: r.dishName ?? "Prato removido",
        quantity: toSafeNumber(r.quantity),
        revenue:  toSafeNumber(r.revenue),
      }));
    }),

  /**
   * GET /trpc/admin.api.paymentMix
   * Distribuição de métodos de pagamento no período.
   */
  paymentMix: internalProcedure
    .input(dateRangeInput)
    .query(async ({ ctx, input }) => {
      const { start, end } = parseDateRange(input ?? {});

      const rows = await ctx.db
        .select({
          method:  orders.paymentMethod,
          orders:  count(orders.id),
          revenue: sum(orders.total),
        })
        .from(orders)
        .where(
          and(
            gte(orders.createdAt, start),
            lte(orders.createdAt, end),
            sql`${orders.status} NOT IN ('cancelled')`,
          )
        )
        .groupBy(orders.paymentMethod)
        .orderBy(desc(count(orders.id)));

      return rows.map(r => ({
        method:  r.method,
        orders:  toSafeNumber(r.orders),
        revenue: toSafeNumber(r.revenue),
      }));
    }),

  // ══════════════════════════════════════════════════════════════
  // 💰 FINANCEIRO — margens, descontos, fidelidade
  // ══════════════════════════════════════════════════════════════

  /**
   * GET /trpc/admin.api.financialSummary
   * Consolidado financeiro: bruto, descontos por tipo, líquido.
   * Usa bi_financial_facts se populada, senão cai em orders direto.
   */
  financialSummary: internalProcedure
    .input(dateRangeInput)
    .query(async ({ ctx, input }) => {
      const { start, end } = parseDateRange(input ?? {});

      // Tenta BI facts primeiro (mais preciso)
      const [biFacts] = await ctx.db
        .select({
          grossTotal:      sum(biFinancialFacts.grossTotal),
          deliveryFee:     sum(biFinancialFacts.deliveryFee),
          discountCoupon:  sum(biFinancialFacts.discountCoupon),
          discountLoyalty: sum(biFinancialFacts.discountLoyalty),
          discountAuto:    sum(biFinancialFacts.discountAuto),
          netTotal:        sum(biFinancialFacts.netTotal),
          orderCount:      count(biFinancialFacts.orderId),
        })
        .from(biFinancialFacts)
        .where(
          and(
            gte(biFinancialFacts.createdAt, start),
            lte(biFinancialFacts.createdAt, end),
          )
        );

      // Fallback para orders direto se BI não tiver dados
      if (!biFacts.orderCount || toSafeNumber(biFacts.orderCount) === 0) {
        const [fallback] = await ctx.db
          .select({
            grossTotal:  sum(orders.subtotal),
            netTotal:    sum(orders.total),
            discount:    sum(orders.totalDiscount),
            shipping:    sum(orders.shippingCost),
            loyalty:     sum(orders.loyaltyDiscount),
            orderCount:  count(orders.id),
          })
          .from(orders)
          .where(
            and(
              gte(orders.createdAt, start),
              lte(orders.createdAt, end),
              sql`${orders.status} NOT IN ('cancelled')`,
            )
          );

        return {
          source: "orders" as const,
          period: { start: start.toISOString(), end: end.toISOString() },
          grossTotal:      toSafeNumber(fallback.grossTotal),
          netTotal:        toSafeNumber(fallback.netTotal),
          totalDiscount:   toSafeNumber(fallback.discount),
          discountLoyalty: toSafeNumber(fallback.loyalty),
          deliveryFee:     toSafeNumber(fallback.shipping),
          orderCount:      toSafeNumber(fallback.orderCount),
        };
      }

      return {
        source: "bi_facts" as const,
        period: { start: start.toISOString(), end: end.toISOString() },
        grossTotal:      toSafeNumber(biFacts.grossTotal),
        netTotal:        toSafeNumber(biFacts.netTotal),
        deliveryFee:     toSafeNumber(biFacts.deliveryFee),
        discountCoupon:  toSafeNumber(biFacts.discountCoupon),
        discountLoyalty: toSafeNumber(biFacts.discountLoyalty),
        discountAuto:    toSafeNumber(biFacts.discountAuto),
        totalDiscount:   toSafeNumber(biFacts.discountCoupon)
                       + toSafeNumber(biFacts.discountLoyalty)
                       + toSafeNumber(biFacts.discountAuto),
        orderCount:      toSafeNumber(biFacts.orderCount),
      };
    }),

  // ══════════════════════════════════════════════════════════════
  // 👥 CLIENTES — comportamento e retenção
  // ══════════════════════════════════════════════════════════════

  /**
   * GET /trpc/admin.api.customerStats
   * Total de clientes, novos no período, recorrentes.
   */
  customerStats: internalProcedure
    .input(dateRangeInput)
    .query(async ({ ctx, input }) => {
      const { start, end } = parseDateRange(input ?? {});

      const [total] = await ctx.db
        .select({ count: count(users.id) })
        .from(users);

      // Novos cadastros no período
      const [newUsers] = await ctx.db
        .select({ count: count(users.id) })
        .from(users)
        .where(
          and(
            gte(users.createdAt, start),
            lte(users.createdAt, end),
          )
        );

      // Compradores únicos no período
      const [buyers] = await ctx.db
        .select({ count: sql<number>`COUNT(DISTINCT ${orders.userId})` })
        .from(orders)
        .where(
          and(
            gte(orders.createdAt, start),
            lte(orders.createdAt, end),
            sql`${orders.status} NOT IN ('cancelled')`,
          )
        );

      return {
        period: { start: start.toISOString(), end: end.toISOString() },
        totalCustomers:  toSafeNumber(total.count),
        newInPeriod:     toSafeNumber(newUsers.count),
        buyersInPeriod:  toSafeNumber(buyers.count),
      };
    }),

  /**
   * GET /trpc/admin.api.loyaltySummary
   * Resumo do programa de fidelidade: pontos emitidos, resgatados, expirados.
   */
  loyaltySummary: internalProcedure
    .input(dateRangeInput)
    .query(async ({ ctx, input }) => {
      const { start, end } = parseDateRange(input ?? {});

      const rows = await ctx.db
        .select({
          type:   loyaltyHistory.type,
          total:  sum(loyaltyHistory.pointsChange),
          count:  count(loyaltyHistory.id),
        })
        .from(loyaltyHistory)
        .where(
          and(
            gte(loyaltyHistory.createdAt, start),
            lte(loyaltyHistory.createdAt, end),
          )
        )
        .groupBy(loyaltyHistory.type);

      const byType: Record<string, { points: number; transactions: number }> = {};
      for (const r of rows) {
        byType[r.type ?? "unknown"] = {
          points:       toSafeNumber(r.total),
          transactions: toSafeNumber(r.count),
        };
      }

      return {
        period: { start: start.toISOString(), end: end.toISOString() },
        earned:  byType["earned"]  ?? { points: 0, transactions: 0 },
        burned:  byType["burned"]  ?? { points: 0, transactions: 0 },
        expired: byType["expired"] ?? { points: 0, transactions: 0 },
        manual:  byType["manual"]  ?? { points: 0, transactions: 0 },
      };
    }),

  // ══════════════════════════════════════════════════════════════
  // 🧠 INTELIGÊNCIA — escrever resultados do Python de volta
  // ══════════════════════════════════════════════════════════════

  /**
   * POST /trpc/admin.api.writeDishIntelligence
   * O app Python envia scores calculados por prato para persistir.
   * O SmartGenerator pode ler esse score no processo de seleção.
   */
  writeDishIntelligence: internalProcedure
    .input(z.array(z.object({
      dishId:             z.number(),
      proteinGrams:       z.number().optional(),
      carbGrams:          z.number().optional(),
      fatGrams:           z.number().optional(),
      popularityScore:    z.number().min(0).max(10).optional(),
      avgRating:          z.number().min(0).max(5).optional(),
      salesVelocity:      z.number().optional(), // unidades/semana
      recommendedPersonas: z.array(z.string()).optional(),
    })))
    .mutation(async ({ ctx, input }) => {
      let upserted = 0;
      for (const item of input) {
        await ctx.db
          .insert(biDishIntelligence)
          .values({
            dishId:          item.dishId,
            proteinGrams:    String(item.proteinGrams ?? 0),
            carbGrams:       String(item.carbGrams ?? 0),
            fatGrams:        String(item.fatGrams ?? 0),
            popularityScore: String(item.popularityScore ?? 5),
            avgRating:       String(item.avgRating ?? 0),
            salesVelocity:   String(item.salesVelocity ?? 0),
          } as typeof biDishIntelligence.$inferInsert)
          .onDuplicateKeyUpdate({
            set: {
              proteinGrams:    sql`VALUES(protein_grams)`,
              carbGrams:       sql`VALUES(carb_grams)`,
              fatGrams:        sql`VALUES(fat_grams)`,
              popularityScore: sql`VALUES(popularity_score)`,
              avgRating:       sql`VALUES(avg_rating)`,
              salesVelocity:   sql`VALUES(sales_velocity)`,
            } as any
          });
        upserted++;
      }
      return { success: true, upserted };
    }),
});

export type AdminApiRouter = typeof adminApiRouter;
