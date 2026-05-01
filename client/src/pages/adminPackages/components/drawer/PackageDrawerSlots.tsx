// components/drawer/PackageDrawerSlots.tsx
import React, { ComponentProps, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { PackageSlotsEditor } from "../PackageSlotsEditor";
import { Box, Sparkles } from "lucide-react";
import { Slot, SlotGroup } from "../../logic/generator/smartGenerator";
import { AdminDish } from "../../logic/hooks/useAdminPackages";

interface EditorSlotGroup {
  id: string | number;
  customLabel?: string;
  optionIds?: (string | number)[];
}

interface PackageDrawerSlotsProps {
  logic: {
    state: { config: { slots: Slot[] } };
    actions: {
      addSlot: () => void;
      updateSlotName: (index: number, name: string) => void;
      updateSlotDishes: (index: number, dishIds: string[]) => void;
      updateSlotGroups: (index: number, groups: SlotGroup[]) => void;
      removeSlot: (index: number) => void;
      reorderSlots: (startIndex: number, endIndex: number) => void;
      duplicateSlot: (index: number) => void;
      updateSlotSize: (index: number, sizeId: string | number | undefined) => void;
    };
    data: {
      allDishes: AdminDish[];
      allOptions: { id: string | number; name: string; price?: number }[];
      allAccompanimentGroups: { id: string | number; name: string }[];
      allSizes: { id: string | number; name: string; defaultMainWeight?: number }[];
    };
  };
  selectedSizeId: string | number;
}

export function PackageDrawerSlots({
  logic,
  selectedSizeId,
}: PackageDrawerSlotsProps) {
  const sanitizedSlotsForEditor = useMemo(() => {
    const rawSlots = logic.state.config.slots || [];

    return rawSlots.map((slot) => ({
      ...slot,
      groups: (slot.groups || []).map((group) => {
        const isCustom = group.id === "custom_sorteo";
        const winnerId = group.optionIds?.[0];

        const winnerName =
          isCustom && winnerId
            ? logic.data.allOptions.find(
                (option) => String(option.id) === String(winnerId)
              )?.name
            : null;

        return {
          ...group,
          id: String(group.id),
          customLabel: winnerName || group.customLabel || "Acompanhamento",
          optionIds: group.optionIds || [String(group.id)],
        };
      }),
    }));
  }, [logic.state.config.slots, logic.data.allOptions]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300 text-left">
      <div className="flex items-center justify-between px-1">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-slate-900">
            <div className="p-1.5 bg-orange-50 rounded-lg">
              <Box size={16} className="text-orange-600" />
            </div>
            <h4 className="text-sm font-black uppercase tracking-widest">
              Arquitetura do Kit
            </h4>
          </div>
          <p className="text-[10px] text-slate-400 font-bold uppercase italic ml-9">
            {sanitizedSlotsForEditor.length > 0
              ? `${sanitizedSlotsForEditor.length} Marmitas configuradas`
              : "Nenhuma marmita adicionada ainda"}
          </p>
        </div>

        <Button
          type="button"
          onClick={logic.actions.addSlot}
          variant="outline"
          className="h-9 px-4 border-slate-200 text-slate-600 font-black text-[10px] uppercase hover:bg-slate-50 rounded-xl"
        >
          + Adicionar Manual
        </Button>
      </div>

      <div className="bg-slate-50/50 p-6 rounded-[2rem] border border-slate-100 shadow-inner">
        {sanitizedSlotsForEditor.length > 0 ? (
          <div key={`editor-container-${sanitizedSlotsForEditor.length}`}>
            <PackageSlotsEditor
              slots={
                sanitizedSlotsForEditor as unknown as ComponentProps<
                  typeof PackageSlotsEditor
                >["slots"]
              }
              allDishes={logic.data.allDishes.map((dish) => ({
                ...dish,
                id: String(dish.id),
                category:
                  dish.categoryName ||
                  (typeof dish.category === "string" ? dish.category : undefined),
              }))}
              allGroups={(logic.data.allAccompanimentGroups || []).map((group) => ({
                id: String(group.id),
                name: group.name,
              }))}
              allSizes={logic.data.allSizes}
              onUpdateName={logic.actions.updateSlotName}
              onUpdateDishes={logic.actions.updateSlotDishes}
              onUpdateGroups={(index, groups) => {
                const editorGroups = groups as EditorSlotGroup[];
                const sanitizedGroupsForLogic: SlotGroup[] = editorGroups.map(
                  (group) => ({
                    id: String(group.id),
                    customLabel: group.customLabel || "Acompanhamento",
                    optionIds: group.optionIds || [String(group.id)],
                  })
                );
                logic.actions.updateSlotGroups(index, sanitizedGroupsForLogic);
              }}
              onRemoveSlot={logic.actions.removeSlot}
              onReorderSlots={logic.actions.reorderSlots}
              onDuplicateSlot={logic.actions.duplicateSlot}
              onUpdateSlotSize={logic.actions.updateSlotSize}
              selectedSizeId={String(selectedSizeId)}
            />
          </div>
        ) : (
          <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
            <div className="p-4 bg-white rounded-full shadow-sm border border-slate-100">
              <Sparkles size={32} className="text-slate-200" />
            </div>
            <div className="space-y-1">
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest">
                Lista Vazia
              </p>
              <p className="text-[10px] text-slate-400 italic">
                Use o <span className="text-orange-500 font-bold">Magic Build</span> acima
                para gerar as marmitas automaticamente.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
