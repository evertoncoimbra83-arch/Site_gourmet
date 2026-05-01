import React, { useState } from "react";
import { useDishStore } from "../logic/useDishStore";
import { Button } from "@/components/ui/button";
import { NutriField } from "./NutriField";
import { trpc } from "@/_core/trpc";
import { 
  RefreshCw, Zap, Beef, Wheat, Droplets, Info, 
  Activity, Trash2, Scale, Search, Plus, Loader2,
  Bone, Magnet} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { motion, AnimatePresence } from "framer-motion";

// --- INTERFACES CORRIGIDAS ---

interface Ingredient {
  id: number;
  name: string;
  energyKcal?: string | number;
  energy_kcal?: string | number;
  energyKj?: string | number;
  energy_kj?: string | number;
  proteins?: string | number;
  carbs?: string | number;
  fatTotal?: string | number;
  fat_total?: string | number;
  fatSaturated?: string | number;
  fat_saturated?: string | number;
  fatTrans?: string | number;
  fat_trans?: string | number;
  fiber?: string | number;
  sodium?: string | number;
  calcium?: string | number;
  iron?: string | number;
  yieldFactor?: string | number;
}

// ✅ Interface unificada: Omitimos o 'id' para evitar conflito com o 'ingredientId'
interface DishCompositionItem extends Omit<Ingredient, 'id'> {
  ingredientId: number;
  ingredientName: string;
  quantity: number | string;
}

export function DishNutriTab() {
  const { 
    formData, 
    setFormData,
    composition, 
    addIngredientToComposition, 
    removeIngredient, 
    updateIngredientQuantity 
  } = useDishStore();
  
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");

  const { data: searchResults, isFetching: isSearching } = trpc.admin.dishes.searchIngredients.useQuery(
    { query: searchTerm }, 
    { enabled: searchTerm.length > 2 }
  );

  const handleSelectIngredient = (ing: Ingredient) => {
    // ✅ FIX TS2352: Conversão segura via unknown
    const currentComposition = (composition as unknown) as DishCompositionItem[];
    const isDuplicate = currentComposition.some(
      item => Number(item.ingredientId) === Number(ing.id)
    );

    if (isDuplicate) {
      toast("Aviso: Este insumo já está na composição.");
      return; 
    }
    
    const cleanItem = {
      ingredientId: Number(ing.id),
      ingredientName: ing.name,
      energyKcal: Number(ing.energyKcal ?? ing.energy_kcal ?? 0),
      energyKj: Number(ing.energyKj ?? ing.energy_kj ?? 0),
      proteins: Number(ing.proteins ?? 0),
      carbs: Number(ing.carbs ?? 0),
      fatTotal: Number(ing.fatTotal ?? ing.fat_total ?? 0),
      fatSaturated: Number(ing.fatSaturated ?? ing.fat_saturated ?? 0),
      fatTrans: Number(ing.fatTrans ?? ing.fat_trans ?? 0),
      fiber: Number(ing.fiber ?? 0),
      sodium: Number(ing.sodium ?? 0),
      calcium: Number(ing.calcium ?? 0),
      iron: Number(ing.iron ?? 0),
      yieldFactor: Number(ing.yieldFactor ?? 1)
    };

    addIngredientToComposition(cleanItem, 100);
    setSearchTerm("");
    toast(`Sucesso: ${ing.name} adicionado.`);
  };

  const handleRecalculate = () => {
    const currentComposition = (composition as unknown) as DishCompositionItem[];

    if (currentComposition.length === 0) {
      toast("Erro: Adicione ingredientes antes de calcular.");
      return;
    }

    type NutritionKeys = keyof Omit<DishCompositionItem, 'ingredientId' | 'ingredientName' | 'quantity' | 'name'>;
    
    const nutriKeys: NutritionKeys[] = [
      "energyKcal", "energyKj", "proteins", "carbs", 
      "fatTotal", "fatSaturated", "fatTrans", 
      "fiber", "sodium", "calcium", "iron"
    ];

    const totals = currentComposition.reduce((acc, item) => {
      const q = Number(item.quantity || 0);
      const ratio = q / 100;
      
      const newAcc = { ...acc };
      nutriKeys.forEach(key => {
        const itemValue = Number(item[key] || 0);
        newAcc[key] = (newAcc[key] || 0) + (itemValue * ratio);
      });
      
      return newAcc;
    }, {} as Record<string, number>);

    const formattedTotals: Record<string, number> = {};
    Object.keys(totals).forEach((key) => {
      formattedTotals[key] = Number(Number(totals[key]).toFixed(2));
    });

    const readableText = currentComposition
      .map((c) => c.ingredientName || c.name)
      .join(", ");

    const technicalComposition = currentComposition.map(item => ({
      ingredientId: Number(item.ingredientId),
      quantity: Number(item.quantity)
    }));

    setFormData({
      ...formData,
      ...formattedTotals,
      ingredients: readableText,
      composition: technicalComposition
    });

    toast(`Cálculo concluído para ${currentComposition.length} itens.`);
  };

  return (
    <div className="space-y-8 pb-4">
      <div className="bg-white rounded-4xl border border-slate-200 p-6 space-y-6 shadow-sm text-left">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Scale className="text-slate-400" size={18} />
            <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-700 italic">Ficha Técnica</h4>
          </div>
          <Button 
            onClick={handleRecalculate} 
            variant="ghost" 
            className="h-8 rounded-full text-emerald-600 text-[9px] font-black uppercase gap-2 hover:bg-emerald-50 px-4 transition-colors"
          > 
            <RefreshCw size={12} /> Recalcular
          </Button>
        </div>

        <div className="relative z-60">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
          <input 
            className="w-full bg-slate-50 border-none rounded-2xl pl-10 h-11 text-xs text-slate-600 font-medium outline-none focus:ring-2 focus:ring-emerald-500/20" 
            placeholder="Pesquisar..." 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
          />
          <AnimatePresence>
            {searchTerm.length > 2 && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute top-12 left-0 w-full bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden max-h-60 overflow-y-auto z-100"
              >
                {isSearching ? (
                  <div className="p-4 flex items-center justify-center gap-2 text-[10px] font-bold text-slate-400 uppercase italic">
                    <Loader2 size={14} className="animate-spin text-emerald-500" /> Consultando...
                  </div>
                ) : (
                  (searchResults as Ingredient[])?.map((ing) => (
                    <div key={ing.id} onClick={() => handleSelectIngredient(ing)} className="p-3 hover:bg-emerald-50 cursor-pointer flex justify-between items-center border-b border-slate-50">
                      <div className="flex flex-col text-left">
                        <span className="text-[10px] font-black uppercase text-slate-700">{ing.name}</span>
                        <span className="text-[8px] text-slate-400 font-bold uppercase italic">
                          Base 100g: {Number(ing.energyKcal || ing.energy_kcal || 0).toFixed(0)} kcal
                        </span>
                      </div>
                      <Plus size={14} className="text-emerald-500" />
                    </div>
                  ))
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="space-y-2 max-h-72 overflow-y-auto custom-scrollbar pr-1 text-left">
          {composition.length === 0 && (
            <p className="text-center py-8 text-[10px] font-bold text-slate-300 uppercase italic">Nenhum insumo.</p>
          )}
          {((composition as unknown) as DishCompositionItem[]).map((item, idx) => (
            <div key={`${item.ingredientId}-${idx}`} className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50/50 border border-slate-100">
              <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-black uppercase text-slate-700 truncate">{item.ingredientName || item.name}</p>
                  <p className="text-[8px] text-slate-400 font-bold uppercase italic leading-none mt-1">
                    Ref 100g: {Number(item.energyKcal || 0).toFixed(0)} kcal | Total: {item.quantity}g
                  </p>
              </div>
              <div className="flex items-center gap-2 bg-white rounded-xl p-1 shadow-sm border border-slate-100">
                <input 
                  type="number" 
                  className="w-14 h-7 bg-transparent text-center font-black text-slate-700 border-none text-xs outline-none" 
                  value={item.quantity} 
                  onChange={e => updateIngredientQuantity(idx, e.target.value)} 
                />
                <span className="text-[9px] font-bold text-slate-400 pr-2 italic uppercase">g</span>
              </div>
              <button 
                className="text-slate-300 hover:text-red-500 p-2 transition-colors" 
                onClick={() => removeIngredient(idx)}
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-4 text-left">
        <h4 className="px-2 text-[11px] font-black uppercase tracking-widest text-slate-400 italic flex items-center gap-2">
          <Activity size={14} /> Totais Consolidados
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <NutriField label="Energia (kcal)" icon={Zap} field="energyKcal" />
          <NutriField label="Carboidratos (g)" icon={Wheat} field="carbs" />
          <NutriField label="Proteínas (g)" icon={Beef} field="proteins" />
          <NutriField label="Gord. Totais (g)" icon={Droplets} field="fatTotal" />
          <NutriField label="Fibras (g)" icon={Activity} field="fiber" />
          <NutriField label="Sódio (mg)" icon={Info} field="sodium" />
          <NutriField label="Cálcio (mg)" icon={Bone} field="calcium" />
          <NutriField label="Ferro (mg)" icon={Magnet} field="iron" />
        </div>
      </div>
    </div>
  );
}