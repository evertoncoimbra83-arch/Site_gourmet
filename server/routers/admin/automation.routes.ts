import { adminProcedure, router } from "../../_core/trpc";
import { loyaltyHistory } from "../../../drizzle/schema/index"; // ✅ Ajustado para o index do seu schema
import { getDb } from "../../db";
import { sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { randomUUID } from "crypto";

/**
 * ✅ 1. A FUNÇÃO DE LÓGICA (Tipada e Segura)
 */
async function runLoyaltyExpirationLogic() {
  const db = await getDb();
  let processedCount = 0;

  // Busca configurações globais
  const settings = await db.query.loyaltySettings.findFirst();
  if (!settings || !settings.enabled) {
    throw new Error("Sistema de fidelidade desativado.");
  }

  const expirationDays = settings.pointsExpirationDays || 365;
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - expirationDays);
  
  // Formatação compatível com MySQL/MariaDB (YYYY-MM-DD HH:MM:SS)
  const formattedDate = cutoffDate.toISOString().slice(0, 19).replace('T', ' ');

  // Transação atômica
  await db.transaction(async (tx) => {
    const toExpire = await tx.execute(sql`
      SELECT user_id, SUM(points_change) as total 
      FROM loyalty_history 
      WHERE created_at < ${formattedDate} AND type = 'earned'
      GROUP BY user_id
    `);

    /**
     * ✅ CORREÇÃO TS2352: 
     * Usamos 'as unknown' antes do cast final porque o retorno do execute (MySqlRawQueryResult)
     * não tem sobreposição direta com a nossa interface de linha.
     */
    const rows = (toExpire[0] as unknown as Array<{ user_id: string; total: string | number }>) || [];

    for (const row of rows) {
      const pointsToLose = Number(row.total);
      
      // Só processa se o saldo expirado for positivo
      if (pointsToLose > 0) {
        await tx.insert(loyaltyHistory).values({
          // ✅ UUID manual para evitar erro 'id doesn't have a default value'
          id: `exp_${randomUUID().slice(0, 8)}_${row.user_id.slice(0, 8)}`,
          userId: row.user_id,
          pointsChange: -pointsToLose,
          reason: 'Expiração Automática',
          type: 'expired',
          createdAt: new Date()
        });
        processedCount++;
      }
    }
  });

  return { processedCount };
}

/**
 * ✅ 2. O ROTEADOR TRPC REVISADO
 */
export const loyaltyAdminRouter = router({
  runManualExpiration: adminProcedure
    .mutation(async () => {
      try {
        const result = await runLoyaltyExpirationLogic();
        
        const message = result.processedCount > 0 
          ? `Sucesso! Pontos expirados de ${result.processedCount} clientes.`
          : "Processamento concluído. Nenhum ponto para expirar hoje.";

        return {
          success: true,
          message,
          processedUsers: result.processedCount,
          timestamp: new Date().toISOString()
        };
      } catch (error: unknown) {
        // ✅ Tipagem segura de erro para o interceptor global
        const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
        
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Falha ao processar expiração: " + errorMessage
        });
      }
    }),
});