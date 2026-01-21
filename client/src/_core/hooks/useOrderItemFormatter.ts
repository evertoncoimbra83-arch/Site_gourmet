import { useMemo } from "react";

/**
 * Utilitário para garantir que o JSON seja parseado corretamente,
 * tratando strings duplas ou valores nulos vindos do banco.
 */
function robustParse(val: any): any {
  if (!val || val === "null" || val === "undefined") return null;
  if (typeof val === "object") return val;
  try {
    let parsed = JSON.parse(val);
    // Trata casos onde o JSON foi encodado como string duas vezes
    if (typeof parsed === "string") parsed = JSON.parse(parsed);
    return parsed;
  } catch (error) {
    return null;
  }
}

export function useOrderItemFormatter(item: any) {
  return useMemo(() => {
    if (!item) return null;

    // ✅ REVISÃO: Agora lemos exclusivamente de item.options
    const rawData = robustParse(item.options);
    
    let options: any[] = [];
    let isPackage = false;
    let customName = null;

    if (rawData) {
      // ✅ CENÁRIO A: PACOTE (Estrutura com .meals)
      if (rawData.meals && Array.isArray(rawData.meals)) {
        isPackage = true;
        customName = rawData.packageName;
        options = rawData.meals;
      } 
      // ✅ CENÁRIO B: PRATO AVULSO (Estrutura com selectedAccompaniments)
      // Note que após a migração, o que era 'accompaniments' agora é 'selectedAccompaniments'
      else if (rawData.selectedAccompaniments && Array.isArray(rawData.selectedAccompaniments)) {
        isPackage = false;
        options = rawData.selectedAccompaniments;
        customName = rawData.dishName || rawData._itemName || rawData.name; 
      }
      // ✅ CENÁRIO C: FALLBACK PARA LEGADO (Caso o JSON seja apenas o array)
      else if (Array.isArray(rawData)) {
        isPackage = false;
        options = rawData;
      }
    }

    // ✅ SUPORTE A SNAKE_CASE E CAMELCASE (Mapeamento do DB)
    const finalName = customName || item.dishName || item.dish_name || item.name || "Item";

    return {
      id: item.id,
      name: finalName,
      isPackage,
      options, // Este campo será usado para listar as marmitas ou os acompanhamentos
      quantity: Number(item.quantity || 1),
      unitPrice: Number(item.unitPrice || item.unit_price || 0),
      total: Number(item.totalPrice || item.total_price || 0),
      size: rawData?.selectedSize?.name || rawData?._sizeLabel || item.sizeName || item.size_name || null
    };
  }, [item]);
}