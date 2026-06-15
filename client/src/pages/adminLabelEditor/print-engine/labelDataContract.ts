import { format, addDays } from "date-fns";

export interface LabelNutritionData {
  kcal: number;
  carbs: number;
  proteins: number;
  fats: number;
  saturatedFats: number;
  transFats: number;
  fiber: number;
  sodium: number;
  portionWeight: number;
}

export interface LabelDataContract {
  dishName: string;
  customerName: string;
  ingredients: string;
  accompaniments: string[];
  allergens: string;
  sizeName: string;
  fabricationDate: string;
  validityDate: string;
  orderId: string;
  itemIndex: number;
  totalItems: number;
  barcodeValue: string;
  nutrition: LabelNutritionData;
}

const DEFAULT_NUTRITION: LabelNutritionData = {
  kcal: 0,
  carbs: 0,
  proteins: 0,
  fats: 0,
  saturatedFats: 0,
  transFats: 0,
  fiber: 0,
  sodium: 0,
  portionWeight: 0,
};

export function normalizeLabelData(raw: Partial<LabelDataContract>): LabelDataContract {
  const nutrition = raw.nutrition
    ? {
        kcal: Number(raw.nutrition.kcal ?? 0),
        carbs: Number(raw.nutrition.carbs ?? 0),
        proteins: Number(raw.nutrition.proteins ?? 0),
        fats: Number(raw.nutrition.fats ?? 0),
        saturatedFats: Number(raw.nutrition.saturatedFats ?? 0),
        transFats: Number(raw.nutrition.transFats ?? 0),
        fiber: Number(raw.nutrition.fiber ?? 0),
        sodium: Number(raw.nutrition.sodium ?? 0),
        portionWeight: Number(raw.nutrition.portionWeight ?? 0),
      }
    : { ...DEFAULT_NUTRITION };

  return {
    dishName: String(raw.dishName ?? "").trim(),
    customerName: String(raw.customerName ?? "").trim(),
    ingredients: String(raw.ingredients ?? "").trim(),
    accompaniments: Array.isArray(raw.accompaniments)
      ? raw.accompaniments.map((acc) => String(acc ?? "").trim()).filter(Boolean)
      : [],
    allergens: String(raw.allergens ?? "").trim(),
    sizeName: String(raw.sizeName ?? "").trim(),
    fabricationDate: String(raw.fabricationDate ?? "").trim(),
    validityDate: String(raw.validityDate ?? "").trim(),
    orderId: String(raw.orderId ?? "").trim(),
    itemIndex: Number(raw.itemIndex ?? 1),
    totalItems: Number(raw.totalItems ?? 1),
    barcodeValue: String(raw.barcodeValue ?? "").trim(),
    nutrition,
  };
}

export function mapToLabelDataContract(
  flatLabel: any,
  order: any,
  validityDays = 90,
  itemIndex = 1,
  totalItems = 1
): LabelDataContract {
  const rawNutrition = flatLabel?.nutrition;
  const nutrition: LabelNutritionData = {
    kcal: Number(rawNutrition?.energyKcal ?? rawNutrition?.kcal ?? 0),
    carbs: Number(rawNutrition?.carbs ?? rawNutrition?.carbohydrates ?? 0),
    proteins: Number(rawNutrition?.proteins ?? rawNutrition?.protein ?? 0),
    fats: Number(rawNutrition?.fatTotal ?? rawNutrition?.fats ?? 0),
    saturatedFats: Number(rawNutrition?.fatSaturated ?? rawNutrition?.saturatedFats ?? 0),
    transFats: Number(rawNutrition?.fatTrans ?? rawNutrition?.transFats ?? 0),
    fiber: Number(rawNutrition?.fiber ?? rawNutrition?.dietary_fiber ?? 0),
    sodium: Number(rawNutrition?.sodium ?? rawNutrition?.salt ?? 0),
    portionWeight: Number(rawNutrition?.yieldWeight ?? rawNutrition?.yield_weight ?? 0),
  };

  const fabrication = new Date();
  const validity = addDays(fabrication, validityDays);

  return normalizeLabelData({
    dishName: flatLabel?.mainDishName ?? flatLabel?.displayName ?? "PRATO",
    customerName: order?.customerName ?? "CLIENTE",
    ingredients: flatLabel?.combinedIngredients ?? flatLabel?.dishIngredients ?? "",
    accompaniments: flatLabel?.accompaniments ?? [],
    allergens: "",
    sizeName: flatLabel?.sizeName ?? "PADRÃO",
    fabricationDate: format(fabrication, "dd/MM/yyyy"),
    validityDate: format(validity, "dd/MM/yyyy"),
    orderId: String(order?.id ?? ""),
    itemIndex,
    totalItems,
    barcodeValue: String(order?.id ?? "0000"),
    nutrition,
  });
}
