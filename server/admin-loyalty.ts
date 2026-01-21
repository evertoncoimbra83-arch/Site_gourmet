import { eq, desc, like, or, count, and, sql } from "drizzle-orm";
import { getDb } from "./db.js"; 
import { loyaltySettings, users, loyaltyHistory, orders } from "../drizzle/schema/index.js";
import crypto from "crypto";

// =================================================================
// CRUD DE CONFIGURAÇÕES (Mantido igual)
// =================================================================
export async function getLoyaltyConfigs() {
    const db = await getDb();
    if (!db) throw new Error("Database not available"); 
    
    let settings = await db.select().from(loyaltySettings).limit(1);
    
    if (settings.length === 0) {
        await db.insert(loyaltySettings).values({
            id: "1", 
            enabled: true,
            conversionRatePoints: 1,
            conversionRateMoney: "1.00",
            redemptionRatePoints: 100,
            redemptionRateMoney: "1.00",
            maxDiscountAmount: "50.00",
            minCartAmount: "0.00", 
            pointsExpirationDays: 365, 
            pointsPerSignup: 100,
            pointsPerReview: 10,
        } as any);
        settings = await db.select().from(loyaltySettings).limit(1);
    }
    
    const config = settings[0];
    return {
        ...config,
        id: String(config.id),
        enabled: Boolean(config.enabled),
        conversionRateMoney: Number(config.conversionRateMoney),
        redemptionRateMoney: Number(config.redemptionRateMoney),
        maxDiscountAmount: Number(config.maxDiscountAmount),
        minCartAmount: Number(config.minCartAmount),
    };
}

export async function updateLoyaltyConfigs(data: any) {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const updateData: any = { updatedAt: new Date() };

    if (data.enabled !== undefined) updateData.enabled = data.enabled;
    if (data.conversionRatePoints !== undefined) updateData.conversionRatePoints = Number(data.conversionRatePoints);
    if (data.conversionRateMoney !== undefined) updateData.conversionRateMoney = String(data.conversionRateMoney);
    if (data.redemptionRatePoints !== undefined) updateData.redemptionRatePoints = Number(data.redemptionRatePoints);
    if (data.redemptionRateMoney !== undefined) updateData.redemptionRateMoney = String(data.redemptionRateMoney);
    if (data.maxDiscountAmount !== undefined) updateData.maxDiscountAmount = String(data.maxDiscountAmount);
    if (data.minCartAmount !== undefined) updateData.minCartAmount = String(data.minCartAmount);
    if (data.pointsExpirationDays !== undefined) updateData.pointsExpirationDays = data.pointsExpirationDays;
    if (data.pointsPerSignup !== undefined) updateData.pointsPerSignup = data.pointsPerSignup;
    if (data.pointsPerReview !== undefined) updateData.pointsPerReview = data.pointsPerReview;

    await db.update(loyaltySettings).set(updateData).where(eq(loyaltySettings.id, "1")); 
    return { success: true };
}

// =================================================================
// RELATÓRIOS E LISTAGEM (AQUI ESTÁ A CORREÇÃO CRÍTICA)
// =================================================================

export async function getCustomersLoyalty(params: { page: number; limit: number; search?: string | null; }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const offset = (params.page - 1) * params.limit;
  
  // Filtros de busca
  const conditions = [];
  if (params.search && params.search.trim() !== "" && params.search !== "undefined") {
    const term = `%${params.search}%`;
    conditions.push(or(like(users.email, term), like(users.name, term)));
  }
  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  try {
    // ✅ MUDANÇA PARA LEFT JOIN:
    // Em vez de uma subquery frágil, unimos as tabelas. Isso garante que os IDs coincidam.
    const dataQuery = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        loyaltyBalance: users.loyaltyBalance,
        // SOMA CONDICIONAL: Soma apenas se o status for 'completed'
        // Usa o truque '+ 0' e REPLACE para limpar as aspas do banco
        spent_total: sql<number>`
          COALESCE(SUM(
            CASE 
              WHEN ${orders.status} = 'completed' 
              THEN REPLACE(${orders.total}, '"', '') + 0 
              ELSE 0 
            END
          ), 0)
        `.as('spent_total')
      })
      .from(users)
      // O Drizzle gere a relação aqui. Se orders.userId estiver definido no schema, isto funciona.
      .leftJoin(orders, eq(orders.userId, users.id))
      .where(whereClause)
      .groupBy(users.id) // Agrupa por utilizador para somar os pedidos corretamente
      .orderBy(desc(users.loyaltyBalance))
      .limit(params.limit)
      .offset(offset);

    // Contagem total para paginação
    const [totalResult] = await db.select({ value: count() }).from(users).where(whereClause);

    return {
      items: dataQuery.map((i: any) => ({
        id: i.id,
        name: i.name,
        email: i.email,
        // Normalização final para o Frontend
        points: Number(i.loyaltyBalance || 0),
        totalSpent: Number(i.spent_total || 0)
      })),
      total: Number(totalResult?.value || 0),
      totalPages: Math.ceil(Number(totalResult?.value || 0) / params.limit),
    };
  } catch (err: any) {
    console.error("❌ Erro fatal no SQL de fidelidade:", err);
    throw err;
  }
}

export async function getCustomerHistory(userId: string) {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const history = await db.select()
        .from(loyaltyHistory)
        .where(eq(loyaltyHistory.userId, userId))
        .orderBy(desc(loyaltyHistory.createdAt));

    return history.map(item => ({
        ...item,
        id: String(item.id),
        userId: String(item.userId),
        points: Number(item.pointsChange), 
    }));
}

export async function addManualPoints(userId: string, points: number, reason: string) {
    const db = await getDb();
    if (!db) throw new Error("Banco de dados não disponível");

    const type = points > 0 ? 'earned' : 'burned';

    try {
        await db.insert(loyaltyHistory).values({
            id: crypto.randomUUID(), 
            userId: userId,
            pointsChange: points,
            type: type as any,
            reason: reason,
            description: reason,
            createdAt: new Date()
        });

        await db.execute(sql`
            UPDATE users 
            SET loyalty_balance = loyalty_balance + ${points} 
            WHERE id = ${userId}
        `);

        return { success: true };
    } catch (error) {
        console.error("❌ Erro SQL ao inserir pontos:", error);
        throw new Error("Falha ao gravar ajuste manual no banco.");
    }
}