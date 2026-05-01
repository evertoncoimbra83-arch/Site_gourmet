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

// --- INTERFACES ---
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

interface AccompanimentListProps {
  groups: AccGroup[];
  selectedAccs: SelectedAcc[];
  onAdd: (group: AccGroup, val: string) => void;
  onRemove: (group: AccGroup, id: string | number) => void;
}

export function AccompanimentList({ groups, selectedAccs, onAdd, onRemove }: AccompanimentListProps) {
  
  const processedGroups = useMemo(() => {
    if (!groups) return [];
    return groups.map((group) => {
      const rawOptions = group.options || group.accompanimentOptions || [];
      
      let itemsConfig: Record<string, unknown>[] = [];
      try {
        itemsConfig = typeof group.itemsOrder === 'string' 
          ? JSON.parse(group.itemsOrder) 
          : (Array.isArray(group.itemsOrder) ? (group.itemsOrder as Record<string, unknown>[]) : []);
      } catch { itemsConfig = []; }

      let orderedOptions: AccOption[] = [];
      if (!itemsConfig.length) {
        orderedOptions = [...rawOptions].sort((a, b) => (a.name || "").localeCompare(b.name || ""));
      } else {
        // ✅ CORREÇÃO: Criamos uma lista temporária e filtramos de forma que o TS entenda o tipo resultante
        const mapped = itemsConfig.map((conf) => {
          const optId = typeof conf === 'object' && conf !== null 
            ? (conf.id || conf.optionId) 
            : conf;
          
          const baseOpt = rawOptions.find((o) => Number(o.id) === Number(optId));
          if (!baseOpt) return null;

          // Garantimos que o retorno segue exatamente a interface AccOption
          const option: AccOption = { 
            ...baseOpt, 
            price_modifier: (conf.price_modifier as string | number) || baseOpt.price_modifier || "0.00" 
          };
          return option;
        });

        // ✅ Uso de Type Guard simplificado para evitar Erro 2677
        orderedOptions = mapped.filter((o): o is AccOption => o !== null);
      }
      return { ...group, processedOptions: orderedOptions };
    });
  }, [groups]);

  if (!groups || groups.length === 0) return null;

  return (
    <div className="space-y-12">
      {processedGroups.map((group) => {
        const groupId = String(group.groupId ?? group.id);
        const selections = (selectedAccs || []).filter((a) => String(a.groupId) === groupId);
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
                <span className="text-[9px] font-black text-slate-400 block uppercase">
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
              
              <SelectContent className="bg-white border border-slate-200 rounded-2xl shadow-2xl z-200 min-w-(--radix-select-trigger-width) overflow-hidden">
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
                          <div className="flex flex-col">
                            <span className={cn("text-[10px] font-bold", isSel ? "text-slate-300" : "text-slate-700")}>
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
                    key={`${groupId}-${a.id}`}
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
