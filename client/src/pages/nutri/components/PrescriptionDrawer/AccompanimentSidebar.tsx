// client/src/pages/nutri/components/PrescriptionDrawer/AccompanimentSidebar.tsx

import React, { useMemo, useState } from "react";
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Plus,
  Search,
  X,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { FullPrescription } from "../../../../../../server/routers/storefront/nutri/types";
import type { Accompaniment } from "./PrescriptionMealCard";
import { getSizeGroups } from "./utils/builder-helpers";

interface SizeGroup {
  id?: string | number | null;
  name?: string | null;
  minSelections?: string | number | null;
  maxSelections?: string | number | null;
  options?: Accompaniment[] | null;
}

interface SizeWithGroups {
  id?: string | number | null;
  name?: string | null;
  groups?: SizeGroup[] | null;
  accompanimentGroups?: SizeGroup[] | null;
}

interface AccompanimentSidebarProps {
  isPickingAccFor: { mealId: string; groupId: string; optionId: string } | null;
  onClose: () => void;
  onAdd: (mealId: string, groupId: string, optionId: string, acc: Accompaniment) => void;
  prescription: FullPrescription;
}

function getGroupSelectionCount(group: SizeGroup, selected: Accompaniment[]) {
  return selected.filter(
    (acc) => String(acc.sourceGroupId ?? "") === String(group.id ?? ""),
  ).length;
}

export function AccompanimentSidebar({
  isPickingAccFor,
  onClose,
  onAdd,
  prescription,
}: AccompanimentSidebarProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const currentOption = useMemo(() => {
    if (!isPickingAccFor) return undefined;

    return prescription?.meals
      ?.find((meal) => meal.id === isPickingAccFor.mealId)
      ?.groups?.find((group) => group.id === isPickingAccFor.groupId)
      ?.options?.find((option) => option.id === isPickingAccFor.optionId);
  }, [isPickingAccFor, prescription?.meals]);

  const selectedSize = useMemo(() => {
    const sizes = (currentOption?.availableSizes || []) as SizeWithGroups[];
    return sizes.find((size) => String(size.id) === String(currentOption?.sizeId));
  }, [currentOption?.availableSizes, currentOption?.sizeId]);

  const selectedAccs = (currentOption?.allowedAccompaniments || []) as Accompaniment[];

  // 🚀 FIX: Substituída a lógica de coalescência pelo helper canônico com Set contra duplicados
  // getGroupsForSize(selectedSize) retorna os grupos vinculados ao tamanho selecionado
  const getGroupsForSize = (size: SizeWithGroups | undefined) => getSizeGroups(size as any);
  const groups = getGroupsForSize(selectedSize);

  const normalizedSearch = searchTerm.trim().toLowerCase();

  const visibleGroups = groups
    .map((group) => ({
      ...group,
      options: (group.options || [])
        .filter((acc) => acc.name.toLowerCase().includes(normalizedSearch))
        .map((acc) => ({
          ...acc,
          sourceGroupId: group.id ?? null,
          sourceGroupName: group.name ?? null,
        })),
    }))
    .filter((group) => (group.options || []).length > 0);

  if (!isPickingAccFor) return null;

  return (
    <div className="w-full md:w-100 bg-white border-l border-slate-200 flex flex-col z-[130] animate-in slide-in-from-right-10 duration-300 shrink-0 shadow-2xl h-full overflow-hidden">
      <div className="md:hidden p-4 border-b flex items-center gap-3 bg-slate-50 shrink-0">
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="rounded-full h-10 w-10 p-0"
        >
          <ChevronLeft size={20} />
        </Button>
        <span className="text-[10px] font-black uppercase tracking-widest">
          Voltar para Edição
        </span>
      </div>

      <div className="p-6 border-b bg-emerald-900 text-white flex justify-between items-center shrink-0">
        <div className="text-left min-w-0">
          <div className="flex items-center gap-2 text-emerald-400 mb-1">
            <span className="text-[8px] font-black uppercase tracking-[0.2em]">
              Configurador de Combos
            </span>
          </div>
          <h3 className="font-black uppercase italic text-sm leading-none truncate">
            {currentOption?.name || "Configurar Item"}
          </h3>
          <p className="text-[9px] font-bold text-emerald-300/60 uppercase mt-1 truncate">
            {selectedSize?.name
              ? `Opções permitidas para ${selectedSize.name}`
              : "Selecione um tamanho válido para trocar acompanhamentos"}
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="hidden md:flex text-white hover:bg-white/10 rounded-full shrink-0"
        >
          <X size={20} />
        </Button>
      </div>

      <div className="p-4 border-b bg-white shrink-0">
        <div className="relative">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            size={16}
          />
          <Input
            placeholder="PROCURAR ITEM..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            className="pl-11 h-12 rounded-2xl text-[10px] font-black uppercase bg-slate-50 border-none focus-visible:ring-emerald-500 transition-all"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50 custom-scrollbar text-left">
        {visibleGroups.length === 0 ? (
          <div className="py-20 text-center opacity-50 flex flex-col items-center gap-4">
            <Search size={40} />
            <p className="max-w-56 text-[10px] font-black uppercase tracking-widest leading-relaxed">
              {groups.length === 0
                ? "Este tamanho não possui acompanhamentos configurados."
                : "Nenhum item encontrado neste tamanho."}
            </p>
          </div>
        ) : (
          visibleGroups.map((group) => {
            const selectedCount = getGroupSelectionCount(group as any, selectedAccs);
            const maxSelections = Number(group.maxSelections || 0);

            return (
              <div key={String(group.id ?? group.name)} className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">
                    {group.name || "Grupo"}
                  </p>
                  <span className="text-[8px] font-black uppercase text-slate-400">
                    mín {Number(group.minSelections || 0)} / máx{" "}
                    {maxSelections > 0 ? maxSelections : "-"}
                  </span>
                </div>

                {(group.options || []).map((acc) => {
                  const isAlreadyLinked = selectedAccs.some(
                    (selected) => String(selected.id) === String(acc.id),
                  );
                  const maxReached =
                    !isAlreadyLinked &&
                    maxSelections > 0 &&
                    selectedCount >= maxSelections;

                  return (
                    <div
                      key={`${String(group.id ?? "group")}:${String(acc.id)}`}
                      onClick={() => {
                        if (!maxReached) {
                          // 🚀 FIX: Alinhado com os parâmetros de coordenadas destravados do novo usePrescriptionBuilder
                          onAdd(isPickingAccFor.mealId, isPickingAccFor.groupId, isPickingAccFor.optionId, acc as any);
                        }
                      }}
                      className={cn(
                        "group p-4 rounded-2xl border shadow-sm transition-all flex items-center justify-between min-w-0",
                        maxReached
                          ? "cursor-not-allowed bg-slate-50 border-slate-100 opacity-60"
                          : "cursor-pointer active:scale-[0.98]",
                        isAlreadyLinked
                          ? "bg-emerald-50 border-emerald-200 ring-2 ring-emerald-500/5"
                          : "bg-white border-slate-100 hover:border-emerald-500 hover:shadow-md",
                      )}
                    >
                      <div className="flex flex-col gap-0.5 min-w-0">
                        <p
                          className={cn(
                            "text-[10px] font-black uppercase leading-tight tracking-tight truncate",
                            isAlreadyLinked ? "text-emerald-900" : "text-slate-800",
                          )}
                        >
                          {acc.name}
                        </p>
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] font-bold text-emerald-600 uppercase whitespace-nowrap">
                            {Number(acc.energyKcal || 0)} kcal
                          </span>
                          <span className="h-1 w-1 rounded-full bg-slate-300" />
                          <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter truncate">
                            P: {Number(acc.proteins || 0)}g | C:{" "}
                            {Number(acc.carbs || 0)}g
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0 ml-4">
                        {isAlreadyLinked ? (
                          <div className="h-8 w-8 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-200 animate-in zoom-in duration-200">
                            <CheckCircle2 size={16} strokeWidth={3} />
                          </div>
                        ) : (
                          <div className="h-8 w-8 rounded-full bg-slate-50 text-slate-300 flex items-center justify-center group-hover:bg-emerald-100 group-hover:text-emerald-600 transition-colors border border-slate-100">
                            <Plus size={16} strokeWidth={3} />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })
        )}
      </div>

      <div className="p-4 bg-white border-t border-slate-100 shrink-0">
        <div className="flex items-center gap-2 text-slate-400">
          <ChevronRight size={14} className="text-emerald-500 shrink-0" />
          <span className="text-[8px] font-black uppercase tracking-widest leading-tight">
            {/* A lista vem dos grupos vinculados ao tamanho selecionado. */}
            A lista vem dos grupos vinculados ao tamanho selecionado.
          </span>
        </div>
      </div>
    </div>
  );
}