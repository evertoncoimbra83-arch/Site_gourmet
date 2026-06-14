import { and, asc, gte, inArray, lte } from "drizzle-orm";
import { z } from "zod";
import { orders } from "../../../drizzle/schema";
import { superAdminProcedure, router } from "../../_core/trpc.js";
import { getDb } from "../../db";
import { enqueueBIAnalyticsJob, ensureBIWorkerRunning } from "../../workers/queues/biQueue.js";

export async function syncHistoricalData(
  startDate: string,
  endDate: string,
  _ids?: string[] | undefined,
  requestId?: string
) {
  const db = await getDb();

  console.log(`[BI SYNC] Iniciando varredura: ${startDate} ate ${endDate}`);

  try {
    const rawOrders = await db
      .select()
      .from(orders)
      .where(
        and(
          gte(orders.createdAt, new Date(startDate)),
          lte(orders.createdAt, new Date(endDate)),
          inArray(orders.status, ["completed", "delivered", "shipped"])
        )
      )
      .orderBy(asc(orders.createdAt));

    if (rawOrders.length === 0) {
      console.log("[BI SYNC] Nenhum pedido encontrado no periodo.");
      return { processed: 0 };
    }

    const workerReady = await ensureBIWorkerRunning();
    if (!workerReady) {
      console.warn("[BI SYNC] Redis/worker indisponivel. Pedidos marcados como skipped.");
      return { processed: 0, skipped: rawOrders.length };
    }

    let count = 0;
    let skipped = 0;

    for (const order of rawOrders) {
      try {
        const queued = await enqueueBIAnalyticsJob(order.id, {
          removeOnComplete: true,
          attempts: 2,
          jobId: `sync-${order.id}`,
          priority: 10,
        }, requestId);

        if (queued) count += 1;
        else skipped += 1;
      } catch (err) {
        console.error(`Erro ao enfileirar pedido ${order.id}:`, err);
      }
    }

    console.log(
      `[BI SYNC] Sincronizacao concluida: ${count} enfileirados, ${skipped} ignorados.`,
    );
    return { processed: count, skipped };
  } catch (error) {
    console.error("Erro critico na varredura de BI:", error);
    throw error;
  }
}

export const biSyncRouter = router({
  run: superAdminProcedure
    .input(
      z.object({
        ids: z.array(z.string()).optional(),
        start: z.string(),
        end: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      return syncHistoricalData(input.start, input.end, input.ids, (ctx.req as any)?.requestId);
    }),
});
