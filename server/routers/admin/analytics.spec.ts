import { describe, it, expect, vi, beforeEach } from "vitest";

// Mocks hoisted para o Drizzle
const dbMock = vi.hoisted(() => {
  const execute = vi.fn();
  const select = vi.fn();
  return { select, execute };
});

vi.mock("../../db.js", () => ({
  getDb: vi.fn(async () => dbMock),
}));

vi.mock("../../logger.js", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

import { adminAnalyticsRouter } from "./analytics.js";

describe("adminAnalyticsRouter", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("calculates KPIs, timeline metrics, and lists rankings correctly on getDashboardStats", async () => {
    // 1. Setup mock para chamadas do db.select() e seus encadeamentos do Drizzle
    const mockFinancialsResult = [
      {
        grossRevenue: "1000.00",
        netRevenue: "850.00",
        coupon: "100.00",
        loyalty: "30.00",
        auto: "20.00",
        totalDiscounts: "150.00",
      },
    ];

    const mockTimelineResult = [
      {
        dateId: 20260529,
        Faturamento: "850.00",
        Pedidos: 10,
        Ticket: "85.00",
        Descontos: "150.00",
      },
    ];

    const mockTopDishesResult = [
      {
        dishId: 1,
        name: "Frango com Batata Doce",
        count: 12,
      },
    ];

    const mockCustomersResult = [{ total: 5 }];
    const mockTotalOrdersResult = [{ count: 10 }];
    const mockNewCustomersByDayResult = [{ dateStr: "20260529", count: 3 }];

    // Mock das resoluções do db.select() subsequentes
    let selectCallCount = 0;
    dbMock.select.mockImplementation(() => {
      const fromMock = {
        where: vi.fn().mockReturnThis(),
        groupBy: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        then: vi.fn((resolve) => {
          selectCallCount++;
          if (selectCallCount === 1) return resolve(mockFinancialsResult);
          if (selectCallCount === 2) return resolve(mockTimelineResult);
          if (selectCallCount === 3) return resolve(mockTopDishesResult);
          if (selectCallCount === 4) return resolve(mockCustomersResult);
          if (selectCallCount === 5) return resolve(mockTotalOrdersResult);
          if (selectCallCount === 6) return resolve(mockNewCustomersByDayResult);
          return resolve([]);
        }),
      };
      return {
        from: vi.fn(() => fromMock),
      };
    });

    // 2. Setup mock para db.execute()
    let executeCallCount = 0;
    dbMock.execute.mockImplementation(async () => {
      executeCallCount++;
      if (executeCallCount === 1) {
        // topAccs
        return [[{ name: "Arroz Integral", count: 8 }]];
      }
      if (executeCallCount === 2) {
        // topCoupons
        return [[{ name: "DESC10", value: 100.00, usage_count: 5 }]];
      }
      if (executeCallCount === 3) {
        // paymentMethods
        return [[{ name: "Cartao", value: 850.00, count: 10 }]];
      }
      return [[]];
    });

    // 3. Execução da Procedure tRPC
    const ctx = {
      user: { id: "admin-1", role: "super_admin" },
      session: { id: "sess-1" },
      req: { ip: "127.0.0.1", headers: {} },
      res: {},
    } as any;

    const caller = adminAnalyticsRouter.createCaller(ctx);
    const stats = await caller.getDashboardStats({ period: "30d" });

    // 4. Verificação de KPIs e dados
    expect(stats.financials).toEqual({
      grossRevenue: 1000,
      netRevenue: 850,
    });
    expect(stats.totalGivenDiscounts).toBe(150);
    expect(stats.avgTicket).toBe(85); // netRevenue (850) / ordersCount (10)
    expect(stats.newCustomers).toBe(5);

    // Verificação da timeline com todas as 5 métricas suportadas na UI
    expect(stats.chartData).toHaveLength(1);
    expect(stats.chartData[0]).toEqual({
      date: "29/05",
      Faturamento: 850,
      Pedidos: 10,
      Ticket: 85,
      Clientes: 3,
      Descontos: 150,
    });

    // Verificação de rankings e listas
    expect(stats.topDishes).toEqual([
      { dishId: 1, name: "Frango com Batata Doce", count: 12 },
    ]);
    expect(stats.topAccompaniments).toEqual([
      { name: "Arroz Integral", count: 8 },
    ]);
    expect(stats.topCoupons).toEqual([
      { coupon: "DESC10", usage_count: 5, total_discounted: 100 },
    ]);
    expect(stats.paymentMethods).toEqual([
      { name: "Cartao", value: 850, count: 10 },
    ]);
  });

  it("resolves date limits correctly for all presets and returns metadata", async () => {
    const mockFinancialsResult = [{ grossRevenue: "100.00", netRevenue: "80.00" }];
    const mockTimelineResult = [{ dateId: 20260529, Faturamento: "80.00", Pedidos: 1, Ticket: "80.00", Descontos: "20.00" }];
    const mockTopDishesResult = [{ dishId: 1, name: "Prato", count: 1 }];
    const mockCustomersResult = [{ total: 1 }];
    const mockTotalOrdersResult = [{ count: 1 }];
    const mockNewCustomersByDayResult = [{ dateStr: "20260529", count: 1 }];

    let selectCallCount = 0;
    dbMock.select.mockImplementation(() => {
      const fromMock = {
        where: vi.fn().mockReturnThis(),
        groupBy: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        then: vi.fn((resolve) => {
          selectCallCount++;
          if (selectCallCount === 1) return resolve(mockFinancialsResult);
          if (selectCallCount === 2) return resolve(mockTimelineResult);
          if (selectCallCount === 3) return resolve(mockTopDishesResult);
          if (selectCallCount === 4) return resolve(mockCustomersResult);
          if (selectCallCount === 5) return resolve(mockTotalOrdersResult);
          if (selectCallCount === 6) return resolve(mockNewCustomersByDayResult);
          return resolve([]);
        }),
      };
      return { from: vi.fn(() => fromMock) };
    });

    dbMock.execute.mockResolvedValue([[]]);

    const ctx = {
      user: { id: "admin-1", role: "super_admin" },
      session: { id: "sess-1" },
      req: { ip: "127.0.0.1", headers: {} },
      res: {},
    } as any;

    const caller = adminAnalyticsRouter.createCaller(ctx);

    // Testar preset today
    const resToday = await caller.getDashboardStats({ preset: "today" });
    expect(resToday.metadata).toBeDefined();
    expect(resToday.metadata?.periodLabel).toBe("Hoje");

    // Testar preset current_month
    selectCallCount = 0;
    const resMonth = await caller.getDashboardStats({ preset: "current_month" });
    expect(resMonth.metadata?.periodLabel).toBe("Mês atual");

    // Testar preset custom
    selectCallCount = 0;
    const resCustom = await caller.getDashboardStats({
      preset: "custom",
      startDate: "2026-05-01",
      endDate: "2026-05-15",
    });
    expect(resCustom.metadata?.periodLabel).toBe("Período personalizado");
    expect(resCustom.metadata?.startDate).toBe("2026-05-01");
    expect(resCustom.metadata?.endDate).toBe("2026-05-15");

    // Testar custom com erro de datas vazias
    await expect(
      caller.getDashboardStats({ preset: "custom" })
    ).rejects.toThrow("startDate e endDate são obrigatórios");

    // Testar custom com formato de data inválido
    await expect(
      caller.getDashboardStats({ preset: "custom", startDate: "01/05/2026", endDate: "15/05/2026" })
    ).rejects.toThrow("Formato de data inválido");
  });
});
