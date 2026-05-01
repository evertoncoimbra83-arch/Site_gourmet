// client/src/pages/checkout/logic/checkoutService.ts

/**
 * ✅ Contrato de saída para o Servidor (tRPC)
 * Se você tiver uma pasta 'shared/types', pode mover esta interface para lá.
 */
export interface PlaceOrderPayload {
  id: string;
  paymentMethodId: string;
  shippingType: "delivery" | "pickup";
  addressId: string | null;
  customerName: string;
  customerDocument: string;
  customerPhone: string;
  shippingCost: number;
  discountAmount: number; // Soma de todos os descontos (Progressivo + Cupom + Pagamento)
  loyaltyDiscount: number;
  useLoyaltyPoints: boolean;
  totalAmount: number;
  notes?: string;
}

/**
 * ✅ Dados brutos vindos do ViewModel/Store
 * Reflete exatamente o que o useCheckoutViewModel possui no momento do envio.
 */
export interface RawCheckoutSubmission {
  cartId: string;
  customerName: string;
  customerCpf: string;
  customerPhone: string;
  selectedPaymentId: string | number;
  selectedShippingType: "delivery" | "pickup";
  selectedAddressId: string | number | null;
  shippingCost: number;
  // Agora separamos os descontos para clareza
  cartDiscounts: number;      // Progressivo + Cupom
  paymentDiscount: number;   // Desconto extra do PIX/Cartão
  loyaltyDiscount: number;
  usesLoyalty: boolean;
  finalTotal: number;
  notes?: string;
}

function toNumber(value: unknown, fallback = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export const CheckoutService = {
  /**
   * 🛠️ Transforma e limpa os dados da UI para o formato exigido pela API.
   */
  preparePayload(raw: RawCheckoutSubmission): PlaceOrderPayload {
    // Calculamos o desconto total (o que foi abatido do subtotal original)
    const totalDiscountAmount = toNumber(raw.cartDiscounts) + toNumber(raw.paymentDiscount);

    return {
      id: raw.cartId,
      paymentMethodId: String(raw.selectedPaymentId),
      shippingType: raw.selectedShippingType,
      addressId: raw.selectedShippingType === "pickup" ? null : String(raw.selectedAddressId),
      customerName: raw.customerName.trim(),
      customerDocument: raw.customerCpf.replace(/\D/g, ""),
      customerPhone: raw.customerPhone.replace(/\D/g, ""),
      shippingCost: toNumber(raw.shippingCost),
      discountAmount: totalDiscountAmount,
      loyaltyDiscount: toNumber(raw.loyaltyDiscount),
      useLoyaltyPoints: Boolean(raw.usesLoyalty),
      totalAmount: toNumber(raw.finalTotal),
      notes: raw.notes?.trim() || undefined,
    };
  }
};
