import { router, protectedProcedure, publicProcedure } from "../../_core/trpc.js";
import { getDb } from "../../db.js"; 
import { users } from "../../../drizzle/schema/index.js"; 
import { sql, eq } from "drizzle-orm";
import { z } from "zod"; 
import { getLoyaltySettings } from "../../loyalty.js"; 
import { logger } from "../../logger.js"; 

// ✅ Interface para as regras de resgate (JSON)
interface RedemptionRule {
  minOrderValue: number;
  maxDiscount: number;
}

// ✅ Interface para evitar o 'any' no User
interface UserLoyaltyRow {
  totalSpent?: string | number;
  total_spent?: string | number;
  loyaltyTier?: string;
}

// ✅ Interface para as configurações (Settings) sem 'any'
interface LoyaltySettingsResponse {
  enabled: boolean;
  redemptionRatePoints: number;
  redemptionRateMoney: string | number;
  conversionRatePoints: number;
  conversionRateMoney: string | number;
  redemptionRules?: RedemptionRule[];
  redemption_rules?: RedemptionRule[];
  minCartAmount?: string | number;
  maxDiscountAmount?: string | number;
}

interface SqlResult extends Record<string, unknown> {
  total_balance?: string | number;
  points_change?: string | number;
  reason?: string;
  description?: string;
  created_at?: Date;
  id?: string;
}

/**
 * 💎 Roteador de Fidelidade - Experiência do Cliente
 */
export const loyaltyRouter = router({

  /**
   * ✅ GET POINTS
   */
  getPoints: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.user.id;
    try {
      const db = await getDb();
      
      const [balanceQuery] = await db.execute<SqlResult>(sql`
        SELECT COALESCE(SUM(points_change), 0) as total_balance 
        FROM loyalty_history 
        WHERE user_id = ${userId}
      `);

      const [userRow] = await db.select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      const rows = Array.isArray(balanceQuery) ? balanceQuery : [balanceQuery];
      const firstRow = rows[0] as SqlResult | undefined;
      const points = Number(firstRow?.total_balance || 0);
      
      const userData = userRow as unknown as UserLoyaltyRow | undefined;
      const totalSpent = userData?.totalSpent || userData?.total_spent || "0.00";

      return { 
        current_points: points,
        loyaltyPoints: points,
        totalSpent: String(totalSpent),
        tier: userData?.loyaltyTier || "Bronze" 
      };
    } catch (error) {
      logger.error({ err: error, userId }, "Erro ao buscar pontos do usuário");
      return { current_points: 0, loyaltyPoints: 0, totalSpent: "0.00" };
    }
  }),

  /**
   * ✅ GET HISTORY
   */
  getHistory: protectedProcedure
    .input(z.object({ limit: z.number().default(5) }).optional())
    .query(async ({ ctx, input }) => {
      const userId = ctx.user.id;
      const limit = input?.limit ?? 5;
      
      try {
        const db = await getDb();
        const [rows] = await db.execute<SqlResult>(sql`
          SELECT id, reason, description, points_change, created_at 
          FROM loyalty_history 
          WHERE user_id = ${userId} 
          ORDER BY created_at DESC
          LIMIT ${limit}
        `);
        
        if (!Array.isArray(rows)) return [];

        return rows.map((entry) => {
          const e = entry as SqlResult;
          return {
            id: e.id,
            reason: e.reason || "Compra Realizada",
            description: e.description || "Pontos acumulados",
            pointsChange: Number(e.points_change || 0),
            createdAt: e.created_at
          };
        });
      } catch (error) {
        logger.error({ err: error, userId }, "Erro ao buscar histórico de fidelidade");
        return [];
      }
    }),

  /**
   * ✅ GET SETTINGS (Público)
   */
  getSettings: publicProcedure.query(async () => {
    try {
      // Fazemos o cast para unknown e depois para a nossa interface estrita
      const settings = (await getLoyaltySettings()) as unknown as LoyaltySettingsResponse;
      
      const rules = settings?.redemption_rules || settings?.redemptionRules;
      
      if (!settings || !rules || (Array.isArray(rules) && rules.length === 0)) {
        logger.warn("⚠️ getSettings retornou regras vazias ou incompletas.");
      }

      return settings;
    } catch (error) {
      logger.error({ err: error }, "Erro crítico ao buscar configurações no loyaltyRouter");
      return { 
        redemptionRatePoints: 100, 
        redemptionRateMoney: "1.00", 
        enabled: false,
        conversionRateMoney: "1.00",
        conversionRatePoints: 1,
        redemptionRules: [] as RedemptionRule[]
      };
    }
  }),

  /**
   * 🔄 COMPATIBILIDADE E DEBUG DE SALDO
   */
  getCustomerSummary: protectedProcedure.query(async ({ ctx }) => {
    try {
      const db = await getDb();
      const [result] = await db.execute<SqlResult>(sql`
        SELECT COALESCE(SUM(points_change), 0) as total_balance 
        FROM loyalty_history 
        WHERE user_id = ${ctx.user.id}
      `);
      
      const rows = Array.isArray(result) ? result : [result];
      const points = Number(rows[0]?.total_balance || 0);

      return { 
        current_points: points, 
        balance: points, 
        points, 
        userId: ctx.user.id 
      };
    } catch (error) {
      logger.error({ err: error }, "Erro no customer summary");
      return { current_points: 0, balance: 0, points: 0, userId: ctx.user.id };
    }
  }),

  getUserBalance: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.user.id;
    logger.debug({ userId }, "Verificando saldo do usuário via getUserBalance");

    try {
      const db = await getDb();
      const [result] = await db.execute<SqlResult>(sql`
        SELECT COALESCE(SUM(points_change), 0) as total_balance 
        FROM loyalty_history 
        WHERE user_id = ${userId}
      `);
      
      const rows = Array.isArray(result) ? result : [result];
      const balance = Number(rows[0]?.total_balance || 0);

      return { balance, userId };
    } catch (error) {
      logger.error({ err: error }, "Erro ao buscar balance");
      return { balance: 0, userId };
    }
  }),
});