/**
 * ✅ PARSE NUTRITION
 * Extrai e normaliza os dados nutricionais de pratos ou acompanhamentos.
 * Suporta tanto o objeto já mapeado quanto a string JSON do banco.
 */
export const parseNutrition = (info: any) => {
  if (!info) return { kcal: 0, proteins: 0, carbs: 0, fats: 0, sodium: 0 };
  
  try {
    const data = typeof info === 'string' ? JSON.parse(info) : info;
    
    return {
      // Mapeia diversas chaves possíveis vindas da API/Banco para o nosso padrão
      kcal: Number(data.kcal || data.energyKcal || data.energy?.value || data.calories || 0),
      proteins: Number(data.proteins || data.protein?.value || 0),
      carbs: Number(data.carbs || data.carbohydrates?.value || 0),
      fats: Number(data.fats || data.fatTotal || data.fat_total || 0),
      sodium: Number(data.sodium || 0)
    };
  } catch (error) {
    console.error("Erro ao processar nutrição:", error);
    return { kcal: 0, proteins: 0, carbs: 0, fats: 0, sodium: 0 };
  }
};

/**
 * ✅ CALCULATE PACKAGE TOTALS
 * Soma os preços e nutrientes de todas as marmitas selecionadas no kit.
 */
export const calculatePackageTotals = (selectedMeals: any[], basePrice: number) => {
  // Inicializa acumuladores
  const totals = {
    nutrition: { kcal: 0, proteins: 0, carbs: 0, fats: 0, sodium: 0 },
    extrasPrice: 0,
    completedMealsCount: 0
  };

  selectedMeals.forEach((meal) => {
    if (!meal.dishId) return; // Pula marmitas ainda não preenchidas
    
    totals.completedMealsCount++;

    // 1. Soma Nutrição do Prato Principal
    const dishNut = parseNutrition(meal.nutritional_info);
    totals.nutrition.kcal += dishNut.kcal;
    totals.nutrition.proteins += dishNut.proteins;
    totals.nutrition.carbs += dishNut.carbs;
    totals.nutrition.fats += dishNut.fats;
    totals.nutrition.sodium += dishNut.sodium;

    // 2. Soma Nutrição e Preço dos Acompanhamentos
    meal.selectedAccompaniments?.forEach((accItem: any) => {
      // Nutrição
      const itemNut = parseNutrition(accItem.nutritional_info || accItem.nutritionalInfo || accItem.nutritional_info);
      totals.nutrition.kcal += itemNut.kcal;
      totals.nutrition.proteins += itemNut.proteins;
      totals.nutrition.carbs += itemNut.carbs;
      totals.nutrition.fats += itemNut.fats;
      totals.nutrition.sodium += itemNut.sodium;

      // Preço (Soma os modificadores de acompanhamentos pagos)
      const priceMod = Number(accItem.price || accItem.priceModifier || 0);
      totals.extrasPrice += priceMod;
    });
  });

  // 3. Cálculos Finais de Status
  const isComplete = selectedMeals.length > 0 && totals.completedMealsCount === selectedMeals.length;
  const progress = selectedMeals.length > 0 ? (totals.completedMealsCount / selectedMeals.length) * 100 : 0;

  return {
    nutrition: totals.nutrition,
    totalPrice: Number(basePrice) + totals.extrasPrice,
    progress,
    isComplete
  };
};