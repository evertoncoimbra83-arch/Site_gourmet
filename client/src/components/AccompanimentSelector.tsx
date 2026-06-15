// client/src/components/AccompanimentSelector.tsx
import React from "react";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export interface Option {
  id: string | number;
  name: string;
  priceModifier?: number;
  defaultGrammage?: number;
  weight?: number;
  groupId?: string | number;
  isNoAccompaniment?: boolean;
  is_no_accompaniment?: boolean;
}

export interface Group {
  id: string | number;
  name: string;
  minSelections?: number;
  maxSelections?: number;
  options: Option[];
}

interface AccompanimentSelectorProps {
  groups: Group[];
  selections: Record<string | number, Option[]> | Option[];
  onToggle: (group: Group, optionId: string) => void;
}

export default function AccompanimentSelector({
  groups,
  selections,
  onToggle,
}: AccompanimentSelectorProps) {
  if (!groups || groups.length === 0) return null;

  const getGroupSelections = (groupId: string | number): Option[] => {
    if (Array.isArray(selections)) {
      return selections.filter((s) => String(s.groupId) === String(groupId));
    }
    return selections[groupId] || selections[String(groupId)] || [];
  };

  return (
    <div className="space-y-6">
      {groups.map((group) => {
        const groupSelections = getGroupSelections(group.id);
        const max = Number(group.maxSelections || 1);
        const isMaxReached = groupSelections.length >= max;

        return (
          <div key={String(group.id)} className="space-y-3">
            <div className="flex flex-col gap-1 ml-1">
              <h5 className="text-[11px] font-black uppercase text-slate-800 tracking-wider">
                {group.name}
              </h5>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">
                {max === 1 ? "Selecione 1 opção" : `Selecione até ${max} opções`}
              </p>
            </div>

            <div className="grid grid-cols-1 gap-2">
              <AnimatePresence mode="popLayout">
                {group.options.map((option) => {
                  const isSelected = groupSelections.some(
                    (s) => String(s.id) === String(option.id)
                  );
                  
                  if (isMaxReached && !isSelected) return null;

                  return (
                    <motion.button
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9, height: 0, padding: 0, border: 0, margin: 0 }}
                      transition={{ duration: 0.2 }}
                      key={String(option.id)}
                      onClick={() => onToggle(group, String(option.id))}
                      className={cn(
                        "flex items-center justify-between p-4 rounded-2xl border-2 transition-all text-left overflow-hidden",
                        isSelected
                          ? "border-emerald-500 bg-emerald-50 shadow-sm"
                          : "border-slate-100 bg-white hover:border-emerald-200"
                      )}
                    >
                      <div className="flex flex-col gap-0.5">
                        <span className={cn(
                          "text-xs font-black uppercase italic transition-colors",
                          isSelected ? "text-emerald-900" : "text-slate-600"
                        )}>
                          {option.name}
                        </span>
                        
                        {/* ✅ TERNÁRIO PARA ELIMINAR O ZERO */}
                        {(Number(option.weight || 0) > 0 || Number(option.defaultGrammage || 0) > 0) ? (
                          <span className={cn(
                            "text-[10px] font-bold uppercase",
                            isSelected ? "text-emerald-600" : "text-slate-400"
                          )}>
                            {option.weight || option.defaultGrammage}g
                          </span>
                        ) : null}
                        
                        {option.priceModifier && Number(option.priceModifier) > 0 ? (
                          <span className="text-[10px] font-bold text-amber-500">
                            + R$ {Number(option.priceModifier).toFixed(2)}
                          </span>
                        ) : null}
                      </div>

                      <div className={cn(
                        "h-6 w-6 rounded-lg border-2 flex items-center justify-center transition-all",
                        isSelected ? "bg-emerald-500 border-emerald-500 text-white" : "border-slate-200 text-transparent"
                      )}>
                        <Check size={14} strokeWidth={4} />
                      </div>
                    </motion.button>
                  );
                })}
              </AnimatePresence>
            </div>
          </div>
        );
      })}
    </div>
  );
}