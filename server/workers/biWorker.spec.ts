import { describe, it, expect, vi, beforeEach } from "vitest";

// Mocks hoisted para o Drizzle
const dbMock = vi.hoisted(() => {
  const select = vi.fn();
  const deleteFn = vi.fn();
  const insert = vi.fn();
  return { select, delete: deleteFn, insert };
});

vi.mock("../db.js", () => ({
  getDb: vi.fn(async () => dbMock),
}));

vi.mock("../logger.js", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

import { processAnalyticsJob } from "./biWorker.js";

describe("biWorker processAnalyticsJob", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("excludes refunded orders by deleting their facts and skipping execution", async () => {
    const mockOrder = {
      id: "ord-12345",
      createdAt: new Date("2026-05-29T12:00:00Z"),
      paymentStatus: "refunded",
    };

    const fromMock = {
      where: vi.fn().mockImplementation(() => ({
        then: (resolve: any) => resolve([mockOrder])
      }))
    };

    dbMock.select.mockImplementation(() => ({
      from: vi.fn().mockReturnValue(fromMock)
    }));

    dbMock.delete.mockImplementation(() => ({
      where: vi.fn().mockResolvedValue(true)
    }));

    const mockJob = {
      data: {
        orderId: "ord-12345",
        requestId: "req-ref",
      },
    } as any;

    await processAnalyticsJob(mockJob);

    // Deve deletar os fatos de BI para o orderId
    expect(dbMock.delete).toHaveBeenCalledTimes(2);
    // Não deve tentar inserir nada novo
    expect(dbMock.insert).not.toHaveBeenCalled();
  });

  it("handles timezone correctly by mapping late-night orders to local Sao_Paulo dateId instead of UTC next day", async () => {
    // 22:30 em Brasília (UTC-3) no dia 28/05/2026 é 01:30 (dia 29/05/2026) em UTC.
    // O biWorker deve gerar dateId = 20260528 (fuso local) e não 20260529 (UTC).
    const mockOrder = {
      id: "ord-999",
      createdAt: new Date("2026-05-29T01:30:00Z"), // 2026-05-29 01:30:00 UTC
      paymentStatus: "paid",
      subtotal: "100.00",
      shippingCost: "15.00",
      totalDiscount: "10.00",
      total: "105.00",
      paymentMethod: "CreditCard",
      discountsSnapshot: "{}",
    };

    const mockItems = [
      {
        id: "item-1",
        orderId: "ord-999",
        dishId: "dish-1",
        dishName: "Prato Teste",
        quantity: 1,
        totalPrice: "105.00",
        options: "{}",
      },
    ];

    let selectCall = 0;
    const fromMock = {
      where: vi.fn().mockImplementation(() => ({
        then: (resolve: any) => {
          selectCall++;
          if (selectCall === 1) return resolve([mockOrder]);
          if (selectCall === 2) return resolve(mockItems);
          return resolve([]);
        }
      }))
    };

    dbMock.select.mockImplementation(() => ({
      from: vi.fn().mockReturnValue(fromMock)
    }));

    dbMock.delete.mockImplementation(() => ({
      where: vi.fn().mockResolvedValue(true)
    }));

    const insertValues: any[] = [];
    dbMock.insert.mockImplementation(() => ({
      values: vi.fn().mockImplementation((val) => {
        insertValues.push(val);
        return {
          then: (resolve: any) => resolve(true)
        };
      })
    }));

    const mockJob = {
      data: {
        orderId: "ord-999",
        requestId: "req-tz",
      },
    } as any;

    await processAnalyticsJob(mockJob);

    // O insertValues deve conter a gravação de biFinancialFacts e biSalesFacts
    expect(insertValues).toHaveLength(2);
    // biFinancialFacts deve possuir o dateId = 20260528 (referente a 28/05 no fuso brasileiro)
    expect(insertValues[0]).toMatchObject({
      dateId: 20260528,
      netTotal: "105.00",
    });
    // biSalesFacts deve possuir o mesmo dateId
    expect(insertValues[1]).toMatchObject({
      dateId: 20260528,
      netRevenue: "105.00",
    });
  });
});
