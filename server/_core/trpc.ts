import { initTRPC, TRPCError } from "@trpc/server";
import { ZodError } from "zod";
import superjson from "superjson";
import { eq } from "drizzle-orm";
import { appConfigs } from "../../drizzle/schema/index.js";
import { type TrpcContext } from "./context";
import { logger } from "../logger";
import { decrypt } from "../encryption.js";
import { AuditLogService } from "../services/AuditLogService.js";
import crypto from "crypto";
import {
  type AdminRole,
  type AppRole,
  normalizeRole,
} from "../../shared/security/rbac.js";

const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error, ctx }) {
    let requestId: string | undefined = undefined;

    if (ctx?.req) {
      requestId =
        (ctx.req as any).requestId ||
        ctx.req.headers?.["x-request-id"] ||
        ctx.req.headers?.["x-correlation-id"];
    }

    try {
      const procedure = shape.data.path || "unknown";
      const { module } = getTrpcModuleAndEntity(procedure);

      const originalError = error.cause instanceof Error ? error.cause : error;
      const isCritical = error.code === "INTERNAL_SERVER_ERROR";
      const severity = isCritical ? "critical" : "warning";

      const actor: any = { userId: "system" };
      let route: string | undefined = undefined;

      if (ctx) {
        if (ctx.user) {
          actor.userId = ctx.user.id;
        }
        if (ctx.req) {
          route = ctx.req.originalUrl || ctx.req.url;
          actor.ipAddress = ctx.req.ip ||
                            (ctx.req.headers?.["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
                            "127.0.0.1";
          actor.userAgent = ctx.req.headers?.["user-agent"] || "unknown";
        }
      }

      void AuditLogService.recordError({
        module,
        source: "trpc",
        error: originalError,
        actor,
        requestId,
        route,
        procedure,
        severity,
        metadata: {
          trpcCode: error.code,
          zodError: error.cause instanceof ZodError ? error.cause.flatten() : null,
        }
      });
    } catch (e) {
      logger.error(e instanceof Error ? e : new Error(String(e)), "Erro ao registrar falha do tRPC no AuditLogService");
    }

    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
        requestId,
      },
    };
  },
});

export const router = t.router;
export const mergeRouters = t.mergeRouters;
export const middleware = t.middleware;
export const publicProcedure = t.procedure;
const procedureRateLimitStore = new Map<string, { count: number; resetAt: number }>();

const isInternal = t.middleware(async ({ ctx, next }) => {
  const reqHeaders = ctx.req?.headers;
  let authHeader: string | null = null;

  if (reqHeaders) {
    if (reqHeaders instanceof Headers) {
      authHeader = reqHeaders.get("authorization");
    } else if (typeof reqHeaders === "object") {
      const headerValue = (
        reqHeaders as Record<string, string | string[] | undefined>
      )["authorization"];
      authHeader = typeof headerValue === "string" ? headerValue : null;
    }
  }

  const token = authHeader?.replace("Bearer ", "");
  const bridgeSetting = await ctx.db.query.appConfigs.findFirst({
    where: eq(appConfigs.configKey, "BRIDGE_TOKEN"),
  });
  const internalToken = bridgeSetting?.configValue
    ? decrypt(bridgeSetting.configValue) || bridgeSetting.configValue
    : null;

  if (!internalToken || !token || token !== internalToken) {
    logger.warn(
      { path: "internal_bridge" },
      "Tentativa de acesso com token de integracao invalido",
    );
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Token de integração inválido ou não fornecido.",
    });
  }

  return next({
    ctx: {
      ...ctx,
      user: { id: "system-ai", role: "super_admin" as const },
      isInternal: true,
    },
  });
});

const isAuthed = t.middleware(({ ctx, next }) => {
  if (!ctx.user || !ctx.session) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Sessão expirada ou não autenticada.",
    });
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
      session: ctx.session,
    },
  });
});

function requireRoles(allowedRoles: AppRole[]) {
  return t.middleware(({ ctx, next, path }) => {
    if (!ctx.user || !ctx.session) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Sessão expirada ou não autenticada.",
      });
    }

    const role = normalizeRole(ctx.user.role);

    if (!allowedRoles.includes(role)) {
      logger.warn(
        {
          path,
          userId: ctx.user.id,
          role,
          allowedRoles,
        },
        "Tentativa de acesso negado por role",
      );
      void AuditLogService.record({
        actor: {
          userId: ctx.user.id,
          ipAddress: ctx.req?.ip || (ctx.req?.headers?.["x-forwarded-for"] as string)?.split(",")[0]?.trim() || "127.0.0.1",
          userAgent: ctx.req?.headers?.["user-agent"] || "unknown",
          requestId: (ctx.req as any)?.requestId,
        },
        module: "security",
        action: "RBAC_DENIED",
        severity: "critical",
        entityType: "trpc_procedure",
        entityId: path,
        newValues: { role, allowedRoles },
      });
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Você não tem permissão para acessar este recurso.",
      });
    }

    return next({
      ctx: {
        ...ctx,
        user: { ...ctx.user, role },
        session: ctx.session,
        isAdmin: ["super_admin", "admin", "operator"].includes(role),
      },
    });
  });
}

type RateLimitConfig = {
  keyPrefix: string;
  limit: number;
  windowMs: number;
  getInputKey?: (input: unknown) => string | null | undefined;
};

function getRateLimitActorKey(ctx: TrpcContext): string {
  const userId = ctx.user?.id ? `user:${ctx.user.id}` : null;
  const guestId = ctx.guestId ? `guest:${ctx.guestId}` : null;
  const forwarded = ctx.req?.headers?.["x-forwarded-for"];
  const ipFromHeader =
    typeof forwarded === "string" ? forwarded.split(",")[0]?.trim() : null;
  const socketIp = ctx.req?.socket?.remoteAddress || null;
  const ip = ipFromHeader || socketIp || "unknown";
  return userId || guestId || `ip:${ip}`;
}

export function createRateLimitMiddleware(config: RateLimitConfig) {
  return t.middleware((opts) => {
    const { ctx, next, path } = opts;
    const actorKey = getRateLimitActorKey(ctx);
    const inputKey = config.getInputKey?.((opts as Record<string, unknown>).rawInput);
    const now = Date.now();
    const key = `${config.keyPrefix}:${path}:${actorKey}:${inputKey || "global"}`;
    const existing = procedureRateLimitStore.get(key);

    if (!existing || existing.resetAt <= now) {
      procedureRateLimitStore.set(key, {
        count: 1,
        resetAt: now + config.windowMs,
      });
      return next();
    }

    if (existing.count >= config.limit) {
      logger.warn(
        {
          path,
          actorKey,
          inputKey,
          limit: config.limit,
          windowMs: config.windowMs,
        },
        "Rate limit de procedure excedido",
      );
      throw new TRPCError({
        code: "TOO_MANY_REQUESTS",
        message: "Muitas tentativas. Tente novamente em instantes.",
      });
    }

    existing.count += 1;
    procedureRateLimitStore.set(key, existing);
    return next();
  }) as any;
}

function getTrpcModuleAndEntity(path: string): { module: string; entity: string } {
  const parts = path.toLowerCase().split(".");
  const routerName = parts[1] || "system";

  const moduleMap: Record<string, string> = {
    settings: "settings",
    storesettings: "settings",
    admintheme: "theme",
    paymentmethods: "payments",
    shippingrules: "shipping",
    shippingmesh: "shipping",
    loyalty: "loyalty",
    loyaltysettings: "loyalty",
    coupons: "marketing",
    marketing: "marketing",
    backups: "backup",
    security: "security",
    labels: "zebra",
    orders: "orders",
    ordersadmin: "orders",
    users: "security",
    usersadmin: "security",
    api: "integrations",
    media: "media",
  };

  const module = moduleMap[routerName] || "system";
  return { module, entity: routerName };
}

function getTrpcSeverity(path: string): "info" | "warning" | "critical" {
  const p = path.toUpperCase();
  if (
    p.includes("BACKUP") ||
    p.includes("SECURITY") ||
    p.includes("GENERATE") ||
    p.includes("EMERGENCY") ||
    p.includes("TOKEN") ||
    p.includes("PASSWORD") ||
    p.includes("DELETE")
  ) {
    return "critical";
  }
  if (
    p.includes("UPDATE") ||
    p.includes("SAVE") ||
    p.includes("EDIT") ||
    p.includes("BATCH") ||
    p.includes("ADJUST")
  ) {
    return "warning";
  }
  return "info";
}

const auditMiddleware = t.middleware(async (opts) => {
  const { ctx, path, type, next } = opts;
  const rawInput = (opts as Record<string, unknown>).rawInput;
  let requestId = (ctx.req as any)?.requestId;
  if (!requestId && ctx.req) {
    requestId =
      ctx.req.headers?.["x-request-id"] ||
      ctx.req.headers?.["x-correlation-id"] ||
      crypto.randomUUID();
    (ctx.req as any).requestId = requestId;
  }

  const result = await next();

  if (type === "mutation" && result.ok && ctx.user) {
    const silentPaths = new Set([
      "admin.logs.list",
      "admin.auth.session",
      "admin.orders.updateStatus",
      "admin.orders.editOrder",
      "admin.orders.deleteOrder",
      "admin.orders.updateStatusBatch",
      "admin.orders.commitAdministrativeEdit",
      "admin.ordersAdmin.updateStatus",
      "admin.ordersAdmin.editOrder",
      "admin.ordersAdmin.deleteOrder",
      "admin.ordersAdmin.updateStatusBatch",
      "admin.ordersAdmin.commitAdministrativeEdit",
      "admin.coupons.create",
      "admin.coupons.update",
      "admin.coupons.delete",
      "admin.paymentMethods.update",
      "admin.paymentMethods.delete",
      "admin.shipping.rules.updateSettings",
      "admin.shipping.rules.createRule",
      "admin.shipping.rules.deleteRule",
      "admin.shippingRules.updateSettings",
      "admin.shippingRules.createRule",
      "admin.shippingRules.deleteRule",
      "admin.loyaltySettings.addManualPoints",
      "admin.loyaltySettings.update",
      "admin.loyaltySettings.deleteTransactions",
      "admin.storeSettings.upsert",
      "admin.storeSettings.update",
      "admin.storeSettings.saveCompanyInfo",
      "admin.settings.upsert",
      "admin.settings.update",
      "admin.settings.saveCompanyInfo",
      "admin.marketing.updateRules",
    ]);

    if (!silentPaths.has(path)) {
      let safeInput: unknown = null;

      if (rawInput && typeof rawInput === "object") {
        const inputObj = { ...(rawInput as Record<string, unknown>) };
        const sensitiveKeys = [
          "password",
          "token",
          "publicAccessToken",
          "secret",
          "currentPassword",
          "newPassword",
        ];

        for (const key of sensitiveKeys) {
          if (key in inputObj) delete inputObj[key];
        }
        safeInput = inputObj;
      } else {
        safeInput = rawInput;
      }

      const { module, entity } = getTrpcModuleAndEntity(path);
      const severity = getTrpcSeverity(path);
      const actionName = `AUTO_${path.toUpperCase().replace(/\./g, "_")}`;
      const responseMessage =
        result.data && typeof result.data === "object"
          ? (result.data as Record<string, unknown>).message || "Sucesso"
          : "Sucesso";

      const actor = {
        userId: ctx.user.id,
        ipAddress: ctx.req?.ip || (ctx.req?.headers?.["x-forwarded-for"] as string)?.split(",")[0]?.trim() || "127.0.0.1",
        userAgent: ctx.req?.headers?.["user-agent"] || "unknown",
        requestId,
      };

      void AuditLogService.record({
        actor,
        module,
        action: actionName,
        entityType: entity,
        entityId: (rawInput as any)?.id || (rawInput as any)?.orderId || null,
        newValues: {
          input: safeInput,
          response: responseMessage,
        },
        severity,
      });
    }
  }

  return result;
});

export const protectedProcedure = t.procedure.use(isAuthed);
export const operatorProcedure = t.procedure
  .use(auditMiddleware)
  .use(requireRoles(["super_admin", "admin", "operator"]));
export const adminProcedure = t.procedure
  .use(auditMiddleware)
  .use(requireRoles(["super_admin", "admin"]));
export const superAdminProcedure = t.procedure
  .use(auditMiddleware)
  .use(requireRoles(["super_admin"]));
export const nutriProcedure = t.procedure
  .use(auditMiddleware)
  .use(requireRoles(["super_admin", "admin", "nutri"]));
export const internalProcedure = t.procedure.use(isInternal);

export type { AdminRole, AppRole };
