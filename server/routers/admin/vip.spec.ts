import { describe, it, expect, vi, beforeEach } from "vitest";

// Hoisted mock for Drizzle
const dbMock = vi.hoisted(() => {
  const execute = vi.fn();
  const select = vi.fn();
  const insert = vi.fn();
  return { execute, select, insert };
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

vi.mock("../../services/AuditLogService.js", () => ({
  AuditLogService: {
    record: vi.fn().mockResolvedValue(true),
  },
}));

import { adminVipRouter } from "./vip.js";
import { TRPCError } from "@trpc/server";

describe("adminVipRouter.summary", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    dbMock.execute.mockReset();
  });

  const ctx = {
    user: { id: "admin-1", role: "super_admin" },
    session: { id: "sess-1" },
    req: { ip: "127.0.0.1", headers: {} },
    res: {},
  } as any;

  it("should classify users into Bronze, Prata, Ouro, Diamante, calculate LTV & ticket averages", async () => {
    const mockDBResult = [
      [
        {
          userId: "u-1",
          email: "bronze@test.com",
          name: "Client Bronze",
          totalOrders: "2",
          totalSpent: "150.00",
          avgTicket: "75.00",
          lastOrderAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() // 5 days ago
        },
        {
          userId: "u-2",
          email: "prata@test.com",
          name: "Client Prata",
          totalOrders: "4",
          totalSpent: "800.00",
          avgTicket: "200.00",
          lastOrderAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString() // 10 days ago
        },
        {
          userId: "u-3",
          email: "ouro@test.com",
          name: "Client Ouro",
          totalOrders: "8",
          totalSpent: "2000.00",
          avgTicket: "250.00",
          lastOrderAt: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString() // 35 days ago (risk!)
        },
        {
          userId: "u-4",
          email: "diamante@test.com",
          name: "Client Diamante",
          totalOrders: "12",
          totalSpent: "5000.00",
          avgTicket: "416.66",
          lastOrderAt: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString() // 40 days ago (risk!)
        }
      ]
    ];

    dbMock.execute.mockResolvedValue(mockDBResult);

    const caller = adminVipRouter.createCaller(ctx);
    const summary = await caller.summary();

    // Verify general counts
    expect(summary.totalClients).toBe(4);
    expect(summary.totalRevenue).toBe(7950);
    expect(summary.totalOrders).toBe(26);

    // Verify Bronze tier
    expect(summary.distribution.bronze.count).toBe(1);
    expect(summary.distribution.bronze.totalSpent).toBe(150);
    expect(summary.distribution.bronze.avgTicket).toBe(75);

    // Verify Prata tier
    expect(summary.distribution.prata.count).toBe(1);
    expect(summary.distribution.prata.totalSpent).toBe(800);
    expect(summary.distribution.prata.avgTicket).toBe(200);

    // Verify Ouro tier
    expect(summary.distribution.ouro.count).toBe(1);
    expect(summary.distribution.ouro.totalSpent).toBe(2000);
    expect(summary.distribution.ouro.avgTicket).toBe(250);

    // Verify Diamante tier
    expect(summary.distribution.diamante.count).toBe(1);
    expect(summary.distribution.diamante.totalSpent).toBe(5000);
    expect(summary.distribution.diamante.avgTicket).toBe(416.6666666666667); // calculated avg

    // Top clients overall sorted by LTV desc
    expect(summary.topClients[0].userId).toBe("u-4");
    expect(summary.topClients[0].tier).toBe("Diamante");
    expect(summary.topClients[1].userId).toBe("u-3");
    expect(summary.topClients[1].tier).toBe("Ouro");
  });

  it("should calculate closest to evolve thresholds correctly", async () => {
    const mockDBResult = [
      [
        {
          userId: "u-1",
          email: "bronze@test.com",
          name: "Client Bronze",
          totalOrders: "2",
          totalSpent: "450.00",
          avgTicket: "225.00",
          lastOrderAt: new Date().toISOString()
        },
        {
          userId: "u-2",
          email: "prata@test.com",
          name: "Client Prata",
          totalOrders: "4",
          totalSpent: "1420.00",
          avgTicket: "355.00",
          lastOrderAt: new Date().toISOString()
        }
      ]
    ];

    dbMock.execute.mockResolvedValue(mockDBResult);

    const caller = adminVipRouter.createCaller(ctx);
    const summary = await caller.summary();

    expect(summary.closestToEvolve).toHaveLength(2);
    
    // Check Client Bronze -> Prata (500)
    const bronzeProgress = summary.closestToEvolve.find(c => c.userId === "u-1");
    expect(bronzeProgress.nextTier).toBe("Prata");
    expect(bronzeProgress.remaining).toBe(50);

    // Check Client Prata -> Ouro (1500)
    const prataProgress = summary.closestToEvolve.find(c => c.userId === "u-2");
    expect(prataProgress.nextTier).toBe("Ouro");
    expect(prataProgress.remaining).toBe(80);
  });

  it("should identify VIP clients (Ouro & Diamante) at risk of churn", async () => {
    const mockDBResult = [
      [
        {
          userId: "u-1",
          email: "bronze@test.com",
          name: "Client Bronze",
          totalOrders: "2",
          totalSpent: "100.00",
          avgTicket: "50.00",
          lastOrderAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString() // 45 days ago (Bronze, should NOT be in risk!)
        },
        {
          userId: "u-2",
          email: "ouro-fresh@test.com",
          name: "Client Ouro Fresh",
          totalOrders: "5",
          totalSpent: "1800.00",
          avgTicket: "360.00",
          lastOrderAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() // 5 days ago (Recent, should NOT be in risk)
        },
        {
          userId: "u-3",
          email: "ouro-risk@test.com",
          name: "Client Ouro Risk",
          totalOrders: "8",
          totalSpent: "2500.00",
          avgTicket: "312.50",
          lastOrderAt: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString() // 35 days ago (Ouro, risk!)
        },
        {
          userId: "u-4",
          email: "diamante-risk@test.com",
          name: "Client Diamante Risk",
          totalOrders: "15",
          totalSpent: "6000.00",
          avgTicket: "400.00",
          lastOrderAt: new Date(Date.now() - 50 * 24 * 60 * 60 * 1000).toISOString() // 50 days ago (Diamante, risk!)
        }
      ]
    ];

    dbMock.execute.mockResolvedValue(mockDBResult);

    const caller = adminVipRouter.createCaller(ctx);
    const summary = await caller.summary();

    // Verify VIPs at risk (should be Ouro Risk and Diamante Risk, sorted by LTV desc)
    expect(summary.vipsAtRisk).toHaveLength(2);
    expect(summary.vipsAtRisk[0].userId).toBe("u-4");
    expect(summary.vipsAtRisk[0].daysInactive).toBe(50);
    expect(summary.vipsAtRisk[1].userId).toBe("u-3");
    expect(summary.vipsAtRisk[1].daysInactive).toBe(35);
  });

  it("should handle empty database gracefully", async () => {
    dbMock.execute.mockResolvedValue([[]]);

    const caller = adminVipRouter.createCaller(ctx);
    const summary = await caller.summary();

    expect(summary.totalClients).toBe(0);
    expect(summary.totalRevenue).toBe(0);
    expect(summary.totalOrders).toBe(0);
    expect(summary.topClients).toHaveLength(0);
    expect(summary.closestToEvolve).toHaveLength(0);
    expect(summary.vipsAtRisk).toHaveLength(0);
    expect(summary.distribution.bronze.count).toBe(0);
    expect(summary.distribution.prata.count).toBe(0);
    expect(summary.distribution.ouro.count).toBe(0);
    expect(summary.distribution.diamante.count).toBe(0);
  });

  it("should handle inconsistent or null field values in query results safely", async () => {
    const mockDBResult = [
      [
        {
          userId: "u-1",
          email: "inconsistent@test.com",
          name: null,
          totalOrders: null,
          totalSpent: null,
          avgTicket: null,
          lastOrderAt: null
        }
      ]
    ];

    dbMock.execute.mockResolvedValue(mockDBResult);

    const caller = adminVipRouter.createCaller(ctx);
    const summary = await caller.summary();

    // Should fall back totalSpent to 0, which gets ignored since it is < 0.01 (min of bronze)
    expect(summary.totalClients).toBe(0);
    expect(summary.totalRevenue).toBe(0);
  });
});

describe("adminVipRouter.createReactivationCoupon", () => {
  let existingActiveCoupons: any[] = [];
  let existingCouponCodeResult: any[] = [];
  let insertedValues: any = null;

  beforeEach(() => {
    existingActiveCoupons = [];
    existingCouponCodeResult = [];
    insertedValues = null;
    vi.restoreAllMocks();
    dbMock.execute.mockReset();
    dbMock.select.mockReset();
    dbMock.insert.mockReset();

    dbMock.select.mockImplementation((fields?: any) => {
      const isFieldsSelect = !!fields;
      return {
        from: vi.fn().mockImplementation(() => {
          const queryChain = {
            where: vi.fn().mockImplementation(() => {
              const limitChain = {
                limit: vi.fn().mockImplementation(() => {
                  return Promise.resolve(existingCouponCodeResult);
                }),
                then: (cb: any) => Promise.resolve(isFieldsSelect ? existingCouponCodeResult : existingActiveCoupons).then(cb)
              };
              return limitChain;
            }),
            then: (cb: any) => Promise.resolve(isFieldsSelect ? existingCouponCodeResult : existingActiveCoupons).then(cb)
          };
          return queryChain;
        })
      };
    });

    dbMock.insert.mockImplementation(() => ({
      values: vi.fn().mockImplementation((val) => {
        insertedValues = val;
        return Promise.resolve({ success: true });
      })
    }));
  });

  const ctx = {
    user: { id: "admin-1", role: "super_admin" },
    session: { id: "sess-1" },
    req: { ip: "127.0.0.1", headers: {} },
    res: {},
  } as any;

  it("should create coupon for Diamante in risk successfully", async () => {
    // 1. User mock
    const mockUserResult = [[{ id: "u-diamante", email: "diamante@test.com", name: "Diamante User", totalSpent: "3500.00" }]];
    // 2. Last order mock
    const mockLastOrderResult = [[{ lastOrderAt: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString() }]]; // 40 days ago

    dbMock.execute.mockResolvedValueOnce(mockUserResult);
    dbMock.execute.mockResolvedValueOnce(mockLastOrderResult);

    const caller = adminVipRouter.createCaller(ctx);
    const result = await caller.createReactivationCoupon({
      userId: "u-diamante",
      discountPercent: 12,
      validDays: 8,
      minOrderValue: 120
    });

    expect(result.couponCode).toContain("VOLTA-");
    expect(result.discountPercent).toBe(12);
    expect(result.minOrderValue).toBe(120);
    expect(result.messageText).toContain(result.couponCode);
    expect(result.messageText).toContain("12%");
    expect(result.messageText).toContain("120");

    // Check saved values
    expect(insertedValues).toBeDefined();
    expect(insertedValues.code).toBe(result.couponCode);
    expect(insertedValues.discountValue).toBe("12.00");
    expect(insertedValues.minOrderValue).toBe("120.00");
    expect(insertedValues.maxUsesPerCustomer).toBe(1);
    expect(insertedValues.usageLimit).toBe(1);
    expect(insertedValues.isActive).toBe(true);
    
    // Check metadata in description
    const descObj = JSON.parse(insertedValues.description);
    expect(descObj.userId).toBe("u-diamante");
    expect(descObj.type).toBe("reactivation");
  });

  it("should create coupon for Ouro in risk successfully", async () => {
    const mockUserResult = [[{ id: "u-ouro", email: "ouro@test.com", name: "Ouro User", totalSpent: "1800.00" }]];
    const mockLastOrderResult = [[{ lastOrderAt: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString() }]]; // 35 days ago

    dbMock.execute.mockResolvedValueOnce(mockUserResult);
    dbMock.execute.mockResolvedValueOnce(mockLastOrderResult);

    const caller = adminVipRouter.createCaller(ctx);
    const result = await caller.createReactivationCoupon({
      userId: "u-ouro"
    });

    expect(result.couponCode).toContain("VOLTA-");
    expect(result.discountPercent).toBe(10); // default
    expect(result.minOrderValue).toBe(99); // default
  });

  it("should block Bronze or Prata users (LTV < 1500)", async () => {
    const mockUserResult = [[{ id: "u-prata", email: "prata@test.com", name: "Prata User", totalSpent: "800.00" }]];
    dbMock.execute.mockResolvedValueOnce(mockUserResult);

    const caller = adminVipRouter.createCaller(ctx);
    await expect(
      caller.createReactivationCoupon({ userId: "u-prata" })
    ).rejects.toThrow("Usuário não pertence à faixa Ouro ou Diamante.");
  });

  it("should block active clients (last purchase < 30 days ago)", async () => {
    const mockUserResult = [[{ id: "u-ouro", email: "ouro@test.com", name: "Ouro User", totalSpent: "2000.00" }]];
    const mockLastOrderResult = [[{ lastOrderAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString() }]]; // 10 days ago (active)

    dbMock.execute.mockResolvedValueOnce(mockUserResult);
    dbMock.execute.mockResolvedValueOnce(mockLastOrderResult);

    const caller = adminVipRouter.createCaller(ctx);
    await expect(
      caller.createReactivationCoupon({ userId: "u-ouro" })
    ).rejects.toThrow("Cliente ativo.");
  });

  it("should block discount percentages above 15%", async () => {
    const caller = adminVipRouter.createCaller(ctx);
    await expect(
      caller.createReactivationCoupon({ userId: "u-any", discountPercent: 16 })
    ).rejects.toThrow("O desconto máximo permitido para reativação é de 15%.");
  });

  it("should block validity periods above 14 days", async () => {
    const caller = adminVipRouter.createCaller(ctx);
    await expect(
      caller.createReactivationCoupon({ userId: "u-any", validDays: 15 })
    ).rejects.toThrow("A validade máxima permitida é de 14 dias.");
  });

  it("should block duplicate creations when there is already an active reactivation coupon", async () => {
    const mockUserResult = [[{ id: "u-ouro", email: "ouro@test.com", name: "Ouro User", totalSpent: "2000.00" }]];
    const mockLastOrderResult = [[{ lastOrderAt: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString() }]]; // 40 days ago

    dbMock.execute.mockResolvedValueOnce(mockUserResult);
    dbMock.execute.mockResolvedValueOnce(mockLastOrderResult);

    // Mock active coupon in database
    existingActiveCoupons = [
      {
        id: "existing-1",
        code: "VOLTA-ABCDEF",
        description: JSON.stringify({ userId: "u-ouro", type: "reactivation" }),
        isActive: true,
        validUntil: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000)
      }
    ];

    const caller = adminVipRouter.createCaller(ctx);
    await expect(
      caller.createReactivationCoupon({ userId: "u-ouro" })
    ).rejects.toThrow("Já existe um cupom de reativação ativo para este cliente.");
  });
});
