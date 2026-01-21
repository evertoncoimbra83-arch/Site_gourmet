import React, { useState } from 'react';
import { trpc } from '@/_core/trpc';
import { Search, Plus, Trash2, Calculator, Loader2 } from 'lucide-react';

export function DishNutritionEditor({ dishId }: { dishId: number }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedItems, setSelectedItems] = useState<any[]>([]);

  // 1. Busca os ingredientes da TACO enquanto você digita
  const { data: searchResults, isFetching } = trpc.admin.nutrition.searchIngredients.useQuery(searchTerm, {
    enabled: searchTerm.length > 2
  });

  // 2. Mutation para salvar a composição no banco
  // ✅ Corrigido: Em mutations, usamos 'isPending' em vez de 'isLoading' nas versões recentes
  const saveMutation = trpc.admin.nutrition.saveDishComposition.useMutation({
    onSuccess: () => {
      alert("Ficha técnica salva e nutrientes calculados!");
    }
  });

  const addItem = (ingredient: any) => {
    if (selectedItems.find(i => i.ingredientId === ingredient.id)) return;
    setSelectedItems([...selectedItems, { 
      ingredientId: ingredient.id, 
      name: ingredient.name, 
      quantity: "100" // padrão 100g
    }]);
    setSearchTerm("");
  };

  const handleSave = () => {
    saveMutation.mutate({
      dishId,
      composition: selectedItems.map(i => ({
        ingredientId: i.ingredientId,
        quantity: Number(i.quantity) // Garante que é número
      }))
    });
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow border border-slate-100">
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-slate-800">
        <Calculator className="w-5 h-5 text-emerald-600" /> Ficha Técnica Nutricional
      </h2>

      {/* Busca de Ingredientes (TACO) */}
      <div className="relative mb-6">
        <div className="flex items-center border rounded-lg px-3 py-2 bg-slate-50 focus-within:ring-2 focus-within:ring-emerald-500/20 transition-all">
          <Search className="w-5 h-5 text-slate-400" />
          <input 
            className="bg-transparent border-none focus:ring-0 w-full ml-2 text-sm"
            placeholder="Pesquisar na Tabela TACO (ex: Frango, Arroz...)"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {isFetching && <Loader2 className="w-4 h-4 animate-spin text-slate-400" />}
        </div>

        {/* Resultados da Busca */}
        {searchResults && searchResults.length > 0 && (
          <div className="absolute z-10 w-full bg-white border rounded-b-lg shadow-xl max-h-60 overflow-y-auto">
            {searchResults.map(ing => (
              <button 
                key={ing.id}
                onClick={() => addItem(ing)}
                className="w-full text-left px-4 py-3 hover:bg-emerald-50 border-b last:border-none flex justify-between items-center transition-colors"
              >
                <span className="text-sm text-slate-700">{ing.name}</span>
                <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded uppercase">{ing.source || 'TACO'}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Lista de Ingredientes do Prato */}
      <div className="space-y-3">
        {selectedItems.length === 0 && (
          <p className="text-center py-8 text-slate-400 text-sm italic">Nenhum ingrediente adicionado ainda.</p>
        )}
        
        {selectedItems.map((item, index) => (
          <div key={index} className="flex items-center gap-4 p-3 border rounded-lg bg-slate-50/50">
            <div className="flex-1 font-medium text-slate-700 text-sm">{item.name}</div>
            <div className="flex items-center gap-2">
              <input 
                type="number"
                value={item.quantity}
                onChange={(e) => {
                  const newItems = [...selectedItems];
                  newItems[index].quantity = e.target.value;
                  setSelectedItems(newItems);
                }}
                className="w-20 border rounded px-2 py-1 text-sm text-center focus:ring-emerald-500/20"
              />
              <span className="text-slate-500 text-sm">g</span>
            </div>
            <button 
              onClick={() => setSelectedItems(selectedItems.filter((_, i) => i !== index))}
              className="text-slate-400 hover:text-red-500 hover:bg-red-50 p-2 rounded transition-all"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {selectedItems.length > 0 && (
        <button 
          onClick={handleSave}
          // ✅ Corrigido: isPending substitui isLoading em mutations
          disabled={saveMutation.isPending}
          className="mt-6 w-full bg-emerald-600 text-white py-3 rounded-lg font-bold hover:bg-emerald-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {saveMutation.isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Calculando Nutrientes...
            </>
          ) : (
            "Salvar Ficha Técnica"
          )}
        </button>
      )}
    </div>
  );
}