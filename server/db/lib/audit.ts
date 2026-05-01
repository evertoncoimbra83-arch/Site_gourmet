import { getDb } from "../../db";
import { auditLogs } from "../../../drizzle/schema/index";
import { redactSensitiveData } from "../../lib/redact";

export interface AuditContext {
  userId?: string | number | null;
  user?: { id: string | number };
  ip?: string;
  userAgent?: string;
}

interface AuditDetails {
  entityId?: string | number | null;
  old?: unknown;
  new?: unknown;
}

export async function logAction(
  ctx: AuditContext,
  action: string,
  entity: string,
  details: AuditDetails,
) {
  const db = await getDb();
  if (!db) return;

  try {
    const now = new Date();
    now.setHours(now.getHours() - 3);

    const safeOld = details.old ? redactSensitiveData(details.old) : null;
    const safeNew = details.new ? redactSensitiveData(details.new) : null;

    const logData = {
      action,
      entity,
      entityId: details.entityId ? String(details.entityId) : "global",
      userId: String(ctx.userId || ctx.user?.id || "system"),
      oldValues: safeOld ? JSON.stringify(safeOld) : null,
      newValues: safeNew ? JSON.stringify(safeNew) : null,
      ipAddress: ctx.ip || "127.0.0.1",
      userAgent: ctx.userAgent || "Sistema",
      createdAt: now,
    };

    await db.insert(auditLogs).values(logData);
  } catch (error) {
    console.error(
      "CRITICAL_AUDIT_ERROR:",
      error instanceof Error ? error.message : error,
    );
  }
}
