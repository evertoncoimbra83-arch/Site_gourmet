import { Queue, type ConnectionOptions, type JobsOptions } from "bullmq";
import {
  redisConnection as redis,
  ensureRedisReady,
  isRedisReady,
} from "../../lib/redis.js";
import { logger } from "../../logger.js";

export const BI_QUEUE_NAME = "bi-analytics-queue";

const REDIS_WARN_COOLDOWN_MS = 10_000;
const connection = redis as unknown as ConnectionOptions;

export const biQueue = new Queue(BI_QUEUE_NAME, {
  connection,
});

let queueErrorBound = false;
let lastQueueWarnAt = 0;

function shouldLog(lastAt: number, cooldownMs: number) {
  return Date.now() - lastAt > cooldownMs;
}

function warnQueue(message: string) {
  if (!shouldLog(lastQueueWarnAt, REDIS_WARN_COOLDOWN_MS)) return;
  lastQueueWarnAt = Date.now();
  logger.warn(`[BI Queue] ${message}`);
}

function bindQueueErrorHandler() {
  if (queueErrorBound) return;
  queueErrorBound = true;
  biQueue.on("error", (err: Error) => {
    warnQueue(`Redis error: ${err.message}`);
  });
}

export async function ensureBIWorkerRunning(): Promise<boolean> {
  bindQueueErrorHandler();
  return isRedisReady() || (await ensureRedisReady("bi-queue-producer"));
}

import crypto from "crypto";

export async function enqueueBIAnalyticsJob(
  orderId: string,
  options?: JobsOptions,
  requestId?: string,
): Promise<boolean> {
  bindQueueErrorHandler();

  const ready = isRedisReady() || (await ensureRedisReady("bi-queue-enqueue"));
  if (!ready) {
    warnQueue(
      `Redis not ready. BI job skipped for order ${orderId}. status=${redis.status}`,
    );
    return false;
  }

  try {
    const finalRequestId = requestId || crypto.randomUUID();
    await biQueue.add(
      "process-analytics",
      { orderId, requestId: finalRequestId },
      options,
    );
    return true;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    warnQueue(`Failed to enqueue order ${orderId}: ${message}`);
    return false;
  }
}
