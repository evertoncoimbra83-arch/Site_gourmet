import { describe, it, expect } from "vitest";
import {
  normalizePurchaseUnit,
  convertPurchaseQuantityToBaseUnit,
  calculateCostPerBaseUnit,
  inferClassificationStatus,
  validatePurchaseItem,
  normalizePurchaseDescription,
  scoreClassificationRule,
  findBestClassificationRule,
  canApplyPurchaseItemCost,
  calculateCostDelta,
  validateCostApplication,
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

  describe("Sprint Financeira - Fase 2C - Regras de Classificação Assistida", () => {
    describe("normalizePurchaseDescription", () => {
      it("deve normalizar descrição removendo acentos e convertendo para minúsculo", () => {
        expect(normalizePurchaseDescription("Pêítô de Frângó!")).toBe("peito de frango");
        expect(normalizePurchaseDescription("  ETIQUETA   zebra  ")).toBe("etiqueta zebra");
      });
    });

    describe("scoreClassificationRule", () => {
      it("deve retornar 100 para match exato", () => {
        expect(scoreClassificationRule("peito de frango", "Peito de Frango")).toBe(100);
      });

      it("deve retornar 50+ se for parcial", () => {
        expect(scoreClassificationRule("peito de frango Seara 1kg", "Peito de Frango")).toBeGreaterThanOrEqual(50);
      });

      it("deve retornar 0 se não houver match", () => {
        expect(scoreClassificationRule("detergente Ype", "Peito de Frango")).toBe(0);
      });
    });

    describe("findBestClassificationRule", () => {
      const mockRules = [
        {
          id: 1,
          pattern: "peito de frango",
          category: "FOOD_INGREDIENT",
          linkedEntityType: "ingredient",
          linkedEntityId: 10,
          confidence: 3,
        },
        {
          id: 2,
          pattern: "pote 300g",
          category: "PACKAGING",
          linkedEntityType: "packaging",
          linkedEntityId: 20,
          conversionFactor: 100,
          confidence: 2,
        },
        {
          id: 3,
          pattern: "etiqueta zebra",
          category: "LABEL_PRINTING",
          confidence: 1,
        },
      ];

      it("deve sugerir FOOD_INGREDIENT com match exato", () => {
        const res = findBestClassificationRule("Peito de Frango", mockRules);
        expect(res).not.toBeNull();
        expect(res?.category).toBe("FOOD_INGREDIENT");
        expect(res?.linkedEntityId).toBe(10);
        expect(res?.confidence).toBe(3);
      });

      it("deve sugerir PACKAGING com match parcial e conversionFactor", () => {
        const res = findBestClassificationRule("Pote 300g transparente", mockRules);
        expect(res).not.toBeNull();
        expect(res?.category).toBe("PACKAGING");
        expect(res?.linkedEntityId).toBe(20);
        expect(res?.conversionFactor).toBe(100);
      });

      it("deve sugerir LABEL_PRINTING sem linkedEntityId", () => {
        const res = findBestClassificationRule("Etiqueta Zebra rolo 1000", mockRules);
        expect(res).not.toBeNull();
        expect(res?.category).toBe("LABEL_PRINTING");
        expect(res?.linkedEntityId).toBeNull();
      });

      it("não deve sugerir se a confiança/score for muito baixo", () => {
        const res = findBestClassificationRule("detergente liquido ype", mockRules);
        expect(res).toBeNull();
      });
    });
  });

  describe("Sprint Financeira - Fase 2D - Aplicação Controlada do Custo Vigente", () => {
    describe("canApplyPurchaseItemCost", () => {
      it("deve permitir aplicação para FOOD_INGREDIENT classificado como ingredient e com ID válido", () => {
        const item = {
          category: "FOOD_INGREDIENT",
          linkedEntityType: "ingredient",
          linkedEntityId: 15,
          computedCostPerBaseUnit: 1.5,
          classificationStatus: "classified",
        };
        expect(canApplyPurchaseItemCost(item)).toBe(true);
      });

      it("deve bloquear aplicação para PACKAGING ou LABEL_PRINTING", () => {
        const packagingItem = {
          category: "PACKAGING",
          linkedEntityType: "packaging",
          linkedEntityId: 15,
          computedCostPerBaseUnit: 1.5,
          classificationStatus: "classified",
        };
        expect(canApplyPurchaseItemCost(packagingItem)).toBe(false);
      });

      it("deve bloquear aplicação para itens ignorados ou pendentes", () => {
        const pendingItem = {
          category: "FOOD_INGREDIENT",
          linkedEntityType: "ingredient",
          linkedEntityId: 15,
          computedCostPerBaseUnit: 1.5,
          classificationStatus: "pending",
        };
        expect(canApplyPurchaseItemCost(pendingItem)).toBe(false);

        const ignoredItem = {
          category: "IGNORE",
          linkedEntityType: "ingredient",
          linkedEntityId: 15,
          computedCostPerBaseUnit: 1.5,
          classificationStatus: "ignored",
        };
        expect(canApplyPurchaseItemCost(ignoredItem)).toBe(false);
      });

      it("deve bloquear se faltar linkedEntityId ou computedCostPerBaseUnit", () => {
        const itemWithoutId = {
          category: "FOOD_INGREDIENT",
          linkedEntityType: "ingredient",
          linkedEntityId: null,
          computedCostPerBaseUnit: 1.5,
          classificationStatus: "classified",
        };
        expect(canApplyPurchaseItemCost(itemWithoutId)).toBe(false);

        const itemWithoutCost = {
          category: "FOOD_INGREDIENT",
          linkedEntityType: "ingredient",
          linkedEntityId: 15,
          computedCostPerBaseUnit: null,
          classificationStatus: "classified",
        };
        expect(canApplyPurchaseItemCost(itemWithoutCost)).toBe(false);
      });

      it("deve bloquear custos negativos", () => {
        const itemNegativeCost = {
          category: "FOOD_INGREDIENT",
          linkedEntityType: "ingredient",
          linkedEntityId: 15,
          computedCostPerBaseUnit: -0.5,
          classificationStatus: "classified",
        };
        expect(canApplyPurchaseItemCost(itemNegativeCost)).toBe(false);
      });
    });

    describe("calculateCostDelta", () => {
      it("deve calcular delta absoluto e percentual corretamente", () => {
        const res = calculateCostDelta(10, 12);
        expect(res.diffAbsolute).toBe(2);
        expect(res.diffPercent).toBe(20);
        expect(res.isHighVariance).toBe(false);
      });

      it("deve marcar variação alta quando maior ou igual a 30%", () => {
        const resPositive = calculateCostDelta(10, 13);
        expect(resPositive.isHighVariance).toBe(true);

        const resNegative = calculateCostDelta(10, 7);
        expect(resNegative.isHighVariance).toBe(true);
      });

      it("não deve disparar variação alta para valores menores que 30%", () => {
        const res = calculateCostDelta(100, 129);
        expect(res.isHighVariance).toBe(false);
      });

      it("deve lidar de forma segura com custos zerados ou inválidos sem gerar NaN/Infinity", () => {
        const resCurrentZero = calculateCostDelta(0, 10);
        expect(resCurrentZero.diffAbsolute).toBe(10);
        expect(resCurrentZero.diffPercent).toBe(0);
        expect(resCurrentZero.isHighVariance).toBe(false);

        const resInvalid = calculateCostDelta(NaN, 10);
        expect(resInvalid.diffAbsolute).toBe(0);
        expect(resInvalid.diffPercent).toBe(0);
        expect(resInvalid.isHighVariance).toBe(false);
      });
    });

    describe("validateCostApplication", () => {
      it("deve passar para custo válido maior que zero", () => {
        const res = validateCostApplication(10, 12);
        expect(res.valid).toBe(true);
        expect(res.error).toBeUndefined();
      });

      it("deve reprovar custos negativos", () => {
        const res = validateCostApplication(10, -5);
        expect(res.valid).toBe(false);
        expect(res.error).toBe("O custo sugerido não pode ser negativo.");
      });

      it("deve retornar warning para custo zero", () => {
        const res = validateCostApplication(10, 0);
        expect(res.valid).toBe(true);
        expect(res.warning).toBeDefined();
      });
    });
  });
});
