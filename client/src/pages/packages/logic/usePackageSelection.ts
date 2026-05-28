// client/src/pages/packages/logic/usePackageSelection.ts
// Hook global de seleção de pacotes — movido de adminOrders para local compartilhado

import { useState, useEffect } from "react";
import { mapPackageMealNutrition } from "./nutritionCalculator";
import { safeInteger, safeNumber } from "@/lib/safe-parse";

// --- INTERFACES ---

interface NutritionalInfo {
  energyKcal?: string | number;
  proteins?: string | number;
  carbs?: string | number;
  fatTotal?: string | number;
  ingredients?: string;
  [key: string]: unknown;
}

interface Product {
  id: string | number;
  name: string;
  energyKcal?: string | number;
  proteins?: string | number;
  carbs?: string | number;
  fatTotal?: string | number;
  nutritional_info?: NutritionalInfo | string;
  nutritionalInfo?: NutritionalInfo;
  ingredients?: string;
  [key: string]: unknown;
}

interface AccompanimentGroup {
  id: string | number;
  name: string;
  maxSelections: number | string;
  defaultGrammage: number | string;
  options: Product[];
}

interface PackageSlot {
  label?: string;
  name?: string;
  dishes: Product[];
  accompanimentGroups: AccompanimentGroup[];
}

interface Package {
  options: PackageSlot[];
  size?: {
    weight?: number | string;
    proteinWeight?: number | string;
  };
}

export interface SelectedMeal {
  mealIndex: number;
  label: string;
  dishId: string | number | null;
  dishName: string;
  dishData: Product | null;
  allowedDishes: Product[];
  accompanimentGroups: AccompanimentGroup[];
  selectedAccompaniments: (Product & {
    groupId: string | number;
    groupName: string;
    weight: number;
  })[];
  mainDishWeight: number;
  nutrition: NutritionalInfo;
}

// --- HOOK ---

export function usePackageSelection(pkg: Package | null | undefined) {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedMeals, setSelectedMeals] = useState<SelectedMeal[]>([]);

  const updateMealWithNutrition = (meal: SelectedMeal): SelectedMeal => {
    const nutrition = mapPackageMealNutrition(
      meal.dishData as Record<string, unknown>,
      meal.selectedAccompaniments as Record<string, unknown>[],
    );
    return { ...meal, nutrition: nutrition as unknown as NutritionalInfo };
  };

  const getNumericValue = (text: string | null | undefined): number => {
    if (!text || typeof text !== "string") return 0;
    const match = text.match(/(\d+)/);
    return match ? safeInteger(match[0]) : 0;
  };

  const sortByWeightAndName = (a: Product, b: Product): number => {
    const valA = getNumericValue(a.name);
    const valB = getNumericValue(b.name);
    if (valA !== 0 && valB !== 0 && valA !== valB) return valA - valB;
    return (a.name || "").localeCompare(b.name || "", "pt-BR");
  };

  useEffect(() => {
    if (!pkg || !pkg.options || !Array.isArray(pkg.options)) return;

    const meals: SelectedMeal[] = pkg.options.map((slot, i) => {
      const sortedDishes: Product[] = [...(slot.dishes || [])]
        .filter((d) => !!d)
        .sort((a, b) => (a.name || "").localeCompare(b.name || "", "pt-BR"));

      const sortedAccGroups: AccompanimentGroup[] = [...(slot.accompanimentGroups || [])]
        .filter((g) => !!g)
        .map((group) => ({
          ...group,
          maxSelections: safeNumber(group.maxSelections, 1),
          defaultGrammage: Number(group.defaultGrammage || 100),
          options: [...(group.options || [])].filter((o) => !!o).sort(sortByWeightAndName),
        }));

      return {
        mealIndex: i,
        label: slot.label || slot.name || `Marmita ${i + 1}`,
        dishId: null,
        dishName: "",
        dishData: null,
        allowedDishes: sortedDishes,
        accompanimentGroups: sortedAccGroups,
        selectedAccompaniments: [],
        mainDishWeight: Number(pkg.size?.weight || pkg.size?.proteinWeight || 200),
        nutrition: { energyKcal: 0, proteins: 0, carbs: 0, fatTotal: 0 },
      };
    });

    setSelectedMeals(meals);
    setCurrentStep(0);
  }, [pkg]);

  const handleSelectDish = (dishId: string | number) => {
    setSelectedMeals((prev) =>
      prev.map((m) => {
        if (m.mealIndex !== currentStep) return m;
        const dish = m.allowedDishes.find((d) => String(d.id) === String(dishId));
        if (!dish) return m;
        return updateMealWithNutrition({
          ...m,
          dishId: dish.id,
          dishName: dish.name,
          dishData: dish,
          selectedAccompaniments: [],
        });
      })
    );
  };

  const handleSelectAcc = (groupId: string | number, optionId: string | number) => {
    setSelectedMeals((prev) =>
      prev.map((m) => {
        if (m.mealIndex !== currentStep) return m;

        const group = m.accompanimentGroups.find((g) => String(g.id) === String(groupId));
        const option = group?.options?.find((o) => String(o.id) === String(optionId));
        if (!group || !option) return m;

        const currentSelected = m.selectedAccompaniments || [];
        const isAlreadySelected = currentSelected.some(
          (a) => String(a.id) === String(optionId) && String(a.groupId) === String(groupId)
        );

        const accToSave = {
          ...option,
          groupId: group.id,
          groupName: group.name,
          ingredients: option.ingredients || "",
          weight: safeNumber(group.defaultGrammage, 100),
        };

        let newSelections: SelectedMeal["selectedAccompaniments"] = [];

        if (isAlreadySelected) {
          newSelections = currentSelected.filter(
            (a) => !(String(a.id) === String(optionId) && String(a.groupId) === String(groupId))
          );
        } else {
          const countInGroup = currentSelected.filter(
            (a) => String(a.groupId) === String(groupId)
          ).length;

          if (countInGroup >= Number(group.maxSelections)) {
            if (Number(group.maxSelections) === 1) {
              const otherGroups = currentSelected.filter(
                (a) => String(a.groupId) !== String(groupId)
              );
              newSelections = [...otherGroups, accToSave];
            } else {
              return m;
            }
          } else {
            newSelections = [...currentSelected, accToSave];
          }
        }

        return updateMealWithNutrition({ ...m, selectedAccompaniments: newSelections });
      })
    );
  };

  return {
    currentStep,
    setCurrentStep,
    selectedMeals,
    handleSelectDish,
    handleSelectAcc,
    currentMeal: selectedMeals[currentStep] || null,
  };
}
