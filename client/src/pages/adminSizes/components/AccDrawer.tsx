// e:/IA/projects/Site_React/client/src/pages/adminSizes/components/AccDrawer.tsx

import React, { useEffect, useState } from "react";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Calculator, Loader2, ChevronDown, LayoutGrid, Info } from "lucide-react";
import { trpc } from "@/_core/trpc";
import { appToast as toast } from "@/lib/app-toast";
import { useAccStore } from "@/pages/adminSizes/logic/useAccStore";
import { AccNutriTab } from "../components/AccNutriTab";

// --- INTERFACES ---

interface Accompaniment {
  id?: string | number;
  name?: string;
  accompanimentCategoryId?: number | string | null;
  accompaniment_category_id?: number | string | null;
  showNutrition?: boolean;
  show_nutrition?: boolean;
  isNoAccompaniment?: boolean;
  is_no_accompaniment?: boolean;
  ingredients?: string;
  energyKcal?: string | number;
  energyKj?: string | number;
  proteins?: string | number;
  carbs?: string | number;
  fatTotal?: string | number;
  sodium?: string | number;
  fiber?: string | number;
  fatSaturated?: string | number;
  fatTrans?: string | number;
  calcium?: string | number;
  iron?: string | number;
  nutritionalInfo?: string | unknown[];
  nutritional_info?: string | unknown[];
  isActive?: boolean;
}

interface AccompanimentCategory {
  id: number;
  name: string;
}

interface AccDrawerProps {
  open: boolean;
  onClose: () => void;
  acc: Accompaniment | null;
}

export function AccDrawer({ open, onClose, acc }: AccDrawerProps) {
  const { formData, composition, setFormData, setComposition, reset } = useAccStore();
  const utils = trpc.useUtils();

  const { data: categories, isLoading: loadingCats } = trpc.admin.accompaniments.categories.list.useQuery(undefined, {
    enabled: open
  });

  const upsertOption = trpc.admin.accompaniments.options.upsert.useMutation({
    onSuccess: () => {
      utils.admin.accompaniments.options.listAll.invalidate();
      toast.success("Ficha técnica salva com sucesso!");
      onClose();
    },
    onError: (err) => {
      toast.error(err.message || "Erro ao sincronizar com o banco.");
    }
  });

  const [selectedCatId, setSelectedCatId] = useState<number | null>(null);

  useEffect(() => {
    if (!open) {
      reset();
      setSelectedCatId(null);
      return;
    }

    if (acc) {
      const currentCatId = acc.accompanimentCategoryId ?? acc.accompaniment_category_id ?? null;
      setSelectedCatId(currentCatId ? Number(currentCatId) : null);

      setFormData({
        name: acc.name || "",
        show_nutrition: !!(acc.showNutrition || acc.show_nutrition),
        showNutrition: !!(acc.showNutrition || acc.show_nutrition),
        isNoAccompaniment: !!(acc.isNoAccompaniment || acc.is_no_accompaniment),
        ingredients: acc.ingredients || "",

        energyKcal: String(acc.energyKcal ?? 0),
        energyKj: String(acc.energyKj ?? "0"),
        proteins: String(acc.proteins ?? "0.00"),
        carbs: String(acc.carbs ?? "0.00"),
        fatTotal: String(acc.fatTotal ?? "0.00"),
        sodium: String(acc.sodium ?? "0"),
        fiber: String(acc.fiber ?? "0.00"),
        fatSaturated: String(acc.fatSaturated ?? "0.00"),
        fatTrans: String(acc.fatTrans ?? "0.00"),
        calcium: String(acc.calcium ?? "0.00"),
        iron: String(acc.iron ?? "0.00"),
      });

      const rawComp = acc.nutritionalInfo ?? acc.nutritional_info;
      try {
        if (rawComp) {
          const parsed = typeof rawComp === 'string' ? JSON.parse(rawComp) : rawComp;
          setComposition(Array.isArray(parsed) ? parsed : []);
        } else {
          setComposition([]);
        }
      } catch {
        setComposition([]);
      }
    }
  }, [acc, open, setFormData, setComposition, reset]);

  const handleSave = () => {
    const finalName = formData.name || acc?.name;

    if (!finalName?.trim()) {
      toast.error("O nome do item é obrigatório.");
      return;
    }

    upsertOption.mutate({
      ...formData,
      id: acc?.id ? Number(acc.id) : undefined,
      name: finalName.trim(),
      composition: composition || [],
      accompanimentCategoryId: selectedCatId,
      isActive: acc?.isActive ?? true,
    });
  };

  return (
    <Sheet open={open} onOpenChange={(isOpen) => { if(!isOpen) onClose(); }}>
      <SheetContent side="right" className="w-full sm:max-w-2xl p-0 border-none bg-slate-50 flex flex-col h-screen outline-none shadow-2xl">
        <SheetHeader className="p-8 pb-6 shrink-0 text-left bg-white border-b relative">
          <SheetTitle className="text-3xl font-black uppercase text-slate-900 tracking-tighter italic flex items-center gap-3">
            <div className="h-10 w-10 bg-emerald-500 rounded-xl flex items-center justify-center text-white rotate-3 shadow-lg shadow-emerald-200 text-center">
              <Calculator size={24} />
            </div>
            Ficha Técnica<span className="text-emerald-500">.</span>
          </SheetTitle>
          <SheetDescription className="sr-only">
            Edição de composição e valores nutricionais.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-8 py-8 space-y-6 custom-scrollbar text-left">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
            <div className="p-6 bg-white rounded-3xl border border-slate-100 shadow-sm space-y-2 text-left">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 text-left">Nome do Item Master</Label>
              <Input
                className="h-12 rounded-xl bg-slate-50 border-none font-black text-lg text-slate-700 italic focus-visible:ring-2 focus-visible:ring-emerald-500 text-left"
                value={formData.name || ""}
                onChange={(e) => setFormData({ name: e.target.value })}
              />
            </div>

            <div className="p-6 bg-white rounded-3xl border border-slate-100 shadow-sm space-y-2 text-left">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 text-left">
                <LayoutGrid size={12} /> Categoria Master
              </Label>
              <div className="relative text-left">
                <select
                  disabled={loadingCats}
                  value={selectedCatId ?? ""}
                  onChange={(e) => setSelectedCatId(e.target.value ? Number(e.target.value) : null)}
                  className="w-full h-12 rounded-xl bg-slate-50 border-none font-black text-xs uppercase tracking-wider text-slate-600 appearance-none px-4 cursor-pointer focus:ring-2 focus:ring-emerald-500 disabled:opacity-50 text-left"
                >
                  <option value="">Geral (Sem Categoria)</option>
                  {categories?.map((cat: AccompanimentCategory) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name.toUpperCase()}
                    </option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>
          </div>

          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6 text-left">
             {/* ✅ FIX 2322: Removido a prop optionId, pois a tab já lê o contexto pelo useAccStore */}
             <div className="p-6 bg-white rounded-3xl border border-slate-100 shadow-sm space-y-3 text-left">
                <label className="flex items-start gap-3 cursor-pointer text-left">
                  <Checkbox
                    checked={!!formData.isNoAccompaniment}
                    onCheckedChange={(checked) => {
                      const isChecked = checked === true;
                      setFormData({
                        isNoAccompaniment: isChecked,
                        ...(isChecked
                          ? {
                              energyKcal: "0",
                              energyKj: "0",
                              proteins: "0.00",
                              carbs: "0.00",
                              fatTotal: "0.00",
                              sodium: "0",
                              fiber: "0.00",
                              fatSaturated: "0.00",
                              fatTrans: "0.00",
                              calcium: "0.00",
                              iron: "0.00",
                            }
                          : {}),
                      });
                    }}
                    className="mt-0.5"
                  />
                  <span className="space-y-1 text-left">
                    <span className="block text-[10px] font-black uppercase tracking-widest text-slate-700 text-left">
                      É opção 'sem acompanhamento'?
                    </span>
                    <span className="block text-[11px] font-semibold leading-relaxed text-slate-500 text-left">
                      Marque quando esta opção representar a ausência de acompanhamento. Ela aparecerá para o cliente, mas não somará peso nem valores nutricionais.
                    </span>
                  </span>
                </label>
                {formData.isNoAccompaniment && (
                  <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-2xl px-4 py-3 text-left">
                    Esta opção será ignorada no cálculo nutricional.
                  </p>
                )}
             </div>

             <AccNutriTab />

             <div className="p-6 bg-white rounded-3xl border border-slate-100 shadow-sm space-y-3 text-left">
                <div className="flex items-center gap-2 text-slate-700 px-1 text-left">
                  <Info size={14} className="text-emerald-500" />
                  <Label className="text-[10px] font-black uppercase tracking-widest text-left">Ingredientes (Texto do Rótulo)</Label>
                </div>
                <Textarea
                  className="rounded-2xl bg-slate-50 border-none font-medium text-xs min-h-30 p-4 resize-none focus-visible:ring-2 focus-visible:ring-emerald-500 transition-all text-left"
                  placeholder="Liste os ingredientes para a etiqueta..."
                  value={formData.ingredients || ""}
                  onChange={(e) => setFormData({ ingredients: e.target.value })}
                />
                <p className="text-[9px] text-slate-400 font-bold uppercase px-2 italic text-center">
                  Este campo aceita edição manual para ajustes finos no rótulo.
                </p>
             </div>
          </div>
        </div>

        <div className="p-8 bg-white border-t border-slate-100 mt-auto flex gap-4 shrink-0 shadow-2xl">
          <Button type="button" variant="ghost" onClick={onClose} className="flex-1 h-16 rounded-2xl font-black text-[11px] uppercase text-slate-400 text-center">
            Cancelar
          </Button>
          <Button
            type="button"
            disabled={upsertOption.isPending}
            className="flex-2 h-16 rounded-2xl bg-slate-950 hover:bg-emerald-600 text-white font-black text-[12px] uppercase shadow-xl flex items-center justify-center gap-2 text-center"
            onClick={handleSave}
          >
            {upsertOption.isPending ? <Loader2 className="animate-spin" /> : 'Salvar Ficha Técnica'}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
