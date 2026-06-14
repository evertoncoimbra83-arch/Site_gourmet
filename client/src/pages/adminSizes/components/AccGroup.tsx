// e:/IA/projects/Site_React/client/src/pages/adminSizes/components/AccGroup.tsx

import React, { useState } from "react";
import { trpc } from "@/_core/trpc";
import { Button } from "@/components/ui/button";
import { Apple, Tag, Activity, Trash2, Loader2, Plus, ChevronDown } from "lucide-react";
import { appToast as toast } from "@/lib/app-toast";
import { AccDrawer } from "./AccDrawer";
import { cn } from "@/lib/utils";
import * as Icons from "lucide-react";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

// --- INTERFACES ---

type IconName = keyof typeof Icons;

interface CompositionItem {
  name: string;
  value: number;
  unit: string;
}

interface Accompaniment {
  id: number;
  name: string;
  accompanimentCategoryId?: number | null;
  energyKcal?: string | number | null;
  nutritionalInfo?: string | CompositionItem[] | null;
  iconKey?: string | null;
  isActive?: boolean;
  show_nutrition?: boolean | null;
  showNutrition?: boolean | null;
  isNoAccompaniment?: boolean | null;
  is_no_accompaniment?: boolean | null;
  [key: string]: unknown;
}

interface AccompanimentCategory {
  id: number;
  name: string;
}

export function AccGroup() {
  const [selectedItem, setSelectedItem] = useState<Accompaniment | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<Accompaniment | null>(null);

  const utils = trpc.useUtils();

  const { data: rawItems, isLoading } = trpc.admin.accompaniments.options.listAll.useQuery();
  const items = rawItems as Accompaniment[] | undefined;

  const { data: categories } = trpc.admin.accompaniments.categories.list.useQuery();

  const upsert = trpc.admin.accompaniments.options.upsert.useMutation({
    onSuccess: () => {
      utils.admin.accompaniments.options.listAll.invalidate();
      toast.success("Item atualizado!");
    },
    onError: (err) => toast.error("Erro ao salvar: " + (err.message || "Erro desconhecido"))
  });

  const deleteMutation = trpc.admin.accompaniments.options.delete.useMutation({
    onSuccess: () => {
      utils.admin.accompaniments.options.listAll.invalidate();
      toast.success("Item removido.");
    },
    onError: (err) => toast.error("Erro ao remover: " + (err.message || "Erro desconhecido"))
  });

  if (isLoading) return <div className="p-10 flex justify-center text-left"><Loader2 className="animate-spin text-emerald-500" /></div>;

  return (
    <div className="p-4 space-y-6 text-left">
      <div className="flex justify-between items-center px-2 text-left">
        <div className="text-left">
          <h2 className="text-xl font-black uppercase italic text-slate-900 tracking-tighter text-left">
            Itens Master <span className="text-emerald-500">.</span>
          </h2>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-left">Gestão de Insumos e Acompanhamentos</p>
        </div>

        <Button
          type="button"
          onClick={() => { setSelectedItem(null); setIsDrawerOpen(true); }}
          className="bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase text-[10px] tracking-widest h-12 px-6 rounded-2xl shadow-lg shadow-emerald-200 transition-all active:scale-95 flex gap-2 border-none text-center"
        >
          <Plus size={16} strokeWidth={4} className="text-white" />
          <span className="text-white">Criar Novo Item</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-left">
        {items?.map((item) => {
          const composition: CompositionItem[] = typeof item.nutritionalInfo === 'string'
            ? JSON.parse(item.nutritionalInfo || "[]")
            : (Array.isArray(item.nutritionalInfo) ? (item.nutritionalInfo as unknown as CompositionItem[]) : []);

          const hasNutrition = !!(Number(item.energyKcal || 0) > 0 || composition.length > 0);

          const IconComponent = item.iconKey && item.iconKey in Icons
            ? (Icons[item.iconKey as IconName] as React.ElementType)
            : null;

          return (
            <div key={item.id} className="p-6 bg-white border border-slate-100 rounded-[2.5rem] shadow-sm flex flex-col gap-4 hover:shadow-md transition-shadow text-left">
              <div className="flex justify-between items-start text-left">
                <div className="flex gap-3 text-left">
                  <div className="h-12 w-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100">
                    {IconComponent ? <IconComponent size={22} /> : <Tag size={22} />}
                  </div>
                  <div className="text-left">
                    <h4 className="font-black text-sm text-slate-700 uppercase leading-tight mt-1 text-left">{item.name}</h4>
                    <span className="text-[10px] text-slate-400 font-mono font-bold tracking-tighter text-left">ID #{item.id}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="ghost" size="icon"
                    onClick={() => { setSelectedItem(item); setIsDrawerOpen(true); }}
                    className={cn("h-9 w-9 rounded-xl transition-colors", hasNutrition ? "text-emerald-500 bg-emerald-50 hover:bg-emerald-100" : "text-slate-300 hover:bg-slate-50")}
                  >
                    <Activity size={18} />
                  </Button>
                  <Button
                    variant="ghost" size="icon"
                    onClick={() => {
                      setItemToDelete(item);
                    }}
                    className="h-9 w-9 rounded-xl text-red-200 hover:text-red-500 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 size={18} />
                  </Button>
                </div>
              </div>

              <div className="space-y-1.5 text-left">
                <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest px-1 text-left">Categoria</label>
                <div className="relative text-left">
                  <select
                    value={item.accompanimentCategoryId || ""}
                    onChange={(e) => {
                      const catId = e.target.value ? Number(e.target.value) : null;

                      const payload = {
                        ...item,
                        accompanimentCategoryId: catId,
                        isActive: item.isActive ?? true,
                        show_nutrition: !!(item.showNutrition || item.show_nutrition),
                        showNutrition: !!(item.showNutrition || item.show_nutrition),
                        isNoAccompaniment: !!(item.isNoAccompaniment || item.is_no_accompaniment),
                        composition: composition,
                        energyKcal: item.energyKcal ?? 0,
                      };

                      // ✅ FIX ESLint: O cast para Parameters evita o erro "Unexpected any"
                      upsert.mutate(payload as unknown as Parameters<typeof upsert.mutate>[0]);
                    }}
                    className="w-full bg-slate-50 border-none rounded-2xl h-10 text-[11px] font-bold text-slate-600 px-4 outline-none cursor-pointer appearance-none focus:ring-2 focus:ring-emerald-500/20 transition-all text-left"
                  >
                    <option value="">Sem Categoria</option>
                    {categories?.map((cat: AccompanimentCategory) => (
                      <option key={cat.id} value={cat.id}>{cat.name.toUpperCase()}</option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>

              {hasNutrition && (
                <div className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50 w-fit px-3 py-1.5 rounded-xl border border-emerald-100 text-left">
                  <Apple size={12} strokeWidth={3} />
                  <span className="text-[9px] font-black uppercase tracking-tighter">Ficha Técnica Ativa</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ✅ FIX 2719: Removendo o `null` de todas as propriedades conflitantes ao passar para o Drawer */}
      <AccDrawer
        open={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        acc={selectedItem ? {
          ...selectedItem,
          energyKcal: selectedItem.energyKcal ?? undefined,
          showNutrition: selectedItem.showNutrition ?? undefined,
          show_nutrition: selectedItem.show_nutrition ?? undefined,
          isNoAccompaniment: selectedItem.isNoAccompaniment ?? selectedItem.is_no_accompaniment ?? undefined,
          is_no_accompaniment: selectedItem.is_no_accompaniment ?? selectedItem.isNoAccompaniment ?? undefined,
          nutritionalInfo: selectedItem.nutritionalInfo ?? undefined
        } : null}
      />

      <ConfirmDialog
        open={itemToDelete !== null}
        title="Excluir Item Master"
        description={itemToDelete ? `Deseja realmente excluir permanentemente "${itemToDelete.name}"?` : ""}
        confirmLabel="Confirmar"
        cancelLabel="Cancelar"
        destructive={true}
        onConfirm={() => {
          if (itemToDelete) {
            deleteMutation.mutate({ id: itemToDelete.id });
            setItemToDelete(null);
          }
        }}
        onCancel={() => setItemToDelete(null)}
      />
    </div>
  );
}
