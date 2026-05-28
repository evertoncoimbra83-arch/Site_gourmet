// client/src/pages/checkout/logic/checkoutService.ts

export interface PlaceOrderPayload {
  id: string;
  paymentMethodId: string;
  shippingType: "delivery" | "pickup";
  addressId: string | null;
  customerName: string;
  customerDocument: string;
  customerPhone: string;
  useLoyaltyPoints: boolean;
  notes?: string;
}

export interface RawCheckoutSubmission {
  cartId: string;
  customerName: string;
  customerCpf: string;
  customerPhone: string;
  selectedPaymentId: string | number;
  selectedShippingType: "delivery" | "pickup";
  selectedAddressId: string | number | null;
  usesLoyalty: boolean;
  notes?: string;
}

export const CheckoutService = {
  preparePayload(raw: RawCheckoutSubmission): PlaceOrderPayload {
    return {
      id: raw.cartId,
      paymentMethodId: String(raw.selectedPaymentId),
      shippingType: raw.selectedShippingType,
      addressId:
        raw.selectedShippingType === "pickup"
          ? null
          : String(raw.selectedAddressId),
      customerName: raw.customerName.trim(),
      customerDocument: raw.customerCpf.replace(/\D/g, ""),
      customerPhone: raw.customerPhone.replace(/\D/g, ""),
      useLoyaltyPoints: Boolean(raw.usesLoyalty),
      notes: raw.notes?.trim() || undefined,
    };
  },
};
