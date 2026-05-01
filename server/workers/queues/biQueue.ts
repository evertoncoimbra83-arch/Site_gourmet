import {
  Queue,
  Worker,
  type ConnectionOptions,
  type JobsOptions,
  type Job,
} from "bullmq";
import {
  redisConnection as redis,
  ensureRedisReady,
  isRedisReady,
} from "../../lib/redis.js";
import { getDb } from "../../db.js";
import { eq } from "drizzle-orm";
import * as schema from "../../../drizzle/schema/index.js";
import { biSalesFacts, biFinancialFacts } from "../../../drizzle/schema/analytics.js";
import { logger } from "../../logger.js";
import { safeInteger, safeJsonParse, safeNumber } from "../../lib/safe-parse.js";

interface ParsedOptions {
  isPackage?: boolean;
  _type?: string;
  packageName?: string;
  meals?: Array<{
    dishId?: number | string;
    dishName?: string;
    label?: string;
    accompaniments?: Record<string, unknown>[];
    selectedAccompaniments?: Record<string, unknown>[];
  }>;
  selectedAccompaniments?: Record<string, unknown>[];
  accompaniments?: Record<string, unknown>[];
  [key: string]: unknown;
}

interface DiscountsSnapshot {
  couponCode?: string | null;
  paymentMethodName?: string | null;
  totals?: {
    couponDiscount?: number | string;
    loyaltyDiscount?: number | string;
    autoDiscount?: number | string;
    shipping?: number | string;
  };
}

const BI_QUEUE_NAME = "bi-analytics-queue";
const REDIS_WARN_COOLDOWN_MS = 10_000;
const WORKER_RETRY_MS = 5_000;

const connection = redis as unknown as ConnectionOptions;

export const biQueue = new Queue(BI_QUEUE_NAME, {
  connection,
});

let biWorker: Worker | null = null;
let workerBootTimer: NodeJS.Timeout | null = null;
let queueErrorBound = false;
let lastQueueWarnAt = 0;
let lastWorkerWarnAt = 0;

function shouldLog(lastAt: number, cooldownMs: number) {
  return Date.now() - lastAt > cooldownMs;
}

function warnQueue(message: string) {
  if (!shouldLog(lastQueueWarnAt, REDIS_WARN_COOLDOWN_MS)) return;
  lastQueueWarnAt = Date.now();
  logger.warn(`[BI Queue] ${message}`);
}

function warnWorker(message: string) {
  if (!shouldLog(lastWorkerWarnAt, REDIS_WARN_COOLDOWN_MS)) return;
  lastWorkerWarnAt = Date.now();
  logger.warn(`[BI Worker] ${message}`);
}

function scheduleWorkerBootstrap() {
  if (workerBootTimer || biWorker) return;
  workerBootTimer = setTimeout(() => {
    workerBootTimer = null;
    void ensureBIWorkerRunning();
  }, WORKER_RETRY_MS);
}

function getNumericOrderId(orderId: string): number {
  const onlyNumbers = orderId.replace(/\D/g, "");
  if (onlyNumbers.length > 0 && onlyNumbers.length < 10) return safeInteger(onlyNumbers);

  let hash = 0;
  for (let i = 0; i < orderId.length; i++) {
    hash = (hash << 5) - hash + orderId.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

async function processAnalyticsJob(job: Job<{ orderId: string }>) {
  const { orderId } = job.data;
  const db = await getDb();

  logger.info(`[BI Worker] Processing order: ${orderId}`);

  try {
    const [order] = await db
      .select()
      .from(schema.orders)
      .where(eq(schema.orders.id, orderId));

    if (!order) {
      logger.warn(`[BI Worker] Order not found: ${orderId}`);
      return;
    }

    const orderItems = await db
      .select()
      .from(schema.orderItems)
      .where(eq(schema.orderItems.orderId, orderId));

    const biOrderId = getNumericOrderId(order.id);
    const dateObj = order.createdAt ? new Date(order.createdAt) : new Date();
    const dateId = safeInteger(dateObj.toISOString().split("T")[0].replace(/-/g, ""));

    let discountCoupon = "0.00";
    let discountLoyalty = String(order.loyaltyDiscount || "0.00");
    let discountAuto = "0.00";
    let deliveryFee = String(order.shippingCost || "0.00");
    let paymentMethod = order.paymentMethod || "Nao Informado";
    let couponCode: string | null = null;

    const snap = safeJsonParse<DiscountsSnapshot>(order.discountsSnapshot, {});
    if (snap && typeof snap === "object") {
      couponCode = snap.couponCode || null;
      paymentMethod = snap.paymentMethodName || paymentMethod;

      if (snap.totals) {
        discountCoupon = String(snap.totals.couponDiscount || "0.00");
        discountLoyalty = String(snap.totals.loyaltyDiscount || "0.00");
        discountAuto = String(snap.totals.autoDiscount || "0.00");
        deliveryFee = String(snap.totals.shipping || deliveryFee);
      }
    }

    await db.delete(biFinancialFacts).where(eq(biFinancialFacts.orderId, biOrderId));
    await db.insert(biFinancialFacts).values({
      orderId: biOrderId,
      paymentMethod,
      grossTotal: String(order.subtotal || "0.00"),
      deliveryFee,
      discountCoupon,
      discountLoyalty,
      discountAuto,
      netTotal: String(order.total || "0.00"),
      couponCode,
      dateId,
    });

    await db.delete(biSalesFacts).where(eq(biSalesFacts.orderId, biOrderId));

    for (const item of orderItems) {
      const options = safeJsonParse<ParsedOptions>(item.options, {});

      if (
        (options?.isPackage || options?._type === "package_custom") &&
        Array.isArray(options.meals) &&
        options.meals.length > 0
      ) {
        for (const meal of options.meals) {
          await db.insert(biSalesFacts).values({
            orderId: biOrderId,
            dishId: safeNumber(meal.dishId),
            combinationHash: `pkg_${options.packageName || "custom"}_dish_${meal.dishId || 0}`,
            itemsDetail: [
              {
                name: meal.dishName || meal.label || "Marmita do Pacote",
                accompaniments:
                  meal.accompaniments || meal.selectedAccompaniments || [],
              },
            ],
            quantity: safeNumber(item.quantity, 1),
            netRevenue: String(
              (safeNumber(item.totalPrice) / options.meals.length).toFixed(2),
            ),
            dateId,
          });
        }
      } else {
        await db.insert(biSalesFacts).values({
          orderId: biOrderId,
          dishId: safeNumber(item.dishId),
          combinationHash: `dish_${item.dishId || 0}`,
          itemsDetail: [
            {
              name: item.dishName || "Prato Avulso",
              accompaniments:
                options?.selectedAccompaniments || options?.accompaniments || [],
            },
          ],
          quantity: safeNumber(item.quantity, 1),
          netRevenue: String(item.totalPrice || "0.00"),
          dateId,
        });
      }
    }

    logger.info(`[BI Worker] Processed successfully: ${orderId}`);
  } catch (fatalError: unknown) {
    const err = fatalError as Error;
    logger.error({ err }, `[BI Worker] Fatal processing error for ${orderId}: ${err.message}`);
    throw fatalError;
  }
}

export async function ensureBIWorkerRunning(): Promise<boolean> {
  if (biWorker) return true;

  const ready = isRedisReady() || (await ensureRedisReady("bi-worker-bootstrap"));
  if (!ready) {
    warnWorker(`Redis not ready. Worker bootstrap postponed. status=${redis.status}`);
    scheduleWorkerBootstrap();
    return false;
  }

  if (!queueErrorBound) {
    queueErrorBound = true;
    biQueue.on("error", (err: Error) => {
      warnQueue(`Redis error: ${err.message}`);
    });
  }

  biWorker = new Worker(BI_QUEUE_NAME, processAnalyticsJob, {
    connection,
  });

  biWorker.on("error", (err: Error) => {
    warnWorker(`Redis error: ${err.message}`);
  });

  logger.info("[BI Worker] Worker online and waiting for jobs.");
  return true;
}

export async function enqueueBIAnalyticsJob(
  orderId: string,
  options?: JobsOptions,
): Promise<boolean> {
  const ready = isRedisReady() || (await ensureRedisReady("bi-queue-enqueue"));
  if (!ready) {
    warnQueue(
      `Redis not ready. BI job skipped for order ${orderId}. status=${redis.status}`,
    );
    scheduleWorkerBootstrap();
    return false;
  }

  await ensureBIWorkerRunning();

  try {
    await biQueue.add("process-analytics", { orderId }, options);
    return true;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    warnQueue(`Failed to enqueue order ${orderId}: ${message}`);
    return false;
  }
}

void ensureBIWorkerRunning();
