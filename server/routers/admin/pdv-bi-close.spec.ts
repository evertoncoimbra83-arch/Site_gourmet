import { beforeEach, describe, expect, it, vi } from "vitest";

const dbMock = vi.hoisted(() => ({
  query: {
    pdvComandas: {
      findFirst: vi.fn(async () => ({
        id: 10,
        status: "aberta",
        totalFinal: "50.00",
      })),
    },
  },
  transaction: vi.fn(async callback => callback(dbMock)),
  delete: vi.fn(() => ({
    where: vi.fn(async () => undefined),
  })),
  insert: vi.fn(() => ({
    values: vi.fn(async () => undefined),
  })),
  update: vi.fn(() => ({
    set: vi.fn(() => ({
      where: vi.fn(async () => undefined),
    })),
  })),
}));

const syncMock = vi.hoisted(() => vi.fn());
const recordMock = vi.hoisted(() => vi.fn());
const recordErrorMock = vi.hoisted(() => vi.fn());

vi.mock("../../db.js", () => ({
  getDb: vi.fn(async () => dbMock),
}));

vi.mock("../../pdv-bi-sync.js", () => ({
  syncPdvComandaToBI: syncMock,
}));

vi.mock("../../services/AuditLogService.js", () => ({
  AuditLogService: {
    record: recordMock,
    recordError: recordErrorMock,
  },
}));

import { pdvRouter } from "./pdv.js";

describe("pdvRouter comandas.fechar BI fallback", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    syncMock.mockRejectedValue(new Error("BI offline"));
  });

  it("falha de BI nao quebra fechamento da comanda", async () => {
    const caller = pdvRouter.createCaller({
      user: { id: "operator-1", role: "admin" },
      session: { id: "session-1" },
      req: { ip: "127.0.0.1", headers: {} },
      res: {},
      db: dbMock,
    } as any);

    const result = await caller.comandas.fechar({
      comandaId: 10,
      pagamentos: [{ forma: "pix", valor: 50 }],
    });

    expect(result.success).toBe(true);
    expect(result.biSync).toMatchObject({
      status: "failed",
      message: "BI offline",
    });
    expect(recordErrorMock).toHaveBeenCalledWith(
      expect.objectContaining({
        module: "pdv",
        procedure: "admin.pdv.comandas.fechar",
      })
    );
  });
});
