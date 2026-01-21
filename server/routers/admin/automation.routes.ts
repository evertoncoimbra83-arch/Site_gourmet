import { adminProcedure, router } from "../../_core/trpc";
import { loyaltyHistory, loyaltySettings } from "drizzle/schema/loyalty";
import { getDb } from "../../db.js";
import { sql } from "drizzle-orm";

// ✅ 1. A FUNÇÃO DE LÓGICA (Declarada no mesmo arquivo)
async function runLoyaltyExpirationLogic() {
  const db = await getDb();
  let processedCount = 0;

  const settings = await db.query.loyaltySettings.findFirst();
  if (!settings || !settings.enabled) {
    throw new Error("Sistema de fidelidade desativado.");
  }

  const expirationDays = settings.pointsExpirationDays || 365;
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - expirationDays);
  const formattedDate = cutoffDate.toISOString().slice(0, 19).replace('T', ' ');

  await db.transaction(async (tx: any) => {
    const toExpire = await tx.execute(sql`
      SELECT user_id, SUM(points_change) as total 
      FROM loyalty_history 
      WHERE created_at < ${formattedDate} AND type = 'earned'
      GROUP BY user_id
    `);

    const rows = toExpire[0] || [];
    for (const row of rows) {
      if (Number(row.total) > 0) {
        await tx.insert(loyaltyHistory).values({
          id: `exp_${Date.now()}_${row.user_id.slice(0,8)}`,
          userId: row.user_id,
          pointsChange: -Number(row.total),
          reason: 'Expiração Automática',
          type: 'expired'
        });
        processedCount++;
      }
    }
  });

  return { processedCount };
}

// ✅ 2. O ROTEADOR TRPC
export const loyaltyAdminRouter = router({
  runManualExpiration: adminProcedure
    .mutation(async () => {
      console.log("--- [ADMIN] Execução manual disparada ---");
      
      // Chamada direta da função que está logo acima
      const result = await runLoyaltyExpirationLogic();
      
      return {
        success: true,
        processedUsers: result.processedCount,
        timestamp: new Date().toISOString()
      };
    }),
});