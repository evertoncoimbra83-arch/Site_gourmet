import { getDb } from "../../db.js";
import { auditLogs } from "drizzle/schema"; 

export async function createAuditLog({
  userId,
  action,
  entity,
  entityId,
  oldValues,
  newValues,
  ctx
}: {
  userId?: string | null; 
  action: string;
  entity?: string;
  entityId?: string | number;
  oldValues?: any;
  newValues?: any;
  ctx?: any;
}) {
  try {
    const db = await getDb();
    if (!db) return;

    // Extração do IP e User Agent do contexto
    const rawIp = ctx?.ip || ctx?.req?.headers['x-forwarded-for'] || ctx?.req?.socket?.remoteAddress || "127.0.0.1";
    const clientIp = typeof rawIp === 'string' ? rawIp.split(',')[0].trim() : "127.0.0.1";
    const userAgent = ctx?.userAgent || ctx?.req?.headers['user-agent'] || "unknown";

    // ✅ O Drizzle agora entende que o 'id' será gerado pelo MySQL
    await db.insert(auditLogs).values({
      userId: userId || null,
      action: action.toUpperCase(),
      entity: entity || null,
      entityId: entityId ? String(entityId) : null,
      oldValues: oldValues ? JSON.stringify(oldValues) : null,
      newValues: newValues ? JSON.stringify(newValues) : null,
      ipAddress: clientIp,
      userAgent: userAgent,
      // createdAt é defaultNow(), então também é opcional aqui
    });
    
  } catch (error) {
    console.error("⚠️ Erro ao gravar auditoria:", error);
  }
}