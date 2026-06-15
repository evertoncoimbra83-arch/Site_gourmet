import { describe, it, expect } from "vitest";
import { formatters } from "@/pages/adminAnalytics/utils/formatters";

// Helper para normalizar espaços e facilitar asserção de moeda (como R$ 1.542,80)
const clean = (str: string) => str.replace(/\u00a0/g, " ").trim();

describe("Centralized Formatters (BI/Dashboard P1-C)", () => {
  describe("formatters.num", () => {
    it("should format integers with pt-BR thousand separator", () => {
      expect(formatters.num(1305)).toBe("1.305");
      expect(formatters.num(42)).toBe("42");
      expect(formatters.num(0)).toBe("0");
      expect(formatters.num("2500")).toBe("2.500");
      expect(formatters.num(null)).toBe("0");
    });
  });

  describe("formatters.money", () => {
    it("should format values to BRL currency", () => {
      expect(clean(formatters.money(1542.8))).toBe("R$ 1.542,80");
      expect(clean(formatters.money(0))).toBe("R$ 0,00");
      expect(clean(formatters.money("100.5"))).toBe("R$ 100,50");
      expect(clean(formatters.money(null))).toBe("R$ 0,00");
    });
  });

  describe("formatters.percent", () => {
    it("should format percentage with exactly 1 decimal place", () => {
      expect(formatters.percent(12.43)).toBe("12,4%");
      expect(formatters.percent(12)).toBe("12,0%");
      expect(formatters.percent(0)).toBe("0,0%");
      expect(formatters.percent("5.67")).toBe("5,7%");
      expect(formatters.percent(null)).toBe("0,0%");
    });
  });

  describe("formatters.avg", () => {
    it("should format average values correctly based on the metric key", () => {
      // Metricas financeiras
      expect(clean(formatters.avg(182.4, "revenue"))).toBe("R$ 182,40/dia");
      expect(clean(formatters.avg(82.3, "ticket"))).toBe("R$ 82,30/dia");
      expect(clean(formatters.avg(15, "discounts"))).toBe("R$ 15,00/dia");

      // Metricas discretas/quantidades
      expect(formatters.avg(1.4601769911504425, "orders")).toBe(
        "1,5 pedidos/dia"
      );
      expect(formatters.avg(3.22, "customers")).toBe("3,2 clientes/dia");

      // Fallback
      expect(formatters.avg(864, "other")).toBe("864 un./dia");
    });
  });

  describe("Calendar Days Calculation", () => {
    it("should correctly compute calendar days between startDate and endDate inclusive", () => {
      const startStr = "2026-05-01";
      const endStr = "2026-05-15";
      const start = new Date(`${startStr}T00:00:00`);
      const end = new Date(`${endStr}T00:00:00`);
      const diffTime = end.getTime() - start.getTime();
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1;

      expect(diffDays).toBe(15);
    });

    it("should return 1 for the same day", () => {
      const startStr = "2026-05-29";
      const endStr = "2026-05-29";
      const start = new Date(`${startStr}T00:00:00`);
      const end = new Date(`${endStr}T00:00:00`);
      const diffTime = end.getTime() - start.getTime();
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1;

      expect(diffDays).toBe(1);
    });
  });
});
