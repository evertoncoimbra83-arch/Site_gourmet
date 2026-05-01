export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  category?: string;
  isPackage?: boolean;
}

export interface DiscountRule {
  id: number;
  name: string;
  minQuantity: number;
  discountValue: number;
  isActive: boolean;
}

export interface PricingResult {
  subtotal: number;
  discounts: number;
  total: number;
  appliedRule: DiscountRule | null;
}