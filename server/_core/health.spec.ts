import express from "express";
import { AddressInfo } from "net";
import { afterEach, describe, expect, it } from "vitest";
import { setupHealthRoutes } from "./health.js";
import { requestIdMiddleware } from "./request-id.js";

const servers: Array<{ close: (callback?: (err?: Error) => void) => void }> = [];

async function startApp(deps?: Parameters<typeof setupHealthRoutes>[1]) {
  const app = express();
  app.use(requestIdMiddleware);
  setupHealthRoutes(app, deps);

  const server = app.listen(0);
  servers.push(server);

  await new Promise<void>((resolve) => server.once("listening", resolve));
  const port = (server.address() as AddressInfo).port;

  return `http://127.0.0.1:${port}`;
}

afterEach(async () => {
  await Promise.all(
    servers.splice(0).map(
      (server) =>
        new Promise<void>((resolve, reject) => {
          server.close((err?: Error) => (err ? reject(err) : resolve()));
        }),
    ),
  );
});

describe("health routes", () => {
  it("returns live status without dependency checks", async () => {
    const baseUrl = await startApp({
      checkDatabase: async () => {
        throw new Error("database should not be checked");
      },
      checkRedis: async () => {
        throw new Error("redis should not be checked");
      },
      checkWorker: async () => {
        throw new Error("worker should not be checked");
      },
    });

    const response = await fetch(`${baseUrl}/health/live`);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get("x-request-id")).toBeTruthy();
    expect(body).toEqual({
      status: "alive",
      timestamp: expect.any(String),
    });
  });

  it("returns ready when database and Redis checks pass", async () => {
    const baseUrl = await startApp({
      checkDatabase: async () => undefined,
      checkRedis: async () => undefined,
      checkWorker: async () => ({
        workerAlive: true,
        lastHeartbeat: "2026-05-29T12:00:00.000Z",
        ageSeconds: 10,
        heartbeat: null,
        queueStats: {
          "nutri-prescription-process": {
            waiting: 0,
            active: 0,
            completed: 1,
            failed: 0,
            delayed: 0,
            paused: 0,
          },
          "bi-analytics-queue": {
            waiting: 0,
            active: 0,
            completed: 1,
            failed: 0,
            delayed: 0,
            paused: 0,
          },
        },
        redisStatus: "ready",
        warnings: [],
      }),
    });

    const response = await fetch(`${baseUrl}/health/ready`);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      status: "ready",
      checks: {
        database: "ok",
        redis: "ok",
        worker: "ok",
      },
      timestamp: expect.any(String),
    });
    expect(body).not.toHaveProperty("worker");
  });

  it("keeps ready status degraded when worker heartbeat is absent", async () => {
    const baseUrl = await startApp({
      checkDatabase: async () => undefined,
      checkRedis: async () => undefined,
      checkWorker: async () => ({
        workerAlive: false,
        lastHeartbeat: null,
        ageSeconds: null,
        heartbeat: null,
        queueStats: {
          "nutri-prescription-process": {
            waiting: 0,
            active: 0,
            completed: 0,
            failed: 0,
            delayed: 0,
            paused: 0,
          },
          "bi-analytics-queue": {
            waiting: 0,
            active: 0,
            completed: 0,
            failed: 0,
            delayed: 0,
            paused: 0,
          },
        },
        redisStatus: "ready",
        warnings: ["worker_heartbeat_absent_or_expired"],
      }),
    });

    const response = await fetch(`${baseUrl}/health/ready`);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.status).toBe("degraded");
    expect(body.checks.worker).toBe("degraded");
    expect(body).not.toHaveProperty("worker");
  });

  it("returns unhealthy worker endpoint when heartbeat is absent", async () => {
    const baseUrl = await startApp({
      checkDatabase: async () => undefined,
      checkRedis: async () => undefined,
      checkWorker: async () => ({
        workerAlive: false,
        lastHeartbeat: null,
        ageSeconds: null,
        heartbeat: null,
        queueStats: {
          "nutri-prescription-process": {
            waiting: 0,
            active: 0,
            completed: 0,
            failed: 0,
            delayed: 0,
            paused: 0,
          },
          "bi-analytics-queue": {
            waiting: 0,
            active: 0,
            completed: 0,
            failed: 0,
            delayed: 0,
            paused: 0,
          },
        },
        redisStatus: "ready",
        warnings: ["worker_heartbeat_absent_or_expired"],
      }),
    });

    const response = await fetch(`${baseUrl}/health/worker`);
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body.status).toBe("unhealthy");
    expect(body).toEqual({
      status: "unhealthy",
      checks: {
        worker: "degraded",
      },
      timestamp: expect.any(String),
    });
  });

  it("returns not_ready without leaking raw dependency errors", async () => {
    const baseUrl = await startApp({
      checkDatabase: async () => {
        throw new Error("DATABASE_URL=mysql://user:secret@db.internal:3306/app");
      },
      checkRedis: async () => undefined,
      checkWorker: async () => {
        throw new Error("worker should not be checked without ready deps");
      },
    });

    const response = await fetch(`${baseUrl}/health/ready`);
    const text = await response.text();
    const body = JSON.parse(text);

    expect(response.status).toBe(503);
    expect(body).toEqual({
      status: "not_ready",
      checks: {
        database: "error",
        redis: "ok",
        worker: "degraded",
      },
      timestamp: expect.any(String),
    });
    expect(text).not.toContain("DATABASE_URL");
    expect(text).not.toContain("secret");
    expect(text).not.toContain("stack");
    expect(text).not.toContain("db.internal");
    expect(text).not.toContain("hostname");
    expect(text).not.toContain("pid");
    expect(text).not.toContain("build");
    expect(text).not.toContain("commit");
  });

  it("keeps incoming x-request-id on health responses", async () => {
    const baseUrl = await startApp({
      checkDatabase: async () => undefined,
      checkRedis: async () => undefined,
      checkWorker: async () => ({
        workerAlive: true,
        lastHeartbeat: "2026-05-29T12:00:00.000Z",
        ageSeconds: 10,
        heartbeat: null,
        queueStats: {
          "nutri-prescription-process": {
            waiting: 0,
            active: 0,
            completed: 0,
            failed: 0,
            delayed: 0,
            paused: 0,
          },
          "bi-analytics-queue": {
            waiting: 0,
            active: 0,
            completed: 0,
            failed: 0,
            delayed: 0,
            paused: 0,
          },
        },
        redisStatus: "ready",
        warnings: [],
      }),
    });

    const response = await fetch(`${baseUrl}/health/live`, {
      headers: { "x-request-id": "req-health-test" },
    });

    expect(response.headers.get("x-request-id")).toBe("req-health-test");
  });
});
