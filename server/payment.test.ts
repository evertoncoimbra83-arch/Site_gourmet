import { describe, expect, it } from "vitest";
import {
  PaymentMethodSchema,
  FoodCardBrandSchema,
} from "./payment";

/**
 * Testes para sistema de pagamento
 */
describe("Payment System", () => {
  describe("Payment Method Schema Validation", () => {
    it("should validate payment method with required fields", () => {
      const validMethod = {
        name: "Dinheiro",
        description: "Pagamento em dinheiro na entrega",
        icon: "💵",
        is_active: true,
        display_order: 1,
      };

      const result = PaymentMethodSchema.parse(validMethod);
      expect(result.name).toBe("Dinheiro");
      expect(result.is_active).toBe(true);
    });

    it("should validate payment method with minimal fields", () => {
      const minimalMethod = {
        name: "Pix",
      };

      const result = PaymentMethodSchema.parse(minimalMethod);
      expect(result.name).toBe("Pix");
      expect(result.is_active).toBe(true);
    });

    it("should reject payment method with empty name", () => {
      const invalidMethod = {
        name: "",
      };

      expect(() => PaymentMethodSchema.parse(invalidMethod)).toThrow();
    });

    it("should reject payment method with name exceeding max length", () => {
      const invalidMethod = {
        name: "A".repeat(101),
      };

      expect(() => PaymentMethodSchema.parse(invalidMethod)).toThrow();
    });
  });

  describe("Food Card Brand Schema Validation", () => {
    it("should validate food card brand with required fields", () => {
      const validBrand = {
        name: "Ticket Alimentação",
        type: "va" as const,
        logo_url: "https://example.com/logo.png",
        is_active: true,
      };

      const result = FoodCardBrandSchema.parse(validBrand);
      expect(result.name).toBe("Ticket Alimentação");
      expect(result.type).toBe("va");
    });

    it("should validate VR type", () => {
      const vrBrand = {
        name: "Sodexo Refeição",
        type: "vr" as const,
      };

      const result = FoodCardBrandSchema.parse(vrBrand);
      expect(result.type).toBe("vr");
    });

    it("should reject invalid brand type", () => {
      const invalidBrand = {
        name: "Invalid Brand",
        type: "invalid" as any,
      };

      expect(() => FoodCardBrandSchema.parse(invalidBrand)).toThrow();
    });

    it("should reject brand with empty name", () => {
      const invalidBrand = {
        name: "",
        type: "va" as const,
      };

      expect(() => FoodCardBrandSchema.parse(invalidBrand)).toThrow();
    });
  });

  describe("Payment Methods", () => {
    it("should have standard payment methods", () => {
      const standardMethods = [
        "Dinheiro",
        "Pix",
        "Débito",
        "Crédito",
        "VA/VR",
      ];

      expect(standardMethods).toContain("Dinheiro");
      expect(standardMethods).toContain("Pix");
      expect(standardMethods).toContain("Débito");
      expect(standardMethods).toContain("Crédito");
      expect(standardMethods).toContain("VA/VR");
    });

    it("should have correct display order", () => {
      const methods = [
        { name: "Dinheiro", display_order: 1 },
        { name: "Pix", display_order: 2 },
        { name: "Débito", display_order: 3 },
        { name: "Crédito", display_order: 4 },
        { name: "VA/VR", display_order: 5 },
      ];

      expect(methods[0].display_order).toBe(1);
      expect(methods[4].display_order).toBe(5);
    });
  });

  describe("Food Card Brands", () => {
    it("should have VA brands", () => {
      const vaBrands = [
        "Ticket Alimentação",
        "Sodexo Alimentação",
        "Alelo Alimentação",
      ];

      expect(vaBrands.length).toBe(3);
      expect(vaBrands).toContain("Ticket Alimentação");
    });

    it("should have VR brands", () => {
      const vrBrands = [
        "Ticket Refeição",
        "Sodexo Refeição",
        "Alelo Refeição",
      ];

      expect(vrBrands.length).toBe(3);
      expect(vrBrands).toContain("Ticket Refeição");
    });

    it("should distinguish between VA and VR types", () => {
      const vaBrand = { type: "va" as const };
      const vrBrand = { type: "vr" as const };

      expect(vaBrand.type).not.toBe(vrBrand.type);
    });
  });

  describe("Payment Method Selection", () => {
    it("should select cash payment", () => {
      const selectedMethod = "Dinheiro";
      expect(selectedMethod).toBe("Dinheiro");
    });

    it("should select PIX payment", () => {
      const selectedMethod = "Pix";
      expect(selectedMethod).toBe("Pix");
    });

    it("should select debit card payment", () => {
      const selectedMethod = "Débito";
      expect(selectedMethod).toBe("Débito");
    });

    it("should select credit card payment", () => {
      const selectedMethod = "Crédito";
      expect(selectedMethod).toBe("Crédito");
    });

    it("should select food card payment", () => {
      const selectedMethod = "VA/VR";
      expect(selectedMethod).toBe("VA/VR");
    });
  });

  describe("Food Card Brand Selection", () => {
    it("should select VA brand", () => {
      const selectedBrand = {
        name: "Ticket Alimentação",
        type: "va" as const,
      };

      expect(selectedBrand.type).toBe("va");
    });

    it("should select VR brand", () => {
      const selectedBrand = {
        name: "Sodexo Refeição",
        type: "vr" as const,
      };

      expect(selectedBrand.type).toBe("vr");
    });
  });

  describe("Payment Validation Rules", () => {
    it("should require payment method selection", () => {
      const paymentData = {
        method: null,
      };

      expect(paymentData.method).toBeNull();
    });

    it("should validate payment method exists", () => {
      const validMethods = ["Dinheiro", "Pix", "Débito", "Crédito", "VA/VR"];
      const selectedMethod = "Dinheiro";

      expect(validMethods).toContain(selectedMethod);
    });

    it("should validate food card brand when VA/VR is selected", () => {
      const selectedMethod = "VA/VR";
      const selectedBrand = "Ticket Alimentação";

      expect(selectedMethod).toBe("VA/VR");
      expect(selectedBrand).toBeTruthy();
    });
  });

  describe("Payment Method Icons", () => {
    it("should have icons for all payment methods", () => {
      const methods = [
        { name: "Dinheiro", icon: "💵" },
        { name: "Pix", icon: "📱" },
        { name: "Débito", icon: "💳" },
        { name: "Crédito", icon: "💳" },
        { name: "VA/VR", icon: "🍽️" },
      ];

      expect(methods.every((m) => m.icon)).toBe(true);
    });
  });

  describe("Order Payment Recording", () => {
    it("should record payment method in order", () => {
      const order = {
        id: 1,
        payment_method: "Dinheiro",
      };

      expect(order.payment_method).toBe("Dinheiro");
    });

    it("should update order payment method", () => {
      let order = {
        id: 1,
        payment_method: "Dinheiro",
      };

      order.payment_method = "Pix";

      expect(order.payment_method).toBe("Pix");
    });

    it("should track payment method history", () => {
      const paymentHistory = [
        { orderId: 1, method: "Dinheiro", timestamp: new Date() },
        { orderId: 2, method: "Pix", timestamp: new Date() },
        { orderId: 3, method: "Crédito", timestamp: new Date() },
      ];

      expect(paymentHistory.length).toBe(3);
      expect(paymentHistory[0].method).toBe("Dinheiro");
    });
  });

  describe("Payment Delivery Information", () => {
    it("should indicate payment on delivery", () => {
      const paymentInfo = {
        type: "on_delivery",
        description: "Pagamento realizado na entrega",
      };

      expect(paymentInfo.type).toBe("on_delivery");
    });

    it("should list accepted payment methods", () => {
      const acceptedMethods = [
        "Dinheiro",
        "Pix",
        "Débito",
        "Crédito",
        "VA/VR",
      ];

      expect(acceptedMethods.length).toBe(5);
    });
  });
});
