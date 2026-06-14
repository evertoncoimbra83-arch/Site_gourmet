import { describe, it, expect, vi, beforeEach } from "vitest";

const dbMock = vi.hoisted(() => {
  const select = vi.fn();
  const insert = vi.fn();
  const execute = vi.fn();
  return { select, insert, execute };
});

vi.mock("../../db.js", () => ({
  getDb: vi.fn(async () => dbMock),
}));

vi.mock("../../encryption.js", async (importOriginal) => {
  const actual = await importOriginal() as any;
  return {
    ...actual,
    decrypt: vi.fn((val) => val),
    encrypt: vi.fn((val) => val),
  };
});

// Mock AuditLogService
vi.mock("../../services/AuditLogService.js", () => ({
  AuditLogService: {
    record: vi.fn(),
  },
}));

import { adminBirthdaysRouter } from "./birthdays.js";

describe("adminBirthdaysRouter", () => {
  const ctx = {
    user: { id: "admin-1", role: "admin" },
    session: { id: "sess-1" },
    req: { ip: "127.0.0.1", headers: {} },
    res: {},
  } as any;

  beforeEach(() => {
    vi.restoreAllMocks();
    dbMock.execute.mockReset();
    dbMock.select.mockReset();
    dbMock.insert.mockReset();
  });

  describe("summary", () => {
    it("should calculate correct summary stats", async () => {
      // Mock base: 4 users
      // User 1: birthday today, LTV 3500 (Diamante)
      // User 2: birthday in 5 days, LTV 2000 (Ouro)
      // User 3: birthday in 15 days, LTV 600 (Prata)
      // User 4: no birthday
      const today = new Date();
      const format = (d: Date) => {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
      };

      const date1 = format(today);
      const date2 = format(new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000));
      const date3 = format(new Date(today.getTime() + 15 * 24 * 60 * 60 * 1000));

      const mockRows = [
        [
          { id: "u-1", email: "u1@t.com", name: "User 1", birthDate: date1, totalOrders: 5, totalSpent: "3500.00" },
          { id: "u-2", email: "u2@t.com", name: "User 2", birthDate: date2, totalOrders: 3, totalSpent: "2000.00" },
          { id: "u-3", email: "u3@t.com", name: "User 3", birthDate: date3, totalOrders: 2, totalSpent: "600.00" },
          { id: "u-4", email: "u4@t.com", name: "User 4", birthDate: "", totalOrders: 0, totalSpent: "0.00" },
        ]
      ];

      dbMock.execute.mockResolvedValue(mockRows);

      const caller = adminBirthdaysRouter.createCaller(ctx);
      const summary = await caller.summary();

      expect(summary.aniversariantesHoje).toBe(1);
      expect(summary.aniversariantesProximos7Dias).toBe(2); // Date1 and Date2
      expect(summary.aniversariantesProximos30Dias).toBe(3); // Date1, Date2, Date3
      expect(summary.vipsAniversariantes).toBe(2); // User 1 and User 2 (Ouro & Diamante) within 30 days
      expect(summary.percentualPreenchido).toBe(75); // 3 of 4
    });
  });

  describe("listUpcoming", () => {
    it("should retrieve and sort upcoming birthdays correctly", async () => {
      const today = new Date();
      const format = (d: Date) => {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
      };

      const date1 = format(today); // User 1
      const date2 = format(new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000)); // User 2

      const mockRows = [
        [
          { id: "u-1", email: "u1@t.com", name: "User 1", phone: "111", birthDate: date1, totalOrders: 5, totalSpent: "3500.00", lastOrderAt: today.toISOString() },
          { id: "u-2", email: "u2@t.com", name: "User 2", phone: "222", birthDate: date2, totalOrders: 3, totalSpent: "2000.00", lastOrderAt: today.toISOString() },
        ]
      ];

      dbMock.execute.mockResolvedValue(mockRows);

      const caller = adminBirthdaysRouter.createCaller(ctx);
      const list = await caller.listUpcoming({ daysAhead: 30 });

      expect(list).toHaveLength(2);
      expect(list[0].id).toBe("u-1"); // Diamante comes first
      expect(list[0].vipTier).toBe("Diamante");
      expect(list[1].id).toBe("u-2");
      expect(list[1].vipTier).toBe("Ouro");
    });
  });

  describe("createCoupon", () => {
    it("should throw error if user does not exist", async () => {
      dbMock.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]), // User not found
          })
        })
      });

      const caller = adminBirthdaysRouter.createCaller(ctx);
      await expect(caller.createCoupon({ userId: "u-1" })).rejects.toThrow("Cliente não encontrado.");
    });

    it("should throw error if user has no birthday", async () => {
      dbMock.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([{ id: "u-1", birthDate: "" }]),
          })
        })
      });

      const caller = adminBirthdaysRouter.createCaller(ctx);
      await expect(caller.createCoupon({ userId: "u-1" })).rejects.toThrow("Cliente não possui data de nascimento cadastrada.");
    });

    it("should throw error if coupon already generated this year", async () => {
      // Mock existing coupons: one matches current year birthday
      const mockCoupons = [
        {
          id: "cop-1",
          code: "NIVER-ABCDEF",
          isActive: true,
          validUntil: new Date(new Date().getTime() + 100000),
          createdAt: new Date(), // this year
          description: JSON.stringify({ userId: "u-1", type: "birthday" }),
        }
      ];

      // Mock select implementations for users and coupons
      dbMock.select
        .mockImplementationOnce(() => ({
          from: () => ({
            where: () => ({
              limit: () => [{ id: "u-1", birthDate: "1990-05-15" }]
            })
          })
        }))
        .mockImplementationOnce(() => ({
          from: () => mockCoupons
        }));

      const caller = adminBirthdaysRouter.createCaller(ctx);
      await expect(caller.createCoupon({ userId: "u-1" })).rejects.toThrow("Este cliente já recebeu um cupom de aniversário no ano de");
    });

    it("should generate a birthday coupon successfully if all rules are satisfied", async () => {
      dbMock.select
        .mockImplementationOnce(() => ({
          from: () => ({
            where: () => ({
              limit: () => [{ id: "u-1", name: "User 1", birthDate: "1990-05-15" }]
            })
          })
        }))
        .mockImplementationOnce(() => ({
          from: () => []
        }))
        .mockImplementationOnce(() => ({
          from: () => ({
            where: () => ({
              limit: () => []
            })
          })
        }));

      dbMock.insert.mockReturnValue({
        values: vi.fn().mockResolvedValue({ success: true }),
      });

      const caller = adminBirthdaysRouter.createCaller(ctx);
      const res = await caller.createCoupon({ userId: "u-1" });

      expect(res.couponCode).toContain("NIVER-");
      expect(res.validUntil).toBeDefined();
      expect(res.messageText).toContain("Passando para desejar um feliz aniversário!");
    });
  });
});
