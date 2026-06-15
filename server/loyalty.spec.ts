import { beforeEach, describe, expect, it, vi } from "vitest";

const dbMock = vi.hoisted(() => ({
  select: vi.fn(),
  update: vi.fn(),
}));

const updateSetMock = vi.hoisted(() => vi.fn());

vi.mock("./db.js", () => ({
  getDb: vi.fn(async () => dbMock),
}));

import { loyaltyHistory, loyaltySettings, users } from "../drizzle/schema/index.js";
import { getUserPoints, updateLoyaltySettings } from "./loyalty.js";

describe("storefront loyalty balance source", () => {
  beforeEach(() => {
    dbMock.select.mockReset();
    dbMock.update.mockReset();
    updateSetMock.mockReset();
    dbMock.update.mockReturnValue({ set: updateSetMock });
    dbMock.select.mockImplementation(() => ({
      from: vi.fn((table) => {
        if (table === users) {
          return {
            where: vi.fn().mockReturnThis(),
            limit: vi.fn().mockResolvedValue([{ availablePoints: 1134 }]),
          };
        }

        if (table === loyaltyHistory) {
          return {
            where: vi.fn().mockResolvedValue([
              { pointsChange: -4501 },
              { pointsChange: 1134 },
            ]),
          };
        }

        if (table === loyaltySettings) {
          return {
            limit: vi.fn().mockResolvedValue([
              {
                id: "1",
                enabled: true,
                conversionRatePoints: 1,
                conversionRateMoney: "1.00",
              },
            ]),
          };
        }

        return {
          where: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue([]),
        };
      }),
    }));
  });

  it("usa users.loyalty_balance como saldo oficial mesmo com historico negativo", async () => {
    const balance = await getUserPoints("user-affected");

    expect(balance.current_points).toBe(1134);
    expect(balance.balance).toBe(1134);
    expect(balance.points).toBe(1134);
    expect(balance.history_balance).toBe(-3367);
  });

  it("updateLoyaltySettings aceita apenas campos validos e evita NaN", async () => {
    await updateLoyaltySettings({
      enabled: "true",
      conversionRatePoints: "2",
      conversionRateMoney: "abc",
      redemptionRatePoints: "99.5",
      redemptionRateMoney: "2.5",
      maxDiscountAmount: "",
      minCartAmount: "10",
      pointsExpirationDays: "365",
      pointsPerSignup: "NaN",
      unknownField: 123,
    });

    expect(updateSetMock).toHaveBeenCalledTimes(1);
    const payload = updateSetMock.mock.calls[0][0];

    expect(Object.keys(payload).sort()).toEqual(
      [
        "conversionRateMoney",
        "conversionRatePoints",
        "enabled",
        "maxDiscountAmount",
        "minCartAmount",
        "pointsExpirationDays",
        "pointsPerSignup",
        "redemptionRateMoney",
        "redemptionRatePoints",
        "updatedAt",
      ].sort(),
    );
    expect(payload.conversionRateMoney).toBe("0.00");
    expect(payload.redemptionRatePoints).toBe(0);
    expect(payload.pointsPerSignup).toBe(0);
    expect(Object.values(payload).some((value) => Number.isNaN(value))).toBe(false);
  });
});
