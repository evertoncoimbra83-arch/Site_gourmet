import { useMemo } from "react";

// --- INTERFACES DE SUB-ITENS ---

interface FormattedAccompaniment {
  name: string;
  weight?: number;
  groupName?: string;
}

interface FormattedMeal {
  dishName?: string;
  selectedAccompaniments?: FormattedAccompaniment[];
}

// --- INTERFACES PRINCIPAIS ---

interface RawOptions {
  meals?: FormattedMeal[];
  packageName?: string;
  selectedAccompaniments?: FormattedAccompaniment[]; 
  dishName?: string;
  _itemName?: string;
  name?: string;
  selectedSize?: { name: string };
  _sizeLabel?: string;
}

interface OrderItemInput {
  id: string | number;
  options?: string | Record<string, unknown> | null;
  name?: string;
  dishName?: string;
  dish_name?: string;
  quantity?: number | string;
  unitPrice?: number | string;
  unit_price?: number | string;
  totalPrice?: number | string;
  total_price?: number | string;
  sizeName?: string;
  size_name?: string;
}

/**
 * Utilitário para garantir que o JSON seja parseado corretamente,
 * tratando strings duplas ou valores nulos vindos do banco.
 */
function robustParse(val: unknown): RawOptions | null {
  if (!val || val === "null" || val === "undefined") return null;
  if (typeof val === "object") return val as RawOptions;
  
  try {
    let parsed = JSON.parse(val as string);
    // Trata casos onde o JSON foi encodado como string duas vezes
    if (typeof parsed === "string") parsed = JSON.parse(parsed);
    return parsed as RawOptions;
  } catch {
    // ✅ ESLint fix: Removido 'error' não utilizado (Line 15)
    return null;
  }
}

export function useOrderItemFormatter(item: OrderItemInput | null | undefined) {
  return useMemo(() => {
    if (!item) return null;

    // ✅ REVISÃO: Agora lemos exclusivamente de item.options
    const rawData = robustParse(item.options);
    
    let options: FormattedMeal[] | FormattedAccompaniment[] | unknown[] = [];
    let isPackage = false;
    let customName: string | null = null;

    if (rawData) {
      // ✅ CENÁRIO A: PACOTE (Estrutura com .meals)
      if (rawData.meals && Array.isArray(rawData.meals)) {
        isPackage = true;
        customName = rawData.packageName || null;
        options = rawData.meals;
      } 
      // ✅ CENÁRIO B: PRATO AVULSO (Estrutura com selectedAccompaniments)
      else if (rawData.selectedAccompaniments && Array.isArray(rawData.selectedAccompaniments)) {
        isPackage = false;
        options = rawData.selectedAccompaniments;
        customName = rawData.dishName || rawData._itemName || rawData.name || null; 
      }
      // ✅ CENÁRIO C: FALLBACK PARA LEGADO (Caso o JSON seja apenas o array)
      else if (Array.isArray(rawData)) {
        isPackage = false;
        options = rawData as unknown[];
      }
    }

    // ✅ SUPORTE A SNAKE_CASE E CAMELCASE (Mapeamento do DB)
    const finalName = customName || item.dishName || item.dish_name || item.name || "Item";

    return {
      id: item.id,
      name: finalName,
      isPackage,
      options, // Marmitas ou acompanhamentos
      quantity: Number(item.quantity || 1),
      unitPrice: Number(item.unitPrice || item.unit_price || 0),
      total: Number(item.totalPrice || item.total_price || 0),
      size: rawData?.selectedSize?.name || rawData?._sizeLabel || item.sizeName || item.size_name || null
    };
  }, [item]);
}