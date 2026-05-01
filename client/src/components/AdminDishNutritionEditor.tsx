import React, { useState } from 'react';
import { trpc } from '@/_core/trpc';
import { Search, Plus, Trash2, Calculator, Loader2 } from 'lucide-react';

// --- INTERFACES ---

interface IngredientResult {
  id: string | number;
  name: string;
  unit?: string;
  energyKcal?: number;
  proteins?: number;
}

interface SelectedItem {
  ingredientId: string | number;
  name: string;
  quantity: string;
  energyKcal?: number;
  proteins?: number;
}

// Interface para contornar cache de tipos do tRPC no Admin
interface NutritionRouter {
  searchIngredients: {
    useQuery: (args: { query: string }, opts: { enabled: boolean }) => {
      data: IngredientResult[] | undefined;
      isFetching: boolean;
    };
  };
}

export function DishNutritionEditor({ dishId }: { dishId: number }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);

  // ✅ CORREÇÃO TS2339: Casting seguro para interface NutritionRouter
  const nutritionApi = (trpc.admin as unknown as { nutritionIngredients: NutritionRouter }).nutritionIngredients;
  
  const { data: searchResults, isFetching } = nutritionApi.searchIngredients.useQuery(
    { query: searchTerm }, 
    { enabled: searchTerm.length > 2 }
  );

  const utils = trpc.useUtils();
  
  const saveMutation = trpc.admin.dishes.update.useMutation({
    onSuccess: () => {
      utils.admin.dishes.getById.invalidate(dishId);
      alert("Ficha técnica salva e nutrientes calculados!");
    }
  });

  const addItem = (ingredient: IngredientResult) => {
    if (selectedItems.find(i => i.ingredientId === ingredient.id)) return;
    setSelectedItems([...selectedItems, { 
      ingredientId: ingredient.id, 
      name: ingredient.name, 
      quantity: "100",
      energyKcal: ingredient.energyKcal,
      proteins: ingredient.proteins
    }]);
    setSearchTerm("");
  };

  const handleSave = () => {
    saveMutation.mutate({
      id: dishId,
      composition: selectedItems.map(i => ({
        ingredientId: i.ingredientId,
        quantity: i.quantity 
      }))
    });
  };

  return (
    <div className="p-6 bg-white rounded-3xl border border-slate-100 shadow-sm">
      <h2 className="text-xl font-black uppercase italic mb-4 flex items-center gap-2 text-slate-800">
        <Calculator className="w-5 h-5 text-emerald-600" /> Ficha Técnica
      </h2>

      {/* Busca de Ingredientes */}
      <div className="relative mb-6">
        <div className="flex items-center border-2 border-slate-50 rounded-2xl px-4 py-3 bg-slate-50 focus-within:bg-white focus-within:border-emerald-100 transition-all">
          <Search className="w-5 h-5 text-slate-400" />
          <input 
            className="bg-transparent border-none focus:ring-0 w-full ml-2 text-sm font-bold"
            placeholder="Pesquisar na Tabela TACO..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {isFetching && <Loader2 className="w-4 h-4 animate-spin text-emerald-500" />}
        </div>

        {searchResults && searchResults.length > 0 && (
          <div className="absolute z-50 w-full mt-2 bg-white border border-slate-100 rounded-2xl shadow-2xl max-h-64 overflow-y-auto p-2">
            {searchResults.map((ing) => (
              <button 
                key={ing.id}
                onClick={() => addItem(ing)}
                className="w-full text-left px-4 py-3 hover:bg-emerald-50 rounded-xl flex justify-between items-center transition-colors group"
              >
                <div className="flex flex-col">
                  <span className="text-sm font-black uppercase text-slate-700">{ing.name}</span>
                  <span className="text-[10px] text-slate-400 font-bold">{ing.unit || 'g'}</span>
                </div>
                <Plus className="w-4 h-4 text-slate-300 group-hover:text-emerald-500" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Lista de Ingredientes do Prato */}
      <div className="space-y-3">
        {selectedItems.length === 0 && (
          <div className="text-center py-10 border-2 border-dashed border-slate-100 rounded-3xl">
            <p className="text-slate-300 text-xs font-black uppercase italic">Nenhum ingrediente adicionado</p>
          </div>
        )}
        
        {selectedItems.map((item, index) => (
          <div key={`${item.ingredientId}-${index}`} className="flex items-center gap-4 p-4 border border-slate-50 rounded-2xl bg-slate-50/50">
            <div className="flex-1 flex flex-col text-left">
              <span className="text-[11px] font-black uppercase text-slate-600 italic">{item.name}</span>
            </div>
            
            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl shadow-sm border border-slate-100">
              <input 
                type="number"
                value={item.quantity}
                onChange={(e) => {
                  const newItems = [...selectedItems];
                  newItems[index].quantity = e.target.value;
                  setSelectedItems(newItems);
                }}
                className="w-14 border-none bg-transparent p-0 text-sm font-black text-center text-emerald-600 focus:ring-0"
              />
              <span className="text-[10px] font-black text-slate-300 uppercase">g</span>
            </div>
            
            <button 
              onClick={() => setSelectedItems(selectedItems.filter((_, i) => i !== index))}
              className="text-slate-300 hover:text-red-500 p-2 transition-all"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {selectedItems.length > 0 && (
        <button 
          onClick={handleSave}
          disabled={saveMutation.isPending}
          className="mt-8 w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-lg disabled:opacity-50 flex items-center justify-center gap-3"
        >
          {saveMutation.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            "Consolidar Ficha Técnica"
          )}
        </button>
      )}
    </div>
  );
}