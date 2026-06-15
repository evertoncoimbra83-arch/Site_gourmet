import { describe, expect, it, vi } from "vitest";

const dbMock = vi.hoisted(() => {
  const select = vi.fn();
  return { select };
});

vi.mock("./db.js", () => ({
  getDb: vi.fn(async () => dbMock),
}));

import {
  normalizePaymentLogoInput,
  resolvePaymentLogoUrl,
} from "../shared/utils/payment-logo";
import { paymentMethodsRouter } from "./routers/storefront/paymentMethods.js";

describe("payment logo resolution", () => {
  it("keeps valid absolute and Cloudinary URLs as image sources", () => {
    const url =
      "https://res.cloudinary.com/demo/image/upload/v1/payment/alelo.webp";

    expect(resolvePaymentLogoUrl(url, "https://gourmetsaudavel.com")).toBe(url);
  });

  it("keeps legacy upload paths displayable without making them valid storage", () => {
    expect(
      resolvePaymentLogoUrl(
        "uploads/vr.webp",
        "https://gourmetsaudavel.com/",
      ),
    ).toBe("https://gourmetsaudavel.com/uploads/vr.webp");
    expect(normalizePaymentLogoInput("uploads/vr.webp")).toBe("");
  });

  it("does not resolve bare legacy filenames as upload assets", () => {
    expect(resolvePaymentLogoUrl("sodexo.webp", "https://gourmetsaudavel.com"))
      .toMatch(/^data:image\/svg\+xml/);
    expect(normalizePaymentLogoInput("sodexo.webp")).toBe("");
  });

  it("does not use dish placeholders for missing payment logos", () => {
    expect(resolvePaymentLogoUrl(null, "https://gourmetsaudavel.com")).toBeNull();
    expect(resolvePaymentLogoUrl("", "https://gourmetsaudavel.com")).toBeNull();
    expect(resolvePaymentLogoUrl(undefined)).not.toBe("/placeholder-dish.png");
  });

  it("preserves Cloudinary admin logo values and rejects other absolute URLs for storage", () => {
    const url =
      "https://res.cloudinary.com/demo/image/upload/v1/payment/pluxee.webp";

    expect(normalizePaymentLogoInput(` ${url} `)).toBe(url);
    expect(normalizePaymentLogoInput("https://cdn.example.com/benefits/pluxee.webp")).toBe("");
  });

  it("router list returns brandLogoUrl and brandName", async () => {
    const mockMethods = [
      {
        id: 1,
        name: "Pix",
        isActive: true,
        displayOrder: 1,
        brandName: "Pix Logo",
        brandLogoUrl: "https://res.cloudinary.com/demo/image/upload/v1/payment/pix.webp",
      },
    ];

    dbMock.select.mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          orderBy: vi.fn().mockResolvedValue(mockMethods),
        }),
      }),
    });

    const caller = paymentMethodsRouter.createCaller({} as any);
    const result = await caller.list();
    expect(result).toEqual(mockMethods);
    expect(result[0].brandLogoUrl).toBe("https://res.cloudinary.com/demo/image/upload/v1/payment/pix.webp");
    expect(result[0].brandName).toBe("Pix Logo");
  });
});
