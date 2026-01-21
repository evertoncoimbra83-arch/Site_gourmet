import { adminProcedure, router } from "../../_core/trpc.js";
import { z } from "zod";
import { sql, gte } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { getDb } from "../../db.js";
import { orders, users } from "../../../drizzle/schema/index.js";

/**
 * Roteador de Analytics (Admin)
 * Rota: admin.analytics.getStats
 */
export const adminAnalyticsRouter = router({
  getStats: adminProcedure
    .input(
      z.object({
        days: z.number().default(1)
      })
      .nullish() // Aceita nulo ou indefinido
    )
    .query(async ({ input }) => {
      try {
        const db = await getDb();
        if (!db) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Falha na conexão com o banco de dados.",
          });
        }

        const days = input?.days ?? 1;
        const dateLimit = new Date();
        dateLimit.setDate(dateLimit.getDate() - days);

        // 1. DADOS DO BANCO (Vendas e Receita)
        const [orderStats] = await db
          .select({
            count: sql<number>`count(${orders.id})`,
            revenue: sql<number>`sum(${orders.total})`
          })
          .from(orders)
          .where(gte(orders.createdAt, dateLimit));

        // 2. DADOS DE CLIENTES (Total na base)
        const [customerCount] = await db
          .select({ value: sql<number>`count(${users.id})` })
          .from(users);

        const businessData = {
          ordersToday: Number(orderStats?.count || 0),
          revenueToday: Number(orderStats?.revenue || 0),
          activeCustomers: Number(customerCount?.value || 0),
        };

        // 3. DADOS EXTERNOS (PostHog) - Falha silenciosa se não configurado
        const postHogData = await fetchPostHogInsight('insight_id_do_funil');

        return {
          ...businessData,
          abandonmentRate: postHogData?.results?.[0]?.rate || 0,
          conversionTrend: [10, 15, 8, 12, 18, 14, 20], // Mock de tendência
        };
      } catch (error: any) {
        console.error("❌ [ANALYTICS ERROR]:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao processar estatísticas de vendas.",
        });
      }
    }),
});

/**
 * 🛠️ HELPER POSTHOG (Privado do arquivo)
 */
async function fetchPostHogInsight(insightId: string) {
  const apiKey = process.env.POSTHOG_PERSONAL_API_KEY;
  const projectId = process.env.POSTHOG_PROJECT_ID;

  // Se não houver chaves ou o ID for o padrão do exemplo, ignora
  if (!apiKey || !projectId || insightId === 'insight_id_do_funil') return null;

  try {
    const url = `https://app.posthog.com/api/projects/${projectId}/insights/${insightId}/`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${apiKey}` }
    });
    
    if (!res.ok) return null;
    return await res.json();
  } catch (e) {
    return null;
  }
}