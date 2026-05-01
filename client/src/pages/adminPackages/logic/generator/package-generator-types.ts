// client/src/pages/adminPackages/logic/generator/package-generator-types.ts

export type GeneratorGoal =
  | "balanced"
  | "high_protein"
  | "low_carb"
  | "economical"
  | "varied";

export interface PackagePersona {
  id: string;
  label: string;
  goal: GeneratorGoal;
  weights: {
    nutrition: number;
    categoryMatch: number;
    sizeMatch: number;
    popularity: number;
    variety: number;
    repetitionPenalty: number;
    cost?: number;
  };
  constraints: {
    minProtein?: number;
    maxCarbs?: number;
    allowedCategoryIds?: string[];
    blockedCategoryIds?: string[];
    requireGroupIds?: string[];
    requireSizeIds?: string[];
    numOptions?: number;
    avoidRepeatedProtein?: boolean;
  };
}

export interface CandidateDish {
  id: string;
  name: string;
  category: string | null;
  categoryId: string | null;
  categoryName: string | null;
  sizeId: string;
  sizeIds: string[];
  protein: number;
  carbs: number;
  calories: number;
  price: number;
  popularityScore: number;
  proteinKey: string;
  allowedGroupIds: string[];
  isVegetarian: boolean;
  isGlutenFree: boolean;
  isLactoseFree: boolean;
}

export interface SlotDraft {
  maxAccompaniments: number;
  name: string;
  numOptions: number;
  allowedCategoryIds?: string[];
  requiredGroupIds?: string[];
  requiredSizeId?: string | null;
  // ✅ FIX: era string (singular), agora string[] para bater com o uso na UI
  allowedCategories?: string[];
}

export interface GeneratedSlot {
  name: string;
  dishIds: string[];
  sizeId?: string;
  groups: {
    id: string;
    customLabel: string;
    optionIds: (string | number)[];
    maxItems?: number;
  }[];
  reasons: string[];
}

export interface RawAccompanimentRule {
  id: string;  // ✅ FIX: era string | number, agora string (crypto.randomUUID() sempre retorna string)
  label: string;
  optionIds: string[];  // ✅ FIX: era (string | number)[], agora string[] (IDs convertidos antes de armazenar)
}

export interface GeneratorInput {
  rawAccompanimentRules: RawAccompanimentRule[];
  persona: PackagePersona;
  dishes: CandidateDish[];
  slots: SlotDraft[];
}

export interface GeneratorResult {
  slots: GeneratedSlot[];
  warnings: string[];
}