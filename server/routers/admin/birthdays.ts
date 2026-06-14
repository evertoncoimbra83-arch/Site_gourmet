import { router, adminProcedure } from "../../_core/trpc.js";
import { getDb } from "../../db.js";
import { sql } from "drizzle-orm";
import { decrypt } from "../../encryption.js";
import { coupons, users } from "../../../drizzle/schema/index.js";
import { eq, and } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { AuditLogService } from "../../services/AuditLogService.js";
import { z } from "zod";
import crypto from "crypto";

const isBirthdayInRange = (birthDateStr: string | null | undefined, daysAhead: number): boolean => {
  if (!birthDateStr) return false;
  const parts = birthDateStr.split("-");
  let m = 0;
  let d = 0;
  if (parts.length === 3) {
    m = parseInt(parts[1], 10) - 1;
    d = parseInt(parts[2], 10);
  } else if (parts.length === 2) {
    m = parseInt(parts[0], 10) - 1;
    d = parseInt(parts[1], 10);
  } else {
    return false;
  }

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  for (let i = 0; i <= daysAhead; i++) {
    const checkDate = new Date(today.getTime() + i * 24 * 60 * 60 * 1000);
    if (checkDate.getMonth() === m && checkDate.getDate() === d) {
      return true;
    }
  }
  return false;
};

const getTierName = (ltv: number): string => {
  if (ltv >= 3000) return "Diamante";
  if (ltv >= 1500) return "Ouro";
  if (ltv >= 500) return "Prata";
  if (ltv >= 0.01) return "Bronze";
  return "Nenhum";
};

export const adminBirthdaysRouter = router({
  summary: adminProcedure.query(async () => {
    const db = await getDb();

    // Query de agregação para obter dados de compras dos usuários ativos
    const rows = await db.execute(sql`
      SELECT 
        u.id,
        u.email,
        u.name,
        u.birth_date as birthDate,
        COUNT(o.id) as totalOrders,
        SUM(CAST(o.total AS DECIMAL(10,2))) as totalSpent
      FROM users u
      LEFT JOIN orders o ON o.user_id = u.id AND o.status IN ('completed', 'shipped', 'delivered') AND o.payment_status != 'refunded'
      WHERE u.deleted_at IS NULL
      GROUP BY u.id, u.email, u.name, u.birth_date
    `) as any;

    const customers = rows[0] || [];
    const totalActive = customers.length;

    let countWithBirthDate = 0;
    let aniversariantesHoje = 0;
    let aniversariantesProximos7Dias = 0;
    let aniversariantesProximos30Dias = 0;
    let vipsAniversariantes = 0;

    const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
    const byMonth = months.map(m => ({ name: m, count: 0 }));

    const byTier = [
      { name: "Bronze", count: 0, color: "#cd7f32" },
      { name: "Prata", count: 0, color: "#c0c0c0" },
      { name: "Ouro", count: 0, color: "#ffd700" },
      { name: "Diamante", count: 0, color: "#e5e4e2" },
    ];

    for (const c of customers) {
      const bDate = c.birthDate;
      if (bDate && bDate.trim() !== "") {
        countWithBirthDate++;

        if (isBirthdayInRange(bDate, 0)) aniversariantesHoje++;
        if (isBirthdayInRange(bDate, 7)) aniversariantesProximos7Dias++;
        if (isBirthdayInRange(bDate, 30)) aniversariantesProximos30Dias++;

        const ltv = Number(c.totalSpent || 0);
        const tier = getTierName(ltv);

        if (tier === "Ouro" || tier === "Diamante") {
          if (isBirthdayInRange(bDate, 30)) {
            vipsAniversariantes++;
          }
        }

        // Gráfico de meses
        const parts = bDate.split("-");
        let mIdx = -1;
        if (parts.length === 3) {
          mIdx = parseInt(parts[1], 10) - 1;
        } else if (parts.length === 2) {
          mIdx = parseInt(parts[0], 10) - 1;
        }
        if (mIdx >= 0 && mIdx < 12) {
          byMonth[mIdx].count++;
        }

        // Gráfico de tiers (colocando LTV 0 como Bronze para fins visuais no gráfico)
        const displayTier = ltv >= 3000 ? "Diamante" : ltv >= 1500 ? "Ouro" : ltv >= 500 ? "Prata" : "Bronze";
        const tierItem = byTier.find(t => t.name === displayTier);
        if (tierItem) {
          tierItem.count++;
        }
      }
    }

    const percentualPreenchido = totalActive > 0 ? (countWithBirthDate / totalActive) * 100 : 0;

    return {
      aniversariantesHoje,
      aniversariantesProximos7Dias,
      aniversariantesProximos30Dias,
      vipsAniversariantes,
      percentualPreenchido,
      byMonth,
      byTier,
    };
  }),

  listUpcoming: adminProcedure
    .input(z.object({
      daysAhead: z.number().default(30)
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      const now = new Date();

      const rows = await db.execute(sql`
        SELECT 
          u.id,
          u.email,
          u.name,
          u.phone,
          u.birth_date as birthDate,
          COUNT(o.id) as totalOrders,
          SUM(CAST(o.total AS DECIMAL(10,2))) as totalSpent,
          MAX(o.created_at) as lastOrderAt
        FROM users u
        LEFT JOIN orders o ON o.user_id = u.id AND o.status IN ('completed', 'shipped', 'delivered') AND o.payment_status != 'refunded'
        WHERE u.deleted_at IS NULL
        GROUP BY u.id, u.email, u.name, u.phone, u.birth_date
      `) as any;

      const customers = rows[0] || [];
      const upcomingList: any[] = [];

      const tierWeights: Record<string, number> = {
        Diamante: 4,
        Ouro: 3,
        Prata: 2,
        Bronze: 1,
        Nenhum: 0,
      };

      for (const c of customers) {
        const bDate = c.birthDate;
        if (bDate && isBirthdayInRange(bDate, input.daysAhead)) {
          const ltv = Number(c.totalSpent || 0);
          const lastOrderDate = c.lastOrderAt ? new Date(c.lastOrderAt) : null;
          let daysInactive: number | null = null;
          if (lastOrderDate) {
            const diffMs = now.getTime() - lastOrderDate.getTime();
            daysInactive = Math.floor(diffMs / (1000 * 60 * 60 * 24));
          }

          upcomingList.push({
            id: c.id,
            name: decrypt(c.name) || c.email || "Cliente sem Nome",
            email: c.email,
            phone: decrypt(c.phone) || "",
            birthDate: bDate,
            lastOrderAt: lastOrderDate ? lastOrderDate.toISOString() : null,
            daysInactive,
            totalOrders: Number(c.totalOrders || 0),
            ltv,
            vipTier: getTierName(ltv),
          });
        }
      }

      // Ordenar Diamante -> Ouro -> Prata -> Bronze -> Nenhum e depois por LTV decrescente
      return upcomingList.sort((a, b) => {
        const weightA = tierWeights[a.vipTier] || 0;
        const weightB = tierWeights[b.vipTier] || 0;
        if (weightA !== weightB) {
          return weightB - weightA;
        }
        return b.ltv - a.ltv;
      });
    }),

  createCoupon: adminProcedure
    .input(z.object({
      userId: z.string(),
      discountPercent: z.number().default(10),
      validDays: z.number().default(7),
      minOrderValue: z.number().default(0),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      const now = new Date();
      const currentYear = now.getFullYear();

      // 1. Validar existência do usuário
      const [userRow] = await db.select().from(users).where(eq(users.id, input.userId)).limit(1);
      if (!userRow) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Cliente não encontrado.",
        });
      }

      // 2. Validar se possui aniversário cadastrado
      if (!userRow.birthDate) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cliente não possui data de nascimento cadastrada.",
        });
      }

      // 3. BLOQUEIO OBRIGATÓRIO: Apenas 1 cupom de aniversário por ano civil
      // Buscar todos os cupons do sistema para verificar o histórico anual
      const allCoupons = await db.select().from(coupons);
      
      const hasAnnualCoupon = allCoupons.some(c => {
        try {
          if (!c.description || !c.createdAt) return false;
          const meta = JSON.parse(c.description);
          if (meta.userId === input.userId && meta.type === "birthday") {
            const couponYear = new Date(c.createdAt).getFullYear();
            return couponYear === currentYear;
          }
          return false;
        } catch {
          return false;
        }
      });

      if (hasAnnualCoupon) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Este cliente já recebeu um cupom de aniversário no ano de ${currentYear}.`,
        });
      }

      // 4. Bloquear duplicidade de cupom de aniversário ativo recente
      const hasActiveCoupon = allCoupons.some(c => {
        try {
          if (!c.description || !c.isActive || !c.validUntil) return false;
          const meta = JSON.parse(c.description);
          return (
            meta.userId === input.userId &&
            meta.type === "birthday" &&
            new Date(c.validUntil) > now
          );
        } catch {
          return false;
        }
      });

      if (hasActiveCoupon) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Já existe um cupom de aniversário ativo para este cliente.",
        });
      }

      // 5. Gerar código único NIVER-XXXXXX
      let couponCode = "";
      let isUnique = false;
      let attempts = 0;
      while (!isUnique && attempts < 10) {
        const rand = crypto.randomBytes(3).toString("hex").toUpperCase();
        couponCode = `NIVER-${rand}`;

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
      const metadata = JSON.stringify({ 
        userId: input.userId, 
        type: "birthday",
        campaign: "ANIVERSARIO" 
      });

      // 6. Inserir no banco
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
        bannerColor: "#ec4899", // Rosa/Festivo para aniversário
        logoUrl: null,
      });

      // 7. Registrar Auditoria
      const actor = {
        userId: ctx.user?.id,
        ipAddress: ctx.req?.ip || (ctx.req?.headers?.["x-forwarded-for"] as string)?.split(",")[0]?.trim() || "127.0.0.1",
        userAgent: ctx.req?.headers?.["user-agent"] || "unknown",
        requestId: (ctx.req as any)?.requestId
      };

      void AuditLogService.record({
        actor,
        module: "marketing",
        action: "BIRTHDAY_COUPON_CREATED",
        severity: "info",
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

      // 8. Montar mensagem pronta
      const day = String(validUntil.getDate()).padStart(2, "0");
      const month = String(validUntil.getMonth() + 1).padStart(2, "0");
      const dateStr = `${day}/${month}`;
      const decryptedName = decrypt(userRow.name) || "Cliente";

      const messageText = `Olá ${decryptedName},

Passando para desejar um feliz aniversário!

Preparamos um presente especial para você:

Cupom: ${couponCode}

Válido até ${dateStr}.

Equipe Gourmet Saudável`;

      return {
        couponCode,
        validUntil: validUntil.toISOString(),
        messageText,
      };
    })
});
