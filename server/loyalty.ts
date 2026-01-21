// server/loyalty.ts

import { eq, desc, like, or, count, and, sum, sql } from "drizzle-orm";
import { getDb } from "./db"; 
import { loyaltySettings, users, loyaltyHistory, orders } from "../drizzle/schema/index.js";

// =================================================================
// 1. CONFIGURAÇÕES (CRUD)
// =================================================================

export async function getLoyaltySettings() {
    const db = await getDb();
    if (!db) throw new Error("Database not available"); 
    
    const settings = await db.select().from(loyaltySettings).limit(1);
    
    if (settings.length === 0) {
        console.log("Criando configurações padrão de fidelidade...");
        await db.insert(loyaltySettings).values({
            enabled: true,
            conversionRatePoints: 1,
            conversionRateMoney: "1.00",
            redemptionRatePoints: 100,
            redemptionRateMoney: "1.00",
            maxDiscountAmount: "50.00",
            minCartAmount: "0.00", 
            minDiscountRequired: "0.00",
            pointsExpirationDays: 365,
            pointsPerSignup: 100,
            pointsPerReview: 10,
        });
        return (await db.select().from(loyaltySettings).limit(1))[0];
    }
    
    return settings[0];
}

export async function updateLoyaltySettings(data: any) {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const updateData: any = {};
    
    if (data.enabled !== undefined) updateData.enabled = data.enabled;
    if (data.conversionRatePoints !== undefined) updateData.conversionRatePoints = data.conversionRatePoints;
    if (data.conversionRateMoney !== undefined) updateData.conversionRateMoney = data.conversionRateMoney.toString();
    if (data.redemptionRatePoints !== undefined) updateData.redemptionRatePoints = data.redemptionRatePoints;
    if (data.redemptionRateMoney !== undefined) updateData.redemptionRateMoney = data.redemptionRateMoney.toString();
    if (data.maxDiscountAmount !== undefined) updateData.maxDiscountAmount = data.maxDiscountAmount.toString();
    if (data.minCartAmount !== undefined) updateData.minCartAmount = data.minCartAmount.toString();
    if (data.minDiscountRequired !== undefined) updateData.minDiscountRequired = data.minDiscountRequired.toString();
    if (data.pointsExpirationDays !== undefined) updateData.pointsExpirationDays = data.pointsExpirationDays;
    if (data.pointsPerSignup !== undefined) updateData.pointsPerSignup = data.pointsPerSignup;
    if (data.pointsPerReview !== undefined) updateData.pointsPerReview = data.pointsPerReview;

    await db.update(loyaltySettings).set(updateData);
    return (await db.select().from(loyaltySettings).limit(1))[0];
}

// =================================================================
// 2. LÓGICA DE CÁLCULO
// =================================================================

export async function calculateLoyaltyPoints(subtotal: number, userId: number): Promise<number> {
    if (!userId || subtotal <= 0) return 0;
    try {
        const settings = await getLoyaltySettings();
        if (!settings.enabled) return 0;

        const moneyBase = parseFloat(settings.conversionRateMoney || "1.00");
        const pointsBase = settings.conversionRatePoints || 1;

        if (moneyBase <= 0) return 0;
        return Math.floor(subtotal / moneyBase) * pointsBase;
    } catch (error) {
        console.error("Erro ao calcular pontos de fidelidade:", error);
        return 0;
    }
}

// =================================================================
// 3. CLIENTES FIDELIDADE (RELATÓRIO ADMIN)
// =================================================================

export async function getLoyaltyCustomers(params: {
    page: number;
    limit: number;
    search?: string;
}) {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const offset = (params.page - 1) * params.limit;
    const conditions = [];

    if (params.search) {
        const term = `%${params.search}%`;
        conditions.push(or(like(users.name, term), like(users.email, term)));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    
    const pointsSubQuery = db
        .select({
            userId: loyaltyHistory.userId,
            points: sql<number>`CAST(SUM(${loyaltyHistory.pointsChange}) AS SIGNED)`.as('points_total'),
        })
        .from(loyaltyHistory)
        .groupBy(loyaltyHistory.userId)
        .as('ph');
        
    const spentSubQuery = db
        .select({
            userId: orders.userId,
            totalSpent: sum(orders.total).as('spent_total'),
        })
        .from(orders)
        .groupBy(orders.userId)
        .as('os');

    const dataQuery = db
        .select({
            id: users.id,
            name: users.name,
            email: users.email,
            points: sql<number>`COALESCE(${pointsSubQuery.points}, 0)`,
            totalSpent: sql<string>`CAST(COALESCE(${spentSubQuery.totalSpent}, '0.00') AS CHAR)`,
            lastActivity: users.lastSignedIn,
        })
        .from(users)
        .leftJoin(pointsSubQuery, eq(users.id, pointsSubQuery.userId))
        .leftJoin(spentSubQuery, eq(users.id, spentSubQuery.userId))
        .orderBy(desc(sql`COALESCE(${pointsSubQuery.points}, 0)`)) 
        .where(whereClause)
        .limit(params.limit)
        .offset(offset);

    const countQuery = db.select({ value: count() }).from(users).where(whereClause);
    const [items, totalResult] = await Promise.all([dataQuery, countQuery]);

    return {
        items: items.map(item => ({
            ...item,
            totalSpent: item.totalSpent || "0.00",
            points: item.points || 0,
        })),
        total: Number(totalResult[0].value),
        totalPages: Math.ceil(Number(totalResult[0].value) / params.limit),
    };
}

export async function getCustomerHistory(userId: number) {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    return db.select()
        .from(loyaltyHistory)
        .where(eq(loyaltyHistory.userId, userId))
        .orderBy(desc(loyaltyHistory.createdAt));
}

// =================================================================
// 4. MÉTODOS PÚBLICOS / PERFIL DO USUÁRIO
// =================================================================

/**
 * Busca o saldo de pontos do usuário com soma manual para garantir precisão de tipos.
 */
export async function getUserPoints(userId: number) {
    const db = await getDb();
    if (!db) return { current_points: 0, lifetime_points: 0 };

    try {
        const history = await db.select()
            .from(loyaltyHistory)
            .where(eq(loyaltyHistory.userId, userId));

        let current = 0;
        let lifetime = 0;

        history.forEach(row => {
            const p = Number(row.pointsChange) || 0;
            current += p;
            if (p > 0) lifetime += p;
        });

      return { current_points: current,
      lifetime_points: lifetime,
      points: current,      // Nome comum
      balance: current,     // Nome comum
      total: current        // Nome comum
    };
    } catch (error) {
      return { current_points: 0, lifetime_points: 0 };
    }
}

export async function getUserLoyaltyPoints(userId: number) {
    return getUserPoints(userId);
}

export async function getLoyaltyHistory(userId: number, limit: number = 10) {
    const db = await getDb();
    if (!db) return [];
    try {
        return await db.select()
            .from(loyaltyHistory)
            .where(eq(loyaltyHistory.userId, userId))
            .orderBy(desc(loyaltyHistory.createdAt))
            .limit(limit);
    } catch (error) {
       
        return [];
    }
}

export async function addPoints(userId: number, points: number, reason: string) {
    const db = await getDb();
    if (!db) return false;
    try {
        await db.insert(loyaltyHistory).values({
            userId,
            pointsChange: points,
            reason,
            createdAt: new Date()
        });
       
        return true;
    } catch (e) {
        console.error("[Loyalty] Erro ao adicionar pontos:", e);
        return false;
    }
}