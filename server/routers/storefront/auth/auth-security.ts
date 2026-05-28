import { TRPCError } from "@trpc/server";
import { AuditLogService } from "../../../services/AuditLogService.js";

type AuthSeverity = "info" | "warning" | "critical";
type AuthContextLike = {
  req?: {
    ip?: string;
    headers?: Record<string, string | string[] | undefined>;
    requestId?: string;
  };
  user?: { id?: string | null } | null;
};

export function normalizeAuthIdentifier(value: string | null | undefined) {
  return (value || "").trim().toLowerCase();
}

export function getAuthInputKey(input: unknown) {
  if (!input || typeof input !== "object") return null;
  const data = input as Record<string, unknown>;
  const value =
    typeof data.identifier === "string"
      ? data.identifier
      : typeof data.email === "string"
        ? data.email
        : null;
  return value ? normalizeAuthIdentifier(value) : null;
}

export function assertPasswordPolicy(password: string, email?: string | null) {
  const trimmed = password.trim();
  if (password.length < 8 || trimmed.length < 8) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "A senha deve ter pelo menos 8 caracteres.",
    });
  }

  const normalizedEmail = normalizeAuthIdentifier(email);
  if (normalizedEmail && trimmed.toLowerCase() === normalizedEmail) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "A senha nao pode ser igual ao e-mail.",
    });
  }
}

export function getAuthActor(ctx?: AuthContextLike, userId?: string | null) {
  const userAgent = ctx?.req?.headers?.["user-agent"];
  return {
    userId: userId || ctx?.user?.id || "anonymous",
    ipAddress:
      ctx?.req?.ip ||
      (ctx?.req?.headers?.["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
      "127.0.0.1",
    userAgent: Array.isArray(userAgent)
      ? userAgent[0]
      : userAgent || "unknown",
    requestId: ctx?.req?.requestId,
  };
}

export function recordAuthEvent(args: {
  ctx?: AuthContextLike;
  action: string;
  severity: AuthSeverity;
  userId?: string | null;
  identifier?: string | null;
  reason?: string;
  entityId?: string | null;
  metadata?: Record<string, unknown>;
}) {
  void AuditLogService.record({
    actor: getAuthActor(args.ctx, args.userId),
    module: "auth",
    action: args.action,
    severity: args.severity,
    entityType: "auth_event",
    entityId: args.entityId || args.userId || null,
    entityLabel: args.identifier
      ? normalizeAuthIdentifier(args.identifier)
      : undefined,
    newValues: {
      identifier: args.identifier
        ? normalizeAuthIdentifier(args.identifier)
        : undefined,
      reason: args.reason,
      ...(args.metadata || {}),
    },
  });
}
