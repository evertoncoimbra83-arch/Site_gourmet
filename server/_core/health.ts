import type { Express, Request, Response } from "express";
import { sql } from "drizzle-orm";
import { getDb } from "../db.js";
import { ensureRedisReady, redisConnection } from "../lib/redis.js";
import { getWorkerHealthStatus } from "../workers/observability.js";

type CheckStatus = "ok" | "error";
type WorkerCheckStatus = "ok" | "degraded";

type HealthChecks = {
  database: CheckStatus;
  redis: CheckStatus;
  worker?: WorkerCheckStatus;
};

type HealthDependencies = {
  checkDatabase?: () => Promise<void>;
  checkRedis?: () => Promise<void>;
  checkWorker?: typeof getWorkerHealthStatus;
  timeoutMs?: number;
};

function withTimeout<T>(
  task: Promise<T>,
  timeoutMs: number,
): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error("health_check_timeout"));
    }, timeoutMs);

    task
      .then(resolve)
      .catch(reject)
      .finally(() => clearTimeout(timer));
  });
}

async function defaultDatabaseCheck() {
  const db = await getDb();
  await db.execute(sql`SELECT 1`);
}

async function defaultRedisCheck() {
  const ready = await ensureRedisReady("health-ready");
  if (!ready) {
    throw new Error("redis_not_ready");
  }
  await redisConnection.ping();
}

export async function getReadyHealth(
  deps: HealthDependencies = {},
): Promise<{
  statusCode: 200 | 503;
  body: {
    status: "ready" | "not_ready" | "degraded";
    checks: HealthChecks;
    timestamp: string;
  };
}> {
  const timeoutMs = deps.timeoutMs ?? 1_500;
  const checks: HealthChecks = {
    database: "error",
    redis: "error",
  };
  let worker: Awaited<ReturnType<typeof getWorkerHealthStatus>> | null = null;

  try {
    await withTimeout(
      (deps.checkDatabase || defaultDatabaseCheck)(),
      timeoutMs,
    );
    checks.database = "ok";
  } catch {
    checks.database = "error";
  }

  try {
    await withTimeout((deps.checkRedis || defaultRedisCheck)(), timeoutMs);
    checks.redis = "ok";
  } catch {
    checks.redis = "error";
  }

  if (checks.redis === "ok") {
    try {
      worker = await withTimeout(
        (deps.checkWorker || getWorkerHealthStatus)(),
        timeoutMs,
      );
      checks.worker = worker.workerAlive ? "ok" : "degraded";
    } catch {
      checks.worker = "degraded";
    }
  } else {
    checks.worker = "degraded";
  }

  const ready = checks.database === "ok" && checks.redis === "ok";
  const degraded = ready && checks.worker === "degraded";

  return {
    statusCode: ready ? 200 : 503,
    body: {
      status: ready ? (degraded ? "degraded" : "ready") : "not_ready",
      checks,
      timestamp: new Date().toISOString(),
    },
  };
}

export function setupHealthRoutes(app: Express, deps: HealthDependencies = {}) {
  app.get("/health/live", (_req: Request, res: Response) => {
    res.status(200).json({
      status: "alive",
      timestamp: new Date().toISOString(),
    });
  });

  app.get("/health/ready", async (_req: Request, res: Response) => {
    const result = await getReadyHealth(deps);
    res.status(result.statusCode).json(result.body);
  });

  app.get("/health/worker", async (_req: Request, res: Response) => {
    try {
      const worker = await withTimeout(
        (deps.checkWorker || getWorkerHealthStatus)(),
        deps.timeoutMs ?? 1_500,
      );
      res.status(worker.workerAlive ? 200 : 503).json({
        status: worker.workerAlive ? "healthy" : "unhealthy",
        checks: {
          worker: worker.workerAlive ? "ok" : "degraded",
        },
        timestamp: new Date().toISOString(),
      });
    } catch {
      res.status(503).json({
        status: "unhealthy",
        checks: {
          worker: "degraded",
        },
        timestamp: new Date().toISOString(),
      });
    }
  });
}
