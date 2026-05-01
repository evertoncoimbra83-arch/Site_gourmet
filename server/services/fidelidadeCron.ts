// server/services/fidelidadeCron.ts
import cron from 'node-cron';
import { eq, sql, and, lt } from 'drizzle-orm';
import { getDb } from '../db.js';
import { loyaltyHistory, loyaltySettings } from '../../drizzle/schema/loyalty.js';
import { users } from '../../drizzle/schema/users.js';
import { logger } from '../logger.js';
import crypto from 'crypto';

/**
 * Processa a expiração de pontos de fidelidade.
 *
 * Algoritmo seguro (sem dupla-expiração):
 *
 *  Para cada usuário com saldo positivo:
 *  1. Soma pontos 'earned' criados ANTES da data de corte
 *  2. Subtrai pontos 'expired' já lançados (impede re-expiração)
 *  3. Calcula: a_expirar = earned_antigos - ja_expirados
 *  4. Limita ao saldo atual (não pode expirar mais do que o usuário tem)
 *  5. Se a_expirar > 0:
 *     - Insere registro de débito (type = 'expired')
 *     - Atualiza loyalty_balance na tabela users
 */
async function processPointsExpiration() {
  const db = await getDb();
  if (!db) {
    logger.error('[CRON FIDELIDADE] Database indisponível');
    return;
  }

  // 1. Busca configurações
  const settingsRows = await db.select().from(loyaltySettings).limit(1);
  const settings = settingsRows[0];

  if (!settings || !settings.enabled) {
    logger.info('[CRON FIDELIDADE] Programa desativado — pulando expiração');
    return;
  }

  const expirationDays = Number(settings.pointsExpirationDays) || 365;
  if (expirationDays <= 0) {
    logger.info('[CRON FIDELIDADE] pointsExpirationDays = 0 — expiração desativada');
    return;
  }

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - expirationDays);

  logger.info({
    expirationDays,
    cutoffDate: cutoffDate.toISOString()
  }, '[CRON FIDELIDADE] Iniciando processamento de expiração');

  // 2. Busca usuários com saldo positivo (só processa quem tem pontos)
  const usersWithBalance = await db
    .select({ id: users.id, loyaltyBalance: sql<number>`COALESCE(loyalty_balance, 0)` })
    .from(users)
    .where(sql`COALESCE(loyalty_balance, 0) > 0`);

  if (usersWithBalance.length === 0) {
    logger.info('[CRON FIDELIDADE] Nenhum usuário com saldo positivo — encerrando');
    return;
  }

  let totalExpired = 0;
  let totalUsers = 0;

  for (const user of usersWithBalance) {
    try {
      await db.transaction(async (tx) => {
        // 3. Soma pontos ganhos ANTES da data de corte
        const earnedRows = await tx
          .select({
            total: sql<number>`COALESCE(SUM(points_change), 0)`
          })
          .from(loyaltyHistory)
          .where(
            and(
              eq(loyaltyHistory.userId, user.id),
              eq(loyaltyHistory.type, 'earned'),
              lt(loyaltyHistory.createdAt, cutoffDate)
            )
          );
        const earnedBeforeCutoff = Number(earnedRows[0]?.total ?? 0);

        if (earnedBeforeCutoff <= 0) return; // Nada para expirar

        // 4. Soma débitos de expiração JÁ lançados (impede dupla-expiração)
        const alreadyExpiredRows = await tx
          .select({
            total: sql<number>`COALESCE(SUM(ABS(points_change)), 0)`
          })
          .from(loyaltyHistory)
          .where(
            and(
              eq(loyaltyHistory.userId, user.id),
              eq(loyaltyHistory.type, 'expired')
            )
          );
        const alreadyExpired = Number(alreadyExpiredRows[0]?.total ?? 0);

        // 5. Calcula quanto falta expirar
        const toExpire = earnedBeforeCutoff - alreadyExpired;
        if (toExpire <= 0) return; // Já foi tudo expirado

        // 6. Limita ao saldo atual (não pode expirar mais do que o usuário tem)
        const currentBalance = Number(user.loyaltyBalance);
        const finalExpire = Math.min(toExpire, currentBalance);
        if (finalExpire <= 0) return;

        // 7. Insere registro de expiração
        await tx.insert(loyaltyHistory).values({
          id: crypto.randomUUID(),
          userId: user.id,
          pointsChange: -finalExpire,
          type: 'expired',
          reason: 'Expiração de Pontos',
          description: `${finalExpire} pontos expirados após ${expirationDays} dias de inatividade.`,
          createdAt: new Date(),
        } as typeof loyaltyHistory.$inferInsert);

        // 8. Atualiza loyalty_balance na tabela users
        await tx.execute(sql`
          UPDATE users
          SET loyalty_balance = GREATEST(0, COALESCE(loyalty_balance, 0) - ${finalExpire})
          WHERE id = ${user.id}
        `);

        totalExpired += finalExpire;
        totalUsers += 1;

        logger.info({
          userId: user.id,
          earnedBeforeCutoff,
          alreadyExpired,
          finalExpire,
          newBalance: Math.max(0, currentBalance - finalExpire)
        }, '[CRON FIDELIDADE] Pontos expirados para usuário');
      });
    } catch (err) {
      logger.error({ err, userId: user.id }, '[CRON FIDELIDADE] Erro ao processar usuário');
    }
  }

  logger.info({
    totalUsers,
    totalExpired
  }, '[CRON FIDELIDADE] Processamento concluído');
}

// Roda todo dia às 03:00
cron.schedule('0 3 * * *', async () => {
  try {
    await processPointsExpiration();
  } catch (err) {
    logger.error({ err }, '[CRON FIDELIDADE] Erro crítico na execução do cron');
  }
});

// Exporta para poder chamar manualmente (ex: botão de admin ou teste)
export { processPointsExpiration };