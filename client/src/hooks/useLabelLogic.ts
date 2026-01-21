import { useMemo } from "react";
import { format, addDays } from "date-fns";

/**
 * 🧠 Hook de Lógica para Etiquetas Zebra
 * Responsável por "explodir" kits e mapear variáveis dinâmicas.
 */
export function useLabelLogic(order: any, selectedLabelIndex: number, validityDays: number) {
  
  const flatLabels = useMemo(() => {
    if (!order?.items) return [];
    const labels: any[] = [];
    
    order.items.forEach((item: any) => {
      let opts: any = {};
      try {
        opts = typeof item.options === 'string' ? JSON.parse(item.options) : (item.options || {});
      } catch (e) { opts = {}; }

      // 🍱 Caso seja um Pacote (Kit com várias marmitas)
      if (opts.meals && Array.isArray(opts.meals)) {
        opts.meals.forEach((meal: any, mIdx: number) => {
          labels.push({
            id: `${item.id}-m-${mIdx}`,
            type: 'kit_item',
            displayName: meal.dishName || "Marmita",
            parentName: opts.packageName || item.dishName || item.name,
            slot: meal.slotName || `Item ${mIdx + 1}`,
            accompaniments: meal.selectedAccompaniments || [],
            // Fallback para ingredientes se não houver na marmita específica
            ingredients: meal.ingredients || item.dish?.ingredients || "Ingredientes: vide site.",
            nutrition: meal.nutrition || opts.appliedNutrition || null,
          });
        });
      } else {
        // 🥗 Caso seja um Prato Individual
        labels.push({
          id: item.id,
          type: 'single_item',
          displayName: opts.dishName || item.dishName || item.name,
          parentName: opts.selectedSize?.name || "",
          slot: "",
          accompaniments: opts.selectedAccompaniments || [],
          ingredients: item.dish?.ingredients || item.ingredients || "Ingredientes: vide site.",
          nutrition: opts.appliedNutrition || null,
        });
      }
    });
    return labels;
  }, [order]);

  const parseContent = (content: string) => {
    const currentLabel = flatLabels[selectedLabelIndex];
    if (!order || !currentLabel) return content;

    const nut = currentLabel.nutrition;
    // Formatação mais profissional para a tabela nutricional
    const nutritionText = nut 
      ? `CAL: ${Math.round(nut.kcal)}kcal | PT: ${nut.protein}g | CB: ${nut.carbs}g | GR: ${nut.fats || 0}g`
      : "Informação nutricional disponível no site.";

    const map: Record<string, string> = {
      '{cliente_nome}': (order.customerName || "CLIENTE").toUpperCase(),
      '{pedido_id}': `${order.id}`,
      '{prato_nome}': (currentLabel.displayName || "PRATO").toUpperCase(),
      '{pacote_nome}': (currentLabel.parentName || "").toUpperCase(),
      '{marmita_slot}': (currentLabel.slot || "").toUpperCase(),
      '{acompanhamentos}': currentLabel.accompaniments.length > 0 
        ? currentLabel.accompaniments.map((a: any) => `• ${a.name}`).join('\n')
        : "Sem acompanhamentos específicos.",
      '{ingredientes}': currentLabel.ingredients,
      '{tabela_nutricional}': nutritionText,
      '{data_impressao}': format(new Date(), 'dd/MM/yyyy'),
      '{data_validade}': format(addDays(new Date(), validityDays), 'dd/MM/yyyy'),
    };

    // ✅ Uso de Regex para garantir substituição global exata e evitar bugs de tags similares
    let result = content;
    Object.entries(map).forEach(([key, value]) => {
      const safeKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      result = result.replace(new RegExp(safeKey, 'g'), value);
    });

    return result;
  };

  return { flatLabels, parseContent };
}