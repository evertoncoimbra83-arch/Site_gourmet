import { describe, expect, it } from "vitest";

import {
  normalizeDisplayPoints,
  normalizeMoneyValue,
} from "../client/src/_core/hooks/useCartLoyalty.js";

describe("cart loyalty display coercion", () => {
  it("nao exibe NaN no indicador de pontos", () => {
    expect(normalizeDisplayPoints("not-a-number")).toBe(0);
    expect(Number.isNaN(normalizeDisplayPoints(Number.NaN))).toBe(false);
  });

  it("coage pontos para inteiros seguros e nao negativos", () => {
    expect(normalizeDisplayPoints("12.9")).toBe(12);
    expect(normalizeDisplayPoints(-10)).toBe(0);
  });

  it("coage valores monetarios invalidos para zero", () => {
    expect(normalizeMoneyValue(undefined)).toBe(0);
    expect(normalizeMoneyValue("abc")).toBe(0);
  });
});
