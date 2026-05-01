import { create } from 'zustand';

// --- INTERFACES ---

interface AccFormData {
  name: string;
  showNutrition: boolean;
  ingredients: string;
  energyKcal: string;
  energyKj: string;
  proteins: string;
  carbs: string;
  fatTotal: string;
  sodium: string;
  fiber: string;
  fatSaturated: string;
  fatTrans: string;
  calcium: string;
  iron: string;
  // ✅ Ajustado para aceitar undefined, resolvendo o erro 2322
  [key: string]: string | boolean | undefined; 
}

interface CompositionItem {
  id: number;
  name?: string;
  ingredientName?: string;
  kcal: number;
  kj: number;
  prot: number;
  carb: number;
  fat: number;
  fib: number;
  sod: number;
  sat: number;
  trans: number;
  ca: number;
  fe: number;
  quantity: string;
  // Campos flexíveis para suporte a dados brutos
  energyKcal?: string | number;
  energyKj?: string | number;
  proteins?: string | number;
  carbs?: string | number;
  fatTotal?: string | number;
  fiber?: string | number;
  sodium?: string | number;
  fatSaturated?: string | number;
  fatTrans?: string | number;
  calcium?: string | number;
  iron?: string | number;
  energy_kcal?: string | number;
  energy_kj?: string | number;
  fat_total?: string | number;
  fat_saturated?: string | number;
  fat_trans?: string | number;
}

interface AccState {
  formData: AccFormData;
  composition: CompositionItem[];
  portionGrammage: number; 
  setFormData: (data: Partial<AccFormData>) => void;
  // ✅ Substituído 'any[]' por tipo específico
  setComposition: (data: Partial<CompositionItem>[]) => void; 
  setPortionGrammage: (grammage: number) => void;
  // ✅ Substituído 'any' por tipo específico
  addItem: (item: Partial<CompositionItem>) => void;
  removeItem: (index: number) => void;
  calculateTotals: () => void;
  reset: () => void;
}

const initialForm: AccFormData = {
  name: "", 
  showNutrition: false,
  ingredients: "", 
  energyKcal: "0",      
  energyKj: "0",        
  proteins: "0.00", 
  carbs: "0.00", 
  fatTotal: "0.00",    
  sodium: "0", 
  fiber: "0.00",
  fatSaturated: "0.00", 
  fatTrans: "0.00",     
  calcium: "0.00", 
  iron: "0.00"
};

export const useAccStore = create<AccState>((set, get) => ({
  formData: { ...initialForm },
  composition: [],
  portionGrammage: 100,

  setFormData: (data) => {
    const current = get().formData;
    // ✅ Agora compatível com a assinatura de índice da interface
    set({ formData: { ...current, ...data } });
  },
  
  setComposition: (data) => {
    const parse = (v: string | number | undefined | null) => {
      const n = parseFloat(String(v || "0").replace(',', '.'));
      return isNaN(n) ? 0 : n;
    };

    const normalizedComposition: CompositionItem[] = (Array.isArray(data) ? data : []).map(item => ({
      ...item,
      id: item.id || 0,
      kcal: parse(item.kcal || item.energyKcal || item.energy_kcal),
      kj: parse(item.kj || item.energyKj || item.energy_kj),
      prot: parse(item.prot || item.proteins),
      carb: parse(item.carb || item.carbs),
      fat: parse(item.fat || item.fatTotal || item.fat_total),
      fib: parse(item.fib || item.fiber),
      sod: parse(item.sod || item.sodium),
      sat: parse(item.sat || item.fatSaturated || item.fat_saturated),
      trans: parse(item.trans || item.fatTrans || item.fat_trans),
      ca: parse(item.ca || item.calcium),
      fe: parse(item.fe || item.iron),
      quantity: String(item.quantity || "100").replace(',', '.')
    }));

    set({ composition: normalizedComposition });
    get().calculateTotals();
  },

  setPortionGrammage: (grammage) => {
    set({ portionGrammage: Number(grammage) || 100 });
    get().calculateTotals(); 
  },

  addItem: (item) => {
    const parse = (v: string | number | undefined | null) => {
      const n = parseFloat(String(v || "0").replace(',', '.'));
      return isNaN(n) ? 0 : n;
    };
    
    const cleanItem: CompositionItem = {
      ...item,
      id: item.id || 0,
      kcal: parse(item.energyKcal || item.energy_kcal || 0),
      kj: parse(item.energyKj || item.energy_kj || 0),
      prot: parse(item.proteins || 0),
      carb: parse(item.carbs || 0),
      fat: parse(item.fatTotal || item.fat_total || 0),
      fib: parse(item.fiber || 0),
      sod: parse(item.sodium || 0),
      sat: parse(item.fatSaturated || item.fat_saturated || 0),
      trans: parse(item.fatTrans || item.fat_trans || 0),
      ca: parse(item.calcium || 0),
      fe: parse(item.iron || 0),
      quantity: String(item.quantity || "100").replace(',', '.')
    } as CompositionItem;

    set((state) => ({ composition: [...state.composition, cleanItem] }));
    get().calculateTotals();
  },

  removeItem: (index) => {
    set((state) => ({ composition: state.composition.filter((_, i) => i !== index) }));
    get().calculateTotals();
  },

  calculateTotals: () => {
    const { composition, portionGrammage, formData } = get();
    if (!composition || composition.length === 0) return;

    const rawTotals = composition.reduce((acc, curr) => {
      const q = parseFloat(String(curr.quantity || "0").replace(',', '.'));
      const f = q / 100; 

      return {
        kcal: acc.kcal + (curr.kcal * f),
        kj: acc.kj + (curr.kj * f),
        prot: acc.prot + (curr.prot * f),
        carb: acc.carb + (curr.carb * f),
        fat: acc.fat + (curr.fat * f),
        fib: acc.fib + (curr.fib * f),
        sod: acc.sod + (curr.sod * f),
        sat: acc.sat + (curr.sat * f),
        trans: acc.trans + (curr.trans * f),
        ca: acc.ca + (curr.ca * f),
        fe: acc.fe + (curr.fe * f),
      };
    }, { kcal: 0, kj: 0, prot: 0, carb: 0, fat: 0, fib: 0, sod: 0, sat: 0, trans: 0, ca: 0, fe: 0 });

    const portionFactor = portionGrammage / 100;

    set({ 
      formData: {
        ...formData,
        energyKcal: Math.round(rawTotals.kcal * portionFactor).toString(),
        energyKj: Math.round(rawTotals.kj * portionFactor).toString(),
        proteins: (rawTotals.prot * portionFactor).toFixed(2),
        carbs: (rawTotals.carb * portionFactor).toFixed(2),
        fatTotal: (rawTotals.fat * portionFactor).toFixed(2),
        fiber: (rawTotals.fib * portionFactor).toFixed(2),
        sodium: Math.round(rawTotals.sod * portionFactor).toString(),
        fatSaturated: (rawTotals.sat * portionFactor).toFixed(2),
        fatTrans: (rawTotals.trans * portionFactor).toFixed(2),
        calcium: (rawTotals.ca * portionFactor).toFixed(2),
        iron: (rawTotals.fe * portionFactor).toFixed(2),
      }
    });
  },

  reset: () => set({ formData: { ...initialForm }, composition: [], portionGrammage: 100 })
}));