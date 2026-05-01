// client/src/pages/nutri/components/PrescriptionDrawer/usePrescriptionBuilder.ts

import { useState, useMemo, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
import { appToast as toast } from "@/lib/app-toast";
import { calculateSingleCardNutrition, type MacroData, type SingleCardOption } from "./utils/nutrition-logic";
import type { FullPrescription } from "../../../../../../server/routers/storefront/nutri/types";
import type {
  BuilderGroup as SharedBuilderGroup,
  BuilderMeal as SharedBuilderMeal,
  BuilderOption as SharedBuilderOption,
  BuilderPrescriptionState as SharedBuilderPrescriptionState,
} from "@shared/types/prescription";

// --- INTERFACES INTERNAS E TIPAGENS DE ENTRADA ---
export type BuilderOption = SharedBuilderOption;
export type BuilderGroup = SharedBuilderGroup;
export type BuilderMeal = SharedBuilderMeal;
export type BuilderPrescriptionState = SharedBuilderPrescriptionState;

export interface CatalogProductInput {
  id: string | number;
  name: string;
  basePrice?: string | number;
  base_price?: string | number;
  price?: string | number;
  energyKcal?: string | number;
  proteins?: string | number;
  carbs?: string | number;
  fatTotal?: string | number;
  availableSizes?: Array<{
    id: number;
    name?: string;
    price?: string | number;
    isDefault?: boolean;
    mainDishWeight?: string | number;
    weight?: string | number;
    price_modifier?: string | number;
  }>;
}

export interface SizeInput {
  id: number;
  name?: string;
  price?: string | number;
  price_modifier?: string | number;
  mainDishWeight?: string | number;
  weight?: string | number;
}

export interface AccInput {
  id: string | number;
  name: string;
  weight?: string | number;
  energyKcal?: string | number;
  proteins?: string | number;
  carbs?: string | number;
  fatTotal?: string | number;
}

export function usePrescriptionBuilder(initialData?: FullPrescription | Partial<BuilderPrescriptionState>) {
  const [prescription, setPrescription] = useState<BuilderPrescriptionState>({
    planName: initialData?.planName || "",
    meals: (initialData?.meals as BuilderMeal[] | undefined) ?? [],
    id: initialData?.id,
    technicalInsight: initialData?.technicalInsight,
    totalKcalTarget: initialData?.totalKcalTarget,
    discountPercentage: initialData?.discountPercentage,
  });

  const [pickingFor, setPickingFor] = useState<{ mealId: string; groupId: string } | null>(null);
  const [pickingAccFor, setPickingAccFor] = useState<{ mealId: string; groupId: string; optionId: string } | null>(null);

  const updateMeals = useCallback((callback: (meals: BuilderMeal[]) => BuilderMeal[]) => {
    setPrescription((prev) => ({ ...prev, meals: callback(prev.meals || []) }));
  }, []);

  const addMeal = () => updateMeals((m: BuilderMeal[]): BuilderMeal[] => [...m, { 
    id: String(uuidv4()), 
    name: `Refeição ${m.length + 1}`, 
    groups: [{
      id: String(uuidv4()),
      name: "Opções da Semana", 
      options: [],
      minSelections: 1,
      maxSelections: 7,
      isRequired: true
    }], 
    notes: "" 
  }]);
  
  const removeMeal = (id: string) => updateMeals((m: BuilderMeal[]): BuilderMeal[] => m.filter(meal => meal.id !== id));
  const updateMealName = (id: string, name: string) => updateMeals((m: BuilderMeal[]): BuilderMeal[] => m.map(meal => meal.id === id ? { ...meal, name } : meal));

  const addOptionToGroup = (product: CatalogProductInput) => {
    if (!pickingFor) return;
    
    let limitReached = false;

    updateMeals((meals: BuilderMeal[]): BuilderMeal[] => meals.map((m: BuilderMeal): BuilderMeal => m.id === pickingFor.mealId ? {
      ...m,
          groups: m.groups.map((g: BuilderGroup): BuilderGroup => {
        if (g.id !== pickingFor.groupId) return g;
        
        if ((g.options || []).length >= 7) {
          limitReached = true;
          return g;
        }

        const defaultSize = product.availableSizes?.find((s) => s.isDefault) || product.availableSizes?.[0];
        const basePrice = Number(defaultSize?.price || product.basePrice || product.base_price || product.price || 0);
        
        const quantityMultiplier = 1; 
        const calculatedPrice = basePrice * quantityMultiplier;

        const newOption: BuilderOption = {
          id: String(uuidv4()),
          dishId: String(product.id),
          name: String(product.name),
          
          basePrice: basePrice,
          multiplier: quantityMultiplier, 
          price: calculatedPrice, 
          priceAtCreation: calculatedPrice, 

          sizeId: defaultSize?.id ? Number(defaultSize.id) : undefined,
          isDefault: true, 
          mainDishWeight: Number(defaultSize?.mainDishWeight || defaultSize?.weight || 200),
          
          nutritionalData: {
            mainDishWeight: Number(defaultSize?.mainDishWeight || defaultSize?.weight || 200),
            baseMacros: {
              kcal: Number(product.energyKcal || 0),
              protein: Number(product.proteins || 0),
              carbs: Number(product.carbs || 0),
              fat: Number(product.fatTotal || 0)
            }
          },
          macros: {
            kcal: Number(product.energyKcal || 0),
            protein: Number(product.proteins || 0),
            carbs: Number(product.carbs || 0),
            fat: Number(product.fatTotal || 0)
          } as BuilderOption["macros"],

          allowedAccompaniments: [],
          availableSizes: product.availableSizes as BuilderOption['availableSizes']
        };

        return {
          ...g,
          options: [...(g.options || []), newOption]
        };
      })
    } : m));

    if (limitReached) {
      toast.error("Limite de 7 pratos atingido para esta refeição.");
    } else {
      toast.success(`${product.name} adicionado!`);
    }
  };

  const removeOption = (mId: string, gId: string, optId: string) => 
    updateMeals((meals: BuilderMeal[]): BuilderMeal[] => meals.map((m: BuilderMeal): BuilderMeal => m.id === mId ? { 
      ...m, 
      groups: m.groups.map((g: BuilderGroup): BuilderGroup => g.id === gId ? { ...g, options: g.options.filter(o => o.id !== optId) } : g) 
    } : m));

  const updateOptionSize = (mId: string, gId: string, optId: string, size: SizeInput) => 
    updateMeals((meals: BuilderMeal[]): BuilderMeal[] => meals.map((m: BuilderMeal): BuilderMeal => m.id === mId ? { 
      ...m, 
      groups: m.groups.map((g: BuilderGroup): BuilderGroup => g.id === gId ? { 
        ...g, 
        options: g.options.map((o: BuilderOption): BuilderOption => {
          if (o.id !== optId) return o;
          
          const newBasePrice = Number(size.price || o.basePrice || 0);
          const currentMultiplier = Number(o.multiplier) || 1; 
          const newCalculatedPrice = newBasePrice * currentMultiplier;

          return { 
            ...o, 
            sizeId: size.id, 
            multiplier: currentMultiplier,
            price: newCalculatedPrice,
            priceAtCreation: newCalculatedPrice, 
            mainDishWeight: Number(size.mainDishWeight || size.weight || 200),
            nutritionalData: {
              ...(o.nutritionalData as Record<string, unknown>),
              mainDishWeight: Number(size.mainDishWeight || size.weight || 200)
            }
          }; 
        }) 
      } : g) 
    } : m));

  const toggleAccompanimentToOption = (acc: AccInput) => {
    if (!pickingAccFor) return;
    const { optionId } = pickingAccFor;
    updateMeals((meals: BuilderMeal[]): BuilderMeal[] => meals.map((m: BuilderMeal): BuilderMeal => ({
      ...m,
      groups: m.groups.map((g: BuilderGroup): BuilderGroup => ({
        ...g,
        options: g.options.map((o: BuilderOption): BuilderOption => {
          if (o.id !== optionId) return o;
          const current = o.allowedAccompaniments || [];
          const exists = current.find(a => String(a.id) === String(acc.id));
          return {
            ...o,
            allowedAccompaniments: exists 
              ? current.filter(a => String(a.id) !== String(acc.id))
              : [...current, { 
                  id: Number(acc.id), 
                  name: acc.name, 
                  weight: Number(acc.weight || 100), 
                  isBase: current.length === 0,
                  energyKcal: Number(acc.energyKcal || 0),
                  proteins: Number(acc.proteins || 0),
                  carbs: Number(acc.carbs || 0),
                  fatTotal: Number(acc.fatTotal || 0)
                }]
          };
        })
      }))
    })));
  };

  const toggleAccompanimentIsBase = (optId: string, accId: string | number) => {
    updateMeals((meals: BuilderMeal[]): BuilderMeal[] => meals.map((m: BuilderMeal): BuilderMeal => ({
      ...m,
      groups: m.groups.map((g: BuilderGroup): BuilderGroup => ({
        ...g,
        options: g.options.map((o: BuilderOption): BuilderOption => {
          if (o.id !== optId) return o;
          return {
            ...o,
            allowedAccompaniments: (o.allowedAccompaniments || []).map(a => 
              String(a.id) === String(accId) ? { ...a, isBase: !a.isBase } : a
            )
          };
        })
      }))
    })));
  };

  const dailyTotals = useMemo(() => {
    const totals: MacroData = { kcal: 0, protein: 0, carbs: 0, fat: 0 };

    (prescription.meals || []).forEach((meal) => {
      (meal.groups || []).forEach((group) => {
        const options = group.options || [];
        if (options.length > 0) {
          let groupKcal = 0, groupProtein = 0, groupCarbs = 0, groupFat = 0;

          options.forEach((opt) => {
            const m = calculateSingleCardNutrition(opt as SingleCardOption);
            groupKcal += m.kcal;
            groupProtein += m.protein;
            groupCarbs += m.carbs;
            groupFat += m.fat;
          });

          totals.kcal += groupKcal / options.length;
          totals.protein += groupProtein / options.length;
          totals.carbs += groupCarbs / options.length;
          totals.fat += groupFat / options.length;
        }
      });
    });

    return {
      kcal: Math.round(totals.kcal),
      protein: Number(totals.protein.toFixed(1)),
      carbs: Number(totals.carbs.toFixed(1)),
      fat: Number(totals.fat.toFixed(1)),
    };
  }, [prescription.meals]);

  return {
    prescription: prescription as FullPrescription,
    setPrescription,
    dailyTotals,
    isPickingFor: pickingFor,
    setIsPickingFor: setPickingFor,
    isPickingAccFor: pickingAccFor,
    setIsPickingAccFor: setPickingAccFor,
    addMeal,
    removeMeal,
    updateMealName,
    addOptionToGroup,
    removeOption,
    updateOptionSize,
    toggleAccompanimentToOption,
    toggleAccompanimentIsBase
  };
}
