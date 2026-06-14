import React, { useMemo } from "react";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react"; 
import { Label } from "@/components/ui/label";
import { AccompanimentList } from "./AccompanimentList";
import { hasAccompaniments } from "../logic/validation";

// --- INTERFACES COMPARTILHADAS ---
interface AccOption {
  id: string | number;
  name: string;
  price_modifier?: string | number;
  iconKey?: string;
  categoryColor?: string;
}

interface AccGroup {
  id?: string | number;
  groupId?: string | number;
  name: string;
  options?: AccOption[];
  accompanimentOptions?: AccOption[];
  itemsOrder?: string | unknown[];
  maxSelections?: string | number;
  minSelections?: string | number;
  processedOptions: AccOption[];
}

interface SelectedAcc {
  id: string | number;
  groupId: string | number;
  name: string;
  iconKey?: string;
}

interface SizeOption {
  id: string | number;
  name: string;
  displayOrder?: number;
  display_order?: number;
  main_dish_weight?: number | string;
  mainDishWeight?: number | string;
  weight?: number | string;
  accompanimentGroups?: AccGroup[];
  groups?: AccGroup[];
  groupsOrder?: string | number[];
  noAccompanimentsMessage?: string | null;
}

interface SizeSelectorProps {
  sizes: SizeOption[];
  selectedId: string | number | null;
  onSelect: (size: SizeOption) => void;
  selectedAccs: SelectedAcc[];
  onAddAcc: (group: AccGroup, val: string) => void;
  onRemoveAcc: (group: AccGroup, id: string | number) => void;
}

export function SizeSelector({ 
  sizes, 
  selectedId, 
  onSelect, 
  selectedAccs, 
  onAddAcc, 
  onRemoveAcc 
}: SizeSelectorProps) {
  if (!sizes?.length) return null;

  // 1. Ordenação dos Tamanhos
  const sortedSizes = useMemo(() => {
    return [...sizes].sort((a, b) => {
      const orderA = a.displayOrder ?? a.display_order;
      const orderB = b.displayOrder ?? b.display_order;
      if (orderA !== undefined && orderB !== undefined && Number(orderA) !== Number(orderB)) {
        return Number(orderA) - Number(orderB);
      }
      const extractGrams = (sizeObj: any) => {
        const w = sizeObj.main_dish_weight ?? sizeObj.mainDishWeight ?? sizeObj.weight;
        if (w !== undefined && w !== null && !isNaN(Number(w))) {
          return Number(w);
        }
        const nameStr = String(sizeObj.name || "");
        const match = nameStr.match(/(\d+)\s*(g|gr|grama|kg)/i);
        if (match) {
          let val = parseInt(match[1], 10);
          if (match[2].toLowerCase() === "kg") val *= 1000;
          return val;
        }
        const numMatch = nameStr.match(/(\d+)/);
        return numMatch ? parseInt(numMatch[1], 10) : 0;
      };
      const gramsA = extractGrams(a);
      const gramsB = extractGrams(b);
      if (gramsA !== gramsB) {
        return gramsA - gramsB;
      }
      return String(a.name || "").localeCompare(String(b.name || ""));
    });
  }, [sizes]);

  // 2. Encontrar o objeto do tamanho selecionado
  const selectedSizeObj = useMemo(() => 
    sortedSizes.find(s => Number(s.id) === Number(selectedId)), 
  [selectedId, sortedSizes]);

  // 3. Lógica de ordenação dos grupos
  const orderedGroups = useMemo(() => {
    if (!selectedSizeObj) return [];
    const rawGroups = (selectedSizeObj.accompanimentGroups || selectedSizeObj.groups || []) as AccGroup[];
    let groupsOrder: number[] = [];
    try {
      groupsOrder = typeof selectedSizeObj.groupsOrder === 'string' 
        ? JSON.parse(selectedSizeObj.groupsOrder) 
        : (selectedSizeObj.groupsOrder || []);
    } catch { groupsOrder = []; }

    if (!groupsOrder.length) return rawGroups;
    return [...rawGroups].sort((a, b) => {
      const idA = Number(a.groupId ?? a.id);
      const idB = Number(b.groupId ?? b.id);
      const indexA = groupsOrder.indexOf(idA);
      const indexB = groupsOrder.indexOf(idB);
      return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
    });
  }, [selectedSizeObj]);

  return (
    <div className="space-y-5">
      <div className="px-1">
        <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest italic">
          1. Qual o tamanho ideal para sua fome?
        </Label>
      </div>

      <div className="grid grid-cols-3 gap-2 px-1">
        {sortedSizes.map((size: SizeOption) => {
          const isSelected = Number(selectedId) === Number(size.id);
          const weight = size.main_dish_weight || size.mainDishWeight || size.weight;

          return (
            <button
              key={size.id}
              type="button"
              onClick={() => onSelect(size)}
              className={cn(
                "relative flex flex-col items-center justify-center py-2.5 px-1 rounded-2xl border-2 transition-all duration-300",
                isSelected
                  ? "border-slate-900 bg-slate-900 text-white shadow-md scale-[1.02]"
                  : "border-slate-100 bg-white text-slate-500 hover:border-emerald-200"
              )}
            >
              <span className="font-black text-[10px] uppercase italic leading-none">
                {size.name}
              </span>
              
              {weight && (
                <span className={cn(
                  "text-[8px] font-bold mt-1 uppercase tracking-tighter opacity-70",
                  isSelected ? "text-slate-300" : "text-slate-500"
                )}>
                  {weight}g
                </span>
              )}

              {isSelected && (
                <div className="absolute -top-1.5 -right-1.5 bg-emerald-500 text-white rounded-full p-0.5 shadow-sm border-2 border-white">
                  <Check size={8} strokeWidth={4} />
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* ÁREA DE PERSONALIZAÇÃO */}
      {selectedSizeObj && (
        <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-500">
          {/* Se o tamanho não tem acompanhamentos disponíveis, exibe a mensagem */}
          {!hasAccompaniments(selectedSizeObj) ? (
            <div className="px-1 py-2 text-[9px] font-bold text-slate-400 italic text-center">
              {/* noAccompanimentsMessage do tamanho selecionado */}
              {(selectedSizeObj as any).noAccompanimentsMessage ||
                "Este tamanho não possui acompanhamentos disponíveis."}
            </div>
          ) : (
            <>
          <div className="flex items-center gap-2 px-1">
            <div className="h-px flex-1 bg-slate-100" />
            <Label className="text-[10px] font-black uppercase text-emerald-600 tracking-widest italic shrink-0">
              2. Complete sua marmita com acompanhamentos
            </Label>
            <div className="h-px flex-1 bg-slate-100" />
          </div>

          <div className="bg-white rounded-[2rem] p-5 border border-slate-100 shadow-sm">
            {/* ✅ CORREÇÃO DEFINITIVA: Tipagem real aplicada, sem 'any' */}
            <AccompanimentList 
              groups={orderedGroups} 
              selectedAccs={selectedAccs}
              onAdd={onAddAcc}
              onRemove={onRemoveAcc}
            />
          </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
