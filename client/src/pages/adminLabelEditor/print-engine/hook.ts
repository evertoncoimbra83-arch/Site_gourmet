import { useCallback, useMemo } from "react";
import { buildFlatLabels, createLabelContentParser, type OrderData } from "./logic";

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

  return { flatLabels, parseContent };
}

