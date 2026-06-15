import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  buildWorkerHeartbeatPayload,
  formatQueueStats,
  parseWorkerHeartbeat,
  extractRequestId,
  recordIncident,
} from "./observability.js";
import { workerRouter } from "../routers/admin/worker.js";
import { redisConnection } from "../lib/redis.js";
import * as redisModule from "../lib/redis.js";

describe("worker observability", () => {
  it("builds heartbeat payload with runtime worker metadata", () => {
    const payload = buildWorkerHeartbeatPayload();

    expect(payload).toMatchObject({
      timestamp: expect.any(String),
      pid: process.pid,
      hostname: expect.any(String),
      queues: ["nutri-prescription-process", "bi-analytics-queue"],
      version: expect.any(String),
    });
    expect(payload).toHaveProperty("build");
    expect(Date.parse(payload.timestamp)).not.toBeNaN();
  });

  it("parses recent heartbeat as alive", () => {
    const nowMs = Date.parse("2026-05-29T12:00:30.000Z");
    const raw = JSON.stringify({
      timestamp: "2026-05-29T12:00:00.000Z",
      pid: 123,
      hostname: "worker-1",
      queues: ["nutri-prescription-process", "bi-analytics-queue"],
      version: "1.0.0",
      build: null,
    });

    expect(parseWorkerHeartbeat(raw, nowMs)).toEqual({
      workerAlive: true,
      lastHeartbeat: "2026-05-29T12:00:00.000Z",
      ageSeconds: 30,
      heartbeat: {
        timestamp: "2026-05-29T12:00:00.000Z",
        pid: 123,
        hostname: "worker-1",
        queues: ["nutri-prescription-process", "bi-analytics-queue"],
        version: "1.0.0",
        build: null,
      },
    });
  });

  it("parses expired or missing heartbeat as dead", () => {
    const nowMs = Date.parse("2026-05-29T12:02:00.000Z");
    const expired = JSON.stringify({
      timestamp: "2026-05-29T12:00:00.000Z",
      pid: 123,
      hostname: "worker-1",
      queues: ["nutri-prescription-process", "bi-analytics-queue"],
      version: "1.0.0",
      build: null,
    });

    expect(parseWorkerHeartbeat(expired, nowMs).workerAlive).toBe(false);
    expect(parseWorkerHeartbeat(null, nowMs)).toEqual({
      workerAlive: false,
      lastHeartbeat: null,
      ageSeconds: null,
      heartbeat: null,
    });
  });

  it("formats queue stats with missing counts as zero", () => {
    expect(
      formatQueueStats("nutri-prescription-process", {
        waiting: 2,
        active: 1,
        completed: 10,
      }),
    ).toEqual({
      waiting: 2,
      active: 1,
      completed: 10,
      failed: 0,
      delayed: 0,
      paused: 0,
    });
  });

  describe("extractRequestId", () => {
    it("extracts requestId when present in job data", () => {
      const mockJob = {
        data: {
          requestId: "req-12345",
        },
      } as any;
      expect(extractRequestId(mockJob)).toBe("req-12345");
    });

    it("returns undefined when requestId is absent", () => {
      const mockJob = {
        data: {},
      } as any;
      expect(extractRequestId(mockJob)).toBeUndefined();
    });

    it("returns undefined when job is null/undefined", () => {
      expect(extractRequestId(null)).toBeUndefined();
      expect(extractRequestId(undefined)).toBeUndefined();
    });
  });

  describe("recordIncident", () => {
    beforeEach(() => {
      vi.restoreAllMocks();
    });

    it("records incident to redis and caps list length", async () => {
      const lpushSpy = vi.spyOn(redisConnection, "lpush").mockResolvedValue(1 as any);
      const ltrimSpy = vi.spyOn(redisConnection, "ltrim").mockResolvedValue("OK" as any);
      const isReadySpy = vi.spyOn(redisModule, "isRedisReady").mockReturnValue(true);

      await recordIncident({
        type: "failed",
        queue: "test-queue",
        jobId: "123",
        jobName: "test-job",
        severity: "critical",
        message: "Test failure message",
        failedReason: "Something broke",
        requestId: "test-req-id",
        attemptsMade: 1,
      });

      expect(isReadySpy).toHaveBeenCalled();
      expect(lpushSpy).toHaveBeenCalledWith(
        "gourmet:worker:incidents",
        expect.stringContaining('"type":"failed"'),
      );
      expect(lpushSpy).toHaveBeenCalledWith(
        "gourmet:worker:incidents",
        expect.stringContaining('"requestId":"test-req-id"'),
      );
      expect(ltrimSpy).toHaveBeenCalledWith("gourmet:worker:incidents", 0, 99);
    });
  });

  describe("workerRouter incidents endpoint", () => {
    it("returns list of incidents from redis and sanitizes format", async () => {
      const mockIncidents = [
        JSON.stringify({
          type: "failed",
          timestamp: "2026-05-29T12:00:00.000Z",
          queue: "test-queue",
          jobId: "123",
          jobName: "test-job",
          severity: "critical",
          message: "Job failed",
          failedReason: "Error",
          requestId: "req-1",
          attemptsMade: 3,
          extraField: "should-be-removed",
        }),
      ];

      const lrangeSpy = vi.spyOn(redisConnection, "lrange").mockResolvedValue(mockIncidents);
      vi.spyOn(redisModule, "isRedisReady").mockReturnValue(true);

      const ctx = {
        user: { id: "admin-1", role: "super_admin" },
        session: { id: "sess-1" },
        req: { ip: "127.0.0.1", headers: {} },
        res: {},
      } as any;

      const caller = workerRouter.createCaller(ctx);
      const incidents = await caller.incidents();

      expect(lrangeSpy).toHaveBeenCalledWith("gourmet:worker:incidents", 0, 49);
      expect(incidents).toHaveLength(1);
      expect(incidents[0]).toEqual({
        type: "failed",
        timestamp: "2026-05-29T12:00:00.000Z",
        queue: "test-queue",
        jobId: "123",
        jobName: "test-job",
        severity: "critical",
        message: "Job failed",
        failedReason: "Error",
        requestId: "req-1",
        attemptsMade: 3,
      });
      expect(incidents[0]).not.toHaveProperty("extraField");
    });
  });
});
