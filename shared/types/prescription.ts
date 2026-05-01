export interface PrescriptionAccompaniment {
  id: string | number;
  name: string;
  isBase?: boolean;
  weight?: number | string;
  energyKcal?: number | string;
  proteins?: number | string;
  carbs?: number | string;
  fatTotal?: number | string;
}

export interface PrescriptionSize {
  id: number;
  price?: string | number;
  weight?: number | string;
  mainDishWeight?: number | string;
  price_modifier?: string | number;
  name?: string;
  isDefault?: boolean;
}

export interface PrescriptionBaseMacros {
  kcal?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
}

export interface PrescriptionOption {
  id: string;
  dishId: string | number;
  name: string;
  basePrice?: number;
  multiplier?: string | number;
  price?: number;
  priceAtCreation?: number;
  isDefault?: boolean;
  sizeId?: number | string | null;
  mainDishWeight?: number;
  macros?: PrescriptionBaseMacros | null;
  nutritionalData?: {
    mainDishWeight?: number;
    baseMacros?: PrescriptionBaseMacros;
  } | null;
  allowedAccompaniments?: PrescriptionAccompaniment[];
  availableSizes?: PrescriptionSize[];
  [key: string]: unknown;
}

export interface PrescriptionGroup {
  id: string;
  name: string;
  minSelections?: number;
  maxSelections?: number;
  isRequired?: boolean;
  options: PrescriptionOption[];
}

export interface PrescriptionMeal {
  id: string;
  name: string;
  notes?: string;
  groups: PrescriptionGroup[];
}

export interface FullPrescription {
  id?: string;
  planName: string;
  meals: PrescriptionMeal[];
  technicalInsight?: string;
  totalKcalTarget?: number;
  discountPercentage?: number;
}

export type BuilderOption = PrescriptionOption;
export type BuilderGroup = PrescriptionGroup;
export type BuilderMeal = PrescriptionMeal;
export type BuilderPrescriptionState = FullPrescription;
