// server/services/AuditLogService.ts
import { getDb } from "../db.js";
import { auditLogs } from "../../drizzle/schema/index.js";
import { redactSensitiveData } from "../lib/redact.js";
import crypto from "crypto";

const recentAuditKeys = new Map<string, number>();
const AUDIT_DEDUPE_WINDOW_MS = 5_000;

export interface AuditActor {
  userId?: string | number | null;
  ipAddress?: string;
  userAgent?: string;
  requestId?: string;
}

export interface RecordAuditInput {
  actor: AuditActor;
  module: string;
  action: string;
  severity?: "info" | "warning" | "critical";
  entityType?: string | null;
  entityId?: string | number | null;
  entityLabel?: string | null;
  oldValues?: unknown;
  newValues?: unknown;
}

export interface RecordErrorInput {
  module: string;
  source?: string;
  error: unknown;
  actor?: AuditActor;
  requestId?: string;
  route?: string;
  procedure?: string;
  metadata?: Record<string, unknown>;
  severity?: "warning" | "critical";
}

const EXPECTED_TRPC_ERROR_CODES = new Set([
  "BAD_REQUEST",
  "UNAUTHORIZED",
  "FORBIDDEN",
  "NOT_FOUND",
  "CONFLICT",
  "PRECONDITION_FAILED",
  "PAYLOAD_TOO_LARGE",
  "METHOD_NOT_SUPPORTED",
  "UNPROCESSABLE_CONTENT",
  "TOO_MANY_REQUESTS",
  "CLIENT_CLOSED_REQUEST",
]);

function shouldPersistError(input: RecordErrorInput): boolean {
  const trpcCode = input.metadata?.trpcCode;
  if (input.source !== "trpc" || typeof trpcCode !== "string") return true;
  if (trpcCode === "INTERNAL_SERVER_ERROR") return true;
  if (input.severity === "critical") return true;
  return !EXPECTED_TRPC_ERROR_CODES.has(trpcCode);
}

function computeDiff(oldVal: any, newVal: any): { before: any; after: any } {
  if (oldVal === null || oldVal === undefined || newVal === null || newVal === undefined) {
    return { before: oldVal, after: newVal };
  }
  if (typeof oldVal !== "object" || typeof newVal !== "object" || Array.isArray(oldVal) || Array.isArray(newVal)) {
    return { before: oldVal, after: newVal };
  }

  const before: Record<string, any> = {};
  const after: Record<string, any> = {};
  
  const allKeys = new Set([...Object.keys(oldVal), ...Object.keys(newVal)]);
  for (const key of allKeys) {
    if (key === "updatedAt" || key === "updated_at" || key === "createdAt" || key === "created_at") {
      continue;
    }
    const o = oldVal[key];
    const n = newVal[key];
    if (JSON.stringify(o) !== JSON.stringify(n)) {
      before[key] = o === undefined ? null : o;
      after[key] = n === undefined ? null : n;
    }
  }

  return { before, after };
}

function hasAuditValue(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === "object" && !Array.isArray(value)) {
    return Object.keys(value as Record<string, unknown>).length > 0;
  }
  return true;
}

function normalizeEntityType(entityType?: string | null): string | null {
  if (!entityType) return null;

  const normalized = entityType.toLowerCase();
  const entityMap: Record<string, string> = {
    orders: "order",
    coupons: "coupon",
    shipping_zones: "shipping_rule",
    shipping_settings: "shipping_settings",
    payment_methods: "payment_method",
    loyalty: "loyalty_rule",
    settings: "settings",
    store_settings: "settings",
    users: "user",
    "var/backups": "backup",
  };

  return entityMap[normalized] || normalized;
}

function shouldSkipDuplicateAudit(input: {
  requestId: string;
  action: string;
  module: string;
  entityType: string | null;
  entityId: string | number | null | undefined;
}): boolean {
  const now = Date.now();
  for (const [key, createdAt] of recentAuditKeys.entries()) {
    if (now - createdAt > AUDIT_DEDUPE_WINDOW_MS) {
      recentAuditKeys.delete(key);
    }
  }

  const key = [
    input.requestId,
    input.module,
    input.action,
    input.entityType || "none",
    input.entityId !== undefined && input.entityId !== null
      ? String(input.entityId)
      : "none",
  ].join("|");

  if (recentAuditKeys.has(key)) return true;
  recentAuditKeys.set(key, now);
  return false;
}

export const AuditLogService = {
  /**
   * Limpa payloads e previne inchaço no banco
   */
  sanitizeData(data: unknown): unknown {
    if (data === null || data === undefined) return null;

    // 1. Mascaramento LGPD genérico por redact.ts (senhas, CPFs, telefones, etc.)
    const redacted = redactSensitiveData(data);

    // 2. Remoção recursiva de Base64, binários e arrays massivos
    const traverseAndTrim = (val: any): any => {
      if (Array.isArray(val)) {
        if (val.length > 20) {
          return { _summary: `Array com ${val.length} itens recortado para poupar espaço.` };
        }
        return val.map(traverseAndTrim);
      }

      if (val && typeof val === "object" && !Buffer.isBuffer(val)) {
        const cleaned: Record<string, any> = {};
        for (const [key, value] of Object.entries(val)) {
          if (typeof value === "string") {
            const trimmedVal = value.trim();
            // Detecta padrões base64, dataURIs ou strings excessivamente grandes (imagens/uploads/CEP grids)
            if (
              trimmedVal.startsWith("data:") ||
              trimmedVal.startsWith("data;base64") ||
              /^[a-zA-Z0-9+/=]{1000,}$/.test(trimmedVal) ||
              trimmedVal.length > 2000
            ) {
              cleaned[key] = `[IMAGE_OR_BINARY_REMOVED: ${trimmedVal.length} caracteres]`;
            } else {
              cleaned[key] = traverseAndTrim(value);
            }
          } else {
            cleaned[key] = traverseAndTrim(value);
          }
        }
        return cleaned;
      }

      return val;
    };

    return traverseAndTrim(redacted);
  },

  /**
   * Gravação isolada de log
   */
  async record(input: RecordAuditInput): Promise<void> {
    try {
      const db = await getDb();
      if (!db) return;

      const action = input.action.toUpperCase();
      const module = input.module.toLowerCase();
      const severity = input.severity || "info";
      const entityType = normalizeEntityType(input.entityType);

      let safeOld = this.sanitizeData(input.oldValues);
      let safeNew = this.sanitizeData(input.newValues);

      // Evita logs de atualização redundantes onde não houve mudança
      if (safeOld && safeNew && JSON.stringify(safeOld) === JSON.stringify(safeNew)) {
        return;
      }

      // Se ambos forem objetos simples, calcula o diff e grava apenas as diferenças
      if (
        safeOld &&
        safeNew &&
        typeof safeOld === "object" &&
        typeof safeNew === "object" &&
        !Array.isArray(safeOld) &&
        !Array.isArray(safeNew)
      ) {
        const { before, after } = computeDiff(safeOld, safeNew);
        safeOld = before;
        safeNew = after;

        if (!hasAuditValue(safeOld) && !hasAuditValue(safeNew)) {
          return;
        }
      }

      // Conversão segura de userId
      let userIdString: string | null = null;
      if (input.actor.userId !== undefined && input.actor.userId !== null) {
        userIdString = String(input.actor.userId);
      }

      // Rastreamento ou geração do requestId
      const requestId = input.actor.requestId || crypto.randomUUID();

      if (
        shouldSkipDuplicateAudit({
          requestId,
          action,
          module,
          entityType,
          entityId: input.entityId,
        })
      ) {
        return;
      }

      await db.insert(auditLogs).values({
        userId: userIdString,
        action,
        module,
        severity,
        entity: entityType,
        entityId: input.entityId !== undefined && input.entityId !== null ? String(input.entityId) : null,
        entityLabel: input.entityLabel || null,
        oldValues: safeOld ? JSON.stringify(safeOld) : null,
        newValues: safeNew ? JSON.stringify(safeNew) : null,
        ipAddress: input.actor.ipAddress || "127.0.0.1",
        userAgent: input.actor.userAgent || "Sistema",
        requestId,
        createdAt: new Date(),
      });
    } catch (error) {
      // Falhas no log não devem derrubar a aplicação principal (baixa acoplamento)
      console.error("Critical: Failed to write audit log:", error);
    }
  },

  /**
   * Grava erros de sistema estruturados
   */
  async recordError(input: RecordErrorInput): Promise<void> {
    try {
      if (!shouldPersistError(input)) {
        return;
      }

      const err = input.error instanceof Error ? input.error : new Error(String(input.error));

      // 1. Limita a 10 linhas da stack trace
      const cleanStack = err.stack
        ? err.stack.split("\n").slice(0, 10).join("\n")
        : "No stack trace";

      // 2. Higieniza dados pessoais e tokens
      const safeMeta = this.sanitizeData(input.metadata || {});

      const actor = {
        userId: "system",
        ...(input.actor || {}),
      };
      if (input.requestId && !actor.requestId) {
        actor.requestId = input.requestId;
      }

      await this.record({
        actor,
        module: input.module,
        action: "ERROR",
        severity: input.severity || "critical",
        entityType: "error",
        entityLabel: err.name || "Error",
        oldValues: null,
        newValues: {
          message: err.message,
          stack: cleanStack,
          source: input.source || "backend",
          procedure: input.procedure,
          route: input.route,
          meta: safeMeta,
        },
      });
    } catch (logErr) {
      console.error("Failed to persist error log entry:", logErr);
    }
  }
};
