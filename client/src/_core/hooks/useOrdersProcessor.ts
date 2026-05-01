import { useMemo } from "react";
import {
  buildFlatLabels,
  cleanText,
  FlatLabel,
  normalizeOrderItems,
  OrderData,
  OrderItem as LogicOrderItem,
  ParsedOptions,
} from "@/pages/adminLabelEditor/print-engine/logic";
import { Order, OrderItem, OrderNutritionSummary } from "@/pages/profile/types/orderTypes";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isString(value: unknown): value is string {
  return typeof value === "string";
}

function toLogicOrderItem(item: OrderItem): LogicOrderItem {
  return {
    id: item.id,
    quantity: item.quantity,
    name: item.name,
    dish_name: item.dish_name,
    dishName: item.dishName,
    totalPrice: Number(item.totalPrice || 0),
    options: item.options,
    parsedOptions: item.parsedOptions,
    packageItems: item.packageItems,
    appliedNutrition: item.appliedNutrition,
    applied_nutrition: item.applied_nutrition,
    nutritionalInfo: item.nutritionalInfo ?? undefined,
  };
}

function toProfileOrderItem(
  item: LogicOrderItem,
  nutritionLabels: OrderNutritionSummary[],
): OrderItem {
  const options: string | ParsedOptions = isString(item.options) ? item.options : item.options ?? {};
  const parsedOptions: string | ParsedOptions | undefined = isString(item.parsedOptions)
    ? item.parsedOptions
    : item.parsedOptions;

  return {
    id: item.id,
    quantity: Number(item.quantity || 0),
    name: cleanText(item.name || item.dishName || item.dish_name || "Item"),
    dishName: isString(item.dishName) ? item.dishName : undefined,
    dish_name: isString(item.dish_name) ? item.dish_name : undefined,
    totalPrice: Number(item.totalPrice || 0),
    options,
    parsedOptions,
    packageItems: item.packageItems,
    appliedNutrition: item.appliedNutrition,
    applied_nutrition: item.applied_nutrition,
    nutritionalInfo: isRecord(item.nutritionalInfo) ? item.nutritionalInfo : null,
    nutritionLabels,
  };
}

export function useOrdersProcessor(orders: Order[]) {
  return useMemo(() => {
    if (!Array.isArray(orders)) return [];

    return [...orders]
      .sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      })
      .map((order) => {
        const normalizedItems = normalizeOrderItems((order.items ?? []).map(toLogicOrderItem));

        const orderForLogic: OrderData = {
          ...order,
          items: normalizedItems,
        };

        const flatLabels = buildFlatLabels(orderForLogic);

        const itemsWithLabels = normalizedItems.map((item) => {
          const itemLabels = flatLabels.filter((label) =>
            String(label.id).startsWith(`${String(item.id)}-`),
          );

          const nutritionLabels: OrderNutritionSummary[] = itemLabels.map((label: FlatLabel) => ({
            id: label.id,
            displayName: cleanText(label.displayName),
            mainDishName: cleanText(label.mainDishName),
            accompaniments: label.accompaniments.map(cleanText),
            combinedIngredients: cleanText(label.combinedIngredients || ""),
            nutrition: label.nutrition,
            slot: cleanText(label.slot),
            kcal: Math.round(label.nutrition?.energyKcal || 0),
            proteins: Math.round(label.nutrition?.proteins || 0),
            carbs: Math.round(label.nutrition?.carbs || 0),
            fat: Math.round(label.nutrition?.fatTotal || 0),
            hasNutrition: !!label.nutrition?.energyKcal,
          }));

          return toProfileOrderItem(item, nutritionLabels);
        });

        return {
          ...order,
          items: itemsWithLabels,
        };
      });
  }, [orders]);
}
