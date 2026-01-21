import { getDb } from "../../db.js";
import { auditLogs } from "../../../drizzle/schema/index.js";

export async function logAction(
  ctx: any, 
  action: string, 
  entity: string, 
  details: { entityId?: string | number | null, old?: any, new?: any }
) {
  const db = await getDb();
  if (!db) return;

  try {
    // ✅ CORREÇÃO DO RELÓGIO: Ajusta para o fuso horário local (Ex: Brasília -3)
    const agora = new Date();
    agora.setHours(agora.getHours() - 3); // Ajuste manual se o servidor estiver em UTC

    const logData: any = {
      action,
      entity,
      entityId: details.entityId ? String(details.entityId) : 'global',
      userId: ctx.userId || ctx.user?.id || null,
      
      // ✅ MELHORIA NOS DETALHES: 
      // Se enviarmos 'old' e 'new', o log fica completo
      oldValues: details.old ? JSON.stringify(details.old) : null,
      newValues: details.new ? JSON.stringify(details.new) : null,
      
      ipAddress: ctx.ip || "127.0.0.1",
      userAgent: ctx.userAgent || "Sistema",
      createdAt: agora, // Usa a data corrigida
    };

    await db.insert(auditLogs).values(logData);
    console.log(`🛡️ Log Auditado: ${action} | Criado em: ${agora.toLocaleString()}`);
  } catch (e) {
    console.error("❌ Erro ao gravar auditoria:", e);
  }
}