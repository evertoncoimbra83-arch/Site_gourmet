import type React from "react";

export interface Partner {
  name: string;
  link?: string;
  logo_url?: string;
  discount_text?: string;
}

export type PageState =
  | "missing-order-id"
  | "loading"
  | "access-denied"
  | "not-found"
  | "unexpected-error"
  | "ready";

export type PageStateContent = {
  title: string;
  eyebrow: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  primaryLabel: string;
  primaryTo?: string;
  primaryAction?: () => void;
  secondaryLabel?: string;
  secondaryTo?: string;
};

export type LoyaltyMetrics =
  | {
      currentPoints: number;
      pointsEarned: number;
      hasValidRewardRule: false;
    }
  | {
      currentPoints: number;
      pointsEarned: number;
      currentCashback: number;
      pointsNeeded: number;
      percentProgress: number;
      redemptionRateMoney: number;
      hasValidRewardRule: true;
    };

export interface SuccessSettings {
  successMessage: string;
  whatsapp: string;
  partners: Partner[];
}

export interface SuccessOrderItem {
  id?: string | number;
  quantity?: number | string;
  dishName?: string | null;
  name?: string | null;
  imageUrl?: string | null;
  totalPrice?: string | number | null;
  sizeName?: string | null;
  size_name?: string | null;
  options?: string | Record<string, unknown> | null;
  parsedOptions?: string | Record<string, unknown> | null;
}

export interface SuccessOrder {
  id?: string | number;
  customerName?: string | null;
  total?: string | number | null;
  paymentMethod?: string | null;
  pointsEarned?: string | number | null;
  items?: SuccessOrderItem[];
}

export interface SuccessPageViewModel {
  orderId: string | null;
  hasOrderId: boolean;
  displayOrderId: string;
  order: SuccessOrder | undefined;
  pageState: PageState;
  stateContent: PageStateContent | null;
  headerTitle: string;
  showReadyContent: boolean;
  settings: SuccessSettings;
  loyaltyMetrics: LoyaltyMetrics | null;
  showLoyaltyCard: boolean;
  money: (value: number) => string;
}
