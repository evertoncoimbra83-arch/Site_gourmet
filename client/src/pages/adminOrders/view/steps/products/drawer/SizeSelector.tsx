import React, { useMemo } from "react";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react"; 
import { Label } from "@/components/ui/label";
import { AccompanimentList } from "./AccompanimentList";

// --- INTERFACES SINCRONIZADAS COM ACCOMPANIMENTLIST ---

interface AccompanimentOption {
  id: string | number;
  name: string;
  price_modifier?: string | number;
  iconKey?: string;
  categoryColor?: string;
  groupId?: number;
}

interface AccompanimentGroup {
  id?: string | number; // ✅ Tornado opcional para bater com AccompanimentList
  groupId?: string | number;
  name: string;
  maxSelections: number | string;
  minSelections?: number | string;
  options?: AccompanimentOption[];
  accompanimentOptions?: AccompanimentOption[];
  itemsOrder?: string | unknown[];
  processedOptions: AccompanimentOption[];
}

interface Size {
  id: string | number;
  name: string;
  displayOrder?: number;
  display_order?: number;
  main_dish_weight?: number;
  mainDishWeight?: number;
  weight?: number;
  accompanimentGroups?: AccompanimentGroup[];
  groups?: AccompanimentGroup[];
  groupsOrder?: string | number[];
}

interface SizeSelectorProps {
  sizes: Size[];
  selectedId: string | number | null;
  onSelect: (size: Size) => void;
  selectedAccs: AccompanimentOption[];
  onAddAcc: (group: AccompanimentGroup, optionId: string) => void;
  onRemoveAcc: (group: AccompanimentGroup, optionId: string | number) => void;
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
    return [...sizes].sort((a, b) => (a.displayOrder ?? a.display_order ?? 0) - (b.displayOrder ?? b.display_order ?? 0));
  }, [sizes]);

  // 2. Encontrar o objeto do tamanho selecionado
  const selectedSizeObj = useMemo(() => 
    sortedSizes.find(s => Number(s.id) === Number(selectedId)), 
  [selectedId, sortedSizes]);

  // 3. Lógica de ordenação dos grupos
  const orderedGroups = useMemo(() => {
    if (!selectedSizeObj) return [];
    const rawGroups = selectedSizeObj.accompanimentGroups || selectedSizeObj.groups || [];
    let groupsOrder: number[] = [];
    try {
      groupsOrder = typeof selectedSizeObj.groupsOrder === 'string' 
        ? JSON.parse(selectedSizeObj.groupsOrder) 
        : (selectedSizeObj.groupsOrder || []);
    } catch { groupsOrder = []; }

    if (!groupsOrder.length) return rawGroups;
    return [...rawGroups].sort((a, b) => {
      const indexA = groupsOrder.indexOf(Number(a.id || a.groupId));
      const indexB = groupsOrder.indexOf(Number(b.id || b.groupId));
      return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
    });
  }, [selectedSizeObj]);

  return (
    <div className="space-y-5 text-left">
      <div className="px-1">
        <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest italic">
          1. Escolha o Tamanho
        </Label>
      </div>

      <div className="grid grid-cols-3 gap-2 px-1">
        {sortedSizes.map((size) => {
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

      {selectedSizeObj && (
        <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-500 text-left">
          <div className="flex items-center gap-2 px-1">
            <div className="h-px flex-1 bg-slate-100" />
            <Label className="text-[10px] font-black uppercase text-emerald-600 tracking-widest italic shrink-0">
              2. Personalize seu {selectedSizeObj.name}
            </Label>
            <div className="h-px flex-1 bg-slate-100" />
          </div>

          <div className="bg-white rounded-[2rem] p-5 border border-slate-100 shadow-sm text-left">
            <AccompanimentList 
              groups={orderedGroups} 
              selectedAccs={selectedAccs}
              onAdd={onAddAcc}
              onRemove={onRemoveAcc}
            />
          </div>
        </div>
      )}
    </div>
  );
}