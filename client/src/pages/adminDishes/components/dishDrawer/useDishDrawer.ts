import { useState, useEffect, useRef } from "react";
import { trpc } from "@/_core/trpc";
import { safeNumber } from "@/lib/safe-parse";

// --- INTERFACES ---
export interface DishFormData {
  id?: number | string;
  name: string;
  description: string;
  price: string;
  salePrice: string;
  categoryId: string;
  imageUrl: string;
  ingredients: string;
  isVegetarian: boolean;
  isGlutenFree: boolean;
  isLactoseFree: boolean;
  showNutrition: boolean;
  energyKcal: string;
  energyKj: string;
  proteins: string;
  carbs: string;
  fatTotal: string;
  fatSaturated: string;
  fatTrans: string;
  sodium: string;
  fiber: string;
  calcium: string;
  iron: string;
  sizes: unknown[];
}

export interface CompositionItem {
  ingredientId?: number | string;
  id?: number | string;
  originalId?: number | string;
  name?: string;
  ingredientName?: string;
  quantity: string | number;
  energyKcal?: string | number;
  energy_kcal?: string | number;
  calories?: string | number;
  energyKj?: string | number;
  energy_kj?: string | number;
  proteins?: string | number;
  protein?: string | number;
  carbs?: string | number;
  carbohydrates?: string | number;
  fatTotal?: string | number;
  fat_total?: string | number;
  fats?: string | number;
  fatSaturated?: string | number;
  fat_saturated?: string | number;
  fatTrans?: string | number;
  fat_trans?: string | number;
  fiber?: string | number;
  fiber_alimentar?: string | number;
  sodium?: string | number;
  sodio?: string | number;
  calcium?: string | number;
  iron?: string | number;
}

export const INITIAL_FORM: DishFormData = {
  name: "", 
  description: "", 
  price: "", 
  salePrice: "", 
  categoryId: "", 
  imageUrl: "",
  ingredients: "", 
  isVegetarian: false, 
  isGlutenFree: false, 
  isLactoseFree: false,
  showNutrition: true,
  energyKcal: "0", 
  energyKj: "0", 
  proteins: "0", 
  carbs: "0", 
  fatTotal: "0", 
  fatSaturated: "0", 
  fatTrans: "0",     
  sodium: "0", 
  fiber: "0",
  calcium: "0",
  iron: "0",
  sizes: [] 
};

// ✅ CORREÇÃO: Trocado 'any' por Record para segurança e conformidade
export function useDishDrawer(dish: Record<string, unknown> | null, open: boolean) {
  const [formData, setFormData] = useState<DishFormData>(INITIAL_FORM);
  const [composition, setComposition] = useState<CompositionItem[]>([]);
  const [view, setView] = useState<'idle' | 'search' | 'manual'>('idle');
  const lastDishId = useRef<number | string | null>(null);
  
  const utils = trpc.useUtils();

  useEffect(() => {
    if (!open) {
      lastDishId.current = null;
      return;
    }

    if (dish) {
      if (dish.id !== lastDishId.current) {
        // ✅ CORREÇÃO: Acesso seguro às propriedades usando cast controlado
        const rawStatus = dish.show_nutrition ?? dish.showNutrition;
        const showNutriStatus = rawStatus === true || rawStatus === 1 || String(rawStatus) === "true";

        setFormData({
          ...dish,
          showNutrition: showNutriStatus,
          price: String(dish.price || ""),
          salePrice: String(dish.salePrice || ""),
          categoryId: String(dish.categoryId || ""),
          
          proteins: String(dish.proteins ?? dish.protein ?? "0"),
          energyKcal: String(dish.energyKcal ?? dish.energy_kcal ?? dish.calories ?? "0"),
          energyKj: String(dish.energyKj ?? dish.energy_kj ?? "0"),
          carbs: String(dish.carbs ?? dish.carbohydrates ?? "0"),
          fatTotal: String(dish.fatTotal ?? dish.fat_total ?? dish.fats ?? "0"),
          fatSaturated: String(dish.fatSaturated ?? dish.fat_saturated ?? "0"),
          fatTrans: String(dish.fatTrans ?? dish.fat_trans ?? "0"),
          sodium: String(dish.sodium ?? dish.sodio ?? "0"),
          fiber: String(dish.fiber ?? dish.fiber_alimentar ?? "0"),
          calcium: String(dish.calcium ?? "0"),
          iron: String(dish.iron ?? "0"),
          
          sizes: Array.isArray(dish.sizes) ? dish.sizes : [] 
        } as unknown as DishFormData); // ✅ Ponte unknown satisfaz o ESLint 8

        setComposition(Array.isArray(dish.composition) ? (dish.composition as CompositionItem[]) : []); 
        lastDishId.current = dish.id as number | string;
      }
    } else {
      const saved = localStorage.getItem("dish_draft");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setFormData(parsed.formData || INITIAL_FORM);
          setComposition(parsed.composition || []);
        } catch {
          setFormData(INITIAL_FORM);
        }
      } else {
        setFormData(INITIAL_FORM);
        setComposition([]);
      }
      lastDishId.current = 'new';
    }
  }, [dish, open]);

  useEffect(() => {
    if (open && !dish) {
      localStorage.setItem("dish_draft", JSON.stringify({ formData, composition }));
    }
  }, [formData, composition, open, dish]);

  const applyTacoCalculations = () => {
    const totals = composition.reduce((acc, curr) => {
      const parseVal = (v: unknown) => safeNumber(String(v || "0").replace(',', '.'));

      const quantity = parseVal(curr.quantity);
      const factor = quantity / 100;

      const kcal = parseVal(curr.energyKcal ?? curr.energy_kcal ?? curr.calories);
      const kj = parseVal(curr.energyKj ?? curr.energy_kj);
      const validKj = kj > 0 ? kj : (kcal * 4.184);

      const prot = parseVal(curr.proteins ?? curr.protein);
      const carb = parseVal(curr.carbs ?? curr.carbohydrates);
      const fat = parseVal(curr.fatTotal ?? curr.fat_total ?? curr.fats);
      const fatSat = parseVal(curr.fatSaturated ?? curr.fat_saturated);
      const fatTrans = parseVal(curr.fatTrans ?? curr.fat_trans);
      const fib = parseVal(curr.fiber ?? curr.fiber_alimentar);
      const sod = parseVal(curr.sodium ?? curr.sodio);
      const calc = parseVal(curr.calcium);
      const iron = parseVal(curr.iron);

      return {
        energy: acc.energy + (kcal * factor),
        energyKj: acc.energyKj + (validKj * factor),
        proteins: acc.proteins + (prot * factor),
        carbs: acc.carbs + (carb * factor),
        fat: acc.fat + (fat * factor),
        fatSaturated: acc.fatSaturated + (fatSat * factor),
        fatTrans: acc.fatTrans + (fatTrans * factor),
        fiber: acc.fiber + (fib * factor),
        sodium: acc.sodium + (sod * factor),
        calcium: acc.calcium + (calc * factor),
        iron: acc.iron + (iron * factor),
      };
    }, { 
      energy: 0, energyKj: 0, proteins: 0, carbs: 0, 
      fat: 0, fatSaturated: 0, fatTrans: 0, fiber: 0, sodium: 0,
      calcium: 0, iron: 0 
    });

    setFormData((prev) => ({
      ...prev,
      ingredients: composition.map(c => (c.name || c.ingredientName || "").trim()).filter(Boolean).join(', '),
      
      energyKcal: totals.energy.toFixed(0),
      energyKj: totals.energyKj.toFixed(0),
      proteins: totals.proteins.toFixed(1),
      carbs: totals.carbs.toFixed(1), 
      fatTotal: totals.fat.toFixed(1),
      fatSaturated: totals.fatSaturated.toFixed(1),
      fatTrans: totals.fatTrans.toFixed(2),
      fiber: totals.fiber.toFixed(1), 
      sodium: totals.sodium.toFixed(0),
      calcium: totals.calcium.toFixed(1),
      iron: totals.iron.toFixed(2),
    }));
  };

  return { 
    formData, 
    setFormData, 
    composition, 
    setComposition, 
    view, 
    setView, 
    utils,
    applyTacoCalculations 
  };
}
