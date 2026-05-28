import { createRateLimitMiddleware, router, superAdminProcedure } from "../../_core/trpc.js";
import { ENV } from "../../_core/env.js";
import { globalLimiter, authLimiter, checkoutLimiter } from "../../security/rateLimit.js";
import {
  buildSafeMediaFilename,
  sanitizeMediaFolder,
  validateAndDecodeImageUpload,
} from "../../lib/upload-security.js";
import { redactSensitiveData } from "../../lib/redact.js";
import { logAction } from "../../db/lib/audit.js";

type RiskLevel = "secure" | "attention" | "critical";

type SecurityCheck = {
  id: string;
  title: string;
  status: boolean;
  risk: RiskLevel;
  message: string;
};

type RedisInfo = {
  hostname: string;
  isIpv4: boolean;
  isPrivateIpv4: boolean;
};

function isIpv4(host: string) {
  return /^\d{1,3}(\.\d{1,3}){3}$/.test(host);
}

function isPrivateIpv4(host: string) {
  if (!isIpv4(host)) return false;
  const [a, b] = host.split(".").map((n) => Number(n));
  if (a === 10) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 127) return true;
  return false;
}

function parseRedisUrl(raw: string): RedisInfo | null {
  if (!raw) return null;
  try {
    const url = new URL(raw);
    const hostname = url.hostname.toLowerCase();
    return {
      hostname,
      isIpv4: isIpv4(hostname),
      isPrivateIpv4: isPrivateIpv4(hostname),
    };
  } catch {
    return null;
  }
}

function getRedisAuthCheck(): SecurityCheck {
  const redisInfo = parseRedisUrl(ENV.redisUrl);
  const host = redisInfo?.hostname || "";
  const hasRedis = ENV.hasRedis;
  const hasAuth = ENV.redisHasAuth;
  const isLocal = ENV.redisIsLocal;
  const isPrivateIp = Boolean(redisInfo?.isIpv4 && redisInfo?.isPrivateIpv4);
  const isPublicIp = Boolean(redisInfo?.isIpv4 && !redisInfo?.isPrivateIpv4);
  const isProduction = ENV.isProductionLike;

  if (!hasRedis) {
    return {
      id: "redis_auth_policy",
      title: "Autenticação do Redis",
      status: false,
      risk: "critical",
      message: "Redis não configurado.",
    };
  }

  if (hasAuth) {
    return {
      id: "redis_auth_policy",
      title: "Autenticação do Redis",
      status: true,
      risk: "secure",
      message: "Redis com autenticação ativa.",
    };
  }

  if (isPublicIp) {
    return {
      id: "redis_auth_policy",
      title: "Autenticação do Redis",
      status: false,
      risk: "critical",
      message: "Redis em IP público sem senha.",
    };
  }

  if (isLocal) {
    return {
      id: "redis_auth_policy",
      title: "Autenticação do Redis",
      status: true,
      risk: "secure",
      message:
        "Redis local sem senha (aceitável para desenvolvimento/ambiente local).",
    };
  }

  if (isPrivateIp) {
    return {
      id: "redis_auth_policy",
      title: "Autenticação do Redis",
      status: !isProduction,
      risk: isProduction ? "critical" : "attention",
      message: isProduction
        ? "Redis privado sem senha em ambiente produtivo."
        : "Redis privado sem senha (revisar antes de produção).",
    };
  }

  return {
    id: "redis_auth_policy",
    title: "Autenticação do Redis",
    status: false,
    risk: isProduction ? "critical" : "attention",
    message:
      host.length > 0
        ? "Redis externo sem senha."
        : "Não foi possível validar host do Redis.",
  };
}

function getSecretsCheck(): SecurityCheck {
  const hasSession = ENV.hasStrongSessionSecret;
  const hasJwt = ENV.hasStrongJwtSecret;

  if (hasSession && hasJwt) {
    return {
      id: "auth_secrets_strength",
      title: "SESSION_SECRET/JWT_SECRET fortes",
      status: true,
      risk: "secure",
      message: "Segredos com tamanho recomendado (>= 32).",
    };
  }

  if (hasSession || hasJwt) {
    return {
      id: "auth_secrets_strength",
      title: "SESSION_SECRET/JWT_SECRET fortes",
      status: true,
      risk: "attention",
      message: "Apenas um segredo forte detectado. Recomenda-se ambos.",
    };
  }

  return {
    id: "auth_secrets_strength",
    title: "SESSION_SECRET/JWT_SECRET fortes",
    status: false,
    risk: "critical",
    message: "Nenhum segredo forte detectado (mínimo recomendado: 32).",
  };
}

function getCorsCheck(): SecurityCheck {
  const cors = ENV.corsOrigin.trim();
  const wildcard = cors === "*" || cors === "";

  if (ENV.isProductionLike) {
    return {
      id: "cors_origin_policy",
      title: "Política de CORS",
      status: !wildcard,
      risk: wildcard ? "critical" : "secure",
      message: wildcard
        ? "CORS com wildcard em produção."
        : "CORS restrito para produção.",
    };
  }

  return {
    id: "cors_origin_policy",
    title: "Política de CORS",
    status: true,
    risk: wildcard ? "attention" : "secure",
    message: wildcard
      ? "Wildcard esperado em ambiente local."
      : "CORS configurado sem wildcard.",
  };
}

function getChecks(): SecurityCheck[] {
  const redactionProbe = redactSensitiveData({
    token: "sensitive-token",
    nested: { password: "top-secret" },
  }) as { token?: unknown; nested?: { password?: unknown } };
  const redactionWorks =
    redactionProbe?.token === "[redacted]" &&
    redactionProbe?.nested?.password === "[redacted]";

  const rateLimitActive =
    typeof globalLimiter === "function" &&
    typeof authLimiter === "function" &&
    typeof checkoutLimiter === "function" &&
    typeof createRateLimitMiddleware === "function";

  const uploadSecurityActive =
    typeof validateAndDecodeImageUpload === "function" &&
    typeof sanitizeMediaFolder === "function" &&
    typeof buildSafeMediaFilename === "function";

  return [
    {
      id: "redis_url_exists",
      title: "REDIS_URL configurado",
      status: ENV.hasRedis,
      risk: ENV.hasRedis ? "secure" : "critical",
      message: ENV.hasRedis
        ? "Configuração presente."
        : "Variável ausente para fila/cache.",
    },
    getRedisAuthCheck(),
    {
      id: "database_url_exists",
      title: "DATABASE_URL configurado",
      status: Boolean(ENV.databaseUrl),
      risk: ENV.databaseUrl ? "secure" : "critical",
      message: ENV.databaseUrl
        ? "Configuração presente."
        : "Variável ausente para conexão de banco.",
    },
    getSecretsCheck(),
    {
      id: "node_env_production",
      title: "NODE_ENV consistente",
      status: ENV.nodeEnv === "production" || !ENV.isProductionLike,
      risk:
        ENV.nodeEnv === "production" || !ENV.isProductionLike
          ? "secure"
          : "critical",
      message:
        ENV.nodeEnv === "production"
          ? "NODE_ENV em produção."
          : ENV.isProductionLike
            ? "Ambiente de produção sem NODE_ENV=production."
            : "Ambiente não produtivo.",
    },
    getCorsCheck(),
    {
      id: "rate_limit_active",
      title: "Rate limit ativo",
      status: rateLimitActive,
      risk: rateLimitActive ? "secure" : "attention",
      message: rateLimitActive
        ? "Middlewares de limite carregados."
        : "Não foi possível confirmar proteção de limite.",
    },
    {
      id: "upload_security_active",
      title: "Upload security ativo",
      status: uploadSecurityActive,
      risk: uploadSecurityActive ? "secure" : "critical",
      message: uploadSecurityActive
        ? "Validação e sanitização de upload disponíveis."
        : "Proteção de upload não detectada.",
    },
    {
      id: "audit_redaction_active",
      title: "Redação de auditoria ativa",
      status: redactionWorks && typeof logAction === "function",
      risk: redactionWorks ? "secure" : "critical",
      message:
        redactionWorks && typeof logAction === "function"
          ? "Campos sensíveis são mascarados."
          : "Redação de dados sensíveis não confirmada.",
    },
  ];
}

function summarizeOverallRisk(checks: SecurityCheck[]): RiskLevel {
  if (checks.some((c) => c.risk === "critical")) return "critical";
  if (checks.some((c) => c.risk === "attention")) return "attention";
  return "secure";
}

export const securityRouter = router({
  getEnvironmentSecurityReport: superAdminProcedure.query(async () => {
    const checks = getChecks();
    const overallRisk = summarizeOverallRisk(checks);

    return {
      status: overallRisk,
      environment: ENV.isProductionLike ? "production" : "development",
      runtime: ENV.isPM2 ? "pm2" : "local",
      isProductionLike: ENV.isProductionLike,
      generatedAt: new Date().toISOString(),
      summary:
        overallRisk === "secure"
          ? "Configuração geral sem riscos críticos."
          : overallRisk === "attention"
            ? "Existem pontos que precisam de revisão."
            : "Existem riscos críticos que exigem ação imediata.",
      checks,
    };
  }),
});
