import os from "os";
import {
  QueueEvents,
  type ConnectionOptions,
  type Job,
  type Queue,
} from "bullmq";
import { AuditLogService } from "../services/AuditLogService.js";
import {
  ensureRedisReady,
  isRedisReady,
  redisConnection,
} from "../lib/redis.js";
import { logger } from "../logger.js";
import { nutriQueue, NUTRI_QUEUE_NAME } from "../queues/nutriQueue.js";
import { biQueue, BI_QUEUE_NAME } from "./queues/biQueue.js";

export const WORKER_HEARTBEAT_KEY = "gourmet:worker:heartbeat";
export const WORKER_HEARTBEAT_TTL_SECONDS = 90;
export const WORKER_HEARTBEAT_INTERVAL_MS = 30_000;
export const WORKER_HEARTBEAT_MAX_AGE_SECONDS = 90;
export const QUEUE_BACKLOG_WARNING_THRESHOLD = 100;

export const getWorkerHeartbeatTtlSeconds = () =>
  Number(process.env.WORKER_HEARTBEAT_TTL_SECONDS) || 90;
export const getWorkerHeartbeatMaxAgeSeconds = () =>
  getWorkerHeartbeatTtlSeconds();
export const getQueueBacklogWarningThreshold = () =>
  Number(process.env.WORKER_BACKLOG_WARNING_THRESHOLD) || 100;
export const getWorkerFailedWarningThreshold = () =>
  Number(process.env.WORKER_FAILED_WARNING_THRESHOLD) || 1;
export const getWorkerIncidentsLimit = () =>
  Number(process.env.WORKER_INCIDENTS_LIMIT) || 100;

export interface WorkerIncident {
  type: "failed" | "stalled" | "worker_error" | "heartbeat_missing" | "backlog_high";
  timestamp: string;
  queue?: string;
  jobId?: string;
  jobName?: string;
  severity: "warning" | "critical";
  message: string;
  failedReason?: string;
  requestId?: string;
  attemptsMade?: number;
}

export async function recordIncident(input: Omit<WorkerIncident, "timestamp">) {
  try {
    const ready = isRedisReady() || (await ensureRedisReady("record-incident"));
    if (!ready) return;

    const incident: WorkerIncident = {
      ...input,
      timestamp: new Date().toISOString(),
    };

    const limit = getWorkerIncidentsLimit();
    await redisConnection.lpush("gourmet:worker:incidents", JSON.stringify(incident));
    await redisConnection.ltrim("gourmet:worker:incidents", 0, limit - 1);
  } catch (err) {
    logger.warn({ err }, "WORKER_RECORD_INCIDENT_FAILED");
  }
}

export type QueueName = typeof NUTRI_QUEUE_NAME | typeof BI_QUEUE_NAME;

export type WorkerHeartbeatPayload = {
  timestamp: string;
  pid: number;
  hostname: string;
  queues: QueueName[];
  version: string;
  build: string | null;
};

export type QueueStats = Record<
  QueueName,
  {
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
    paused: number;
  }
>;

export type WorkerHealthStatus = {
  workerAlive: boolean;
  lastHeartbeat: string | null;
  ageSeconds: number | null;
  heartbeat: WorkerHeartbeatPayload | null;
  queueStats: QueueStats;
  redisStatus: string;
  warnings: string[];
};

const QUEUE_COUNT_TYPES = [
  "waiting",
  "active",
  "completed",
  "failed",
  "delayed",
  "paused",
] as const;

const observableQueues: Array<{ name: QueueName; queue: Queue }> = [
  { name: NUTRI_QUEUE_NAME, queue: nutriQueue },
  { name: BI_QUEUE_NAME, queue: biQueue },
];

let heartbeatTimer: NodeJS.Timeout | null = null;
let lastAlertAt = new Map<string, number>();
let queueEventsStarted = false;
let queueEvents: QueueEvents[] = [];

function shouldLogAlert(key: string, cooldownMs = 60_000) {
  const now = Date.now();
  const last = lastAlertAt.get(key) || 0;
  if (now - last < cooldownMs) return false;
  lastAlertAt.set(key, now);
  return true;
}

function toCount(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function getRuntimeVersion() {
  return process.env.APP_VERSION || process.env.npm_package_version || "unknown";
}

function getRuntimeBuild() {
  return process.env.BUILD_ID || process.env.GIT_SHA || process.env.COMMIT_SHA || null;
}

export function buildWorkerHeartbeatPayload(): WorkerHeartbeatPayload {
  return {
    timestamp: new Date().toISOString(),
    pid: process.pid,
    hostname: os.hostname(),
    queues: [NUTRI_QUEUE_NAME, BI_QUEUE_NAME],
    version: getRuntimeVersion(),
    build: getRuntimeBuild(),
  };
}

export function parseWorkerHeartbeat(
  raw: string | null,
  nowMs = Date.now(),
): {
  workerAlive: boolean;
  lastHeartbeat: string | null;
  ageSeconds: number | null;
  heartbeat: WorkerHeartbeatPayload | null;
} {
  if (!raw) {
    return {
      workerAlive: false,
      lastHeartbeat: null,
      ageSeconds: null,
      heartbeat: null,
    };
  }

  try {
    const heartbeat = JSON.parse(raw) as WorkerHeartbeatPayload;
    const heartbeatMs = Date.parse(heartbeat.timestamp);
    if (!Number.isFinite(heartbeatMs)) {
      return {
        workerAlive: false,
        lastHeartbeat: null,
        ageSeconds: null,
        heartbeat: null,
      };
    }

    const ageSeconds = Math.max(0, Math.floor((nowMs - heartbeatMs) / 1000));
    return {
      workerAlive: ageSeconds <= getWorkerHeartbeatMaxAgeSeconds(),
      lastHeartbeat: heartbeat.timestamp,
      ageSeconds,
      heartbeat,
    };
  } catch {
    return {
      workerAlive: false,
      lastHeartbeat: null,
      ageSeconds: null,
      heartbeat: null,
    };
  }
}

export function formatQueueStats(
  queueName: QueueName,
  counts: Partial<Record<(typeof QUEUE_COUNT_TYPES)[number], number>>,
): QueueStats[QueueName] {
  const stats = {
    waiting: toCount(counts.waiting),
    active: toCount(counts.active),
    completed: toCount(counts.completed),
    failed: toCount(counts.failed),
    delayed: toCount(counts.delayed),
    paused: toCount(counts.paused),
  };

  const failedThreshold = getWorkerFailedWarningThreshold();
  if (stats.failed >= failedThreshold && shouldLogAlert(`${queueName}:failed`)) {
    logger.warn(
      { queue: queueName, failed: stats.failed },
      "WORKER_QUEUE_FAILED_JOBS_PRESENT",
    );
  }

  const backlog = stats.waiting + stats.delayed;
  const backlogThreshold = getQueueBacklogWarningThreshold();
  if (backlog > backlogThreshold) {
    if (shouldLogAlert(`incident:${queueName}:backlog`, 60_000)) {
      void recordIncident({
        type: "backlog_high",
        queue: queueName,
        severity: "warning",
        message: `Queue backlog high: ${backlog} jobs (waiting: ${stats.waiting}, delayed: ${stats.delayed})`,
      });
    }
    if (shouldLogAlert(`${queueName}:backlog`)) {
      logger.warn(
        { queue: queueName, backlog, waiting: stats.waiting, delayed: stats.delayed },
        "WORKER_QUEUE_BACKLOG_HIGH",
      );
    }
  }

  return stats;
}

export async function getQueueStats(): Promise<QueueStats> {
  const entries = await Promise.all(
    observableQueues.map(async ({ name, queue }) => {
      const counts = await queue.getJobCounts(...QUEUE_COUNT_TYPES);
      return [name, formatQueueStats(name, counts)] as const;
    }),
  );

  return Object.fromEntries(entries) as QueueStats;
}

export async function writeWorkerHeartbeat() {
  const ready = isRedisReady() || (await ensureRedisReady("worker-heartbeat"));
  if (!ready) {
    if (shouldLogAlert("worker-heartbeat:redis-not-ready", 30_000)) {
      logger.warn(
        { redisStatus: redisConnection.status },
        "WORKER_HEARTBEAT_REDIS_NOT_READY",
      );
    }
    return;
  }

  const payload = buildWorkerHeartbeatPayload();
  await redisConnection.set(
    WORKER_HEARTBEAT_KEY,
    JSON.stringify(payload),
    "EX",
    getWorkerHeartbeatTtlSeconds(),
  );
}

export function startWorkerHeartbeat() {
  if (heartbeatTimer) return;
  void writeWorkerHeartbeat().catch((err) => {
    logger.warn({ err }, "WORKER_HEARTBEAT_WRITE_FAILED");
  });
  heartbeatTimer = setInterval(() => {
    void writeWorkerHeartbeat().catch((err) => {
      logger.warn({ err }, "WORKER_HEARTBEAT_WRITE_FAILED");
    });
  }, WORKER_HEARTBEAT_INTERVAL_MS);
  heartbeatTimer.unref?.();
}

export async function getWorkerHealthStatus(): Promise<WorkerHealthStatus> {
  const ready = isRedisReady() || (await ensureRedisReady("health-worker"));
  const queueStats = ready ? await getQueueStats() : emptyQueueStats();
  const rawHeartbeat = ready
    ? await redisConnection.get(WORKER_HEARTBEAT_KEY)
    : null;
  const parsed = parseWorkerHeartbeat(rawHeartbeat);
  const warnings: string[] = [];

  if (!parsed.workerAlive) {
    warnings.push("worker_heartbeat_absent_or_expired");
    if (shouldLogAlert("incident:heartbeat_missing", 60_000)) {
      void recordIncident({
        type: "heartbeat_missing",
        severity: "critical",
        message: `Worker heartbeat absent or expired (age: ${parsed.ageSeconds || 0}s, status: ${redisConnection.status})`,
      });
    }
    if (shouldLogAlert("worker-health:heartbeat-absent")) {
      logger.warn(
        {
          lastHeartbeat: parsed.lastHeartbeat,
          ageSeconds: parsed.ageSeconds,
          redisStatus: redisConnection.status,
        },
        "WORKER_HEARTBEAT_ABSENT",
      );
    }
  }

  for (const [queue, stats] of Object.entries(queueStats)) {
    if (stats.failed >= getWorkerFailedWarningThreshold()) warnings.push(`${queue}_failed_jobs_present`);
    if (stats.waiting + stats.delayed > getQueueBacklogWarningThreshold()) {
      warnings.push(`${queue}_backlog_high`);
    }
  }

  return {
    ...parsed,
    queueStats,
    redisStatus: redisConnection.status,
    warnings,
  };
}

export function emptyQueueStats(): QueueStats {
  return {
    [NUTRI_QUEUE_NAME]: formatQueueStats(NUTRI_QUEUE_NAME, {}),
    [BI_QUEUE_NAME]: formatQueueStats(BI_QUEUE_NAME, {}),
  };
}

export function extractRequestId(job: Job | null | undefined) {
  const data = job?.data;
  if (!data || typeof data !== "object") return undefined;
  const requestId = (data as { requestId?: unknown }).requestId;
  return typeof requestId === "string" ? requestId : undefined;
}

async function getJobForEvent(queue: Queue, jobId: string) {
  try {
    return await queue.getJob(jobId);
  } catch (err) {
    logger.warn({ err, queue: queue.name, jobId }, "WORKER_JOB_FETCH_FAILED");
    return null;
  }
}

async function recordFailedJobAudit(input: {
  queue: QueueName;
  jobId: string;
  jobName?: string;
  error: string;
  attemptsMade?: number;
  requestId?: string;
}) {
  await AuditLogService.recordError({
    module: "worker",
    source: "bullmq",
    error: new Error(input.error),
    requestId: input.requestId,
    severity: "critical",
    metadata: {
      queue: input.queue,
      jobId: input.jobId,
      jobName: input.jobName,
      attemptsMade: input.attemptsMade,
    },
  });
}

function bindQueueEventHandlers(queueName: QueueName, queue: Queue) {
  const events = new QueueEvents(queueName, {
    connection: redisConnection as unknown as ConnectionOptions,
  });

  events.on("completed", async ({ jobId }) => {
    const job = await getJobForEvent(queue, jobId);
    logger.info(
      {
        queue: queueName,
        jobId,
        jobName: job?.name,
        attemptsMade: job?.attemptsMade,
        requestId: extractRequestId(job),
      },
      "WORKER_JOB_COMPLETED",
    );
  });

  events.on("failed", async ({ jobId, failedReason }) => {
    const job = await getJobForEvent(queue, jobId);
    const requestId = extractRequestId(job);
    const eventPayload = {
      queue: queueName,
      jobId,
      jobName: job?.name,
      error: failedReason,
      attemptsMade: job?.attemptsMade,
      requestId,
    };
    logger.error(eventPayload, "WORKER_JOB_FAILED");
    await recordFailedJobAudit(eventPayload);
    await recordIncident({
      type: "failed",
      queue: queueName,
      jobId,
      jobName: job?.name,
      severity: "critical",
      message: failedReason || "Job failed",
      failedReason: failedReason || undefined,
      requestId,
      attemptsMade: job?.attemptsMade,
    });
  });

  events.on("stalled", async ({ jobId }) => {
    const job = await getJobForEvent(queue, jobId);
    const requestId = extractRequestId(job);
    logger.warn(
      {
        queue: queueName,
        jobId,
        jobName: job?.name,
        attemptsMade: job?.attemptsMade,
        requestId,
      },
      "WORKER_JOB_STALLED",
    );
    await recordIncident({
      type: "stalled",
      queue: queueName,
      jobId,
      jobName: job?.name,
      severity: "warning",
      message: "Job stalled",
      requestId,
      attemptsMade: job?.attemptsMade,
    });
  });

  events.on("error", (err) => {
    logger.error({ queue: queueName, err }, "WORKER_QUEUE_EVENTS_ERROR");
    void recordIncident({
      type: "worker_error",
      queue: queueName,
      severity: "critical",
      message: err.message,
    });
  });

  return events;
}

export function startWorkerQueueObservability() {
  if (queueEventsStarted) return;
  queueEventsStarted = true;
  queueEvents = observableQueues.map(({ name, queue }) =>
    bindQueueEventHandlers(name, queue),
  );

  logger.info(
    { queues: observableQueues.map(({ name }) => name) },
    "WORKER_QUEUE_OBSERVABILITY_STARTED",
  );
}

export async function stopWorkerObservabilityForTests() {
  if (heartbeatTimer) {
    clearInterval(heartbeatTimer);
    heartbeatTimer = null;
  }
  await Promise.all(queueEvents.map((events) => events.close()));
  queueEvents = [];
  queueEventsStarted = false;
  lastAlertAt = new Map<string, number>();
}
