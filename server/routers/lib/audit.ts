import { getDb } from "../../db.js";
import { auditLogs } from "../../../drizzle/schema/index.js"; // Ajustado para o padrão comum de exportação

interface AuditLogInput {
  userId?: string | null;
  action: string;
  entity?: string;
  entityId?: string | number;
  oldValues?: unknown;
  newValues?: unknown;
  ctx?: {
    ip?: string;
    userAgent?: string;
    req?: {
      headers?: Record<string, string | string[] | undefined>;
      socket?: { remoteAddress?: string };
    };
  };
}

export async function createAuditLog({
  userId,
  action,
  entity,
  entityId,
  oldValues,
  newValues,
  ctx
}: AuditLogInput) {
  try {
    const db = await getDb();
    if (!db) return;

    // Extração do IP e User Agent do contexto com tipagem segura
    const rawIp = ctx?.ip || ctx?.req?.headers?.['x-forwarded-for'] || ctx?.req?.socket?.remoteAddress || "127.0.0.1";
    const clientIp = typeof rawIp === 'string' ? rawIp.split(',')[0].trim() : "127.0.0.1";
    const userAgent = ctx?.userAgent || (ctx?.req?.headers?.['user-agent'] as string) || "unknown";

    await db.insert(auditLogs).values({
      userId: userId || null,
      action: action.toUpperCase(),
      entity: entity || null,
      entityId: entityId ? String(entityId) : null,
      oldValues: oldValues ? JSON.stringify(oldValues) : null,
      newValues: newValues ? JSON.stringify(newValues) : null,
      ipAddress: clientIp,
      userAgent: userAgent,
    });
    
  } catch (err) {
    // Adicionado log para evitar bloco vazio e para monitoramento
    console.error("Critical: Failed to create audit log:", err);
  }
}