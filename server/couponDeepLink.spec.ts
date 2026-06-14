import { describe, it, expect, vi } from "vitest";
import {
  sanitizeCouponCode,
  parseCouponFromUrl,
  removeQueryParams,
  buildCouponLink,
  readPendingCoupon,
  writePendingCoupon,
  clearPendingCoupon,
} from "../shared/utils/coupon.ts";

describe("Coupon Deep Link Helpers", () => {
  describe("sanitizeCouponCode", () => {
    it("should clean and uppercase a valid code", () => {
      expect(sanitizeCouponCode("  volta10  ")).toBe("VOLTA10");
      expect(sanitizeCouponCode("cupom-2026_val")).toBe("CUPOM-2026_VAL");
    });

    it("should return null for empty or whitespace-only inputs", () => {
      expect(sanitizeCouponCode(null)).toBeNull();
      expect(sanitizeCouponCode(undefined)).toBeNull();
      expect(sanitizeCouponCode("")).toBeNull();
      expect(sanitizeCouponCode("   ")).toBeNull();
    });

    it("should reject codes exceeding 64 characters", () => {
      const longCode = "A".repeat(65);
      expect(sanitizeCouponCode(longCode)).toBeNull();
      expect(sanitizeCouponCode("A".repeat(64))).toBe("A".repeat(64));
    });

    it("should reject codes containing unsafe or invalid characters", () => {
      expect(sanitizeCouponCode("VOLTA 10")).toBeNull(); // contains space
      expect(sanitizeCouponCode("VOLTA$10")).toBeNull(); // dollar sign
      expect(sanitizeCouponCode("<script>alert(1)</script>")).toBeNull(); // XSS injection
      expect(sanitizeCouponCode("VOLTA.10")).toBeNull(); // dot
    });
  });

  describe("parseCouponFromUrl", () => {
    it("should parse cupom with highest priority", () => {
      const search = "?cupom=VOLTA10&coupon=UNUSED&discount=UNUSED";
      expect(parseCouponFromUrl(search)).toBe("VOLTA10");
    });

    it("should fall back to coupon when cupom is not present", () => {
      const search = "?coupon=VOLTA5&discount=UNUSED";
      expect(parseCouponFromUrl(search)).toBe("VOLTA5");
    });

    it("should fall back to discount when others are not present", () => {
      const search = "?discount=VOLTA15";
      expect(parseCouponFromUrl(search)).toBe("VOLTA15");
    });

    it("should return null when no coupon params are present", () => {
      expect(parseCouponFromUrl("?utm_source=google")).toBeNull();
    });

    it("should sanitize the parsed value", () => {
      expect(parseCouponFromUrl("?cupom=   volta10$   ")).toBeNull();
      expect(parseCouponFromUrl("?cupom=   volta-10   ")).toBe("VOLTA-10");
    });
  });

  describe("removeQueryParams", () => {
    it("should remove target query params and keep others", () => {
      const search = "?cupom=VOLTA10&utm_source=google&ref=123";
      const cleaned = removeQueryParams(search, ["cupom", "coupon", "discount"]);
      expect(cleaned).toBe("utm_source=google&ref=123");
    });

    it("should clear everything if only targets exist", () => {
      const search = "?cupom=VOLTA10";
      const cleaned = removeQueryParams(search, ["cupom"]);
      expect(cleaned).toBe("");
    });

    it("should do nothing if targets do not exist", () => {
      const search = "?utm_source=google";
      const cleaned = removeQueryParams(search, ["cupom"]);
      expect(cleaned).toBe("utm_source=google");
    });
  });

  describe("buildCouponLink", () => {
    it("should build a correct deep link", () => {
      expect(buildCouponLink("VOLTA10", "https://gourmetsaudavel.com")).toBe(
        "https://gourmetsaudavel.com/?cupom=VOLTA10"
      );
      expect(buildCouponLink("VOLTA10", "https://gourmetsaudavel.com/")).toBe(
        "https://gourmetsaudavel.com/?cupom=VOLTA10"
      );
    });
  });

  describe("Pending Coupon Storage Flow", () => {
    it("should write, read and clear pending coupon correctly", () => {
      const store: Record<string, string> = {};
      const getItem = (key: string) => store[key] || null;
      const setItem = (key: string, val: string) => {
        store[key] = val;
      };
      const removeItem = (key: string) => {
        delete store[key];
      };

      // Write
      const written = writePendingCoupon(setItem, "VOLTA10", "url");
      expect(written).not.toBeNull();
      expect(written!.code).toBe("VOLTA10");
      expect(written!.source).toBe("url");

      // Read
      const read = readPendingCoupon(getItem);
      expect(read).not.toBeNull();
      expect(read!.code).toBe("VOLTA10");

      // Clear
      clearPendingCoupon(removeItem);
      expect(readPendingCoupon(getItem)).toBeNull();
    });

    it("should return null if the pending coupon is expired", () => {
      const store: Record<string, string> = {};
      const getItem = (key: string) => store[key] || null;
      const setItem = (key: string, val: string) => {
        store[key] = val;
      };

      // Write valid coupon
      writePendingCoupon(setItem, "VOLTA10", "url");

      // Manually set capturedAt to 8 days ago
      const payload = JSON.parse(store["gourmet.pendingCouponCode"]);
      const eightDaysAgo = new Date();
      eightDaysAgo.setDate(eightDaysAgo.getDate() - 8);
      payload.capturedAt = eightDaysAgo.toISOString();
      store["gourmet.pendingCouponCode"] = JSON.stringify(payload);

      // Read should be null because of expiration
      const read = readPendingCoupon(getItem);
      expect(read).toBeNull();
    });

    it("should return the coupon if it is within 6 days old", () => {
      const store: Record<string, string> = {};
      const getItem = (key: string) => store[key] || null;
      const setItem = (key: string, val: string) => {
        store[key] = val;
      };

      writePendingCoupon(setItem, "VOLTA10", "url");

      // Manually set capturedAt to 6 days ago
      const payload = JSON.parse(store["gourmet.pendingCouponCode"]);
      const sixDaysAgo = new Date();
      sixDaysAgo.setDate(sixDaysAgo.getDate() - 6);
      payload.capturedAt = sixDaysAgo.toISOString();
      store["gourmet.pendingCouponCode"] = JSON.stringify(payload);

      const read = readPendingCoupon(getItem);
      expect(read).not.toBeNull();
      expect(read!.code).toBe("VOLTA10");
    });
  });
});
