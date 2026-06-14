import { describe, it, expect } from "vitest";
import { getDb } from "../../db.js";
import { couponUsage } from "../../../drizzle/schema/index.js";
import { getTableColumns, eq } from "drizzle-orm";

describe("couponUsage Schema and Constraint Tests", () => {
  it("should have orderId as MySqlVarChar to align with orders.id", () => {
    const columns = getTableColumns(couponUsage);
    expect(columns.orderId.columnType).toContain("MySqlVarChar");
  });

  it("should have couponId as MySqlVarChar to align with coupons.id", () => {
    const columns = getTableColumns(couponUsage);
    expect(columns.couponId.columnType).toContain("MySqlVarChar");
  });

  it("should successfully insert alphanumeric string order_id and prevent duplicate uses", async () => {
    const db = await getDb();
    if (!db) {
      console.warn("Database not available for integration test.");
      return;
    }

    const testCouponId = "test-coupon-" + Math.floor(Math.random() * 1000000);
    const testOrderId = "GS-TEST-ORDER-" + Math.floor(Math.random() * 1000000);
    const testUserId = "test-user-id";

    // 1. Insert valid usage with string order_id
    const generatedId1 = String(Math.floor(Math.random() * 1000000000));
    await db.insert(couponUsage).values({
      id: generatedId1,
      couponId: testCouponId,
      userId: testUserId,
      orderId: testOrderId,
      usedAt: new Date()
    });

    // Verify insertion succeeded
    const rows = await db.select().from(couponUsage).where(eq(couponUsage.couponId, testCouponId));
    expect(rows).toHaveLength(1);
    expect(rows[0].orderId).toBe(testOrderId);

    // 2. Attempt duplicate insert (violating unique constraint uniq_coupon_order)
    const generatedId2 = String(Math.floor(Math.random() * 1000000000));
    await expect(
      db.insert(couponUsage).values({
        id: generatedId2,
        couponId: testCouponId,
        userId: testUserId,
        orderId: testOrderId,
        usedAt: new Date()
      })
    ).rejects.toThrow();

    // Clean up
    await db.delete(couponUsage).where(eq(couponUsage.couponId, testCouponId));
  });

  it("should insert coupon usage without passing id (leaving AUTO_INCREMENT to generate it)", async () => {
    const db = await getDb();
    if (!db) {
      console.warn("Database not available for integration test.");
      return;
    }

    const testCouponId = "test-coupon-" + Math.floor(Math.random() * 1000000);
    const testOrderId = "GS-TEST-ORDER-" + Math.floor(Math.random() * 1000000);
    const testUserId = "test-user-id";

    // Insert without id key (casting to any to bypass TS requirements of id)
    await db.insert(couponUsage).values({
      couponId: testCouponId,
      userId: testUserId,
      orderId: testOrderId,
      usedAt: new Date()
    } as any);

    const rows = await db.select().from(couponUsage).where(eq(couponUsage.couponId, testCouponId));
    expect(rows).toHaveLength(1);
    expect(rows[0].orderId).toBe(testOrderId);
    expect(rows[0].id).toBeDefined(); // The auto-increment generated an id!

    // Clean up
    await db.delete(couponUsage).where(eq(couponUsage.couponId, testCouponId));
  });

  it("should handle duplicate coupon usage insert gracefully in checkout try/catch flow", async () => {
    const db = await getDb();
    if (!db) {
      console.warn("Database not available for integration test.");
      return;
    }

    const testCouponId = "test-coupon-" + Math.floor(Math.random() * 1000000);
    const testOrderId = "GS-TEST-ORDER-" + Math.floor(Math.random() * 1000000);
    const testUserId = "test-user-id";

    // 1. First insert
    await db.insert(couponUsage).values({
      couponId: testCouponId,
      userId: testUserId,
      orderId: testOrderId,
      usedAt: new Date()
    } as any);

    // 2. Simulated duplicate insertion within a try-catch block (mirroring router logic)
    let errorLogged = false;
    try {
      await db.insert(couponUsage).values({
        couponId: testCouponId,
        userId: testUserId,
        orderId: testOrderId,
        usedAt: new Date()
      } as any);
    } catch (err) {
      // Gracefully capture and do not re-throw, just log warning
      errorLogged = true;
    }

    expect(errorLogged).toBe(true); // Database constraints triggered, but we handle it safely

    // Clean up
    await db.delete(couponUsage).where(eq(couponUsage.couponId, testCouponId));
  });

  it("should rollback coupon_usage insert if the parent transaction rolls back", async () => {
    const db = await getDb();
    if (!db) {
      console.warn("Database not available for integration test.");
      return;
    }

    const testCouponId = "test-coupon-" + Math.floor(Math.random() * 1000000);
    const testOrderId = "GS-TEST-ORDER-" + Math.floor(Math.random() * 1000000);
    const testUserId = "test-user-id";

    try {
      await db.transaction(async (tx) => {
        // 1. Insert coupon usage inside transaction
        await tx.insert(couponUsage).values({
          couponId: testCouponId,
          userId: testUserId,
          orderId: testOrderId,
          usedAt: new Date()
        } as any);

        // 2. Force transaction rollback by throwing an error
        throw new Error("Trigger Rollback");
      });
    } catch (err) {
      // Expected exception
    }

    // 3. Verify that the insert was rolled back and does not exist in db
    const rows = await db.select().from(couponUsage).where(eq(couponUsage.couponId, testCouponId));
    expect(rows).toHaveLength(0);
  });
});
