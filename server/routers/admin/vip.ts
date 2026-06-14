import { router, adminProcedure } from "../../_core/trpc.js";
import { getDb } from "../../db.js";
import { sql } from "drizzle-orm";
import { decrypt } from "../../encryption.js";
import { coupons } from "../../../drizzle/schema/index.js";
import { eq, and } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { AuditLogService } from "../../services/AuditLogService.js";
import { z } from "zod";
import crypto from "crypto";

export const adminVipRouter = router({
  summary: adminProcedure.query(async () => {
    const db = await getDb();
    
    // 1. Query all orders aggregated by user
    const rows = await db.execute(sql`
      SELECT 
        o.user_id as userId,
        u.email as email,
        u.name as name,
        COUNT(o.id) as totalOrders,
        SUM(CAST(o.total AS DECIMAL(10,2))) as totalSpent,
        AVG(CAST(o.total AS DECIMAL(10,2))) as avgTicket,
        MAX(o.created_at) as lastOrderAt
      FROM orders o
      JOIN users u ON o.user_id = u.id
      WHERE o.status IN ('completed', 'shipped', 'delivered')
        AND o.payment_status != 'refunded'
      GROUP BY o.user_id, u.email, u.name
    `) as any;

    const customersRaw = rows[0] || [];
    const now = new Date();

    const thresholds = {
      bronze: { min: 0.01, max: 499.99 },
      prata: { min: 500.00, max: 1499.99 },
      ouro: { min: 1500.00, max: 2999.99 },
      diamante: { min: 3000.00, max: Infinity }
    };

    const getTier = (ltv: number) => {
      if (ltv >= thresholds.diamante.min) return "Diamante";
      if (ltv >= thresholds.ouro.min) return "Ouro";
      if (ltv >= thresholds.prata.min) return "Prata";
      if (ltv >= thresholds.bronze.min) return "Bronze";
      return "Nenhum";
    };

    const getNextTier = (tier: string) => {
      if (tier === "Bronze") return { name: "Prata", min: thresholds.prata.min };
      if (tier === "Prata") return { name: "Ouro", min: thresholds.ouro.min };
      if (tier === "Ouro") return { name: "Diamante", min: thresholds.diamante.min };
      return null;
    };

    const tiersSummary: Record<string, { key: string; count: number; totalSpent: number; totalOrders: number; avgTicket: number }> = {
      Bronze: { key: "bronze", count: 0, totalSpent: 0, totalOrders: 0, avgTicket: 0 },
      Prata: { key: "prata", count: 0, totalSpent: 0, totalOrders: 0, avgTicket: 0 },
      Ouro: { key: "ouro", count: 0, totalSpent: 0, totalOrders: 0, avgTicket: 0 },
      Diamante: { key: "diamante", count: 0, totalSpent: 0, totalOrders: 0, avgTicket: 0 },
    };

    const allCustomers: any[] = [];
    const nextTierList: any[] = [];
    const atRiskList: any[] = [];

    let totalRevenue = 0;
    let totalOrdersCount = 0;

    for (const c of customersRaw) {
      const totalSpent = Number(c.totalSpent || 0);
      const totalOrders = Number(c.totalOrders || 0);
      const avgTicket = Number(c.avgTicket || 0);
      const decryptedName = decrypt(c.name) || c.email || "Cliente sem Nome";
      const tier = getTier(totalSpent);

      if (tier === "Nenhum") continue;

      totalRevenue += totalSpent;
      totalOrdersCount += totalOrders;

      const lastOrderDate = c.lastOrderAt ? new Date(c.lastOrderAt) : null;
      let daysInactive = 0;
      if (lastOrderDate) {
        const diffMs = now.getTime() - lastOrderDate.getTime();
        daysInactive = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      }

      const customerObj = {
        userId: c.userId,
        email: c.email,
        name: decryptedName,
        totalOrders,
        totalSpent,
        avgTicket,
        tier,
        lastOrderAt: lastOrderDate ? lastOrderDate.toISOString() : null,
        daysInactive
      };

      allCustomers.push(customerObj);

      // Add to tier totals
      tiersSummary[tier].count++;
      tiersSummary[tier].totalSpent += totalSpent;
      tiersSummary[tier].totalOrders += totalOrders;

      // Fase 4: Clientes Próximos da Próxima Faixa
      const nextTier = getNextTier(tier);
      if (nextTier) {
        const remaining = Number((nextTier.min - totalSpent).toFixed(2));
        nextTierList.push({
          userId: c.userId,
          name: decryptedName,
          email: c.email,
          tier,
          nextTier: nextTier.name,
          totalSpent,
          remaining
        });
      }

      // Fase 5: Clientes VIP em Risco (Ouro / Diamante sem compra nos últimos 30 dias)
      if ((tier === "Ouro" || tier === "Diamante") && daysInactive >= 30) {
        atRiskList.push({
          userId: c.userId,
          name: decryptedName,
          email: c.email,
          tier,
          lastOrderAt: lastOrderDate ? lastOrderDate.toISOString() : null,
          daysInactive,
          totalSpent
        });
      }
    }

    // Compute averages per tier
    const distribution = Object.keys(tiersSummary).reduce((acc: any, key: string) => {
      const summary = tiersSummary[key];
      const pctRevenue = totalRevenue > 0 ? (summary.totalSpent / totalRevenue) * 100 : 0;
      acc[summary.key] = {
        key: summary.key,
        name: key,
        count: summary.count,
        totalSpent: summary.totalSpent,
        totalOrders: summary.totalOrders,
        avgTicket: summary.totalOrders > 0 ? summary.totalSpent / summary.totalOrders : 0,
        pctRevenue
      };
      return acc;
    }, {});

    // Sort rankings
    const topClients = [...allCustomers]
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 15);

    const closestToEvolve = nextTierList
      .sort((a, b) => a.remaining - b.remaining)
      .slice(0, 15);

    const vipsAtRisk = atRiskList
      .sort((a, b) => b.totalSpent - a.totalSpent); // Sort high value clients first

    return {
      thresholds,
      distribution,
      topClients,
      closestToEvolve,
      vipsAtRisk,
      totalRevenue,
      totalClients: allCustomers.length,
      totalOrders: totalOrdersCount
    };
  }),

  createReactivationCoupon: adminProcedure
    .input(z.object({
      userId: z.string(),
      discountPercent: z.number().optional().default(10),
      validDays: z.number().optional().default(7),
      minOrderValue: z.number().optional().default(99),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      const now = new Date();

      // Validações de limites
      if (input.discountPercent > 15) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "O desconto máximo permitido para reativação é de 15%.",
        });
      }
      if (input.validDays > 14) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "A validade máxima permitida é de 14 dias.",
        });
      }

      // 1. Verificar se o usuário existe e calcular o LTV
      const rows = await db.execute(sql`
        SELECT 
          u.id as id,
          u.email as email,
          u.name as name,
          SUM(CAST(o.total AS DECIMAL(10,2))) as totalSpent
        FROM users u
        LEFT JOIN orders o ON o.user_id = u.id AND o.status IN ('completed', 'shipped', 'delivered') AND o.payment_status != 'refunded'
        WHERE u.id = ${input.userId} AND u.deleted_at IS NULL
        GROUP BY u.id, u.email, u.name
      `) as any;

      const userRows = rows[0] || [];
      if (userRows.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Usuário não encontrado.",
        });
      }

      const client = userRows[0];
      const ltv = Number(client.totalSpent || 0);

      // Bloquear Bronze/Prata (LTV < 1500)
      if (ltv < 1500) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Usuário não pertence à faixa Ouro ou Diamante.",
        });
      }

      // 2. Verificar se o usuário está em risco (inativo há pelo menos 30 dias)
      const lastOrderRows = await db.execute(sql`
        SELECT MAX(created_at) as lastOrderAt
        FROM orders
        WHERE user_id = ${input.userId}
          AND status IN ('completed', 'shipped', 'delivered')
          AND payment_status != 'refunded'
      `) as any;

      const lastOrderAt = lastOrderRows[0]?.[0]?.lastOrderAt;
      if (!lastOrderAt) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cliente não possui compras finalizadas.",
        });
      }

      const diffMs = now.getTime() - new Date(lastOrderAt).getTime();
      const daysInactive = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (daysInactive < 30) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Cliente ativo. Última compra realizada há ${daysInactive} dias.`,
        });
      }

      // 3. Verificar duplicidade de cupom ativo recente para o mesmo cliente
      // Rastrear através do JSON salvo no campo 'description'
      const activeCoupons = await db.select().from(coupons).where(and(
        eq(coupons.isActive, true),
        sql`${coupons.validUntil} > ${now}`
      ));

      const hasActiveCoupon = activeCoupons.some(c => {
        try {
          if (!c.description) return false;
          const meta = JSON.parse(c.description);
          return meta.userId === input.userId && meta.type === "reactivation";
        } catch {
          return false;
        }
      });

      if (hasActiveCoupon) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Já existe um cupom de reativação ativo para este cliente.",
        });
      }

      // 4. Gerar código único VOLTA-XXXXXX
      let couponCode = "";
      let isUnique = false;
      let attempts = 0;
      while (!isUnique && attempts < 10) {
        const rand = crypto.randomBytes(3).toString("hex").toUpperCase();
        couponCode = `VOLTA-${rand}`;

        const [existing] = await db
          .select({ id: coupons.id })
          .from(coupons)
          .where(eq(coupons.code, couponCode))
          .limit(1);

        if (!existing) {
          isUnique = true;
        }
        attempts++;
      }

      if (!isUnique) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Falha ao gerar código de cupom exclusivo.",
        });
      }

      const validUntil = new Date(now.getTime() + input.validDays * 24 * 60 * 60 * 1000);
      const generatedId = String(Math.floor(Math.random() * 1000000000));
      const metadata = JSON.stringify({ userId: input.userId, type: "reactivation" });

      // 5. Salvar o cupom no banco
      await db.insert(coupons).values({
        id: generatedId,
        code: couponCode,
        description: metadata,
        discountType: "percentage",
        discountValue: input.discountPercent.toFixed(2),
        minOrderValue: input.minOrderValue.toFixed(2),
        maxUsesPerCustomer: 1,
        usageLimit: 1,
        isActive: true,
        validFrom: now,
        validUntil: validUntil,
        bannerColor: "#ffd700", // Destaque dourado/VIP
        logoUrl: null,
      });

      // 6. Registrar Auditoria no AuditLogService
      const actor = {
        userId: ctx.user?.id,
        ipAddress: ctx.req?.ip || (ctx.req?.headers?.["x-forwarded-for"] as string)?.split(",")[0]?.trim() || "127.0.0.1",
        userAgent: ctx.req?.headers?.["user-agent"] || "unknown",
        requestId: (ctx.req as any)?.requestId
      };

      void AuditLogService.record({
        actor,
        module: "marketing",
        action: "VIP_REACTIVATION_COUPON_CREATED",
        severity: "warning",
        entityType: "coupons",
        entityId: generatedId,
        entityLabel: couponCode,
        oldValues: null,
        newValues: {
          targetUserId: input.userId,
          couponCode,
          discountPercent: input.discountPercent,
          validUntil: validUntil.toISOString(),
          minOrderValue: input.minOrderValue
        }
      });

      // 7. Montar texto da mensagem para copiar
      const day = String(validUntil.getDate()).padStart(2, "0");
      const month = String(validUntil.getMonth() + 1).padStart(2, "0");
      const dateStr = `${day}/${month}`;

      const messageText = `Olá, sentimos sua falta na Gourmet Saudável 😊

Preparamos um cupom especial para sua próxima compra:
CUPOM: ${couponCode}

Use até ${dateStr} e ganhe ${input.discountPercent}% de desconto em pedidos acima de R$ ${input.minOrderValue}.

Esperamos você de volta!`;

      return {
        couponCode,
        validUntil: validUntil.toISOString(),
        discountPercent: input.discountPercent,
        minOrderValue: input.minOrderValue,
        messageText
      };
    })
});
