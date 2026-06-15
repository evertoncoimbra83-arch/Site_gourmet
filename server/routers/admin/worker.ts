import { z } from "zod";
import { router, adminProcedure } from "../../_core/trpc.js";
import { redisConnection, isRedisReady, ensureRedisReady } from "../../lib/redis.js";
import {
  getWorkerHealthStatus,
  getWorkerIncidentsLimit,
} from "../../workers/observability.js";

export const workerRouter = router({
  health: adminProcedure.query(async () => {
    return getWorkerHealthStatus();
  }),

  incidents: adminProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(50),
      }).optional()
    )
    .query(async ({ input }) => {
      const limit = input?.limit ?? 50;
      const ready = isRedisReady() || (await ensureRedisReady("worker-incidents-query"));
      if (!ready) {
        return [];
      }

      const rawIncidents = await redisConnection.lrange("gourmet:worker:incidents", 0, limit - 1);

      return rawIncidents.map((raw) => {
        try {
          const parsed = JSON.parse(raw);
          return {
            type: parsed.type,
            timestamp: parsed.timestamp,
            queue: parsed.queue,
            jobId: parsed.jobId,
            jobName: parsed.jobName,
            severity: parsed.severity,
            message: parsed.message,
            failedReason: parsed.failedReason,
            requestId: parsed.requestId,
            attemptsMade: parsed.attemptsMade,
          };
        } catch {
          return null;
        }
      }).filter(Boolean);
    }),
});
