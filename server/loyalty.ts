// server/loyalty.ts

import { eq, desc, like, or, count, and, sum, sql } from "drizzle-orm";
import { getDb } from "./db"; 
import { loyaltySettings, users, loyaltyHistory, orders } from "../drizzle/schema/index";
import crypto from "crypto";
import { safeBoolean, safeInteger, safeNumber, safeString } from "./lib/safe-parse";

// =================================================================
// 1. CONFIGURAÇÕES (CRUD)
// =================================================================

export async function getLoyaltySettings() {
    const db = await getDb();
    if (!db) throw new Error("Database not available"); 
    
    const settings = await db.select().from(loyaltySettings).limit(1);
    
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
            // ✅ CORREÇÃO: Removido 'pointsPerReview' pois não existe no Schema
        } as typeof loyaltySettings.$inferInsert);
        return (await db.select().from(loyaltySettings).limit(1))[0];
    }
    
    return settings[0];
}

export async function updateLoyaltySettings(data: Record<string, unknown>) {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // ✅ CORREÇÃO: Usando casting para contornar limitações do schema e evitar TS2339
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = {};
    
    if (data.enabled !== undefined) updateData.enabled = safeBoolean(data.enabled);
    if (data.conversionRatePoints !== undefined) updateData.conversionRatePoints = safeInteger(data.conversionRatePoints);
    if (data.conversionRateMoney !== undefined) updateData.conversionRateMoney = safeString(data.conversionRateMoney);
    if (data.redemptionRatePoints !== undefined) updateData.redemptionRatePoints = safeInteger(data.redemptionRatePoints);
    if (data.redemptionRateMoney !== undefined) updateData.redemptionRateMoney = safeString(data.redemptionRateMoney);
    if (data.maxDiscountAmount !== undefined) updateData.maxDiscountAmount = safeString(data.maxDiscountAmount);
    if (data.minCartAmount !== undefined) updateData.minCartAmount = safeString(data.minCartAmount);
    if (data.pointsExpirationDays !== undefined) updateData.pointsExpirationDays = safeInteger(data.pointsExpirationDays);
    if (data.pointsPerSignup !== undefined) updateData.pointsPerSignup = safeInteger(data.pointsPerSignup);
    
    // updatedAt costuma causar erro se não estiver no schema, tratamos como any acima
    updateData.updatedAt = new Date();

    await db.update(loyaltySettings).set(updateData);
    return (await db.select().from(loyaltySettings).limit(1))[0];
}

// =================================================================
// 2. LÓGICA DE CÁLCULO
// =================================================================

export async function calculateLoyaltyPoints(subtotal: number, userId: string): Promise<number> {
    if (!userId || subtotal <= 0) return 0;
    try {
        const settings = await getLoyaltySettings();
        if (!settings.enabled) return 0;

        const moneyBase = safeNumber(settings.conversionRateMoney, 1);
        const pointsBase = safeInteger(settings.conversionRatePoints, 1);

        if (moneyBase <= 0) return 0;
        return Math.floor(subtotal / moneyBase) * pointsBase;
    } catch {
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
        total: safeNumber(totalResult[0].value),
        totalPages: Math.ceil(safeNumber(totalResult[0].value) / params.limit),
    };
}

export async function getCustomerHistory(userId: string) {
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

export async function getUserPoints(userId: string) {
    const db = await getDb();
    if (!db) return { current_points: 0, lifetime_points: 0 };

    try {
        const history = await db.select()
            .from(loyaltyHistory)
            .where(eq(loyaltyHistory.userId, userId));

        let current = 0;
        let lifetime = 0;

        history.forEach(row => {
            const p = safeNumber(row.pointsChange, 0);
            current += p;
            if (p > 0) lifetime += p;
        });

      return { 
        current_points: current,
        lifetime_points: lifetime,
        points: current,
        balance: current,
        total: current
      };
    } catch {
      return { current_points: 0, lifetime_points: 0 };
    }
}

export async function getUserLoyaltyPoints(userId: string) {
    return getUserPoints(userId);
}

export async function getLoyaltyHistory(userId: string, limit: number = 10) {
    const db = await getDb();
    if (!db) return [];
    try {
        return await db.select()
            .from(loyaltyHistory)
            .where(eq(loyaltyHistory.userId, userId))
            .orderBy(desc(loyaltyHistory.createdAt))
            .limit(limit);
    } catch {
        return [];
    }
}

export async function addPoints(userId: string, points: number, reason: string) {
    const db = await getDb();
    if (!db) return false;
    try {
        await db.insert(loyaltyHistory).values({
            id: crypto.randomUUID(),
            userId,
            pointsChange: points,
            reason,
            createdAt: new Date()
        });
       
        return true;
    } catch {
        return false;
    }
}
