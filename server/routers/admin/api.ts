// server/routers/admin/api.ts
import { randomBytes } from "node:crypto";
import { adminProcedure, internalProcedure, router } from "../../_core/trpc.js";
import { z } from "zod";
import { appConfigs, orders, orderItems, dishes, packages, categories, loyaltyHistory, users } from "../../../drizzle/schema/index.js";
import { biFinancialFacts, biDishIntelligence } from "../../../drizzle/schema/analytics.js";
import { encrypt } from "../../encryption.js";
import { desc, eq, gte, lte, and, sql, count, sum } from "drizzle-orm";

function createIntegrationToken() {
  return `gia_${randomBytes(24).toString("hex")}`;
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

  generateToken: adminProcedure.mutation(async ({ ctx }) => {
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
      id:         Number(d.id),
      categoryId: d.categoryId ? Number(d.categoryId) : null,
      price:      Number(d.price ?? 0),
      energyKcal: Number(d.energyKcal ?? 0),
      proteins:   Number(d.proteins ?? 0),
      carbs:      Number(d.carbs ?? 0),
      fatTotal:   Number(d.fatTotal ?? 0),
      fiber:      Number(d.fiber ?? 0),
      sodium:     Number(d.sodium ?? 0),
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
      price:     Number(p.price ?? 0),
      salePrice: p.salePrice ? Number(p.salePrice) : null,
      config:    typeof p.config === "string" ? JSON.parse(p.config) : p.config,
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

      const totalRev  = Number(result.totalRevenue  ?? 0);
      const totalOrd  = Number(result.totalOrders   ?? 0);

      return {
        period: { start: start.toISOString(), end: end.toISOString() },
        totalOrders:    totalOrd,
        totalRevenue:   totalRev,
        totalDiscount:  Number(result.totalDiscount ?? 0),
        totalShipping:  Number(result.totalShipping ?? 0),
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
        orders:  Number(r.orders),
        revenue: Number(r.revenue ?? 0),
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
        quantity: Number(r.quantity ?? 0),
        revenue:  Number(r.revenue ?? 0),
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
        orders:  Number(r.orders),
        revenue: Number(r.revenue ?? 0),
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
      if (!biFacts.orderCount || Number(biFacts.orderCount) === 0) {
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
          grossTotal:      Number(fallback.grossTotal ?? 0),
          netTotal:        Number(fallback.netTotal ?? 0),
          totalDiscount:   Number(fallback.discount ?? 0),
          discountLoyalty: Number(fallback.loyalty ?? 0),
          deliveryFee:     Number(fallback.shipping ?? 0),
          orderCount:      Number(fallback.orderCount ?? 0),
        };
      }

      return {
        source: "bi_facts" as const,
        period: { start: start.toISOString(), end: end.toISOString() },
        grossTotal:      Number(biFacts.grossTotal ?? 0),
        netTotal:        Number(biFacts.netTotal ?? 0),
        deliveryFee:     Number(biFacts.deliveryFee ?? 0),
        discountCoupon:  Number(biFacts.discountCoupon ?? 0),
        discountLoyalty: Number(biFacts.discountLoyalty ?? 0),
        discountAuto:    Number(biFacts.discountAuto ?? 0),
        totalDiscount:   Number(biFacts.discountCoupon ?? 0)
                       + Number(biFacts.discountLoyalty ?? 0)
                       + Number(biFacts.discountAuto ?? 0),
        orderCount:      Number(biFacts.orderCount ?? 0),
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
        totalCustomers:  Number(total.count),
        newInPeriod:     Number(newUsers.count),
        buyersInPeriod:  Number(buyers.count),
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
          points:       Number(r.total ?? 0),
          transactions: Number(r.count ?? 0),
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