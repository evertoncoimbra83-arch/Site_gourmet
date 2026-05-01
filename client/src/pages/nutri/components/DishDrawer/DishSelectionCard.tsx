import React from "react";
import { Check, ChevronDown, ChevronUp, Utensils } from "lucide-react";
// ✅ Importação oficial das opções de prescrição
import type { PrescriptionOption } from "../../../../../../server/routers/storefront/nutri/types";
import { SizeSelector } from "./SizeSelector";
// ✅ Importamos a interface correta que o Selector já usa para evitar o erro 2719
import { AccompanimentSelector, type AccompanimentGroup } from "./AccompanimentSelector";

interface ProductCatalogItem {
  id: number | string;
  name: string;
  imageUrl?: string | null;
  categoryName?: string | null;
  availableSizes: Array<{
    id: number | string;
    name: string;
    weight: string;
    mainDishWeight: string;
    // ✅ Usando a interface oficial importada acima
    accompanimentGroups: AccompanimentGroup[]; 
  }>;
}

interface DishSelectionCardProps {
  product: ProductCatalogItem;
  // ✅ Config estendido para aceitar campos auxiliares da UI
  config?: PrescriptionOption & { accompaniments?: string[]; sizeId?: string; calories?: number };
  isExpanded: boolean;
  onToggle: () => void;
  onExpand: () => void;
  // ✅ CORREÇÃO: Tipado como Partial<PrescriptionOption> para remover o 'any'
  onUpdate: (updates: Partial<PrescriptionOption & { accompaniments?: string[]; sizeId?: string; calories?: number }>) => void;
}

export function DishSelectionCard({ 
  product, 
  config, 
  isExpanded, 
  onToggle, 
  onExpand, 
  onUpdate 
}: DishSelectionCardProps) {
  const isSelected = !!config;

  return (
    <div className={`rounded-2xl border-2 transition-all overflow-hidden ${
      isSelected ? 'border-emerald-500 bg-white shadow-md' : 'border-slate-100 bg-white hover:border-slate-200'
    }`}>
      {/* Cabeçalho do Card */}
      <div 
        onClick={onToggle}
        className={`flex items-center justify-between p-3 cursor-pointer transition-colors ${
          isSelected ? 'bg-emerald-50/40' : 'bg-transparent'
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-slate-100 overflow-hidden flex items-center justify-center border border-slate-200">
            {product.imageUrl ? (
              <img src={product.imageUrl} alt={product.name} className="object-cover h-full w-full" />
            ) : (
              <Utensils size={18} className="text-slate-400"/>
            )}
          </div>
          <div className="min-w-0">
            <p className="text-[9px] font-black uppercase text-slate-400 leading-none mb-1">
              {product.categoryName || "Geral"}
            </p>
            <span className="text-[11px] font-black uppercase text-slate-700 block leading-tight truncate">
              {product.name}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isSelected && (
            <>
              <Check size={18} className="text-emerald-600 animate-in zoom-in" />
              <div 
                onClick={(e) => { 
                  e.stopPropagation(); 
                  onExpand(); 
                }} 
                className={`p-1.5 rounded-lg transition-colors ${
                  isExpanded ? 'bg-emerald-100 text-emerald-700' : 'hover:bg-slate-100 text-slate-400'
                }`}
              >
                {isExpanded ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Área de Configuração */}
      {isSelected && isExpanded && (
        <div className="p-4 border-t border-slate-50 space-y-5 bg-slate-50/30 animate-in slide-in-from-top-2 duration-200">
          <SizeSelector 
            availableSizes={product.availableSizes} 
            selectedSizeId={config?.sizeId} 
            calories={config?.macros?.kcal ?? config?.calories}
            onChange={(sizeId: string, calories?: number) => onUpdate({ sizeId, calories })}
          />
          
          <AccompanimentSelector 
            // ✅ Agora os tipos são idênticos, resolvendo o erro 2719
            groups={product.availableSizes?.find(s => String(s.id) === config?.sizeId)?.accompanimentGroups || []}
            selectedIds={config?.accompaniments || []}
            onChange={(accompaniments: string[]) => onUpdate({ accompaniments })}
          />
        </div>
      )}
    </div>
  );
}