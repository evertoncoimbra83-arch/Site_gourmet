import { eq, desc, like, or, count, and, sql, inArray } from "drizzle-orm";
import { getDb } from "./db.js"; 
import { loyaltySettings, users, loyaltyHistory, orders } from "../drizzle/schema/index.js";
import crypto from "crypto";
import { logger } from "./logger.js";

// Helper de tipagem
const toNum = (val: unknown): number => (val === null || val === undefined ? 0 : Number(val));

interface DatabaseError {
    message: string;
    code?: string;
}

export async function getLoyaltyConfigs() {
    const db = await getDb();
    if (!db) throw new Error("Database not available"); 
    
    let settings = await db.select().from(loyaltySettings).limit(1);
    
    if (settings.length === 0) {
        const defaultId = "1";
        logger.info("Configurações de fidelidade não encontradas. Criando padrões...");
        await db.insert(loyaltySettings).values({
            id: defaultId, 
            enabled: true,
            conversionRatePoints: 1,
            conversionRateMoney: "1.00",
            redemptionRatePoints: 100,
            redemptionRateMoney: "1.00",
            maxDiscountAmount: "50.00",
            minCartAmount: "0.00", 
            pointsExpirationDays: 365, 
            pointsPerSignup: 100,
        } as typeof loyaltySettings.$inferInsert);
        settings = await db.select().from(loyaltySettings).limit(1);
    }
    
    const config = settings[0];
    return {
        ...config,
        id: String(config.id),
        enabled: Boolean(config.enabled),
        conversionRateMoney: toNum(config.conversionRateMoney),
        redemptionRateMoney: toNum(config.redemptionRateMoney),
        maxDiscountAmount: toNum(config.maxDiscountAmount),
        minCartAmount: toNum(config.minCartAmount),
    };
}

export async function updateLoyaltyConfigs(data: Record<string, unknown>) {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // ✅ Removido a desestruturação do '_' que causava o aviso. 
    // Criamos o objeto de update filtrando o 'id' de forma limpa.
    const updateData = { ...data };
    delete updateData.id;
    
    (updateData as Record<string, unknown>).updatedAt = new Date();

    await db.update(loyaltySettings)
        .set(updateData as Record<string, unknown>)
        .where(eq(loyaltySettings.id, "1")); 
        
    logger.info({ updateFields: Object.keys(updateData) }, "Configurações de fidelidade atualizadas pelo administrador");
    return { success: true };
}

export async function getCustomersLoyalty(params: { page: number; limit: number; search?: string | null }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const offset = (params.page - 1) * params.limit;
  const conditions = [];
  
  if (params.search && params.search.trim() !== "" && params.search !== "undefined") {
    const term = `%${params.search}%`;
    conditions.push(
      or(
        like(users.email, term), 
        sql`name_index LIKE ${term}` 
      )
    );
  }
  
  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  try {
    const dataQuery = await db
      .select({
        id: users.id,
        name: users.name, 
        email: users.email,
        loyaltyBalance: sql`loyalty_balance`.mapWith(Number),
        totalSpent: sql`COALESCE(SUM(CASE WHEN ${orders.status} = 'completed' THEN ${orders.total} ELSE 0 END), 0)`.mapWith(Number)
      })
      .from(users)
      .leftJoin(orders, eq(orders.userId, users.id))
      .where(whereClause)
      .groupBy(users.id)
      .orderBy(sql`loyalty_balance DESC`)
      .limit(params.limit)
      .offset(offset);

    const [totalResult] = await db
      .select({ value: count() })
      .from(users)
      .where(whereClause);

    return {
      items: (dataQuery || []),
      total: toNum(totalResult?.value),
      totalPages: Math.ceil(toNum(totalResult?.value) / params.limit),
    };
  } catch (error) {
    logger.error({ err: error }, "Erro ao listar saldo de fidelidade dos clientes");
    return { items: [], total: 0, totalPages: 0 };
  }
}

export async function getCustomerHistory(userId: string) {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const history = await db.select()
        .from(loyaltyHistory)
        .where(eq(loyaltyHistory.userId, userId))
        .orderBy(desc(loyaltyHistory.createdAt));

    return (history || []).map((item) => ({
        ...item,
        id: String(item.id),
        userId: String(item.userId),
        points: toNum(item.pointsChange), 
    }));
}

export async function addManualPoints(userId: string, points: number, reason: string) {
    const db = await getDb();
    if (!db) throw new Error("Banco de dados não disponível");

    const type = points > 0 ? 'earned' : 'burned';

    logger.info({ userId, points, reason }, "📝 Iniciando ajuste manual de pontos");

    try {
        return await db.transaction(async (tx) => {
            await tx.insert(loyaltyHistory).values({
                id: crypto.randomUUID(), 
                userId: userId,
                pointsChange: points,
                type: type,
                reason: reason,
                description: reason,
                createdAt: new Date()
            } as typeof loyaltyHistory.$inferInsert);

            await tx.execute(sql`
                UPDATE users 
                SET loyalty_balance = COALESCE(loyalty_balance, 0) + ${points} 
                WHERE id = ${userId}
            `);

            logger.info({ userId, points }, "✅ Pontos ajustados com sucesso");
            return { success: true };
        });
    } catch (error: unknown) {
        const dbError = error as DatabaseError;
        logger.error({ err: dbError, userId }, "❌ Falha ao processar ajuste manual de fidelidade");
        throw new Error(`Erro ao salvar pontos: ${dbError.message}`);
    }
}

export async function deleteTransactions(userId: string, transactionIds: string[]) {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    try {
        return await db.transaction(async (tx) => {
            logger.warn({ userId, transactionCount: transactionIds.length }, "⚠️ Iniciando estorno de transações de fidelidade");

            await tx.delete(loyaltyHistory)
                .where(
                    and(
                        eq(loyaltyHistory.userId, userId),
                        inArray(loyaltyHistory.id, transactionIds)
                    )
                );

            const remainingHistory = await tx.select({
                points: loyaltyHistory.pointsChange
            })
            .from(loyaltyHistory)
            .where(eq(loyaltyHistory.userId, userId));

            const newBalance = remainingHistory.reduce((acc, curr) => acc + toNum(curr.points), 0);

            await tx.execute(sql`
                UPDATE users 
                SET loyalty_balance = ${newBalance} 
                WHERE id = ${userId}
            `);

            logger.info({ userId, newBalance }, "✅ Transações deletadas e saldo recalculado");
            return { success: true, newBalance };
        });
    } catch (error: unknown) {
        logger.error({ err: error, userId }, "Erro ao deletar transações e recalcular saldo");
        throw new Error("Erro ao processar estorno no banco de dados.");
    }
}