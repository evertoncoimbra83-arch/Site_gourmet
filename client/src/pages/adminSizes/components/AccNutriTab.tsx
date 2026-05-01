// e:/IA/projects/Site_React/client/src/pages/adminSizes/components/AccNutriTab.tsx

import React, { useEffect, useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/_core/trpc";
import { useAccStore } from "@/pages/adminSizes/logic/useAccStore";
import { NutriField } from "../components/NutriField"; 
import { 
  RefreshCw, Zap, Beef, Wheat, Droplets, Info, 
  Activity, Trash2, Scale, Search, Plus, Loader2,
  Layers, Bone, Magnet, Flame
} from "lucide-react";
import { appToast as sonnerToast } from "@/lib/app-toast";
import { motion, AnimatePresence } from "framer-motion";

// --- INTERFACES ---

interface Ingredient {
  id: number;
  name: string;
  kcal?: number | string;
  energyKcal?: number | string;
  kj?: string | number;
  prot?: string | number;
  carb?: string | number;
  fat?: string | number;
}

interface CompositionItem {
  id: number;
  name: string;
  ingredientId: number;
  ingredientName: string;
  quantity: string;
  kcal?: number | string;
  energyKcal?: number | string;
  kj?: string | number;
  prot?: string | number;
  carb?: string | number;
  fat?: string | number;
}

export function AccNutriTab() {
  const { 
    composition, 
    formData, 
    setFormData, 
    addItem, 
    removeItem, 
    calculateTotals,
  } = useAccStore();
  
  const [searchTerm, setSearchTerm] = useState("");

  const { data: allIngredients, isLoading: isLoadingAll } = trpc.admin.ingredients.list.useQuery(undefined, {
    staleTime: 1000 * 60 * 10, 
  });

  const filteredResults = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    const searchWords = term.split(/\s+/).filter(word => word.length >= 2);

    if (searchWords.length === 0 || !allIngredients) return [];

    const matches = (allIngredients as Ingredient[]).filter((ing) => {
      const itemName = (ing.name || "").toLowerCase();
      return searchWords.every(word => itemName.includes(word));
    });

    return matches.sort((a, b) => {
      const nameA = a.name.toLowerCase();
      const nameB = b.name.toLowerCase();
      const startsWithA = nameA.startsWith(term);
      const startsWithB = nameB.startsWith(term);
      if (startsWithA && !startsWithB) return -1;
      if (!startsWithA && startsWithB) return 1;
      return nameA.length - nameB.length;
    }).slice(0, 15); 
  }, [searchTerm, allIngredients]);

  useEffect(() => {
    if (composition.length > 0) {
      const ingredientList = (composition as unknown as CompositionItem[])
        .map(item => item.name || item.ingredientName)
        .filter(Boolean)
        .join(", ");
      
      if (formData.ingredients !== ingredientList) {
        setFormData({ ingredients: ingredientList.toUpperCase() });
      }
    } else {
      if (formData.ingredients !== "") {
        setFormData({ ingredients: "" });
      }
    }
  }, [composition, setFormData, formData.ingredients]);

  const handleSelectIngredient = (ing: Ingredient) => {
    const compList = composition as unknown as CompositionItem[];
    const alreadyIn = compList.some((item) => 
      Number(item.ingredientId || item.id) === Number(ing.id)
    );

    if (alreadyIn) {
      sonnerToast.error("Insumo já adicionado", {
        description: "Este item já consta na lista de composição."
      });
      setSearchTerm("");
      return; 
    }
    
    const newItem = { 
      ...ing, 
      ingredientId: ing.id, 
      ingredientName: ing.name, 
      quantity: "100" 
    } as unknown as CompositionItem;

    // ✅ O TRUQUE DE MESTRE: typeof composition[0]
    // Isso diz ao TS: "Use exatamente o tipo de item que a store espera", sem usar 'any'
    addItem(newItem as unknown as typeof composition[0]); 
    
    setSearchTerm("");
    sonnerToast.success(`${ing.name.toUpperCase()} incluído com sucesso.`);
  };

  const handleUpdateQuantity = (idx: number, val: string) => {
    const numericVal = val.replace(',', '.');
    const newComp = [...(composition as unknown as CompositionItem[])];
    newComp[idx].quantity = numericVal;
    
    // ✅ O TRUQUE DE MESTRE: typeof composition
    // Passamos a bola direto para o tipo original da Store, calando o TS e o ESLint
    useAccStore.setState({ composition: newComp as unknown as typeof composition });
    calculateTotals();
  };

  return (
    <div className="space-y-8 pb-10 text-left">
      <div className="bg-white rounded-[2.5rem] border border-slate-200 p-6 space-y-6 shadow-sm">
        <div className="flex justify-between items-center px-1">
          <div className="flex items-center gap-2">
            <Scale className="text-emerald-500" size={18} />
            <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-700 italic">Composição (Insumos Brutos)</h4>
          </div>
          <Button 
            onClick={() => calculateTotals()} 
            variant="ghost" 
            className="h-8 rounded-full text-slate-400 text-[9px] font-black uppercase gap-2 hover:bg-slate-50"
          > 
            <RefreshCw size={12} className={isLoadingAll ? "animate-spin" : ""} /> 
            Recalcular 
          </Button>
        </div>

        <div className="relative z-[60]">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 z-10">
            {isLoadingAll ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
          </div>
          <Input 
            className="bg-slate-50 border-none rounded-2xl pl-10 h-11 text-xs text-slate-600 focus-visible:ring-2 focus-visible:ring-emerald-500 transition-all font-medium" 
            placeholder={isLoadingAll ? "Carregando..." : "Busque ingredientes (ex: sal, tomate)..."} 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
          />
          
          <AnimatePresence>
            {searchTerm.trim().length >= 2 && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }} 
                animate={{ opacity: 1, y: 0 }} 
                exit={{ opacity: 0, y: -10 }} 
                className="absolute top-12 left-0 w-full bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden max-h-60 overflow-y-auto z-[70]"
              >
                {filteredResults.length === 0 ? (
                  <div className="p-4 text-center text-[10px] font-bold text-slate-400 uppercase italic">
                    Nenhum insumo encontrado
                  </div>
                ) : (
                  filteredResults.map((ing) => (
                    <button
                      key={ing.id} 
                      type="button"
                      onClick={() => handleSelectIngredient(ing)} 
                      className="w-full p-3 hover:bg-emerald-50 cursor-pointer flex justify-between items-center border-b border-slate-50 last:border-none group text-left transition-colors"
                    >
                      <div className="flex flex-col text-left">
                        <span className="text-[10px] font-black uppercase text-slate-700 group-hover:text-emerald-700">{ing.name}</span>
                        <span className="text-[8px] text-slate-400 font-bold uppercase italic">
                          {Math.round(Number(ing.kcal || ing.energyKcal || 0))} kcal / 100g
                        </span>
                      </div>
                      <Plus size={14} className="text-emerald-500" />
                    </button>
                  ))
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="space-y-2 max-h-72 overflow-y-auto custom-scrollbar text-left">
          {composition.length === 0 && (
            <div className="py-10 text-center space-y-2">
              <Layers className="mx-auto text-slate-200" size={30} />
              <p className="text-[9px] font-black uppercase text-slate-300 italic tracking-tighter">Nenhum insumo adicionado</p>
            </div>
          )}
          
          {(composition as unknown as CompositionItem[]).map((item, idx) => (
            <div key={`${item.id}-${idx}`} className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50/50 border border-slate-100 group transition-all text-left">
              <div className="flex-1 min-w-0 text-left">
                  <p className="text-[10px] font-black uppercase text-slate-700 truncate">
                    {item.name || item.ingredientName}
                  </p>
                  <p className="text-[8px] text-slate-400 font-bold uppercase italic">
                    {((Number(item.kcal || item.energyKcal || 0) * Number(item.quantity || 0)) / 100).toFixed(0)} kcal na porção
                  </p>
              </div>
              
              <div className="flex items-center gap-2 bg-white rounded-xl p-1 shadow-sm border border-slate-100">
                <input 
                  type="number" 
                  className="w-14 h-7 bg-transparent text-center font-black text-slate-700 border-none text-xs p-0 focus:outline-none" 
                  value={item.quantity} 
                  onChange={e => handleUpdateQuantity(idx, e.target.value)} 
                />
                <span className="text-[9px] font-bold text-slate-400 italic pr-2">g</span>
              </div>
              
              <button 
                type="button"
                className="w-8 h-8 flex items-center justify-center rounded-xl text-slate-200 hover:text-red-500 transition-all text-center" 
                onClick={() => removeItem(idx)}
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-4 text-left">
        <div className="flex items-center gap-2 px-2">
          <Activity size={16} className="text-emerald-500" />
          <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-400 italic">Resultado Final por Porção</h4>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <NutriField label="Energia (kcal)" icon={Zap} value={formData.energyKcal} onChange={(v) => setFormData({ energyKcal: v })} color="text-orange-500" bg="bg-orange-50" />
          <NutriField label="Energia (kJ)" icon={Flame} value={formData.energyKj} onChange={(v) => setFormData({ energyKj: v })} color="text-orange-600" bg="bg-orange-50/50" />
          <NutriField label="Carboidratos (g)" icon={Wheat} value={formData.carbs} onChange={(v) => setFormData({ carbs: v })} color="text-amber-500" bg="bg-amber-50" />
          <NutriField label="Proteínas (g)" icon={Beef} value={formData.proteins} onChange={(v) => setFormData({ proteins: v })} color="text-red-500" bg="bg-red-50" />
          <NutriField label="Gorduras Totais (g)" icon={Droplets} value={formData.fatTotal} onChange={(v) => setFormData({ fatTotal: v })} color="text-blue-500" bg="bg-blue-50" />
          <NutriField label="Gord. Saturadas (g)" icon={Layers} value={formData.fatSaturated} onChange={(v) => setFormData({ fatSaturated: v })} color="text-purple-500" bg="bg-purple-50" />
          <NutriField label="Fibras (g)" icon={Activity} value={formData.fiber} onChange={(v) => setFormData({ fiber: v })} color="text-emerald-500" bg="bg-emerald-50" />
          <NutriField label="Sódio (mg)" icon={Info} value={formData.sodium} onChange={(v) => setFormData({ sodium: v })} color="text-slate-500" bg="bg-slate-50" />
          <NutriField label="Cálcio (mg)" icon={Bone} value={formData.calcium} onChange={(v) => setFormData({ calcium: v })} color="text-zinc-500" bg="bg-zinc-100" />
          <NutriField label="Ferro (mg)" icon={Magnet} value={formData.iron} onChange={(v) => setFormData({ iron: v })} color="text-indigo-500" bg="bg-indigo-50" />
        </div>
      </div>
    </div>
  );
}