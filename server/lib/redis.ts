import { Redis } from "ioredis";

const redisUrl = process.env.REDIS_URL;
const redisHost = process.env.REDIS_HOST || "localhost";
const redisPort = Number(process.env.REDIS_PORT) || 6379;

const REDIS_OPTS = {
  maxRetriesPerRequest: null as null,
  lazyConnect: true,
  enableOfflineQueue: false,
  connectTimeout: 8000,
  retryStrategy: (times: number) => {
    if (times > 15) return null;
    return Math.min(times * 500, 10_000);
  },
};

export const redisConnection = redisUrl
  ? new Redis(redisUrl, REDIS_OPTS)
  : new Redis({ host: redisHost, port: redisPort, ...REDIS_OPTS });

let connectAttempt: Promise<boolean> | null = null;
let lastRedisErrorLogAt = 0;
let lastRedisWarnLogAt = 0;

function shouldLog(lastAt: number, cooldownMs: number) {
  return Date.now() - lastAt > cooldownMs;
}

function waitForRedisReady(timeoutMs = 8_000): Promise<boolean> {
  if (redisConnection.status === "ready") return Promise.resolve(true);

  return new Promise((resolve) => {
    let settled = false;

    const cleanup = (ok: boolean) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      redisConnection.off("ready", onReady);
      redisConnection.off("close", onCloseOrEnd);
      redisConnection.off("end", onCloseOrEnd);
      resolve(ok);
    };

    const onReady = () => cleanup(true);
    const onCloseOrEnd = () => cleanup(false);

    const timer = setTimeout(() => {
      cleanup(redisConnection.status === "ready");
    }, timeoutMs);

    redisConnection.once("ready", onReady);
    redisConnection.once("close", onCloseOrEnd);
    redisConnection.once("end", onCloseOrEnd);
  });
}

export function isRedisReady() {
  return redisConnection.status === "ready";
}

export async function ensureRedisReady(context = "runtime"): Promise<boolean> {
  if (isRedisReady()) return true;

  if (connectAttempt) {
    return connectAttempt;
  }

  connectAttempt = (async () => {
    try {
      const status = redisConnection.status;

      if (status === "end") {
        return false;
      }

      if (status === "wait" || status === "close") {
        await redisConnection.connect();
      }

      const ready = await waitForRedisReady();

      if (!ready && shouldLog(lastRedisWarnLogAt, 10_000)) {
        lastRedisWarnLogAt = Date.now();
        console.warn(
          `[Redis] Not ready yet (${context}). status=${redisConnection.status}`,
        );
      }

      return ready;
    } catch (err) {
      if (shouldLog(lastRedisErrorLogAt, 10_000)) {
        lastRedisErrorLogAt = Date.now();
        const message = err instanceof Error ? err.message : String(err);
        console.error(`[Redis] Connect failed (${context}): ${message}`);
      }
      return false;
    } finally {
      connectAttempt = null;
    }
  })();

  return connectAttempt;
}

redisConnection.on("error", (err: Error) => {
  if (!shouldLog(lastRedisErrorLogAt, 10_000)) return;
  lastRedisErrorLogAt = Date.now();
  console.error("[Redis] Connection error:", err.message);
});
