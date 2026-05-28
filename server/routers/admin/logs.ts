import { superAdminProcedure, router } from "../../_core/trpc.js";
import { z } from "zod";
import { getDb } from "../../db.js";
import { auditLogs, users } from "../../../drizzle/schema/index.js";
import { and, asc, desc, eq, gte, like, lte, or, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { decrypt } from "../../encryption.js";

function unseal(val: unknown): string {
  if (!val) return "";
  try {
    const str = String(val);
    if (str.split(":").length !== 3) return str;
    return decrypt(str) || str;
  } catch {
    return String(val);
  }
}

function parseLogValues(val: unknown): Record<string, unknown> | null {
  if (!val) return null;

  if (typeof val === "object" && !Buffer.isBuffer(val)) {
    return val as Record<string, unknown>;
  }

  try {
    const str = Buffer.isBuffer(val) ? val.toString("utf8") : String(val);
    return JSON.parse(str);
  } catch {
    return { info: "Dados em formato incompatível ou texto puro" };
  }
}

const logsListInput = z.object({
  limit: z.number().min(1).max(100).default(50),
  offset: z.number().min(0).default(0),
  module: z.string().trim().optional(),
  severity: z.enum(["info", "warning", "critical", "error"]).optional(),
  action: z.string().trim().optional(),
  entityType: z.string().trim().optional(),
  userId: z.string().trim().optional(),
  requestId: z.string().trim().optional(),
  startDate: z.string().trim().optional(),
  endDate: z.string().trim().optional(),
  search: z.string().trim().optional(),
});

const logDetailInput = z.object({
  id: z.coerce.number().min(1),
});

let cachedModules: string[] | null = null;
let cacheExpiry = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutos em milissegundos

export const adminLogsRouter = router({
  modules: superAdminProcedure.query(async () => {
    const now = Date.now();
    if (cachedModules && now < cacheExpiry) {
      return cachedModules;
    }

    const db = await getDb();
    if (!db) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Banco de dados indisponível.",
      });
    }

    const rows = await db
      .select({ module: auditLogs.module })
      .from(auditLogs)
      .groupBy(auditLogs.module)
      .orderBy(asc(auditLogs.module));

    const result = rows
      .map(row => row.module || "legacy")
      .filter((module, index, modules) => modules.indexOf(module) === index);

    cachedModules = result;
    cacheExpiry = now + CACHE_TTL_MS;
    return result;
  }),

  list: superAdminProcedure.input(logsListInput).query(async ({ input }) => {
    const db = await getDb();
    if (!db) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Banco de dados indisponível.",
      });
    }

    try {
      const conditions = [];
      const limit = Math.min(Math.max(input.limit || 50, 1), 100);
      const offset = Math.max(input.offset || 0, 0);

      if (input.module) conditions.push(eq(auditLogs.module, input.module));
      if (input.action)
        conditions.push(like(auditLogs.action, `%${input.action}%`));
      if (input.entityType)
        conditions.push(eq(auditLogs.entity, input.entityType));
      if (input.userId) conditions.push(eq(auditLogs.userId, input.userId));
      if (input.requestId)
        conditions.push(eq(auditLogs.requestId, input.requestId));

      if (input.severity) {
        conditions.push(
          input.severity === "error"
            ? eq(auditLogs.action, "ERROR")
            : eq(auditLogs.severity, input.severity)
        );
      }

      if (input.startDate) {
        const start = new Date(input.startDate);
        if (!Number.isNaN(start.getTime())) {
          conditions.push(gte(auditLogs.createdAt, start));
        }
      }

      if (input.endDate) {
        const end = new Date(input.endDate);
        if (!Number.isNaN(end.getTime())) {
          conditions.push(lte(auditLogs.createdAt, end));
        }
      }

      if (input.search) {
        const term = `%${input.search}%`;
        conditions.push(
          or(
            like(auditLogs.action, term),
            like(auditLogs.module, term),
            like(auditLogs.entity, term),
            like(auditLogs.entityId, term),
            like(auditLogs.entityLabel, term),
            like(auditLogs.requestId, term),
            like(users.email, term)
          )
        );
      }

      const whereClause =
        conditions.length > 0 ? and(...conditions) : undefined;

      const [totalRow] = await db
        .select({ total: sql<number>`count(*)` })
        .from(auditLogs)
        .leftJoin(users, eq(auditLogs.userId, users.id))
        .where(whereClause);

      const rows = await db
        .select({
          id: auditLogs.id,
          action: auditLogs.action,
          module: auditLogs.module,
          severity: auditLogs.severity,
          entity: auditLogs.entity,
          entityId: auditLogs.entityId,
          entityLabel: auditLogs.entityLabel,
          ipAddress: auditLogs.ipAddress,
          userAgent: auditLogs.userAgent,
          requestId: auditLogs.requestId,
          createdAt: auditLogs.createdAt,
          userId: auditLogs.userId,
          userName: users.name,
          userEmail: users.email,
          hasOldValues: sql<number>`case when ${auditLogs.oldValues} is null then 0 else 1 end`,
          hasNewValues: sql<number>`case when ${auditLogs.newValues} is null then 0 else 1 end`,
        })
        .from(auditLogs)
        .leftJoin(users, eq(auditLogs.userId, users.id))
        .where(whereClause)
        .orderBy(desc(auditLogs.createdAt))
        .limit(limit)
        .offset(offset);

      const items = rows.map(row => ({
        id: row.id,
        action: row.action,
        module: row.module || "legacy",
        severity: row.action === "ERROR" ? "error" : row.severity || "info",
        entity: row.entity,
        entityType: row.entity || "legacy",
        entityId: row.entityId,
        entityLabel:
          row.entityLabel || row.entityId || row.entity || "Registro legado",
        ipAddress: row.ipAddress || "Interno",
        userAgent: row.userAgent || "unknown",
        requestId: row.requestId || null,
        oldValues: null,
        newValues: null,
        hasDetails: Boolean(row.hasOldValues || row.hasNewValues),
        isErrorLog: row.action === "ERROR",
        user: row.userName
          ? { id: row.userId, name: unseal(row.userName), email: row.userEmail }
          : { id: row.userId, name: "Sistema", email: "Automático" },
        createdAt:
          row.createdAt instanceof Date
            ? row.createdAt.toISOString()
            : new Date(String(row.createdAt || Date.now())).toISOString(),
      }));

      const total = Number(totalRow?.total || 0);
      const nextOffset = offset + items.length;

      return {
        items,
        total,
        limit,
        offset,
        hasMore: nextOffset < total,
        nextOffset: nextOffset < total ? nextOffset : null,
      };
    } catch (err) {
      console.error("Erro ao processar logs de auditoria:", err);

      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Falha ao carregar trilha de auditoria para o painel.",
      });
    }
  }),

  detail: superAdminProcedure.input(logDetailInput).query(async ({ input }) => {
    const db = await getDb();
    if (!db) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Banco de dados indisponível.",
      });
    }

    const [row] = await db
      .select({
        id: auditLogs.id,
        oldValues: auditLogs.oldValues,
        newValues: auditLogs.newValues,
      })
      .from(auditLogs)
      .where(eq(auditLogs.id, input.id))
      .limit(1);

    if (!row) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Log não encontrado.",
      });
    }

    return {
      id: row.id,
      oldValues: parseLogValues(row.oldValues),
      newValues: parseLogValues(row.newValues),
    };
  }),
});
