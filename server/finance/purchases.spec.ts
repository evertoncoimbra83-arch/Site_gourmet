import { describe, it, expect } from "vitest";
import {
  normalizePurchaseUnit,
  convertPurchaseQuantityToBaseUnit,
  calculateCostPerBaseUnit,
  inferClassificationStatus,
  validatePurchaseItem,
} from "./purchases";

describe("Sprint Financeira - Fase 2B - purchases.ts (Helpers de Entrada de Compras)", () => {
  describe("normalizePurchaseUnit", () => {
    it("deve normalizar unidades suportadas para minúsculo e sem espaços", () => {
      expect(normalizePurchaseUnit("KG ")).toBe("kg");
      expect(normalizePurchaseUnit("  l  ")).toBe("l");
      expect(normalizePurchaseUnit("Caixa")).toBe("caixa");
      expect(normalizePurchaseUnit("g")).toBe("g");
      expect(normalizePurchaseUnit("un")).toBe("un");
    });

    it("deve retornar 'un' como fallback para unidades não suportadas", () => {
      expect(normalizePurchaseUnit("saco")).toBe("un");
      expect(normalizePurchaseUnit("")).toBe("un");
      expect(normalizePurchaseUnit(null as any)).toBe("un");
    });
  });

  describe("convertPurchaseQuantityToBaseUnit", () => {
    it("deve converter kg para g (multiplica por 1000)", () => {
      expect(convertPurchaseQuantityToBaseUnit(2, "kg")).toBe(2000);
      expect(convertPurchaseQuantityToBaseUnit(0.5, "kg")).toBe(500);
    });

    it("deve converter l para ml (multiplica por 1000)", () => {
      expect(convertPurchaseQuantityToBaseUnit(1.5, "l")).toBe(1500);
    });

    it("deve manter unidade base como un se for un", () => {
      expect(convertPurchaseQuantityToBaseUnit(10, "un")).toBe(10);
    });

    it("deve exigir conversionFactor e converter pacote, rolo e caixa", () => {
      // Caixa com conversionFactor
      expect(convertPurchaseQuantityToBaseUnit(3, "caixa", 50)).toBe(150);
      // Pacote com conversionFactor
      expect(convertPurchaseQuantityToBaseUnit(2, "pacote", 10)).toBe(20);
      // Rolo com conversionFactor
      expect(convertPurchaseQuantityToBaseUnit(1, "rolo", 100)).toBe(100);
    });

    it("deve retornar 0 para pacote, rolo ou caixa se conversionFactor não for informado ou for inválido", () => {
      expect(convertPurchaseQuantityToBaseUnit(3, "caixa")).toBe(0);
      expect(convertPurchaseQuantityToBaseUnit(3, "caixa", 0)).toBe(0);
      expect(convertPurchaseQuantityToBaseUnit(3, "caixa", -5)).toBe(0);
    });

    it("deve lidar de forma segura com quantidade zero ou menor que zero", () => {
      expect(convertPurchaseQuantityToBaseUnit(0, "kg")).toBe(0);
      expect(convertPurchaseQuantityToBaseUnit(-2, "g")).toBe(0);
      expect(convertPurchaseQuantityToBaseUnit(NaN, "un")).toBe(0);
    });
  });

  describe("calculateCostPerBaseUnit", () => {
    it("deve calcular o custo unitário por base unit", () => {
      expect(calculateCostPerBaseUnit(189.0, 10000)).toBe(0.0189);
      expect(calculateCostPerBaseUnit(31.0, 5000)).toBe(0.0062);
      expect(calculateCostPerBaseUnit(85.0, 100)).toBe(0.85);
    });

    it("deve arredondar para 6 casas decimais", () => {
      // 10 / 3 = 3.33333333333... -> 3.333333
      expect(calculateCostPerBaseUnit(10.0, 3)).toBe(3.333333);
      // 1 / 7 = 0.14285714... -> 0.142857
      expect(calculateCostPerBaseUnit(1.0, 7)).toBe(0.142857);
    });

    it("não deve gerar NaN ou Infinity e retornar 0 para entradas inválidas ou quantidades zeradas", () => {
      expect(calculateCostPerBaseUnit(10, 0)).toBe(0);
      expect(calculateCostPerBaseUnit(10, -1)).toBe(0);
      expect(calculateCostPerBaseUnit(0, 100)).toBe(0);
      expect(calculateCostPerBaseUnit(-5, 100)).toBe(0);
      expect(calculateCostPerBaseUnit(NaN, 100)).toBe(0);
      expect(calculateCostPerBaseUnit(10, NaN)).toBe(0);
      expect(calculateCostPerBaseUnit(Infinity, 100)).toBe(0);
      expect(calculateCostPerBaseUnit(10, Infinity)).toBe(0);
    });
  });

  describe("inferClassificationStatus", () => {
    it("deve retornar 'ignored' se a categoria for IGNORE", () => {
      const res = inferClassificationStatus({
        category: "IGNORE",
        unit: "un",
      });
      expect(res).toBe("ignored");
    });

    it("deve retornar 'classified' se categoria exigir vinculo (FOOD_INGREDIENT) e vinculo estiver correto", () => {
      const res = inferClassificationStatus({
        category: "FOOD_INGREDIENT",
        linkedEntityType: "ingredient",
        linkedEntityId: 12,
        unit: "kg",
      });
      expect(res).toBe("classified");
    });

    it("deve retornar 'pending' se categoria for FOOD_INGREDIENT mas não tiver vinculo técnico", () => {
      const res = inferClassificationStatus({
        category: "FOOD_INGREDIENT",
        unit: "kg",
      });
      expect(res).toBe("pending");
    });

    it("deve retornar 'pending' se categoria for PACKAGING, tiver vinculo, mas faltar conversionFactor para caixa", () => {
      const res = inferClassificationStatus({
        category: "PACKAGING",
        linkedEntityType: "packaging",
        linkedEntityId: 4,
        unit: "caixa",
        conversionFactor: null,
      });
      expect(res).toBe("pending");
    });

    it("deve retornar 'classified' se categoria for PACKAGING, tiver vinculo e conversionFactor preenchido", () => {
      const res = inferClassificationStatus({
        category: "PACKAGING",
        linkedEntityType: "packaging",
        linkedEntityId: 4,
        unit: "caixa",
        conversionFactor: 100,
      });
      expect(res).toBe("classified");
    });

    it("deve retornar 'classified' para categorias operacionais gerais que não exigem relacionamento", () => {
      expect(inferClassificationStatus({ category: "CLEANING", unit: "un" })).toBe("classified");
      expect(inferClassificationStatus({ category: "LOGISTICS", unit: "un" })).toBe("classified");
      expect(inferClassificationStatus({ category: "PAYMENT_OR_SERVICE_FEE", unit: "un" })).toBe("classified");
      expect(inferClassificationStatus({ category: "OPERATIONAL_EXPENSE", unit: "un" })).toBe("classified");
    });

    it("deve retornar 'pending' se não houver categoria", () => {
      expect(inferClassificationStatus({ unit: "un" })).toBe("pending");
    });
  });

  describe("validatePurchaseItem", () => {
    it("deve passar para itens válidos", () => {
      const res = validatePurchaseItem({
        rawDescription: "Peito de frango",
        quantity: 2,
        totalPrice: 40,
        unit: "kg",
      });
      expect(res.valid).toBe(true);
      expect(res.errors).toEqual([]);
    });

    it("deve reprovar se descrição estiver vazia", () => {
      const res = validatePurchaseItem({
        rawDescription: "",
        quantity: 2,
        totalPrice: 40,
        unit: "kg",
      });
      expect(res.valid).toBe(false);
      expect(res.errors).toContain("Descrição bruta do item é obrigatória.");
    });

    it("deve reprovar se quantidade for menor ou igual a zero", () => {
      const res = validatePurchaseItem({
        rawDescription: "Peito de frango",
        quantity: 0,
        totalPrice: 40,
        unit: "kg",
      });
      expect(res.valid).toBe(false);
      expect(res.errors).toContain("Quantidade deve ser maior que zero.");
    });

    it("deve reprovar se preço for negativo", () => {
      const res = validatePurchaseItem({
        rawDescription: "Peito de frango",
        quantity: 2,
        totalPrice: -1,
        unit: "kg",
      });
      expect(res.valid).toBe(false);
      expect(res.errors).toContain("Preço total não pode ser negativo.");
    });

    it("deve reprovar se unit exigir conversionFactor e ele for nulo ou inválido", () => {
      const res = validatePurchaseItem({
        rawDescription: "Potes plásticos",
        quantity: 2,
        totalPrice: 150,
        unit: "caixa",
      });
      expect(res.valid).toBe(false);
      expect(res.errors).toContain("Unidades agrupadas (caixa) exigem um fator de conversão maior que zero.");
    });
  });
});
