import { initTRPC, TRPCError } from "@trpc/server";
import { ZodError } from "zod";
import superjson from "superjson";
import { eq } from "drizzle-orm";
import { appConfigs } from "../../drizzle/schema/index.js";
import { type TrpcContext } from "./context";
import { logAction } from "../db/lib/audit";
import { logger } from "../logger";
import { redactSensitiveData } from "../lib/redact";
import { decrypt } from "../encryption.js";

type AppRole = "admin" | "user" | "nutri";

const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
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
      user: { id: "system-ai", role: "admin" as const },
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

    if (!allowedRoles.includes(ctx.user.role)) {
      logger.warn(
        {
          path,
          userId: ctx.user.id,
          role: ctx.user.role,
          allowedRoles,
        },
        "Tentativa de acesso negado por role",
      );
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Você não tem permissão para acessar este recurso.",
      });
    }

    return next({
      ctx: {
        ...ctx,
        user: ctx.user,
        session: ctx.session,
        isAdmin: ctx.user.role === "admin",
      },
    });
  });
}

type RateLimitConfig = {
  keyPrefix: string;
  limit: number;
  windowMs: number;
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
  return t.middleware(({ ctx, next, path }) => {
    const actorKey = getRateLimitActorKey(ctx);
    const now = Date.now();
    const key = `${config.keyPrefix}:${path}:${actorKey}`;
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
  });
}

const auditMiddleware = t.middleware(async (opts) => {
  const { ctx, path, type, next } = opts;
  const rawInput = (opts as Record<string, unknown>).rawInput;
  const result = await next();

  if (type === "mutation" && result.ok && ctx.user) {
    const silentPaths = ["admin.logs.list", "admin.auth.session"];

    if (!silentPaths.includes(path)) {
      let safeInput: unknown = null;

      if (rawInput && typeof rawInput === "object") {
        const inputObj = { ...(rawInput as Record<string, unknown>) };
        const sensitiveKeys = [
          "password",
          "token",
          "secret",
          "currentPassword",
          "newPassword",
        ];

        for (const key of sensitiveKeys) {
          if (key in inputObj) delete inputObj[key];
        }

        safeInput = redactSensitiveData(inputObj);
      } else {
        safeInput = redactSensitiveData(rawInput);
      }

      const entity = path.split(".")[1] || "system";
      const actionName = `AUTO_${path.toUpperCase().replace(/\./g, "_")}`;
      const responseMessage =
        result.data && typeof result.data === "object"
          ? (result.data as Record<string, unknown>).message || "Sucesso"
          : "Sucesso";

      void logAction(
        { ...ctx, user: { id: ctx.user.id } },
        actionName,
        entity,
        {
          new: {
            input: safeInput,
            response: responseMessage,
          },
        },
      ).catch((err) => {
        const msg = err instanceof Error ? err.message : "Erro desconhecido";
        logger.error({ err: msg, path }, "Erro ao salvar auditoria automática");
      });
    }
  }

  return result;
});

export const protectedProcedure = t.procedure.use(isAuthed);
export const adminProcedure = t.procedure
  .use(requireRoles(["admin"]))
  .use(auditMiddleware);
export const nutriProcedure = t.procedure
  .use(requireRoles(["admin", "nutri"]))
  .use(auditMiddleware);
export const internalProcedure = t.procedure.use(isInternal);
