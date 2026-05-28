import React, { useMemo } from "react";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue, 
} from "@/components/ui/select";
import { X, CheckCircle2, Circle } from "lucide-react";
import { CategoryIcon } from "@/pages/products/drawer/CategoryIcon";
import { cn } from "@/lib/utils";

// --- INTERFACES DE TIPAGEM ---

interface AccompanimentOption {
  id: string | number;
  name: string;
  price_modifier?: string | number;
  iconKey?: string;
  categoryColor?: string;
  groupId?: number;
}

// Interface para os itens dentro do array itemsOrder
interface ConfigItem {
  id?: string | number;
  optionId?: string | number;
  price_modifier?: string | number;
}

interface AccompanimentGroup {
  id?: string | number;
  groupId?: string | number;
  name: string;
  maxSelections: number | string;
  minSelections?: number | string;
  options?: AccompanimentOption[];
  accompanimentOptions?: AccompanimentOption[];
  itemsOrder?: string | unknown[]; 
  processedOptions: AccompanimentOption[];
}

interface AccompanimentListProps {
  groups: AccompanimentGroup[];
  selectedAccs: AccompanimentOption[];
  onAdd: (group: AccompanimentGroup, optionId: string) => void;
  onRemove: (group: AccompanimentGroup, optionId: string | number) => void;
}

export function AccompanimentList({ groups, selectedAccs, onAdd, onRemove }: AccompanimentListProps) {
  
  const processedGroups = useMemo(() => {
    if (!groups) return [];
    return groups.map((group) => {
      const rawOptions = group.options || group.accompanimentOptions || [];
      
      let itemsConfig: unknown[] = [];
      try {
        if (typeof group.itemsOrder === 'string') {
          itemsConfig = JSON.parse(group.itemsOrder) as unknown[];
        } else if (Array.isArray(group.itemsOrder)) {
          itemsConfig = group.itemsOrder;
        }
      } catch { 
        itemsConfig = []; 
      }

      let orderedOptions: AccompanimentOption[] = [];
      
      if (!itemsConfig || itemsConfig.length === 0) {
        orderedOptions = [...rawOptions].sort((a, b) => (a.name || "").localeCompare(b.name || ""));
      } else {
        orderedOptions = itemsConfig
          .map((conf) => {
            const isObj = typeof conf === 'object' && conf !== null;
            // ✅ CORREÇÃO: Usando a interface ConfigItem em vez de 'any'
            const item = conf as ConfigItem;
            const optId = isObj ? (item.id || item.optionId) : conf;
            const baseOpt = rawOptions.find((o) => Number(o.id) === Number(optId));
            
            if (!baseOpt) return null;

            return { 
              ...baseOpt, 
              price_modifier: isObj 
                ? item.price_modifier || baseOpt.price_modifier || "0.00" 
                : baseOpt.price_modifier || "0.00"
            } as AccompanimentOption;
          })
          .filter((opt): opt is AccompanimentOption => opt !== null);
      }
      
      return { ...group, processedOptions: orderedOptions };
    });
  }, [groups]);

  if (!groups || groups.length === 0) return null;

  return (
    <div className="space-y-12 text-left">
      {processedGroups.map((group) => {
        const groupId = Number(group.id || group.groupId);
        const selections = (selectedAccs || []).filter((a) => Number(a.groupId) === groupId);
        const max = Number(group.maxSelections || 1);
        const min = Number(group.minSelections || 0);
        const isFull = selections.length >= max;
        const isComplete = selections.length >= min;

        return (
          <div key={`group-${groupId}`} className="space-y-4">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <Label className="text-[11px] font-black uppercase text-slate-800 tracking-wider">
                    {group.name}
                  </Label>
                  {isComplete ? (
                    <CheckCircle2 size={12} className="text-emerald-500" />
                  ) : (
                    <Circle size={12} className="text-amber-400 animate-pulse" />
                  )}
                </div>
                <span className="text-[8px] font-bold uppercase tracking-tighter mt-0.5">
                  {!isComplete 
                    ? <span className="text-amber-500 italic">Escolha pelo menos {min - selections.length} item(ns)</span>
                    : <span className="text-emerald-500 italic">Pronto!</span>
                  }
                </span>
              </div>
              <div className="text-right">
                <span className="text-[9px] font-black text-slate-500 block uppercase">
                  {selections.length} / {max}
                </span>
              </div>
            </div>

            <Select onValueChange={(val) => onAdd(group, val)} disabled={isFull}>
              <SelectTrigger className={cn(
                "w-full h-14 rounded-2xl border-2 transition-all px-5 font-bold text-xs uppercase shadow-sm",
                !isComplete ? "border-amber-100 bg-amber-50" : "border-slate-100 bg-white"
              )}>
                <SelectValue placeholder={isFull ? "Limite atingido" : "Selecione uma opção..."} />
              </SelectTrigger>
              
              <SelectContent className="bg-white border border-slate-200 rounded-2xl shadow-2xl z-[200] min-w-[var(--radix-select-trigger-width)] overflow-hidden">
                {group.processedOptions.map((opt) => {
                  const isSel = selections.some((s) => Number(s.id) === Number(opt.id));
                  const price = Number(opt.price_modifier || 0);

                  return (
                    <SelectItem 
                      key={opt.id} 
                      value={String(opt.id)} 
                      disabled={isSel}
                      className="focus:bg-slate-50 py-3 px-4 border-b border-slate-50 last:border-none"
                    >
                      <div className="flex justify-between items-center w-full">
                        <div className="flex items-center gap-3">
                          <CategoryIcon iconKey={opt.iconKey} color={opt.categoryColor} size={16} />
                          <div className="flex flex-col text-left">
                            <span className={cn("text-[10px] font-bold", isSel ? "text-slate-500" : "text-slate-700")}>
                              {opt.name}
                            </span>
                            {price > 0 && (
                              <span className="text-[9px] text-emerald-600 font-black">+ R$ {price.toFixed(2)}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>

            {selections.length > 0 && (
              <div className="flex flex-col gap-2 pt-1">
                {selections.map((a) => (
                  <div 
                    key={a.id}
                    className="flex items-center justify-between bg-slate-900 text-white p-3 rounded-2xl shadow-md border border-slate-800"
                  >
                    <div className="flex items-center gap-3">
                      <CategoryIcon iconKey={a.iconKey} color="white" size={14} />
                      <span className="text-[10px] font-black uppercase italic tracking-wide">{a.name}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => onRemove?.(group, a.id)}
                      className="h-8 w-8 flex items-center justify-center bg-white/10 hover:bg-red-500 rounded-full transition-all"
                    >
                      <X size={14} className="text-white" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
