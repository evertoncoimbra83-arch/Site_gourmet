  const nodeEnv = process.env.NODE_ENV || "development";
const appEnv = process.env.APP_ENV || "";
const corsOrigin = process.env.CORS_ORIGIN || process.env.CORS_ORIGINS || "";
const redisUrl = process.env.REDIS_URL || "";

const isProdNode = nodeEnv === "production";
const isProductionLike =
  isProdNode ||
  appEnv === "production" ||
  process.env.VERCEL_ENV === "production" ||
  process.env.RAILWAY_ENVIRONMENT === "production";

const warn = (key: string, required = false): string => {
  const val = process.env[key];

  if (!val) {
    const level = required && isProductionLike ? "[critical]" : "[warn]";
    console.warn(`[ENV] ${level} Missing env var: ${key}`);
  }

  return val ?? "";
};

const get = (key: string, fallback = ""): string => {
  return process.env[key] ?? fallback;
};

const isStrongSecret = (val: string, minLength = 32) => val.trim().length >= minLength;

const isIpv4 = (host: string) => /^\d{1,3}(\.\d{1,3}){3}$/.test(host);

const isPrivateIpv4 = (host: string) => {
  if (!isIpv4(host)) return false;
  const [a, b] = host.split(".").map((n) => Number(n));
  if (a === 10) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 127) return true;
  return false;
};

const LOCAL_REDIS_HOSTS = new Set(["localhost", "127.0.0.1", "::1", "redis"]);

function parseRedisUrl(raw: string) {
  if (!raw) return null;
  try {
    const url = new URL(raw);
    const hostname = url.hostname.toLowerCase();
    return {
      hostname,
      hasAuth: Boolean(url.password),
      isLocal: LOCAL_REDIS_HOSTS.has(hostname),
      isIpv4: isIpv4(hostname),
      isPrivateIpv4: isPrivateIpv4(hostname),
    };
  } catch {
    return null;
  }
}

const parsedRedis = parseRedisUrl(redisUrl);
const sessionSecret = get("SESSION_SECRET");
const jwtSecret = get("JWT_SECRET");
const hasStrongSessionSecret = isStrongSecret(sessionSecret);
const hasStrongJwtSecret = isStrongSecret(jwtSecret);

export type EnvConfig = {
  appId: string;
  cookieSecret: string;
  databaseUrl: string;
  redisUrl: string;
  corsOrigin: string;
  nodeEnv: string;
  appEnv: string;
  oAuthServerUrl: string;
  ownerOpenId: string;
  isProduction: boolean;
  isProductionLike: boolean;
  forgeApiUrl: string;
  forgeApiKey: string;
  dbEncryptionKey: string;
  isPM2: boolean;
  hasRedis: boolean;
  redisIsLocal: boolean;
  redisHasAuth: boolean;
  redisIsPrivateIp: boolean;
  redisIsPublicIp: boolean;
  hasStrongSessionSecret: boolean;
  hasStrongJwtSecret: boolean;
  secretsAreStrong: boolean;
};

export const ENV: EnvConfig = {
  appId: get("VITE_APP_ID"),
  cookieSecret: process.env.SESSION_SECRET || warn("JWT_SECRET", true),
  databaseUrl: warn("DATABASE_URL", true),
  redisUrl,
  corsOrigin,
  nodeEnv,
  appEnv,
  oAuthServerUrl: get("OAUTH_SERVER_URL"),
  ownerOpenId: get("OWNER_OPEN_ID"),
  isProduction: isProdNode,
  isProductionLike,
  forgeApiUrl: get("BUILT_IN_FORGE_API_URL"),
  forgeApiKey: get("BUILT_IN_FORGE_API_KEY"),
  dbEncryptionKey: warn("DB_ENCRYPTION_KEY", true),
  isPM2: Boolean(process.env.pm_id),
  hasRedis: Boolean(redisUrl),
  redisIsLocal: Boolean(parsedRedis?.isLocal),
  redisHasAuth: Boolean(parsedRedis?.hasAuth),
  redisIsPrivateIp: Boolean(parsedRedis?.isIpv4 && parsedRedis?.isPrivateIpv4),
  redisIsPublicIp: Boolean(parsedRedis?.isIpv4 && !parsedRedis?.isPrivateIpv4),
  hasStrongSessionSecret,
  hasStrongJwtSecret,
  secretsAreStrong: hasStrongSessionSecret && hasStrongJwtSecret,
};
