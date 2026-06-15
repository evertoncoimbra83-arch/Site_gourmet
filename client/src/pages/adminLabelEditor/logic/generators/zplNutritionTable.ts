import { LabelElement, LabelData, pxToDots } from "../label-compiler";
import { formatNutritionTableText, type NutritionData } from "../../print-engine/logic";
import { generateZplTextBlock } from "../../print-engine/zplTextBlock";

const COMPACT_HEIGHT_DOTS = 150;

function toNutritionData(data: LabelData): NutritionData {
  const record = data as LabelData & {
    nutrition?: NutritionData | Record<string, unknown> | null;
    energyKcal?: string | number;
    energyKj?: string | number;
    sugars?: string | number;
    addedSugars?: string | number;
    fatSaturated?: string | number;
    fatTrans?: string | number;
    fiber?: string | number;
    sodium?: string | number;
    yieldWeight?: string | number;
  };

  if (record.nutrition && typeof record.nutrition === "object") {
    return record.nutrition as NutritionData;
  }

  return {
    energyKcal: Number(record.energyKcal ?? record.kcal ?? 0),
    energyKj: Number(record.energyKj ?? 0),
    carbs: Number(record.carbs ?? 0),
    sugars: Number(record.sugars ?? 0),
    addedSugars: Number(record.addedSugars ?? 0),
    proteins: Number(record.prots ?? 0),
    fatTotal: Number(record.fats ?? 0),
    fatSaturated: Number(record.fatSaturated ?? 0),
    fatTrans: Number(record.fatTrans ?? 0),
    fiber: Number(record.fiber ?? 0),
    sodium: Number(record.sodium ?? 0),
    yieldWeight: Number(record.yieldWeight ?? 0),
  };
}

export function generateZplNutritionTable(
  el: LabelElement,
  data: LabelData,
  dpi: 203 | 300 = 203,
): string {
  const x = pxToDots(el.x, dpi);
  const y = pxToDots(el.y, dpi);
  const width = pxToDots(el.width, dpi);
  const height = pxToDots(el.height, dpi);
  const fontSize = Math.max(12, Math.min(pxToDots(el.fontSize || 8, dpi), 18));
  const compact = height < COMPACT_HEIGHT_DOTS;
  const maxLines = compact ? 8 : 16;

  return generateZplTextBlock({
    x,
    y,
    width,
    fontSize,
    fontWidth: Math.round(fontSize * 0.9),
    text: formatNutritionTableText(toNutritionData(data), { compact }),
    maxLines,
    lineSpacing: 0,
    alignment: "left",
  });
}
