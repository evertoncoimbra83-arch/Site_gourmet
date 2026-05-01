import { useCallback, useMemo } from "react";
import {
  buildFlatLabels,
  createLabelContentParser,
  type OrderData,
  type FlatLabel,
  type NutritionData,
  type MealOption,
  type ParsedOptions,
  type OrderItem,
  type Accompaniment,
} from "../../../../../adminLabelEditor/print-engine/logic";
export type { OrderData, FlatLabel, NutritionData, MealOption, ParsedOptions, OrderItem, Accompaniment };

export function useLabelLogic(order: OrderData | null, selectedLabelIndex: number, validityDays = 90) {
  const flatLabels = useMemo(() => buildFlatLabels(order), [order]);
  const parser = useMemo(
    () => createLabelContentParser(order, flatLabels, validityDays),
    [order, flatLabels, validityDays],
  );

  const parseContent = useCallback(
    (content: string, overrideIndex?: number) => parser(content, overrideIndex ?? selectedLabelIndex),
    [parser, selectedLabelIndex],
  );

  return {
    flatLabels: flatLabels as FlatLabel[],
    parseContent,
  };
}
