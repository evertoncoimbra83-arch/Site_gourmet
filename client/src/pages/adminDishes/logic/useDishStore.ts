import { create } from 'zustand';

// --- INTERFACES ---

export interface CompositionItem {
  name: string;
  ingredientId: number;
  ingredientName: string;
  quantity: number;
  energyKcal: number;
  energyKj: number;
  proteins: number;
  carbs: number;
  fatTotal: number;
  fatSaturated: number;
  fatTrans: number;
  fiber: number;
  sodium: number;
  addedSugars: number;
  calcium: number;
  iron: number;
  originalId?: number;
}

export interface DishFormData {
  id?: number | string;
  name: string;
  ingredients: string;
  description: string;
  show_nutrition: boolean;
  price?: string | number;
  salePrice?: string | number | null;
  [key: string]: unknown; // Permite os campos nutricionais calculados
}

interface DishState {
  formData: DishFormData;
  composition: CompositionItem[];
  setFormData: (data: Partial<DishFormData>) => void;
  setComposition: (comp: CompositionItem[]) => void;
  addIngredientToComposition: (rawIngredient: Partial<CompositionItem>, quantity?: number) => void;
  updateIngredientQuantity: (index: number, quantity: string | number) => void;
  removeIngredient: (index: number) => void;
  reset: () => void;
}

// ✅ Função auxiliar para gerar o texto da lista de ingredientes
const generateIngredientsText = (composition: CompositionItem[]) => {
  return composition
    .map(item => item.ingredientName || item.name)
    .filter(Boolean)
    .join(", ");
};

const calculateAggregatedTotals = (composition: CompositionItem[]) => {
  const totals = composition.reduce((acc, item) => {
    const qty = Number(item.quantity) || 0;
    const factor = qty / 100;

    return {
      energyKcal: acc.energyKcal + ((Number(item.energyKcal) || 0) * factor),
      energyKj: acc.energyKj + ((Number(item.energyKj) || 0) * factor),
      proteins: acc.proteins + ((Number(item.proteins) || 0) * factor),
      carbs: acc.carbs + ((Number(item.carbs) || 0) * factor),
      fatTotal: acc.fatTotal + ((Number(item.fatTotal) || 0) * factor),
      fatSaturated: acc.fatSaturated + ((Number(item.fatSaturated) || 0) * factor),
      fatTrans: acc.fatTrans + ((Number(item.fatTrans) || 0) * factor),
      fiber: acc.fiber + ((Number(item.fiber) || 0) * factor),
      sodium: acc.sodium + ((Number(item.sodium) || 0) * factor),
      calcium: acc.calcium + ((Number(item.calcium) || 0) * factor),
      iron: acc.iron + ((Number(item.iron) || 0) * factor),
    };
  }, { 
    energyKcal: 0, energyKj: 0, proteins: 0, carbs: 0, 
    fatTotal: 0, fatSaturated: 0, fatTrans: 0, fiber: 0, sodium: 0,
    calcium: 0, iron: 0 
  });

  return {
    energyKcal: totals.energyKcal.toFixed(2),
    energyKj: totals.energyKj.toFixed(2),
    proteins: totals.proteins.toFixed(2),
    carbs: totals.carbs.toFixed(2),
    fatTotal: totals.fatTotal.toFixed(2),
    fatSaturated: totals.fatSaturated.toFixed(2),
    fatTrans: totals.fatTrans.toFixed(2),
    fiber: totals.fiber.toFixed(2),
    sodium: totals.sodium.toFixed(2),
    calcium: totals.calcium.toFixed(2),
    iron: totals.iron.toFixed(2),
  };
};

export const useDishStore = create<DishState>((set, get) => ({
  formData: {
    name: "",
    ingredients: "",
    description: "",
    show_nutrition: false,
    price: "0.00",
    salePrice: null
  },
  composition: [],

  setFormData: (data) => set((state) => ({ 
    formData: { ...state.formData, ...data } 
  })),

  setComposition: (rawComposition) => {
    // ✅ CORREÇÃO LINHA 112: Removido 'any', usado cast unknown para acessar IDs dinâmicos
    const safeComposition = Array.isArray(rawComposition) ? rawComposition.map(item => {
       const typedItem = item as unknown as Record<string, unknown>;
       return {
         ...item,
         ingredientId: Number(typedItem.ingredientId || typedItem.id || typedItem.originalId),
         quantity: Number(item.quantity)
       };
    }) : [];

    const totals = calculateAggregatedTotals(safeComposition);
    const currentText = get().formData.ingredients;

    set((state) => ({ 
      composition: safeComposition, 
      formData: { 
        ...state.formData, 
        ...totals,
        ingredients: currentText || generateIngredientsText(safeComposition)
      } 
    }));
  },

  addIngredientToComposition: (rawIng, initialQty = 100) => {
    // ✅ CORREÇÃO LINHA 130: Removido 'any', tipagem via Record
    const typedIng = rawIng as unknown as Record<string, unknown>;
    const finalId = typedIng.ingredientId || typedIng.id || typedIng.originalId;
    if (!finalId) return;

    const newItem: CompositionItem = {
      ingredientId: Number(finalId),
      ingredientName: String(rawIng.name || typedIng.ingredientName || "Ingrediente"),
      quantity: Number(initialQty),
      energyKcal: Number(rawIng.energyKcal || 0),
      energyKj: Number(rawIng.energyKj || 0),
      proteins: Number(rawIng.proteins || 0),
      carbs: Number(rawIng.carbs || 0),
      fatTotal: Number(rawIng.fatTotal || 0),
      fatSaturated: Number(rawIng.fatSaturated || 0),
      fatTrans: Number(rawIng.fatTrans || 0),
      fiber: Number(rawIng.fiber || 0),
      sodium: Number(rawIng.sodium || 0),
      addedSugars: Number(rawIng.addedSugars || 0),
      calcium: Number(rawIng.calcium || 0),
      iron: Number(rawIng.iron || 0),
      originalId: Number(finalId),
      name: String(rawIng.name || "")
    };

    const newComposition = [...get().composition, newItem];
    const totals = calculateAggregatedTotals(newComposition);
    const currentText = get().formData.ingredients;

    set((state) => ({
      composition: newComposition,
      formData: { 
        ...state.formData, 
        ...totals,
        ingredients: currentText || generateIngredientsText(newComposition)
      }
    }));
  },

  updateIngredientQuantity: (index, quantity) => {
    const newComposition = [...get().composition];
    newComposition[index] = { 
      ...newComposition[index], 
      quantity: Number(quantity) >= 0 ? Number(quantity) : 0 
    };

    const totals = calculateAggregatedTotals(newComposition);
    set((state) => ({
      composition: newComposition,
      formData: { ...state.formData, ...totals }
    }));
  },

  removeIngredient: (index) => {
    const newComposition = get().composition.filter((_, i) => i !== index);
    const totals = calculateAggregatedTotals(newComposition);
    const currentText = get().formData.ingredients;

    set((state) => ({
      composition: newComposition,
      formData: { 
        ...state.formData, 
        ...totals,
        ingredients: currentText === generateIngredientsText(get().composition) 
            ? generateIngredientsText(newComposition) 
            : currentText
      }
    }));
  },

  reset: () => set({ 
    formData: {
        name: "",
        ingredients: "",
        description: "",
        show_nutrition: false,
        price: "0.00",
        salePrice: null
    }, 
    composition: [] 
  }),
}));