import { describe, it, expect, vi, beforeEach } from "vitest";
import fs from "fs";
import path from "path";

// Mocking getDb
const dbMock = vi.hoisted(() => {
  const select = vi.fn();
  const update = vi.fn();
  const deleteFn = vi.fn();
  const insert = vi.fn();
  const execute = vi.fn();
  return { select, update, delete: deleteFn, insert, execute };
});

vi.mock("../../db.js", () => ({
  getDb: vi.fn(async () => dbMock),
}));

vi.mock("../../dishes.js", () => ({
  getDishDetails: vi.fn(async (id: number) => ({
    id,
    name: "Prato Teste",
    isActive: true,
    price: 20.00,
    sizes: [
      {
        id: "size-1",
        name: "M",
        priceModifier: 0.00,
        accompanimentGroups: []
      }
    ]
  }))
}));

import { calculatePricing } from "../../../shared/domain/cart/pricing.js";
import { recalculateCheckoutFromCart } from "./recalculateOrder.js";
import {
  carts,
  cartItems,
  paymentMethods,
  discountRules,
  coupons,
  loyaltySettings,
  users,
  couponUsage,
} from "../../../drizzle/schema/index.js";

describe("Sprint Comercial P1-A — Testes de Blindagem Comercial", () => {
  // Outer variables for query mock routing
  let currentCart: any;
  let currentCartItems: any[];
  let currentPaymentMethod: any;
  let currentRules: any[];
  let currentCoupon: any;
  let currentLoyaltySettings: any;
  let currentUser: any;
  let currentCouponUsageCount: number;

  beforeEach(() => {
    vi.restoreAllMocks();
    dbMock.select.mockReset();
    dbMock.update.mockReset();
    dbMock.delete.mockReset();
    dbMock.insert.mockReset();
    dbMock.execute.mockReset();

    // Default setups
    currentCart = {
      id: "cart-uuid",
      couponCode: "CUPOM10",
      couponId: "coupon-uuid",
      usesLoyalty: true,
      userId: "user-123"
    };

    currentCartItems = [
      { id: "item-1", dishId: "1", quantity: 8, unitPrice: "20.00", options: { selectedSizeId: "size-1" } } // subtotal = 160
    ];

    currentPaymentMethod = {
      id: "payment-pix",
      name: "Pix",
      discountPercentage: "10.00"
    };

    currentRules = [
      { id: 7, name: "Progressivo 5%", minQuantity: 8, discountValue: "5.00", type: "percentage", isActive: 1 }
    ];

    currentCoupon = {
      id: "coupon-uuid",
      code: "CUPOM10",
      discountType: "fixed",
      discountValue: "20.00",
      isActive: 1,
      minOrderValue: "0.00",
      maxUsesPerCustomer: null
    };

    currentLoyaltySettings = {
      id: "1",
      enabled: 1,
      redemptionRatePoints: 100,
      redemptionRateMoney: "1.00",
      maxDiscountAmount: "50.00",
      redemptionRules: []
    };

    currentUser = {
      id: "user-123",
      availablePoints: 3000 // worth R$ 30
    };

    currentCouponUsageCount = 0;

    // Table-based query routing mock
    dbMock.select.mockImplementation(() => {
      return {
        from: vi.fn().mockImplementation((table: any) => {
          let resolvedValue: any = [];

          if (table === carts) {
            resolvedValue = [currentCart];
          } else if (table === cartItems) {
            resolvedValue = currentCartItems;
          } else if (table === paymentMethods) {
            resolvedValue = [currentPaymentMethod];
          } else if (table === discountRules) {
            resolvedValue = currentRules;
          } else if (table === coupons) {
            resolvedValue = [currentCoupon];
          } else if (table === loyaltySettings) {
            resolvedValue = [currentLoyaltySettings];
          } else if (table === users) {
            resolvedValue = [currentUser];
          } else if (table === couponUsage) {
            resolvedValue = [{ count: currentCouponUsageCount }];
          }

          const queryChain = {
            where: vi.fn().mockReturnThis(),
            orderBy: vi.fn().mockReturnThis(),
            limit: vi.fn().mockResolvedValue(resolvedValue),
            leftJoin: vi.fn().mockReturnThis(),
            groupBy: vi.fn().mockReturnThis(),
            then: (cb: any) => Promise.resolve(resolvedValue).then(cb),
          };
          return queryChain;
        })
      };
    });
  });

  describe("Fase 3: Motor de Precificação (fixed vs percentage)", () => {
    const mockItems = [
      { id: "item-1", name: "Marmita Fit", price: 20, quantity: 5 } // subtotal = 100
    ];

    it("deve aplicar desconto percentual corretamente", () => {
      const rules = [
        { id: 1, name: "Promo 10%", minQuantity: 5, discountValue: 10, type: "percentage", isActive: true }
      ];
      const result = calculatePricing(mockItems, rules);
      expect(result.subtotal).toBe(100);
      expect(result.discounts).toBe(10); // 10% of 100
      expect(result.total).toBe(90);
    });

    it("deve aplicar desconto fixo (fixed) corretamente", () => {
      const rules = [
        { id: 1, name: "Promo R$15", minQuantity: 5, discountValue: 15, type: "fixed", isActive: true }
      ];
      const result = calculatePricing(mockItems, rules);
      expect(result.subtotal).toBe(100);
      expect(result.discounts).toBe(15); // R$ 15 fixed
      expect(result.total).toBe(85);
    });

    it("deve limitar o desconto ao valor do subtotal bruto (clamping)", () => {
      const rules = [
        { id: 1, name: "Super Desconto R$150", minQuantity: 5, discountValue: 150, type: "fixed", isActive: true }
      ];
      const result = calculatePricing(mockItems, rules);
      expect(result.subtotal).toBe(100);
      expect(result.discounts).toBe(100); // capped at subtotal
      expect(result.total).toBe(0);
    });
  });

  describe("Fase 2: Resolução Automática de Cumulatividade (Prioridade)", () => {
    it("Fidelidade deve vencer Cupom e Progressivo (Fidelidade > Cupom > Progressivo)", async () => {
      currentCart.usesLoyalty = true;
      currentCart.couponCode = "CUPOM10";
      // subtotal triggers progressive (8 * 20 = 160)

      const res = await recalculateCheckoutFromCart({
        userId: "user-123",
        cartId: "cart-uuid",
        shippingCost: 0,
        paymentMethodId: "payment-pix",
        useLoyaltyPoints: true // Selected
      });

      expect(res.loyaltyDiscount).toBe(30); // 3000 points = R$ 30
      expect(res.couponDiscount).toBe(0); // Suppressed
      expect(res.autoDiscount).toBe(0); // Suppressed
      expect(res.paymentDiscount).toBe(16); // 10% of 160 (PIX coexists)
      expect(res.total).toBe(114); // 160 - 30 (loyalty) - 16 (pix) = 114
    });

    it("cliente com 1134 pontos usa saldo oficial no checkout sem saldo negativo", async () => {
      currentCart.usesLoyalty = true;
      currentCart.couponCode = null;
      currentUser.availablePoints = 1134;

      const res = await recalculateCheckoutFromCart({
        userId: "user-123",
        cartId: "cart-uuid",
        shippingCost: 0,
        paymentMethodId: "payment-pix",
        useLoyaltyPoints: true,
      });

      expect(res.loyaltyDiscount).toBe(11.34);
      expect(res.pointsUsed).toBe(1134);
      expect(res.pointsUsed).toBeGreaterThanOrEqual(0);
      expect(dbMock.insert).not.toHaveBeenCalled();
      expect(dbMock.update).not.toHaveBeenCalled();
    });

    it("simulacao de checkout nao consome pontos quando fidelidade esta ativa", async () => {
      currentCart.usesLoyalty = true;
      currentUser.availablePoints = 3000;

      await recalculateCheckoutFromCart({
        userId: "user-123",
        cartId: "cart-uuid",
        shippingCost: 0,
        paymentMethodId: "payment-pix",
        useLoyaltyPoints: true,
      });

      expect(dbMock.insert).not.toHaveBeenCalled();
      expect(dbMock.update).not.toHaveBeenCalled();
    });

    it("Cupom deve vencer Progressivo se Fidelidade estiver inativa", async () => {
      currentCart.usesLoyalty = false;
      currentCart.couponCode = "CUPOM10";

      const res = await recalculateCheckoutFromCart({
        userId: "user-123",
        cartId: "cart-uuid",
        shippingCost: 0,
        paymentMethodId: "payment-pix",
        useLoyaltyPoints: false // Fidelidade inativa
      });

      expect(res.couponDiscount).toBe(20); // R$ 20 fixed coupon
      expect(res.loyaltyDiscount).toBe(0); // Suppressed
      expect(res.autoDiscount).toBe(0); // Suppressed
      expect(res.paymentDiscount).toBe(16); // 10% of 160 (PIX coexists)
      expect(res.total).toBe(124); // 160 - 20 - 16 = 124
    });

    it("Progressivo deve aplicar se Fidelidade e Cupom estiverem inativos", async () => {
      currentCart.usesLoyalty = false;
      currentCart.couponCode = null;

      const res = await recalculateCheckoutFromCart({
        userId: "user-123",
        cartId: "cart-uuid",
        shippingCost: 0,
        paymentMethodId: "payment-pix",
        useLoyaltyPoints: false
      });

      expect(res.autoDiscount).toBe(8); // 5% of 160 = 8
      expect(res.couponDiscount).toBe(0);
      expect(res.loyaltyDiscount).toBe(0);
      expect(res.paymentDiscount).toBe(16); // 10% of 160
      expect(res.total).toBe(136); // 160 - 8 - 16 = 136
    });
  });

  describe("Fase 4: Limite de Cupom por Cliente (maxUsesPerCustomer)", () => {
    beforeEach(() => {
      currentCoupon.maxUsesPerCustomer = 2;
    });

    it("deve barrar a aplicação se o cliente excedeu o limite de usos anteriores", async () => {
      currentCouponUsageCount = 2; // usage count is 2 (equal to limit)

      const { validateCoupon } = await import("../../coupon.js");
      const result = await validateCoupon("CUPOM10", "user-123", 100);
      expect(result.isValid).toBe(false);
      expect(result.message).toContain("Limite de uso por cliente atingido");
      expect(result.discountAmount).toBe(0);
    });

    it("deve permitir a aplicação se o cliente está abaixo do limite de usos", async () => {
      currentCouponUsageCount = 1; // usage count is 1 (less than limit)

      const { validateCoupon } = await import("../../coupon.js");
      const result = await validateCoupon("CUPOM10", "user-123", 100);
      expect(result.isValid).toBe(true);
      expect(result.discountAmount).toBe(20);
    });
  });

  describe("Fase 4: Validação Física da Migração", () => {
    it("deve conter a migração gerada com a coluna max_uses_per_customer", () => {
      const migrationsDir = path.join(process.cwd(), "drizzle-migrations");
      const files = fs.readdirSync(migrationsDir);
      const sqlFiles = files.filter(f => f.endsWith(".sql"));

      let foundColumn = false;
      for (const file of sqlFiles) {
        const content = fs.readFileSync(path.join(migrationsDir, file), "utf-8");
        if (content.includes("max_uses_per_customer")) {
          foundColumn = true;
          break;
        }
      }
      expect(foundColumn).toBe(true);
    });
  });
});
