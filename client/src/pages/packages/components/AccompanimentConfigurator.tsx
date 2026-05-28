// client/src/pages/packages/components/AccompanimentConfigurator.tsx
import React, { useMemo } from "react"; 
import { X, Scale, ChevronRight } from "lucide-react";

import { usePackageAcc } from "../logic/usePackageAcc";
import PackageNutritionDashboard from "./PackageNutritionDashboard";
import AccompanimentSelector from "@/components/AccompanimentSelector";
import type { Group, Option } from "@/components/AccompanimentSelector";
import { AccompanimentOption } from "../logic/packageMachine.types";
import type { TRPCBaseItem, TRPCGroupMeta, PackageSlot } from "../view/PackageDrawer";

interface AccompanimentConfiguratorProps {
  index: number;
  slot: PackageSlot;
  pkg: {
    allowedAccompaniments: TRPCBaseItem[];
    accompanimentGroups: TRPCGroupMeta[];
  };
  currentState: {
    dishId?: string;
    dishName?: string;
    selectedAccompaniments: AccompanimentOption[];
  } | undefined;
  actions: {
    removeMeal: (index: number) => void;
    updateAccompaniments: (index: number, accs: AccompanimentOption[]) => void;
  };
  onNext: () => void;
  isLast: boolean;
  sizeWeight: number;
}

export function AccompanimentConfigurator({
  index,
  slot,
  pkg,           // ✅ FIX: agora destructurado (antes era ignorado)
  currentState,
  actions,
  onNext,
  isLast,
  sizeWeight
}: AccompanimentConfiguratorProps) {
  
  const { accompanimentGroups, formattedSelections } = usePackageAcc({
    currentMealState: currentState,
    slot: slot,
    // ✅ FIX: passa allowedAccompaniments para hidratar grupos do Smart Generator
    // que só têm optionIds e não têm options[] completo
    allOptions: pkg.allowedAccompaniments as unknown as Record<string, unknown>[],
  });

  const currentDish = useMemo(() => 
    (slot.dishes || []).find((d) => String(d.id) === String(currentState?.dishId)),
    [slot.dishes, currentState?.dishId]
  );

  const handleToggle = (group: Group, optionId: string) => {
    let currentSelections = [...(currentState?.selectedAccompaniments || [])];
    
    const existingIndex = currentSelections.findIndex(
      (acc) => String(acc.id) === String(optionId) && String(acc.groupId) === String(group.id)
    );

    if (existingIndex > -1) {
      currentSelections.splice(existingIndex, 1);
    } else {
      const optionData = group.options.find((o) => String(o.id) === String(optionId));
      
      if (optionData) {
        const optionMeta = optionData as unknown as Record<string, unknown>;
        const countInGroup = currentSelections.filter((a) => String(a.groupId) === String(group.id)).length;
        const max = Number(group.maxSelections || 1);

        if (countInGroup >= max) {
          if (max === 1) {
            currentSelections = currentSelections.filter((a) => String(a.groupId) !== String(group.id));
          } else {
            return;
          }
        }

        currentSelections.push({
          id: String(optionData.id),
          name: String(optionData.name),
          groupId: String(group.id),
          groupName: String(group.name),
          weight: Number(optionData.weight || optionData.defaultGrammage || 100),
          priceModifier: Number(optionData.priceModifier || 0),
          nutritional_info:
            optionMeta.nutritional_info ||
            optionMeta.nutritionalInfo ||
            optionMeta.nutrition ||
            null,
          nutritionalInfo:
            optionMeta.nutritionalInfo ||
            optionMeta.nutritional_info ||
            optionMeta.nutrition ||
            null,
        } as AccompanimentOption);
      }
    }

    actions.updateAccompaniments(index, currentSelections);
  };

  const typedGroups = accompanimentGroups as unknown as Group[];
  const typedSelections = formattedSelections as unknown as Record<number, Option[]>;

  return (
    <div className="space-y-8 py-2 animate-in fade-in slide-in-from-bottom-3 duration-500">
      
      {/* CARD DO PRATO SELECIONADO */}
      <div className="relative overflow-hidden bg-white border border-slate-200 rounded-[2rem] p-5 shadow-sm group">
        <div className="flex items-center justify-between relative z-10">
          <div className="flex flex-col">
            <span className="text-[9px] font-black uppercase text-emerald-600 tracking-[0.2em] flex items-center gap-1.5 mb-1">
              <Scale size={10} strokeWidth={3} /> Prato Selecionado
            </span>
            <h4 className="text-sm font-black uppercase italic text-slate-900 leading-tight">
              {currentState?.dishName}
            </h4>
            <span className="text-[10px] font-bold text-slate-400 mt-1 uppercase">
              Porção base de {sizeWeight}g
            </span>
          </div>
          
          <button 
            type="button"
            onClick={() => actions.removeMeal(index)}
            className="h-10 w-10 flex items-center justify-center bg-slate-50 text-slate-400 rounded-2xl hover:bg-red-50 hover:text-red-500 transition-all active:scale-90 shadow-sm"
          >
            <X size={18} />
          </button>
        </div>
        
        <div className="absolute -right-4 -bottom-4 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity pointer-events-none">
          <Scale size={80} />
        </div>
      </div>

      {/* DASHBOARD NUTRICIONAL */}
      <PackageNutritionDashboard 
        dish={currentDish as Record<string, unknown>} 
        selectedAccs={currentState?.selectedAccompaniments as unknown as Record<string, unknown>[]} 
        defaultWeight={sizeWeight} 
      />

      {/* SELEÇÃO DE ACOMPANHAMENTOS */}
      <div className="space-y-6">
        {typedGroups.length > 0 ? (
          <>
            <div className="flex items-center gap-3 px-1">
              <div className="h-px flex-1 bg-slate-100" />
              <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] whitespace-nowrap">
                2. Personalize com acompanhamentos
              </h4>
              <div className="h-px flex-1 bg-slate-100" />
            </div>

            <p className="px-1 text-[9px] font-black uppercase tracking-[0.16em] text-slate-400">
              Escolha conforme as regras de cada grupo. Itens adicionais aparecem no card da opção.
            </p>

            <AccompanimentSelector 
              groups={typedGroups} 
              selections={typedSelections} 
              onToggle={handleToggle} 
            />
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-10 px-6 bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200">
            <Scale size={32} className="text-slate-200 mb-3" />
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest text-center">
              Esta opção não requer <br/> acompanhamentos extras
            </p>
          </div>
        )}
      </div>

      {/* NAVEGAÇÃO */}
      {!isLast && (
        <button 
          type="button"
          onClick={onNext}
          className="group w-full h-16 bg-slate-950 hover:bg-emerald-600 text-white rounded-[1.5rem] font-black uppercase tracking-widest text-[11px] shadow-xl flex items-center justify-between px-8 transition-all active:scale-[0.98]"
        >
          <span className="flex flex-col items-start leading-none">
            <span className="text-[8px] text-white/50 mb-1 uppercase">Próximo Passo</span>
            Configurar Marmita {index + 2}
          </span>
          <div className="bg-white/10 p-2 rounded-xl group-hover:bg-white/20 transition-colors">
            <ChevronRight size={18} />
          </div>
        </button>
      )}
    </div>
  );
}
