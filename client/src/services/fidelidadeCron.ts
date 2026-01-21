import cron from 'node-cron';
import { getDb } from "server/db.js"; // ✅ Import que você confirmou estar certo
import { loyaltyHistory, loyaltySettings } from 'drizzle/schema/loyalty';
import { sql } from 'drizzle-orm';

// Agenda para rodar todo dia às 03:00 da manhã
cron.schedule('0 3 * * *', async () => {
  console.log('--- [CRON] Iniciando verificação de expiração de pontos ---');

  try {
    // 1. Obtemos a instância do banco de dados através da função getDb
    const db = await getDb(); // ✅ Agora 'db' existe e pode ser usado abaixo
    
    // 2. Busca as configurações de expiração
    const settings = await db.query.loyaltySettings.findFirst();
    
    if (!settings || !settings.enabled) {
      console.log('--- [CRON] Fidelidade desativada ou sem configurações. ---');
      return;
    }

    const expirationDays = settings.pointsExpirationDays || 365;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - expirationDays);

    // Formata a data para o padrão MySQL (YYYY-MM-DD HH:mm:ss)
    const formattedDate = cutoffDate.toISOString().slice(0, 19).replace('T', ' ');

    // 3. Transação para processar expirações
    await db.transaction(async (tx: any) => {
      
      // Buscamos a soma de pontos ganhos (earned) antes da data limite por usuário
      const toExpire = await tx.execute(sql`
        SELECT 
          user_id, 
          SUM(points_change) as total_to_expire
        FROM loyalty_history
        WHERE created_at < ${formattedDate}
        AND type = 'earned'
        GROUP BY user_id
      `);

      // O [0] contém as linhas retornadas
      const rows = (toExpire[0] || []) as Array<{ user_id: string, total_to_expire: string | number }>;

      for (const row of rows) {
        const amount = Number(row.total_to_expire);
        
        if (amount > 0) {
          // Geramos um ID único para o log de expiração
          const expId = `exp_${Date.now()}_${row.user_id.slice(0, 8)}`;

          await tx.insert(loyaltyHistory).values({
            id: expId,
            userId: row.user_id,
            pointsChange: -amount, // Débito
            reason: 'Expiração de Pontos',
            description: `Pontos expirados automaticamente após ${expirationDays} dias.`,
            type: 'expired'
          });
          
          console.log(`--- [CRON] Usuário ${row.user_id}: ${amount} pontos expirados. ---`);
        }
      }
    });

    console.log('--- [CRON] Processamento finalizado com sucesso. ---');
  } catch (error) {
    console.error('--- [CRON] Erro crítico no processamento de expiração:', error);
  }
});