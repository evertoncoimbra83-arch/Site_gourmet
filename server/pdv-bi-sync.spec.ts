import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  comanda: null as any,
  collisionRows: [] as Array<{ orderId: number }>,
  closedIds: [] as Array<{ id: number }>,
  inserts: [] as any[],
  deletes: 0,
}));

const dbMock = vi.hoisted(() => ({
  query: {
    pdvComandas: {
      findFirst: vi.fn(async () => state.comanda),
    },
  },
  select: vi.fn(() => ({
    from: vi.fn(() => ({
      where: vi.fn(() => ({
        limit: vi.fn(async () => state.collisionRows),
        orderBy: vi.fn(async () => state.closedIds),
      })),
    })),
  })),
  delete: vi.fn(() => ({
    where: vi.fn(async () => {
      state.deletes++;
    }),
  })),
  insert: vi.fn(() => ({
    values: vi.fn(async (value) => {
      state.inserts.push(value);
    }),
  })),
}));

vi.mock("./db.js", () => ({
  getDb: vi.fn(async () => dbMock),
}));

vi.mock("./logger.js", () => ({
  logger: {
    warn: vi.fn(),
    info: vi.fn(),
    error: vi.fn(),
  },
}));

import {
  getPdvBiOrderId,
  listClosedPdvComandaIds,
  PDV_BI_ORDER_ID_OFFSET,
  syncPdvComandaToBI,
} from "./pdv-bi-sync.js";

describe("pdv-bi-sync", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    state.comanda = null;
    state.collisionRows = [];
    state.closedIds = [];
    state.inserts = [];
    state.deletes = 0;
  });

  it("calcula orderIdBi com offset obrigatorio", () => {
    expect(PDV_BI_ORDER_ID_OFFSET).toBe(10000000);
    expect(getPdvBiOrderId(152)).toBe(10000152);
  });

  it("comanda fechada gera fatos financeiros e de vendas", async () => {
    state.comanda = {
      id: 152,
      status: "fechada",
      totalItens: "120.00",
      desconto: "20.00",
      totalFinal: "100.00",
      fechadaEm: new Date("2026-05-31T15:00:00-03:00"),
      updatedAt: new Date("2026-05-31T15:00:00-03:00"),
      pagamentos: [{ forma: "pix", formaDescricao: null, valor: "100.00" }],
      itens: [
        {
          id: 7,
          dishId: 10,
          nome: "Executivo",
          quantidade: 2,
          subtotal: "100.00",
          observacao: null,
        },
      ],
    };

    const result = await syncPdvComandaToBI(152);

    expect(result).toMatchObject({
      status: "synced",
      orderIdBi: 10000152,
      financialFacts: 1,
      salesFacts: 1,
    });
    expect(state.deletes).toBe(2);
    expect(state.inserts[0]).toMatchObject({
      orderId: 10000152,
      paymentMethod: "pix",
      grossTotal: "120.00",
      discountAuto: "20.00",
      netTotal: "100.00",
    });
    expect(state.inserts[1]).toMatchObject({
      orderId: 10000152,
      dishId: 10,
      quantity: 2,
      netRevenue: "100.00",
    });
  });

  it("sincronizacao e idempotente apagando fatos antigos antes de inserir", async () => {
    state.comanda = {
      id: 1,
      status: "fechada",
      totalItens: "10.00",
      desconto: "0.00",
      totalFinal: "10.00",
      fechadaEm: new Date("2026-05-31T12:00:00-03:00"),
      pagamentos: [{ forma: "cartao", valor: "10.00" }],
      itens: [{ id: 1, dishId: null, nome: "Item", quantidade: 1, subtotal: "10.00" }],
    };

    await syncPdvComandaToBI(1);
    await syncPdvComandaToBI(1);

    expect(state.deletes).toBe(4);
    expect(state.inserts).toHaveLength(4);
  });

  it("comanda aberta nao sincroniza", async () => {
    state.comanda = { id: 2, status: "aberta", pagamentos: [], itens: [] };

    const result = await syncPdvComandaToBI(2);

    expect(result).toMatchObject({ status: "skipped", reason: "not_closed" });
    expect(state.inserts).toHaveLength(0);
  });

  it("multiplos pagamentos sao consolidados", async () => {
    state.comanda = {
      id: 3,
      status: "fechada",
      totalItens: "100.00",
      desconto: "0.00",
      totalFinal: "100.00",
      fechadaEm: new Date("2026-05-31T12:00:00-03:00"),
      pagamentos: [
        { forma: "pix", valor: "40.00" },
        { forma: "cartao", formaDescricao: "debito", valor: "60.00" },
      ],
      itens: [{ id: 1, dishId: 5, nome: "Item", quantidade: 1, subtotal: "100.00" }],
    };

    await syncPdvComandaToBI(3);

    expect(state.inserts[0].paymentMethod).toBe("mixed:pix+debito");
  });

  it("script historico lista comandas fechadas", async () => {
    state.closedIds = [{ id: 1 }, { id: 2 }];

    const ids = await listClosedPdvComandaIds();

    expect(ids).toEqual([1, 2]);
  });

  it("alerta risco de colisao sem bloquear", async () => {
    state.collisionRows = [{ orderId: 10000001 }];
    state.comanda = {
      id: 4,
      status: "fechada",
      totalItens: "20.00",
      desconto: "0.00",
      totalFinal: "20.00",
      fechadaEm: new Date("2026-05-31T12:00:00-03:00"),
      pagamentos: [{ forma: "outro", valor: "20.00" }],
      itens: [{ id: 1, dishId: 6, nome: "Item", quantidade: 1, subtotal: "20.00" }],
    };

    const result = await syncPdvComandaToBI(4);

    expect(result.collisionRisk).toBe(true);
    expect(result.status).toBe("synced");
  });
});
