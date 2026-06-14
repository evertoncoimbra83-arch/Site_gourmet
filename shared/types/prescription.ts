export interface PrescriptionAccompaniment {
  id: string | number;
  name: string;
  isBase?: boolean;
  weight?: number | string;
  energyKcal?: number | string;
  proteins?: number | string;
  carbs?: number | string;
  fatTotal?: number | string;
  isActive?: boolean | null;
  isNoAccompaniment?: boolean | null;
  is_no_accompaniment?: boolean | null;
  groupId?: string | number | null;
  groupName?: string | null;
  defaultGrammage?: string | number | null;
  minSelections?: string | number | null;
  maxSelections?: string | number | null;
  sourceGroupId?: string | number | null;
  sourceGroupName?: string | null;
}

export interface PrescriptionAccompanimentGroup {
  id?: string | number | null;
  name?: string | null;
  minSelections?: string | number | null;
  maxSelections?: string | number | null;
  defaultGrammage?: string | number | null;
  isRequired?: boolean | null;
  options?: PrescriptionAccompaniment[] | null;
}

export interface PrescriptionSize {
  id: number;
  price?: string | number;
  weight?: number | string;
  mainDishWeight?: number | string;
  noAccompanimentsMessage?: string | null;
  price_modifier?: string | number;
  displayOrder?: string | number | null;
  name?: string;
  isDefault?: boolean;
  groups?: PrescriptionAccompanimentGroup[] | null;
  accompanimentGroups?: PrescriptionAccompanimentGroup[] | null;
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
  weight?: number | string | null;
  sizeWeight?: number | string | null;
  mainDishWeight?: number;
  macros?: PrescriptionBaseMacros | null;
  nutritionalData?: {
    mainDishWeight?: number;
    baseMacros?: PrescriptionBaseMacros;
    allowedAccompaniments?: PrescriptionAccompaniment[];
    autoSelectedAccompaniments?: number;
    recipeWeight?: number | string;
    recipe_weight?: number | string;
    sizeId?: number | string | null;
    sizeName?: string | null;
    weight?: number | string | null;
    sizeWeight?: number | string | null;
    noAccompanimentsMessage?: string | null;
    composition?: Array<Record<string, unknown>>;
  } | null;
  allowedAccompaniments?: PrescriptionAccompaniment[];
  availableSizes?: PrescriptionSize[];
  sizeName?: string | null;
  noAccompanimentsMessage?: string | null;
  legacySizeMissing?: boolean;
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
