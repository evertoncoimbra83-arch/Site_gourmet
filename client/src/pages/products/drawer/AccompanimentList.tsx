import React, { useMemo, useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { CheckCircle2, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

interface AccOption {
  id: string | number;
  name: string;
  price_modifier?: string | number;
  priceModifier?: string | number;
  iconKey?: string;
  categoryColor?: string;
  isNoAccompaniment?: boolean;
  is_no_accompaniment?: boolean;
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

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== "undefined" && window.innerWidth < 640
  );

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 639px)");
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  return isMobile;
}

export function AccompanimentList({
  groups,
  selectedAccs,
  onAdd,
  onRemove,
}: AccompanimentListProps) {
  const isMobile = useIsMobile();
  const [userExpandedGroups, setUserExpandedGroups] = useState<Record<string, boolean>>({});

  // Reset userExpandedGroups when selections become incomplete
  useEffect(() => {
    setUserExpandedGroups((prev) => {
      let changed = false;
      const next = { ...prev };
      groups.forEach((group) => {
        const groupId = String(group.groupId ?? group.id);
        const selections = (selectedAccs || []).filter((a) => String(a.groupId) === groupId);
        const min = Number(group.minSelections || 0);
        const isComplete = selections.length >= min;
        if (!isComplete && next[groupId]) {
          delete next[groupId];
          changed = true;
        }
      });
      return changed ? next : prev;
    });
  }, [groups, selectedAccs]);

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
        const mapped = itemsConfig.map((conf) => {
          const optId = typeof conf === 'object' && conf !== null
            ? (conf.id || (conf as any).optionId)
            : conf;

          const baseOpt = rawOptions.find((o) => Number(o.id) === Number(optId));
          if (!baseOpt) return null;

          const option: AccOption = {
            ...baseOpt,
            price_modifier: (conf as any).price_modifier || baseOpt.price_modifier || (conf as any).priceModifier || baseOpt.priceModifier || "0.00"
          };
          return option;
        });

        orderedOptions = mapped.filter((o): o is AccOption => o !== null);
      }
      return { ...group, processedOptions: orderedOptions };
    });
  }, [groups]);

  if (!groups || groups.length === 0) return null;

  return (
    <div className="space-y-8 md:space-y-12">
      {processedGroups.map((group) => {
        const groupId = String(group.groupId ?? group.id);
        const selections = (selectedAccs || []).filter((a) => String(a.groupId) === groupId);
        const max = Number(group.maxSelections || 1);
        const min = Number(group.minSelections || 0);
        const isFull = selections.length >= max;
        const isComplete = selections.length >= min;
        const selectionHint =
          min > 0 && max > 0 && min === max
            ? `Obrigatorio escolher ${min} ${min === 1 ? "opcao" : "opcoes"}`
            : min > 0
              ? `Escolha entre ${min} e ${max} opcoes`
              : max === 1
                ? "Escolha ate 1 opcao"
                : `Escolha ate ${max} opcoes`;

        const isLimitReached = selections.length >= min && (min > 0 || selections.length > 0);
        const isCollapsed = isMobile && isLimitReached && !userExpandedGroups[groupId];

        if (isCollapsed) {
          return (
            <div key={`group-${groupId}`} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-3">
              <div className="flex justify-between items-center">
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <Label className="text-[11px] font-black uppercase text-slate-800 tracking-wider">
                      {group.name}
                    </Label>
                    <CheckCircle2 size={12} className="text-emerald-500" />
                  </div>
                  <span className="text-[9px] font-bold text-slate-500 mt-0.5">
                    {selections.length} de {max} selecionado(s)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setUserExpandedGroups(prev => ({ ...prev, [groupId]: true }))}
                  className="text-[10px] font-black uppercase tracking-widest text-emerald-600 hover:text-emerald-700 bg-white border border-slate-200 px-3 py-1.5 rounded-xl transition-all shadow-sm"
                >
                  Alterar
                </button>
              </div>
              <div className="flex flex-col gap-1.5 pt-1 border-t border-slate-100">
                {selections.map((a) => (
                  <div key={`${groupId}-${a.id}`} className="flex items-center gap-2 text-[10px] font-bold text-slate-700 uppercase tracking-wide">
                    <span className="text-emerald-500 font-extrabold">✓</span>
                    <span>{a.name}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        }

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
                <span className="text-[8px] font-bold uppercase tracking-tighter text-slate-400 mt-1">
                  {selectionHint}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[9px] font-black text-slate-500 block uppercase">
                  {selections.length} / {max}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {group.processedOptions.map((opt) => {
                const isSel = selections.some((s) => Number(s.id) === Number(opt.id));
                const price = Number(opt.price_modifier || opt.priceModifier || 0);

                const handleClick = () => {
                  if (isSel) {
                    onRemove(group, opt.id);
                  } else {
                    if (!isFull) {
                      onAdd(group, String(opt.id));
                    }
                  }
                };

                return (
                  <button
                    key={opt.id}
                    type="button"
                    disabled={!isSel && isFull}
                    onClick={handleClick}
                    className={cn(
                      "flex items-center justify-between p-3 rounded-2xl border-2 transition-all text-left shadow-sm min-h-[3.25rem] h-auto w-full",
                      isSel
                        ? "border-slate-900 bg-slate-900 text-white hover:bg-slate-800"
                        : "border-slate-100 bg-white hover:bg-slate-50 text-slate-800",
                      (!isSel && isFull) && "opacity-30 cursor-not-allowed hover:bg-white"
                    )}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1 mr-2">
                      {isSel ? (
                        <CheckCircle2 className="h-4.5 w-4.5 text-emerald-400 shrink-0" size={18} />
                      ) : (
                        <Circle className="h-4.5 w-4.5 text-slate-300 shrink-0" size={18} />
                      )}
                      <span className={cn(
                        "text-[11px] font-semibold whitespace-normal break-words leading-snug flex-1",
                        isSel ? "text-white" : "text-slate-800"
                      )}>
                        {opt.name}
                      </span>
                    </div>
                    {price > 0 && (
                      <span className={cn(
                        "text-[10px] font-black shrink-0 ml-auto pl-2 tracking-wide",
                        isSel ? "text-emerald-300" : "text-emerald-600"
                      )}>
                        + R$ {price.toFixed(2)}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
