import { AuditLogService } from "../../services/AuditLogService.js";

export interface AuditContext {
  userId?: string | number | null;
  user?: { id: string | number };
  ip?: string;
  userAgent?: string;
  requestId?: string;
}

interface AuditDetails {
  entityId?: string | number | null;
  entityLabel?: string | null;
  old?: unknown;
  new?: unknown;
}

function deduceModule(action: string, entity: string): string {
  const act = action.toUpperCase();
  const ent = (entity || "").toLowerCase();

  if (act.includes("AUTH") || act.includes("LOGIN") || act.includes("PASSWORD") || ent.includes("user")) return "security";
  if (ent.includes("setting") || ent.includes("config")) return "settings";
  if (ent.includes("payment") || act.includes("PAYMENT")) return "payments";
  if (ent.includes("shipping") || ent.includes("zone") || ent.includes("mesh") || ent.includes("cep")) return "shipping";
  if (ent.includes("loyalty")) return "loyalty";
  if (ent.includes("coupon") || ent.includes("marketing") || ent.includes("offer")) return "marketing";
  if (ent.includes("backup")) return "backup";
  if (ent.includes("label") || ent.includes("template")) return "zebra";
  if (ent.includes("dish") || ent.includes("ingredient") || ent.includes("category") || ent.includes("package") || ent.includes("showcase")) return "catalog";
  if (ent.includes("order") || act.includes("ORDER")) return "orders";
  
  return "system";
}

function deduceSeverity(action: string): "info" | "warning" | "critical" {
  const act = action.toUpperCase();
  if (
    act.includes("PASSWORD") ||
    act.includes("BACKUP") ||
    act.includes("SECURITY") ||
    act.includes("EMERGENCY") ||
    act.includes("PANIC") ||
    act.includes("TOKEN") ||
    act.includes("SECRET") ||
    act.includes("GENERATE_TOKEN") ||
    act.includes("DELETE_USER")
  ) {
    return "critical";
  }
  if (
    act.includes("DELETE") ||
    act.includes("UPDATE_SETTINGS") ||
    act.includes("DISABLE") ||
    act.includes("ADJUST") ||
    act.includes("ESTORNO") ||
    act.includes("BULK")
  ) {
    return "warning";
  }
  return "info";
}

export async function logAction(
  ctx: AuditContext,
  action: string,
  entity: string,
  details: AuditDetails,
) {
  const actor = {
    userId: ctx.userId || ctx.user?.id || null,
    ipAddress: ctx.ip,
    userAgent: ctx.userAgent,
    requestId: ctx.requestId || (ctx as any).req?.requestId,
  };

  const module = deduceModule(action, entity);
  const severity = deduceSeverity(action);

  await AuditLogService.record({
    actor,
    module,
    action,
    entityType: entity,
    entityId: details.entityId || null,
    entityLabel: details.entityLabel || null,
    oldValues: details.old,
    newValues: details.new,
    severity,
  });
}
