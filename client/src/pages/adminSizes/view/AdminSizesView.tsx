import React, { useMemo, useState } from "react";
import type { ComponentProps } from "react";

import { useAdminSizesTab } from "../logic/useAdminSizesTab";
import { useAdminGroupsTab } from "../logic/useAdminGroupsTab";
import { useAdminOptionsTab } from "../logic/useAdminOptionsTab";

import { SizeCard } from "../components/SizeCard";
import { GroupCard } from "../components/GroupCard";
import { AccDrawer } from "../components/AccDrawer";

import { LayoutList, Layers, Grid, Plus, Loader2, Edit2, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { appToast as toast } from "@/lib/app-toast";

import { DragDropContext, Droppable, Draggable, type DropResult } from "@hello-pangea/dnd";

// ---------------------------------
// Helpers
// ---------------------------------

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

function toNumberId(v: unknown): number | null {
  if (v == null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

// ---------------------------------
// Types derived from components/hooks
// ---------------------------------
type SizeCardProps = ComponentProps<typeof SizeCard>;
type SizeData = SizeCardProps["size"];

type GroupCardProps = ComponentProps<typeof GroupCard>;
type GroupData = GroupCardProps["group"];

type AccDrawerProps = ComponentProps<typeof AccDrawer>;
type AccData = AccDrawerProps["acc"];

type SizesTab = ReturnType<typeof useAdminSizesTab>;
type GroupsTab = ReturnType<typeof useAdminGroupsTab>;
type OptionsTab = ReturnType<typeof useAdminOptionsTab>;

// Inputs “exatos” das actions (sem any)
type CreateSizeInput = Parameters<SizesTab["actions"]["create"]>[0];
type UpdateSizeFn = SizesTab["actions"]["update"];
type DuplicateSizeInput = Parameters<SizesTab["actions"]["duplicate"]>[0];

// ---------------------------------
// Local “raw” interfaces
// ---------------------------------
interface Category {
  id: number;
  name: string;
}

interface Accompaniment {
  id: number;
  name: string;
  accompanimentCategoryId?: number | null;
  [key: string]: unknown;
}

interface GroupOption {
  id: number;
  name: string;
  [key: string]: unknown;
}

export function AdminSizesView() {
  const [activeTab, setActiveTab] = useState<"sizes" | "groups" | "options">("sizes");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedAcc, setSelectedAcc] = useState<AccData>(null);

  const sizesTab = useAdminSizesTab() as SizesTab;
  const groupsTab = useAdminGroupsTab() as GroupsTab;
  const optionsTab = useAdminOptionsTab() as OptionsTab;

  const isLoading = sizesTab.isLoading || groupsTab.isLoading || optionsTab.isLoading;

  const handleOpenAccDrawer = (acc?: AccData) => {
    setSelectedAcc(acc ?? null);
    setIsDrawerOpen(true);
  };

  // ✅ Sizes normalizados para bater com SizeCard (sem inventar props que não existem no tipo)
  const normalizedSizes: SizeData[] = useMemo(() => {
    const list = (sizesTab.sizes ?? []) as unknown[];

    return list
      .filter(isRecord)
      .map((s) => {
        const noAccMsg =
          typeof s.noAccompanimentsMessage === "string" ? s.noAccompanimentsMessage : "";

        // NOTE: não colocamos "order" aqui, porque o TS reclama se SizeData não tiver essa prop.
        const normalized: SizeData = {
          ...(s as unknown as SizeData),
          noAccompanimentsMessage: noAccMsg,
        };

        return normalized;
      });
  }, [sizesTab.sizes]);

  // ✅ Groups normalizados para bater com GroupCard (resolve TS2739)
  const normalizedGroups: GroupData[] = useMemo(() => {
    const list = (groupsTab.groups ?? []) as unknown[];

    return list
      .filter(isRecord)
      .map((g) => {
        // Garantir os campos que o GroupCard espera (defaults “seguros”)
        const normalized: GroupData = {
          ...(g as unknown as GroupData),
          isActive: typeof g.isActive === "boolean" ? g.isActive : true,
          minSelections: Number.isFinite(Number(g.minSelections)) ? Number(g.minSelections) : 0,
          maxSelections: Number.isFinite(Number(g.maxSelections)) ? Number(g.maxSelections) : 1,
          defaultGrammage: Number.isFinite(Number(g.defaultGrammage)) ? Number(g.defaultGrammage) : 0,
        };
        return normalized;
      });
  }, [groupsTab.groups]);

  const linkedGroupsBySizeId = sizesTab.linkedGroups as Record<number, number[] | undefined>;

  const onDragEndSizes = (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(normalizedSizes);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    const newOrderIds = items
      .map((item) => toNumberId((item as unknown as { id?: unknown }).id))
      .filter((id): id is number => id != null);

    sizesTab.actions.reorder(newOrderIds);
    toast.success("Ordem dos tamanhos atualizada");
  };

  const handleCreateSize = () => {
    // ⚠️ Aqui a action `create` decide o shape real.
    // A gente manda o payload “padrão” e faz cast via unknown pra não dar TS2353 por campo extra.
    const payload = {
      name: "Novo Tamanho",
      isActive: true,
      price: "0.00",
      priceModifier: "0.00",
      mainDishWeight: "200.00",
      iconKey: "Box",
      groupsOrder: [],
      noAccompanimentsMessage: "",
      // NÃO colocamos order aqui por padrão porque pode não existir no CreateSizeInput.
    } as unknown as CreateSizeInput;

    sizesTab.actions.create(payload);
  };

  if (isLoading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="animate-spin text-emerald-500" size={40} />
      </div>
    );
  }

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500 relative px-2 md:px-0 text-left">
      {/* SELETOR DE ABAS */}
      <div className="flex p-1.5 bg-slate-200/50 backdrop-blur-sm rounded-2xl w-full md:w-fit border border-slate-200 shadow-inner overflow-x-auto no-scrollbar">
        {(["sizes", "groups", "options"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "flex-1 md:flex-none whitespace-nowrap px-4 md:px-6 py-3 rounded-xl text-[9px] md:text-[11px] font-black uppercase transition-all flex items-center justify-center gap-2 tracking-wider",
              activeTab === tab
                ? "bg-white shadow-md text-slate-900 scale-100 md:scale-105"
                : "text-slate-400 hover:text-slate-600"
            )}
          >
            {tab === "sizes" && <LayoutList size={14} />}
            {tab === "groups" && <Layers size={14} />}
            {tab === "options" && <Grid size={14} />}
            <span className="inline">{tab === "sizes" ? "Tamanhos" : tab === "groups" ? "Grupos" : "Fichas"}</span>
          </button>
        ))}
      </div>

      <div className="min-h-[400px]">
        {/* ABA: TAMANHOS */}
        {activeTab === "sizes" && (
          <div className="space-y-6">
            <div className="flex justify-end">
              <Button
                onClick={handleCreateSize}
                className="w-full md:w-auto bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl h-12 px-6 font-black uppercase text-[10px] tracking-widest italic shadow-lg"
              >
                <Plus size={18} className="mr-2" /> Novo Tamanho
              </Button>
            </div>

            <DragDropContext onDragEnd={onDragEndSizes}>
              <Droppable droppableId="sizes-list">
                {(provided) => (
                  <div className="space-y-4" {...provided.droppableProps} ref={provided.innerRef}>
                    {normalizedSizes.map((size, index) => {
                      const sizeId = toNumberId((size as unknown as { id?: unknown }).id) ?? index;

                      return (
                        <Draggable key={String(sizeId)} draggableId={String(sizeId)} index={index}>
                          {(p) => (
                            <SizeCard
                              innerRef={p.innerRef}
                              draggableProps={p.draggableProps as unknown as Record<string, unknown>}
                              dragHandleProps={p.dragHandleProps as unknown as Record<string, unknown>}
                              size={size}
                              groups={normalizedGroups as unknown as SizeCardProps["groups"]}
                              linkedIds={linkedGroupsBySizeId[sizeId] || []}
                              isExpanded={expandedId === sizeId}
                              onToggleExpand={() => setExpandedId(expandedId === sizeId ? null : sizeId)}
                              onUpdate={sizesTab.actions.update as UpdateSizeFn}
                              onDelete={() => sizesTab.actions.remove(sizeId)}
                              onDuplicate={() => sizesTab.actions.duplicate(size as unknown as DuplicateSizeInput)}
                              onToggleLink={async (sId, gId) => {
                                await sizesTab.actions.toggleLink(sId, gId);
                              }}
                            />
                          )}
                        </Draggable>
                      );
                    })}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          </div>
        )}

        {/* ABA: GRUPOS */}
        {activeTab === "groups" && (
          <div className="space-y-6">
            <div className="flex justify-end">
              <Button
                onClick={() => groupsTab.actions.upsert({ name: "Novo Grupo" })}
                className="w-full md:w-auto bg-slate-900 hover:bg-slate-800 text-white rounded-2xl h-12 px-6 font-black uppercase text-[10px] tracking-widest italic shadow-xl"
              >
                <Plus size={18} className="mr-2" /> Criar Grupo
              </Button>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {normalizedGroups.map((group) => {
                const groupId = toNumberId((group as unknown as { id?: unknown }).id) ?? 0;

                return (
                  <GroupCard
                    key={groupId}
                    group={group}
                    allOptions={optionsTab.items as unknown as GroupOption[]}
                    isExpanded={expandedId === groupId}
                    onToggleExpand={() => setExpandedId(expandedId === groupId ? null : groupId)}
                    onUpdate={(id, data) => groupsTab.actions.upsert({ ...data, id })}
                    onDelete={() => groupsTab.actions.remove(groupId)}
                    onToggleOption={groupsTab.actions.toggleOption}
                  />
                );
              })}
            </div>
          </div>
        )}

        {/* ABA: FICHAS TÉCNICAS */}
        {activeTab === "options" && (
          <div className="space-y-6">
            <div className="flex justify-end">
              <Button
                onClick={() => handleOpenAccDrawer()}
                className="w-full md:w-auto bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl h-12 px-6 font-black uppercase text-[10px] tracking-widest italic shadow-lg"
              >
                <Plus size={18} className="mr-2" /> Novo Item Master
              </Button>
            </div>

            {/* MOBILE VIEW */}
            <div className="grid grid-cols-1 gap-3 md:hidden">
              {(optionsTab.items as unknown as Accompaniment[]).map((item) => (
                <div key={item.id} className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400">
                        <Package size={18} />
                      </div>
                      <div className="text-left">
                        <h4 className="font-black text-slate-800 uppercase italic text-[11px] leading-tight">{item.name}</h4>
                        <span className="text-[9px] text-slate-400 font-bold uppercase">ID: {item.id}</span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleOpenAccDrawer(item as unknown as AccData)}
                      className="h-10 w-10 rounded-xl bg-slate-50 text-slate-400"
                    >
                      <Edit2 size={16} />
                    </Button>
                  </div>

                  <div className="pt-3 border-t border-slate-50">
                    <p className="text-[9px] font-black text-slate-400 uppercase mb-2">Categoria Visual</p>
                    <select
                      value={String(item.accompanimentCategoryId || "")}
                      onChange={(e) => optionsTab.actions.updateCategory(item.id, Number(e.target.value) || null)}
                      className="w-full bg-slate-100 rounded-xl px-4 py-3 text-[10px] font-black uppercase border-none outline-none"
                    >
                      <option value="">Sem Categoria</option>
                      {(optionsTab.categories as unknown as Category[]).map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              ))}
            </div>

            {/* DESKTOP VIEW */}
            <div className="hidden md:block bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b">
                  <tr>
                    <th className="p-6 text-[10px] font-black uppercase text-slate-400">Item / Insumo</th>
                    <th className="p-6 text-[10px] font-black uppercase text-slate-400 text-center">Categoria</th>
                    <th className="p-6 text-[10px] font-black uppercase text-slate-400 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(optionsTab.items as unknown as Accompaniment[]).map((item) => (
                    <tr key={item.id} className="group hover:bg-slate-50/50 transition-colors">
                      <td className="p-6">
                        <div className="flex flex-col">
                          <span className="font-black text-slate-800 uppercase italic text-sm">{item.name}</span>
                          <span className="text-[9px] text-slate-400 font-bold mt-0.5">ID: {item.id}</span>
                        </div>
                      </td>
                      <td className="p-6 text-center">
                        <select
                          value={String(item.accompanimentCategoryId || "")}
                          onChange={(e) => optionsTab.actions.updateCategory(item.id, Number(e.target.value) || null)}
                          className="bg-slate-100 rounded-xl px-4 py-2 text-[10px] font-black uppercase border-none focus:ring-2 focus:ring-emerald-500 cursor-pointer min-w-[140px]"
                        >
                          <option value="">Geral</option>
                          {(optionsTab.categories as unknown as Category[]).map((cat) => (
                            <option key={cat.id} value={cat.id}>
                              {cat.name.toUpperCase()}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="p-6 text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenAccDrawer(item as unknown as AccData)}
                          className="h-10 w-10 rounded-xl text-slate-300 hover:text-emerald-500 transition-all"
                        >
                          <Edit2 size={16} />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <AccDrawer open={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} acc={selectedAcc} />
    </div>
  );
}
