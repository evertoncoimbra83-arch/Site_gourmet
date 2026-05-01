import React from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Utensils } from "lucide-react";
import { appToast as toast } from "@/lib/app-toast";

interface AccompanimentOption {
  id: number;
  name: string;
}

export interface AccompanimentGroup {
  id: number;
  name: string;
  maxSelections: number;
  options: AccompanimentOption[];
}

interface AccompanimentSelectorProps {
  groups?: AccompanimentGroup[];
  selectedIds: string[];
  onChange: (newIds: string[]) => void;
}

export function AccompanimentSelector({ groups, selectedIds, onChange }: AccompanimentSelectorProps) {
  if (!groups || groups.length === 0) {
    return (
      <div className="bg-slate-50 p-3 rounded-xl border border-dashed border-slate-200">
        <p className="text-[10px] text-slate-400 font-bold uppercase text-center">
          Este tamanho não possui acompanhamentos configurados.
        </p>
      </div>
    );
  }

  const handleToggle = (optionId: string, groupMax: number, groupOptions: AccompanimentOption[]) => {
    const isSelected = selectedIds.includes(optionId);
    
    if (isSelected) {
      // Remover se já estiver selecionado
      onChange(selectedIds.filter(id => id !== optionId));
    } else {
      // Lógica de validação de limite máximo por grupo
      const idsFromThisGroup = selectedIds.filter(id => 
        groupOptions.some(opt => String(opt.id) === id)
      );

      if (idsFromThisGroup.length >= groupMax && groupMax > 0) {
        toast.warning(`Limite atingido`, {
          description: `Neste grupo podes selecionar no máximo ${groupMax} opções.`
        });
        return;
      }

      onChange([...selectedIds, optionId]);
    }
  };

  return (
    <div className="space-y-4 pt-2">
      <div className="flex items-center gap-2 mb-1">
        <Utensils size={12} className="text-emerald-600" />
        <span className="text-[9px] font-black uppercase text-emerald-800 tracking-wider">
          Configurar Acompanhamentos
        </span>
      </div>

      {groups.map((group) => (
        <div key={group.id} className="space-y-2 bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
          <div className="flex justify-between items-center">
            <label className="text-[10px] font-black uppercase text-slate-600">
              {group.name}
            </label>
            <span className="text-[9px] font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
              Máx: {group.maxSelections}
            </span>
          </div>

          <div className="grid grid-cols-1 gap-1.5">
            {group.options.map((opt) => {
              const optIdStr = String(opt.id);
              const isActive = selectedIds.includes(optIdStr);

              return (
                <div 
                  key={opt.id} 
                  onClick={() => handleToggle(optIdStr, group.maxSelections, group.options)}
                  className={`flex items-center gap-2 p-2 rounded-lg border transition-all cursor-pointer ${
                    isActive 
                      ? 'bg-emerald-50 border-emerald-200' 
                      : 'bg-white border-slate-50 hover:border-slate-200'
                  }`}
                >
                  <Checkbox 
                    id={`opt-${opt.id}`} 
                    checked={isActive}
                    onCheckedChange={() => handleToggle(optIdStr, group.maxSelections, group.options)}
                  />
                  <span className={`text-[10px] font-bold uppercase transition-colors ${
                    isActive ? 'text-emerald-700' : 'text-slate-500'
                  }`}>
                    {opt.name}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}