import { beforeEach, describe, expect, it, vi } from "vitest";

const dbMock = vi.hoisted(() => {
  const select = vi.fn();
  const update = vi.fn();
  const deleteFn = vi.fn();
  return { select, update, delete: deleteFn };
});

vi.mock("../../../db.js", () => ({
  getDb: vi.fn(async () => dbMock),
}));

vi.mock("../../../workers/queues/biQueue.js", () => ({
  enqueueBIAnalyticsJob: vi.fn(),
}));

import { OrderManagerService } from "./OrderManagerService.js";

function mockMutableOrderSelect(oldOrder?: Record<string, unknown>) {
  dbMock.select
    .mockReturnValueOnce({
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([{ id: "order-1", status: "pending" }]),
    })
    .mockReturnValueOnce({
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([
        oldOrder ?? {
          id: "order-1",
          status: "pending",
          shippingAddress: "Rua Antiga",
          shippingAddressNumber: "10",
          shippingAddressComplement: null,
          shippingNeighborhood: "Centro",
          shippingCity: "Santos",
          shippingState: "SP",
          shippingZipCode: "11000-000",
        },
      ]),
    });
}

describe("OrderManagerService admin order updates", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    dbMock.select.mockReset();
    dbMock.update.mockReset();
    dbMock.delete.mockReset();
  });

  it("persists order status through the existing update flow", async () => {
    let updatePayload: Record<string, unknown> | undefined;

    dbMock.select.mockReturnValue({
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([{ id: "order-1", status: "pending" }]),
    });
    dbMock.update.mockReturnValue({
      set: vi.fn((payload) => {
        updatePayload = payload;
        return { where: vi.fn().mockResolvedValue({ affectedRows: 1 }) };
      }),
    });

    await OrderManagerService.updateStatus("order-1", "preparing");

    expect(updatePayload).toMatchObject({ status: "preparing" });
  });

  it("updates only delivery snapshot fields without recalculating totals", async () => {
    let updatePayload: Record<string, unknown> | undefined;

    mockMutableOrderSelect();
    dbMock.update.mockReturnValue({
      set: vi.fn((payload) => {
        updatePayload = payload;
        return { where: vi.fn().mockResolvedValue({ affectedRows: 1 }) };
      }),
    });

    await OrderManagerService.updateDeliveryAddress("order-1", {
      shippingAddress: "Rua Nova",
      shippingAddressNumber: "123",
      shippingAddressComplement: "Apto 45",
      shippingNeighborhood: "Boqueirao",
      shippingCity: "Santos",
      shippingState: "SP",
      shippingZipCode: "11045-000",
    });

    expect(updatePayload).toMatchObject({
      shippingAddress: "Rua Nova",
      shippingAddressNumber: "123",
      shippingAddressComplement: "Apto 45",
      shippingNeighborhood: "Boqueirao",
      shippingCity: "Santos",
      shippingState: "SP",
      shippingZipCode: "11045-000",
    });
    expect(updatePayload).not.toHaveProperty("shippingCost");
    expect(updatePayload).not.toHaveProperty("subtotal");
    expect(updatePayload).not.toHaveProperty("total");
  });
});
