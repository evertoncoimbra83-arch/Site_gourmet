import "dotenv/config";

import { logger } from "../logger.js";
import {
  startWorkerHeartbeat,
  startWorkerQueueObservability,
} from "./observability.js";

async function bootstrapWorkers() {
  logger.info({ event: "WORKER_BOOTSTRAP_START" }, "WORKER_BOOTSTRAP_START");
  process.env.WORKER_PROCESS = "true";

  const [{ nutriWorker }, { ensureBIWorkerRunning }] = await Promise.all([
    import("./nutriWorker.js"),
    import("./biWorker.js"),
  ]);

  await nutriWorker.waitUntilReady();

  const biWorkerReady = await ensureBIWorkerRunning();
  if (!biWorkerReady) {
    throw new Error("BI worker bootstrap failed: Redis not ready");
  }

  startWorkerHeartbeat();
  startWorkerQueueObservability();

  logger.info(
    { event: "WORKER_BOOTSTRAP_SUCCESS", workers: ["nutri", "bi"] },
    "WORKER_BOOTSTRAP_SUCCESS",
  );
}

if (process.env.WORKER_PROCESS === "true") {
  bootstrapWorkers().catch((err) => {
    logger.error({ event: "WORKER_BOOTSTRAP_ERROR", err }, "WORKER_BOOTSTRAP_ERROR");
    process.exit(1);
  });
}
