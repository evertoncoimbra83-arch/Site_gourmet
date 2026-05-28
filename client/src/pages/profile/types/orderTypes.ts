import type {
  MealOption,
  NutritionData,
  ParsedOptions,
} from "../../adminLabelEditor/print-engine/logic";

export interface OrderItem {
  id: string | number;
  quantity: number | string;
  name: string;
  dishName?: string;
  dish_name?: string;
  totalPrice: number | string;
  options: string | ParsedOptions;
  parsedOptions?: string | ParsedOptions;
  packageItems?: MealOption[];
  appliedNutrition?: unknown;
  applied_nutrition?: unknown;
  nutritionalInfo?: Record<string, unknown> | null;
  nutritionLabels?: OrderNutritionSummary[];
  imageUrl?: string | null;
  sizeName?: string | null;
  size_name?: string | null;
  [key: string]: unknown;
}

export interface Order {
  id: string | number;
  status: string;
  total: number | string;
  subtotal: number | string;
  shippingCost: number | string;
  shippingType?: string;
  customerName?: string;
  shippingAddress?: string | Record<string, unknown>;
  createdAt: string | Date;
  pointsEarned?: number;
  pointsUsed?: number;
  loyaltyDiscount?: number | string;
  loyalty_discount?: number | string;
  loyaltyPointsEarned?: number;
  loyalty_points_earned?: number;
  loyaltyPointsUsed?: number;
  loyalty_points_used?: number;
  discountsSnapshot?: string | Record<string, unknown>;
  items: OrderItem[];
  notes?: string;
}

export interface OrderNutritionSummary {
  id: string | number;
  displayName: string;
  mainDishName: string;
  accompaniments: string[];
  combinedIngredients: string;
  nutrition: NutritionData | null;
  slot?: string;
  parentName?: string;
  kcal: number;
  proteins: number;
  carbs: number;
  fat: number;
  hasNutrition: boolean;
  sizeName?: string | null;
}

export interface NutritionStats {
  kcal: number;
  proteins: number;
  carbs: number;
  fat: number;
}
