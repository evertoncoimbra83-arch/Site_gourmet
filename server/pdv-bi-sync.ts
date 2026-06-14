import { and, asc, eq, gte, sql } from "drizzle-orm";
import {
  biFinancialFacts,
  biSalesFacts,
  pdvComandaItens,
  pdvComandas,
  pdvPagamentos,
} from "../drizzle/schema/index.js";
import { getDb } from "./db.js";
import { safeInteger, safeNumber } from "./lib/safe-parse.js";
import { logger } from "./logger.js";

export const PDV_BI_ORDER_ID_OFFSET = 10000000;
export const PDV_BI_USER_ID = "pdv_salao_offline";
export const PDV_BI_STATUS = "completed";

type DbType = Awaited<ReturnType<typeof getDb>>;

export interface PdvBiSyncResult {
  comandaId: number;
  orderIdBi: number;
  status: "synced" | "skipped";
  reason?: "not_found" | "not_closed";
  financialFacts: number;
  salesFacts: number;
  collisionRisk: boolean;
}

function money(value: unknown): string {
  return safeNumber(value).toFixed(2);
}

export function getPdvBiOrderId(comandaId: number): number {
  return PDV_BI_ORDER_ID_OFFSET + safeInteger(comandaId, 0);
}

function getDateId(date: Date): number {
  const formatter = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  return safeInteger(formatter.format(date).replace(/-/g, ""));
}

function mapPaymentMethod(
  pagamentos: Array<{ forma: string; formaDescricao?: string | null }>,
): string {
  if (pagamentos.length === 0) return "Nao Informado";
  if (pagamentos.length === 1) {
    const pagamento = pagamentos[0];
    return pagamento.formaDescricao || pagamento.forma;
  }

  const forms = Array.from(
    new Set(
      pagamentos.map((pagamento) => pagamento.formaDescricao || pagamento.forma),
    ),
  );
  return `mixed:${forms.join("+")}`.slice(0, 50);
}

export async function validatePdvBiOffsetCollision(
  db: DbType,
): Promise<boolean> {
  const rows = await db
    .select({ orderId: biFinancialFacts.orderId })
    .from(biFinancialFacts)
    .where(gte(biFinancialFacts.orderId, PDV_BI_ORDER_ID_OFFSET))
    .limit(1);

  return rows.length > 0;
}

export async function syncPdvComandaToBI(
  comandaId: number,
): Promise<PdvBiSyncResult> {
  const db = await getDb();
  const orderIdBi = getPdvBiOrderId(comandaId);
  const collisionRisk = await validatePdvBiOffsetCollision(db);

  if (collisionRisk) {
    logger.warn(
      { comandaId, orderIdBi },
      "[PDV BI] Existem fatos BI com order_id dentro da faixa reservada do PDV.",
    );
  }

  const comanda = await db.query.pdvComandas.findFirst({
    where: eq(pdvComandas.id, comandaId),
    with: {
      itens: {
        orderBy: [asc(pdvComandaItens.id)],
      },
      pagamentos: {
        orderBy: [asc(pdvPagamentos.id)],
      },
    },
  });

  if (!comanda) {
    return {
      comandaId,
      orderIdBi,
      status: "skipped",
      reason: "not_found",
      financialFacts: 0,
      salesFacts: 0,
      collisionRisk,
    };
  }

  if (comanda.status !== "fechada") {
    return {
      comandaId,
      orderIdBi,
      status: "skipped",
      reason: "not_closed",
      financialFacts: 0,
      salesFacts: 0,
      collisionRisk,
    };
  }

  const dateId = getDateId(comanda.fechadaEm || comanda.updatedAt || new Date());

  await db.delete(biSalesFacts).where(eq(biSalesFacts.orderId, orderIdBi));
  await db.delete(biFinancialFacts).where(eq(biFinancialFacts.orderId, orderIdBi));

  await db.insert(biFinancialFacts).values({
    orderId: orderIdBi,
    paymentMethod: mapPaymentMethod(comanda.pagamentos),
    couponCode: null,
    grossTotal: money(comanda.totalItens),
    deliveryFee: "0.00",
    discountCoupon: "0.00",
    discountLoyalty: "0.00",
    discountAuto: money(comanda.desconto),
    netTotal: money(comanda.totalFinal),
    dateId,
  });

  let salesFacts = 0;
  if (comanda.itens.length === 0) {
    logger.warn({ comandaId, orderIdBi }, "[PDV BI] Comanda fechada sem itens.");
  }

  for (const item of comanda.itens) {
    await db.insert(biSalesFacts).values({
      orderId: orderIdBi,
      dishId: item.dishId ?? null,
      combinationHash: `pdv_dish_${item.dishId || 0}`,
      itemsDetail: [
        {
          source: "pdv_salao",
          userId: PDV_BI_USER_ID,
          status: PDV_BI_STATUS,
          comandaId,
          itemId: item.id,
          name: item.nome,
          observacao: item.observacao || null,
        },
      ],
      quantity: safeInteger(item.quantidade, 1),
      netRevenue: money(item.subtotal),
      dateId,
    });
    salesFacts++;
  }

  return {
    comandaId,
    orderIdBi,
    status: "synced",
    financialFacts: 1,
    salesFacts,
    collisionRisk,
  };
}

export async function listClosedPdvComandaIds(): Promise<number[]> {
  const db = await getDb();
  const rows = await db
    .select({ id: pdvComandas.id })
    .from(pdvComandas)
    .where(and(eq(pdvComandas.status, "fechada"), sql`${pdvComandas.fechadaEm} IS NOT NULL`))
    .orderBy(asc(pdvComandas.id));

  return rows.map((row) => row.id);
}
