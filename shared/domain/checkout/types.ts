// shared/domain/checkout/types.ts

export type ShippingValidationType = "success" | "warning" | "error";

export interface ShippingValidation {
  isDeliverable: boolean;
  fee: number;
  minOrderValue: number | null;
  message: string;
  type: ShippingValidationType;
  cityMatch?: boolean;
}

export interface RawShippingResponse {
  isValid?: boolean;
  is_valid?: boolean;
  cityAllowed?: boolean;
  shippingCost?: number | string;
  price?: number | string;
  minOrderValue?: number | null;
}