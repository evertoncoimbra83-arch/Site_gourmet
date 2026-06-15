import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock database to test delete logic in OrderManagerService and AdminOrderFinalizeService.
const dbMock = vi.hoisted(() => {
  const select = vi.fn();
  const update = vi.fn();
  const deleteFn = vi.fn();
  const insert = vi.fn();
  const transaction = vi.fn(cb => cb(dbMock));
  const execute = vi.fn();
  return { select, update, delete: deleteFn, insert, transaction, execute };
});

vi.mock("../../db.js", () => ({
  getDb: vi.fn(async () => dbMock),
}));

vi.mock("../../workers/queues/biQueue.js", () => ({
  enqueueBIAnalyticsJob: vi.fn(),
}));

import { getNumericOrderId } from "./orders/AdminOrderHelpers.js";
import { OrderManagerService } from "./orders/OrderManagerService.js";
import { AdminOrderFinalizeService } from "./orders/AdminOrderFinalizeService.js";

describe("BI Recovery Sprint - getNumericOrderId", () => {
  it("resolves logical collisions between different string prefixes with same numbers", () => {
    const id1 = getNumericOrderId("GS-29781");
    const id2 = getNumericOrderId("GS-WP-29781");
    expect(id1).not.toBe(id2);
  });

  it("handles pure integer order IDs that fit in 32-bit limits", () => {
    const id1 = getNumericOrderId("29781");
    expect(id1).toBe(29781);

    const id2 = getNumericOrderId("999999999");
    expect(id2).toBe(999999999);
  });

  it("hashes pure integer order IDs that are too long for 32-bit integer limits", () => {
    const longId = "123456789012345";
    const hashed = getNumericOrderId(longId);
    expect(typeof hashed).toBe("number");
    expect(hashed).toBeGreaterThan(0);
    // Since it's too long, it should not be parsed directly as safeNumber
    expect(hashed).not.toBe(123456789012345);
  });

  it("handles UUIDs and other non-standard formats deterministically", () => {
    const uuid1 = "3b25113a-c821-4d1d-91b3-0a719d36183e";
    const uuid2 = "3b25113a-c821-4d1d-91b3-0a719d36183f";
    const hashed1 = getNumericOrderId(uuid1);
    const hashed2 = getNumericOrderId(uuid2);

    expect(hashed1).toBeGreaterThan(0);
    expect(hashed2).toBeGreaterThan(0);
    expect(hashed1).not.toBe(hashed2);

    // Idempotency: same input returns same output
    expect(getNumericOrderId(uuid1)).toBe(hashed1);
  });
});

describe("BI Recovery Sprint - Cancel and Deletion Clears Facts", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    dbMock.select.mockReset();
    dbMock.update.mockReset();
    dbMock.delete.mockReset();
    dbMock.insert.mockReset();
  });

  it("OrderManagerService.updateStatus to cancelled deletes facts from both tables", async () => {
    dbMock.select.mockReturnValue({
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([{ id: "ord-123", status: "pending" }]),
    });
    dbMock.update.mockReturnValue({
      set: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue({ affectedRows: 1 }),
    });
    dbMock.delete.mockReturnValue({
      where: vi.fn().mockResolvedValue({}),
    });

    await OrderManagerService.updateStatus("GS-29781", "cancelled");

    // Deletion should be called for both biSalesFacts and biFinancialFacts
    expect(dbMock.delete).toHaveBeenCalledTimes(2);
  });

  it("OrderManagerService.delete deletes facts from both tables in a transaction", async () => {
    dbMock.select.mockReturnValue({
      from: vi.fn().mockReturnThis(),
      where: vi
        .fn()
        .mockResolvedValue([
          { id: "ord-123", status: "pending", userId: "user-1" },
        ]),
    });
    dbMock.delete.mockReturnValue({
      where: vi.fn().mockResolvedValue({}),
    });
    dbMock.update.mockReturnValue({
      set: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue({}),
    });
    dbMock.insert.mockReturnValue({
      values: vi.fn().mockResolvedValue({}),
    });

    await OrderManagerService.delete("GS-29781");

    // Inside transaction, it deletes from biSalesFacts and biFinancialFacts, orderItems, and orders
    expect(dbMock.delete).toHaveBeenCalled();
  });

  it("AdminOrderFinalizeService cancels previous order and deletes old BI facts", async () => {
    // We mock the two select statements sequentially.
    let selectCallCount = 0;
    dbMock.select.mockImplementation(() => {
      selectCallCount++;
      if (selectCallCount === 1) {
        // Draft search
        return {
          from: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue([
            {
              id: "draft-123",
              userId: "user-1",
              metadataJson: JSON.stringify({
                editingOrderId: "GS-WP-29781",
                paymentStatus: "paid",
              }),
              discountsSnapshot: "{}",
              shippingValue: "10.00",
              discountValue: "5.00",
            },
          ]),
        };
      } else {
        // Items search
        return {
          from: vi.fn().mockReturnThis(),
          where: vi
            .fn()
            .mockResolvedValue([
              { id: "item-1", dishId: 1, unitPrice: 15.0, quantity: 2 },
            ]),
        };
      }
    });

    dbMock.update.mockReturnValue({
      set: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue({}),
    });

    dbMock.delete.mockReturnValue({
      where: vi.fn().mockResolvedValue({}),
    });

    dbMock.insert.mockReturnValue({
      values: vi.fn().mockResolvedValue({}),
    });

    const result = await AdminOrderFinalizeService.finalize("draft-123");

    expect(result.success).toBe(true);
    // Should have updated status of old order to cancelled
    expect(dbMock.update).toHaveBeenCalled();
    // Should have deleted old BI facts
    expect(dbMock.delete).toHaveBeenCalled();
  });
});
