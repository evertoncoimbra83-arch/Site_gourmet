import type { SuccessOrderItem } from "../types";

export function safeJsonParse(value: unknown): Record<string, unknown> {
  if (!value) return {};
  if (typeof value === "object" && value !== null && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  if (typeof value !== "string") return {};
  try {
    const parsed = JSON.parse(value);
    return typeof parsed === "object" &&
      parsed !== null &&
      !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : {};
  } catch {
    return {};
  }
}

function getOptionName(value: unknown): string | undefined {
  if (typeof value !== "object" || value === null) return undefined;
  const name = (value as { name?: unknown }).name;
  return typeof name === "string" ? name : undefined;
}

export function getItemSizeText(item: SuccessOrderItem) {
  const options =
    typeof item.options === "string"
      ? safeJsonParse(item.options)
      : item.options || {};
  const parsedOptions =
    typeof item.parsedOptions === "string"
      ? safeJsonParse(item.parsedOptions)
      : item.parsedOptions || {};

  const rawSize =
    options.selectedSizeName ||
    options.sizeName ||
    item.sizeName ||
    item.size_name ||
    getOptionName(options.size) ||
    getOptionName(options.selectedSize) ||
    options._sizeLabel ||
    parsedOptions.selectedSizeName ||
    parsedOptions.sizeName ||
    getOptionName(parsedOptions.size) ||
    getOptionName(parsedOptions.selectedSize) ||
    parsedOptions._sizeLabel ||
    "";

  const size = typeof rawSize === "string" ? rawSize.trim() : "";
  const normalized = size.toUpperCase();
  const isStandard =
    !size ||
    normalized === "PADRAO" ||
    normalized === "PADRÃO" ||
    normalized === "PADRÃƒO";
  return isStandard ? "" : size;
}

export function getSelectedAccs(options: Record<string, unknown>) {
  if (Array.isArray(options.selectedAccs)) return options.selectedAccs;
  if (Array.isArray(options.selectedAccompaniments)) {
    return options.selectedAccompaniments;
  }
  return [];
}

export function getPackageMeals(options: Record<string, unknown>) {
  if (Array.isArray(options.meals)) return options.meals;
  if (Array.isArray(options.items)) return options.items;
  return [];
}

export function getItemOptions(item: SuccessOrderItem) {
  return typeof item.options === "string"
    ? safeJsonParse(item.options)
    : item.options || {};
}

export function getItemSubDetailsText(item: SuccessOrderItem) {
  const options = getItemOptions(item);
  const meals = getPackageMeals(options);
  const selectedAccs = getSelectedAccs(options);
  const noAccompanimentsMessage =
    typeof options.noAccompanimentsMessage === "string"
      ? options.noAccompanimentsMessage.trim()
      : "";
  const isPackage =
    options._type === "package_custom" ||
    meals.length > 0 ||
    String(item.dishName || item.name || "")
      .toLowerCase()
      .includes("pacote");

  if (isPackage && meals.length > 0) {
    return meals
      .map(meal => {
        const typedMeal = meal as {
          quantity?: number | string;
          dishName?: string;
          name?: string;
        };
        return `${typedMeal.quantity || 1}x ${
          typedMeal.dishName || typedMeal.name || "Marmita"
        }`;
      })
      .join(" + ");
  }

  if (selectedAccs.length > 0) {
    return selectedAccs
      .map(acc => {
        const typedAcc = acc as {
          name?: string;
          label?: string;
          weight?: number | string;
        };
        const name = typedAcc.name || typedAcc.label || "";
        const weight = typedAcc.weight ? ` (${typedAcc.weight}g)` : "";
        return `${name}${weight}`;
      })
      .filter(Boolean)
      .join(", ");
  }

  if (noAccompanimentsMessage) {
    return noAccompanimentsMessage;
  }

  return "";
}
