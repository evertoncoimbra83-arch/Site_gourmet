import { describe, it, expect } from "vitest";
import { calculateMargin } from "./marginCalculator";

describe("Sprint Financeira - Fase 1 - marginCalculator.ts", () => {
  it("deve calcular corretamente para um cenário simples de lucro positivo", () => {
    const res = calculateMargin({
      grossRevenue: 30.00,
      discounts: 0,
      ingredientCost: 10.00,
      packagingCost: 2.00,
      accompanimentCost: 1.00,
      paymentFeePercent: 2, // 2%
      paymentFeeFlat: 0.10,
      realShippingCost: 5.00,
      quantity: 1
    });

    expect(res.grossRevenue).toBe(30.00);
    expect(res.netRevenue).toBe(30.00);
    expect(res.productCost).toBe(13.00); // (10 + 2 + 1) * 1
    expect(res.paymentFee).toBe(0.70);   // (30 * 0.02) + 0.10
    expect(res.logisticsCost).toBe(5.00);
    expect(res.totalCost).toBe(18.70);   // 13 + 0.70 + 5.00
    expect(res.grossProfit).toBe(11.30);  // 30 - 18.70
    expect(res.marginPercent).toBe(37.67); // (11.30 / 30) * 100 = 37.6666... -> 37.67
    expect(res.warnings).toEqual([]);
  });

  it("deve calcular corretamente aplicando descontos", () => {
    const res = calculateMargin({
      grossRevenue: 50.00,
      discounts: 10.00,
      ingredientCost: 15.00,
      packagingCost: 1.50,
      paymentFeePercent: 3,
      paymentFeeFlat: 0,
      realShippingCost: 4.00
    });

    expect(res.netRevenue).toBe(40.00);  // 50 - 10
    expect(res.productCost).toBe(16.50); // (15 + 1.5) * 1
    expect(res.paymentFee).toBe(1.20);   // 40 * 0.03 = 1.20
    expect(res.logisticsCost).toBe(4.00);
    expect(res.totalCost).toBe(21.70);   // 16.5 + 1.2 + 4.0
    expect(res.grossProfit).toBe(18.30);  // 40.00 - 21.70
    expect(res.marginPercent).toBe(45.75); // (18.30 / 40.00) * 100
  });

  it("deve lidar com quantidade maior que 1 multiplicando custos proporcionalmente", () => {
    const res = calculateMargin({
      grossRevenue: 60.00,
      discounts: 0,
      ingredientCost: 8.00,
      packagingCost: 1.00,
      accompanimentCost: 1.00,
      paymentFeePercent: 1.5,
      paymentFeeFlat: 0.15,
      realShippingCost: 6.00,
      quantity: 3
    });

    expect(res.productCost).toBe(30.00); // (8 + 1 + 1) * 3 = 30.00
    expect(res.paymentFee).toBe(1.35);   // (60 * 0.015) + (0.15 * 3) = 0.90 + 0.45 = 1.35
    expect(res.logisticsCost).toBe(6.00);
    expect(res.totalCost).toBe(37.35);   // 30 + 1.35 + 6.00
    expect(res.grossProfit).toBe(22.65);  // 60 - 37.35
    expect(res.marginPercent).toBe(37.75); // (22.65 / 60) * 100
  });

  it("deve gerar avisos se houver custos ou taxas ausentes", () => {
    const res = calculateMargin({
      grossRevenue: 40.00,
      discounts: 0
    });

    expect(res.warnings).toContain("missingIngredientCost");
    expect(res.warnings).toContain("missingPackagingCost");
    expect(res.warnings).toContain("missingPaymentFee");
    expect(res.warnings).toContain("missingShippingCost");
  });

  it("deve lidar com lucro negativo/margem negativa emitindo aviso", () => {
    const res = calculateMargin({
      grossRevenue: 20.00,
      discounts: 5.00,
      ingredientCost: 20.00,
      packagingCost: 2.00,
      paymentFeePercent: 2,
      paymentFeeFlat: 0.20,
      realShippingCost: 10.00
    });

    expect(res.netRevenue).toBe(15.00); // 20 - 5
    expect(res.totalCost).toBe(32.50);  // CPV (22) + Taxas (15 * 0.02 + 0.20 = 0.50) + Frete (10) = 32.50
    expect(res.grossProfit).toBe(-17.50);
    expect(res.marginPercent).toBe(-116.67); // (-17.50 / 15.00) * 100 = -116.6666... -> -116.67
    expect(res.warnings).toContain("negativeMargin");
  });

  it("deve tratar receita líquida zero de forma segura sem NaN ou Infinity", () => {
    const res = calculateMargin({
      grossRevenue: 10.00,
      discounts: 10.00,
      ingredientCost: 5.00,
      packagingCost: 1.00,
      paymentFeePercent: 2,
      paymentFeeFlat: 0.10
    });

    expect(res.netRevenue).toBe(0);
    expect(res.grossProfit).toBe(-6.10); // CPV (6) + Flat Fee (0.10)
    expect(res.marginPercent).toBe(0);
    expect(res.warnings).toContain("zeroRevenue");
    expect(res.warnings).toContain("negativeMargin");
  });

  it("deve aplicar arredondamento monetário de duas casas decimais", () => {
    const res = calculateMargin({
      grossRevenue: 10.555,
      discounts: 1.222,
      ingredientCost: 3.333,
      packagingCost: 1.111,
      paymentFeePercent: 2.5,
      paymentFeeFlat: 0.05
    });

    expect(res.grossRevenue).toBe(10.56);
    expect(res.discounts).toBe(1.22);
    expect(res.netRevenue).toBe(9.34);
    expect(res.productCost).toBe(4.44); // (3.333 + 1.111) = 4.444 -> 4.44
    // Fee = (9.34 * 0.025) + 0.05 = 0.2335 + 0.05 = 0.2835 -> 0.28
    expect(res.paymentFee).toBe(0.28);
  });
});
