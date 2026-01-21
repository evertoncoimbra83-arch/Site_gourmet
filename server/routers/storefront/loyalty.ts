import { router, protectedProcedure, publicProcedure } from "../../_core/trpc.js";
import { getDb } from "../../db.js"; 
import { loyaltySettings, users } from "../../../drizzle/schema/index.js"; 
import { sql, eq } from "drizzle-orm";
import { z } from "zod"; // ✅ CORREÇÃO 1: Importação do Zod adicionada

/**
 * Roteador de Fidelidade - Visão do Cliente
 */
export const loyaltyRouter = router({

  /**
   * ✅ GET POINTS
   * Busca saldo via histórico e estatísticas via tabela de usuários.
   */
  getPoints: protectedProcedure.query(async ({ ctx }) => {
    const currentUserId = ctx.user.id;
    try {
      const db = await getDb();
      
      // Soma o saldo do histórico (mais preciso para pontos atuais)
      const result = await db.execute(sql`
        SELECT SUM(points_change) as total_balance 
        FROM loyalty_history 
        WHERE user_id = ${currentUserId}
      `);

      // ✅ CORREÇÃO 2: Verificação do nome da coluna no schema
      // O Drizzle usa camelCase por padrão para as propriedades. 
      // Se 'totalSpent' deu erro, estamos acessando via objeto de colunas.
      const userStats = await db.select()
        .from(users)
        .where(eq(users.id, currentUserId))
        .limit(1);

      const data = (result as any)[0];
      const rows = Array.isArray(data) ? data[0] : data;
      const points = Number(rows?.total_balance || 0);
      
      // Mapeia o campo correto do usuário (ajustado para o que costuma estar no seu schema)
      const userData = userStats[0] as any;
      const totalSpentValue = userData?.totalSpent || userData?.total_spent || "0.00";

      return { 
        current_points: points,
        loyaltyPoints: points,
        totalSpent: String(totalSpentValue)
      };
    } catch (error) {
      console.error("[Loyalty] Erro no getPoints:", error);
      return { current_points: 0, loyaltyPoints: 0, totalSpent: "0.00" };
    }
  }),

  /**
   * ✅ GET HISTORY
   */
  getHistory: protectedProcedure
    .input(z.object({ limit: z.number().default(5) }).optional()) // ✅ Zod agora funciona
    .query(async ({ ctx, input }) => {
      const userId = ctx.user.id;
      const limit = input?.limit ?? 5;
      try {
        const db = await getDb();
        const result = await db.execute(sql`
          SELECT * FROM loyalty_history 
          WHERE user_id = ${userId} 
          ORDER BY created_at DESC
          LIMIT ${limit}
        `);
        
        const rows = (result as unknown as any[])[0];
        if (!Array.isArray(rows)) return [];

        return rows.map((entry: any) => ({
          id: entry.id,
          reason: entry.reason || "Compra Realizada",
          description: entry.description || "Pontos acumulados",
          pointsChange: Number(entry.points_change || 0),
          createdAt: entry.created_at
        }));
      } catch (error) {
        console.error("[Loyalty] Erro no getHistory:", error);
        return [];
      }
    }),

  /**
   * ✅ ROTA DE SALDO PARA O CARRINHO
   */
  getUserBalance: protectedProcedure
    .query(async ({ ctx }) => {
      const currentUserId = ctx.user.id;
      try {
        const db = await getDb();
        const result = await db.execute(sql`
          SELECT SUM(points_change) as total_balance 
          FROM loyalty_history 
          WHERE user_id = ${currentUserId}
        `);

        const data = (result as any)[0];
        const rows = Array.isArray(data) ? data[0] : data;
        
        return { 
          balance: Number(rows?.total_balance || 0),
          userId: currentUserId
        };
      } catch (error) {
        return { balance: 0, userId: currentUserId };
      }
    }),

  /**
   * ✅ CONFIGURAÇÕES GERAIS (Público)
   */
  getSettings: publicProcedure.query(async () => {
    try {
      const db = await getDb();
      const settings = await db.select().from(loyaltySettings).limit(1);
      if (settings[0]) return settings[0];
      return { redemptionRatePoints: 100, redemptionRateMoney: "1.00", enabled: false };
    } catch (error) {
      return { redemptionRatePoints: 100, redemptionRateMoney: "1.00", enabled: false };
    }
  }),

  // Mantido por compatibilidade com outras partes do site
  getCustomerHistory: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.user.id;
    const db = await getDb();
    const result = await db.execute(sql`SELECT * FROM loyalty_history WHERE user_id = ${userId} ORDER BY created_at DESC`);
    const rows = (result as any)[0];
    if (!Array.isArray(rows)) return [];
    return rows.map((entry: any) => ({ ...entry, points: Number(entry.points_change || 0), date: entry.created_at }));
  }),

  getCustomerSummary: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    const result = await db.execute(sql`SELECT SUM(points_change) as total_balance FROM loyalty_history WHERE user_id = ${ctx.user.id}`);
    const data = (result as any)[0];
    const rows = Array.isArray(data) ? data[0] : data;
    const points = Number(rows?.total_balance || 0);
    return { current_points: points, balance: points, points, userId: ctx.user.id };
  }),
});