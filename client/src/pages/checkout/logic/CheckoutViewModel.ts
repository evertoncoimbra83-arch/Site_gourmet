// client/src/pages/checkout/logic/CheckoutViewModel.ts

import type { Id } from "@/_core/type/utils";

export interface CheckoutCartItem {
  id: string;
  name: string;
  quantity: number;
  displayPrice: number;
  priceFormatted: string;
  displaySize: string | null;
  isPackage: boolean;
  packageMeals?: {
    dishName: string;
    accompaniments: string[];
  }[];
  accompaniments?: string[];
  hasNoAvailableAccompaniments?: boolean;
  noAccompanimentsMessage?: string;
}

export interface AddressItem {
  id: Id;
  street: string;
  number: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
  isDefault?: boolean;
}

export interface CheckoutViewModel {
  isLoading: boolean;
  isSubmitting: boolean;
  currentStep: number;
  session: {
    isReady: boolean;
    isLoading: boolean;
    userId: string | null;
  };

  customer: {
    name: string;
    cpf: string;
    phone: string;
    email: string;
    isCPFValid: boolean;
    errors?: {
      name?: string;
      cpf?: string;
      phone?: string;
      email?: string;
    };
  };

  logistics: {
    type: "delivery" | "pickup";
    addresses: AddressItem[];
    selectedAddressId: string | null;
    shippingCost: number;
    shippingCostFormatted: string;
    canContinue: boolean;
    errorMessage?: string;
    canDeliver: boolean;
    minOrderValue: number;
    isBelowMinForDelivery: boolean;
    shippingTypeManuallySelected: boolean;
    zipCode?: string;
  };

  payment: {
    methods: {
      id: string;
      name: string;
      discountLabel?: string;
    }[];
    selectedId: string | null;
  };

  summary: {
    items: CheckoutCartItem[];
    subtotal: number;
    subtotalFormatted: string;
    discounts: { label: string; valueFormatted: string }[];
    total: number;
    totalFormatted: string;
    notes: string;
    storeInfo?: {
      address: string;
      hours?: string;
    };
  };

  actions: {
    setField: (field: string, value: string | number | boolean | null) => void;
    setShippingType: (
      type: "delivery" | "pickup",
      options?: { manual?: boolean },
    ) => void;
    setAddress: (id: string) => void;
    setPayment: (id: string) => void;
    setNotes: (notes: string) => void;
    placeOrder: () => Promise<void>;
  };
}
