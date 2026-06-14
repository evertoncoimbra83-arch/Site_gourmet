import { describe, it, expect, vi, beforeEach } from "vitest";

const dbMock = vi.hoisted(() => {
  const execute = vi.fn();
  const select = vi.fn();
  return { execute, select };
});

vi.mock("../../db.js", () => ({
  getDb: vi.fn(async () => dbMock),
}));

vi.mock("../../encryption.js", async (importOriginal) => {
  const actual = await importOriginal() as any;
  return {
    ...actual,
    decrypt: vi.fn((val) => val),
  };
});

import { adminCampaignsRouter } from "./campaigns.js";

describe("adminCampaignsRouter", () => {
  const ctx = {
    user: { id: "admin-1", role: "super_admin" },
    session: { id: "sess-1" },
    req: { ip: "127.0.0.1", headers: {} },
    res: {},
  } as any;

  beforeEach(() => {
    vi.restoreAllMocks();
    dbMock.execute.mockReset();
    dbMock.select.mockReset();
  });

  it("should return empty summary structure when there are no coupons and no orders", async () => {
    dbMock.select.mockReturnValue({
      from: vi.fn().mockResolvedValue([]),
    });
    dbMock.execute.mockResolvedValue([[]]);

    const caller = adminCampaignsRouter.createCaller(ctx);
    const summary = await caller.summary();

    expect(summary.totals.couponsGenerated).toBe(0);
    expect(summary.totals.couponsUsed).toBe(0);
    expect(summary.totals.revenueGenerated).toBe(0);
    expect(summary.totals.conversionRate).toBe(0);
    expect(summary.totals.avgTicket).toBe(0);
    expect(summary.totals.roi).toBe(0);
    expect(summary.totals.activeCampaigns).toBe(0);

    expect(summary.campanhas).toHaveLength(5);
    const bf = summary.campanhas.find(c => c.name === "BLACK_FRIDAY")!;
    expect(bf.couponsGenerated).toBe(0);
    expect(bf.couponsUsed).toBe(0);
  });

  it("should classify campaigns by JSON metadata, keywords and code prefix", async () => {
    const mockCoupons = [
      { id: "1", code: "VOLTA-12345", description: JSON.stringify({ userId: "u1", type: "reactivation" }), isActive: true }, 
      { id: "2", code: "BF50", description: JSON.stringify({ campaign: "BLACK_FRIDAY" }), isActive: true }, 
      { id: "3", code: "NIVER10", description: "Cupom especial de aniversário", isActive: true }, 
      { id: "4", code: "BOASVINDAS", description: "Primeira compra dos clientes novos", isActive: true }, 
      { id: "5", code: "SPRING20", description: "Cupom sazonal de primavera", isActive: true }, 
    ];

    dbMock.select.mockReturnValue({
      from: vi.fn().mockResolvedValue(mockCoupons),
    });

    dbMock.execute.mockResolvedValue([[]]);

    const caller = adminCampaignsRouter.createCaller(ctx);
    const summary = await caller.summary();

    expect(summary.totals.couponsGenerated).toBe(5);

    const c1 = summary.campanhas.find(c => c.name === "REATIVAÇÃO_VIP")!;
    expect(c1.couponsGenerated).toBe(1);

    const c2 = summary.campanhas.find(c => c.name === "BLACK_FRIDAY")!;
    expect(c2.couponsGenerated).toBe(1);

    const c3 = summary.campanhas.find(c => c.name === "ANIVERSARIO")!;
    expect(c3.couponsGenerated).toBe(1);

    const c4 = summary.campanhas.find(c => c.name === "CLIENTE_NOVO")!;
    expect(c4.couponsGenerated).toBe(1);

    const c5 = summary.campanhas.find(c => c.name === "SAZONAL")!;
    expect(c5.couponsGenerated).toBe(1);
  });

  it("should group order usage and calculate faturamento, ticket average, conversion rate and ROI", async () => {
    const mockCoupons = [
      { id: "1", code: "VOLTA-123", description: JSON.stringify({ userId: "u1", type: "reactivation" }), isActive: true }, 
      { id: "2", code: "BF100", description: JSON.stringify({ campaign: "BLACK_FRIDAY" }), isActive: true }, 
    ];

    dbMock.select.mockReturnValue({
      from: vi.fn().mockResolvedValue(mockCoupons),
    });

    const mockOrders = [
      {
        id: "O-1",
        userId: "u-1",
        total: "150.00",
        totalDiscount: "15.00",
        discountsSnapshot: JSON.stringify({ couponCode: "VOLTA-123", totals: {} }),
        createdAt: new Date().toISOString(),
        customerName: "Client A",
        email: "clienta@test.com"
      },
      {
        id: "O-2",
        userId: "u-2",
        total: "400.00",
        totalDiscount: "100.00",
        discountsSnapshot: JSON.stringify({ couponCode: "BF100", totals: {} }),
        createdAt: new Date().toISOString(),
        customerName: "Client B",
        email: "clientb@test.com"
      },
      {
        id: "O-3",
        userId: "u-2",
        total: "600.00",
        totalDiscount: "100.00",
        discountsSnapshot: JSON.stringify({ couponCode: "BF100", totals: {} }),
        createdAt: new Date().toISOString(),
        customerName: "Client B",
        email: "clientb@test.com"
      }
    ];

    dbMock.execute.mockResolvedValue([mockOrders]);

    const caller = adminCampaignsRouter.createCaller(ctx);
    
    const summary = await caller.summary();
    expect(summary.totals.couponsGenerated).toBe(2);
    expect(summary.totals.couponsUsed).toBe(3);
    expect(summary.totals.revenueGenerated).toBe(1150); 
    expect(summary.totals.conversionRate).toBe(150); 
    expect(summary.totals.avgTicket).toBe(383.33); 
    expect(summary.totals.roi).toBe(383.33);
    expect(summary.totals.clientsImpacted).toBe(2); 

    const bf = summary.campanhas.find(c => c.name === "BLACK_FRIDAY")!;
    expect(bf.couponsUsed).toBe(2);
    expect(bf.revenueGenerated).toBe(1000); 
    expect(bf.avgTicket).toBe(500);
    expect(bf.roi).toBe(500);

    const vip = summary.campanhas.find(c => c.name === "REATIVAÇÃO_VIP")!;
    expect(vip.couponsUsed).toBe(1);
    expect(vip.revenueGenerated).toBe(150);
    expect(vip.avgTicket).toBe(150);
    expect(vip.roi).toBe(150);

    const react = await caller.reactivation();
    expect(react.cuponsGerados).toBe(1);
    expect(react.cuponsUtilizados).toBe(1);
    expect(react.clientesRetornaram).toBe(1);
    expect(react.receitaRecuperada).toBe(150);
    expect(react.ticketMedio).toBe(150);
    expect(react.roi).toBe(150);
    expect(react.list).toHaveLength(1);
    expect(react.list[0].code).toBe("VOLTA-123");
    expect(react.list[0].clientName).toBe("Client A");
    expect(react.list[0].orderTotal).toBe(150);
    expect(react.list[0].discountAmount).toBe(15);
  });

  it("should process coupon_usage and fallback to discountsSnapshot without duplicating metric counts", async () => {
    const mockCoupons = [
      { id: "1", code: "VOLTA-123", description: JSON.stringify({ userId: "u1", type: "reactivation" }), isActive: true }, 
      { id: "2", code: "BF100", description: JSON.stringify({ campaign: "BLACK_FRIDAY" }), isActive: true }, 
    ];

    dbMock.select.mockReturnValue({
      from: vi.fn().mockResolvedValue(mockCoupons),
    });

    dbMock.execute.mockImplementation(async (queryObj: any) => {
      const sqlStr = queryObj.sql || "";
      if (sqlStr.includes("coupon_usage")) {
        return [[
          {
            orderId: "O-USAGE-1",
            userId: "u-usage-1",
            usedAt: new Date().toISOString(),
            couponId: "1",
            couponCode: "VOLTA-123",
            couponDescription: null,
            total: "200.00",
            totalDiscount: "20.00",
            customerName: "Client Usage",
            email: "clientusage@test.com"
          }
        ]];
      } else {
        return [[
          {
            orderId: "O-USAGE-1",
            userId: "u-usage-1",
            total: "200.00",
            totalDiscount: "20.00",
            discountsSnapshot: JSON.stringify({ couponCode: "VOLTA-123", totals: {} }),
            createdAt: new Date().toISOString(),
            customerName: "Client Usage",
            email: "clientusage@test.com"
          },
          {
            orderId: "O-FALLBACK-2",
            userId: "u-fallback-2",
            total: "300.00",
            totalDiscount: "30.00",
            discountsSnapshot: JSON.stringify({ couponCode: "BF100", totals: {} }),
            createdAt: new Date().toISOString(),
            customerName: "Client Fallback",
            email: "clientfallback@test.com"
          }
        ]];
      }
    });

    const caller = adminCampaignsRouter.createCaller(ctx);
    const summary = await caller.summary();

    // Verification:
    // Total used should be 2 (O-USAGE-1 and O-FALLBACK-2). O-USAGE-1 should not be counted twice.
    expect(summary.totals.couponsUsed).toBe(2);
    expect(summary.totals.revenueGenerated).toBe(500); // 200 + 300
    expect(summary.totals.clientsImpacted).toBe(2);

    const bf = summary.campanhas.find(c => c.name === "BLACK_FRIDAY")!;
    expect(bf.couponsUsed).toBe(1);
    expect(bf.revenueGenerated).toBe(300);

    const vip = summary.campanhas.find(c => c.name === "REATIVAÇÃO_VIP")!;
    expect(vip.couponsUsed).toBe(1);
    expect(vip.revenueGenerated).toBe(200);
  });
});
