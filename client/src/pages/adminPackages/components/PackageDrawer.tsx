// client/src/pages/adminPackages/components/PackageDrawer.tsx

import React, { useEffect, useState, useMemo } from "react"; // ✅ Removido ComponentProps
import { useForm } from "react-hook-form";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { MediaPickerModal } from "@/components/MediaPickerModal"; 
import { 
  Save, Layout, Loader2, Package as PackageIcon, 
  Box, Settings2, Wand2, Eye, AlertCircle, CheckCircle2 
} from "lucide-react";
import { appToast as toast } from "@/lib/app-toast";
import { cn } from "@/lib/utils";

// Componentes Fatiados e Lógica
import { PackageDrawerGeral } from "./drawer/PackageDrawerGeral";
import { PackageDrawerConfig } from "./drawer/PackageDrawerConfig";
import { PackageDrawerSlots } from "./drawer/PackageDrawerSlots";
import { PackagePreviewPanel } from "./PackagePreviewPanel";
import { PackagePresetSelector } from "./PackagePresetSelector";
import { PackageAutoGenerator } from "./PackageAutoGenerator";
import { PackagePreset } from "../logic/constants/package-presets";
import { usePackageValidation } from "../logic/hooks/usePackageValidation";
import { usePackageDraft } from "../logic/hooks/usePackageDraft";

// Importações dos tipos
import { AdminDish, DbCategory } from "../logic/hooks/useAdminPackages";
import { GeneratedSlot } from "../logic/generator/package-generator-types";

// --- INTERFACES ---

interface PackageData {
  id?: string | number; name?: string; slug?: string; description?: string; highlights?: string;
  category?: string; isPopular?: boolean | number; price?: number | string; base_price?: number | string;
  salePrice?: number | string; sale_price?: number | string; imageUrl?: string; image_url?: string;
  numberOfOptions?: number; number_of_options?: number; displayOrder?: number; display_order?: number;
  sizeId?: string | number; isActive?: boolean; status?: string;
}

export interface PackageFormData {
  name: string; slug?: string; description?: string; highlights?: string; category?: string;
  is_popular?: boolean; image_url?: string; isActive?: boolean; status?: string;
  number_of_options?: string | number; display_order?: string | number;
  size_id?: string | number; base_price?: string | number; sale_price?: string | number;
}

export interface PackageDrawerProps {
  open: boolean;
  onClose: () => void;
  pkg: PackageData | null;
  onSubmit: (data: PackageFormData) => void;
  logic: {
    state: { config: { slots: GeneratedSlot[] }; isDialogOpen: boolean };
    actions: {
      addSlot: () => void;
      updateSlotName: (index: number, name: string) => void;
      updateSlotDishes: (index: number, dishIds: string[]) => void;
      updateSlotGroups: (index: number, groups: GeneratedSlot['groups']) => void; // ✅ Tipado
      removeSlot: (index: number) => void;
      reorderSlots: (startIndex: number, endIndex: number) => void;
      duplicateSlot: (index: number) => void;
      updateSlotSize: (index: number, sizeId: string | number | undefined) => void;
      loadSlots: (slots: { slots: GeneratedSlot[] }) => void; 
      closeDialog: () => void;
    };
    data: {
      allDishes: AdminDish[];
      allOptions: { id: string | number; name: string }[]; 
      allSizes: { id: string | number; name: string; defaultMainWeight?: number }[];
      allCategories: DbCategory[]; 
      topDishes?: { dishId: number; name: string }[]; 
    };
    mutations: { createMutation: { isPending: boolean }; updateMutation: { isPending: boolean }; };
  };
}

export function PackageDrawer({ open, onClose, pkg, onSubmit, logic }: PackageDrawerProps) {
  const { register, handleSubmit, reset, setValue, watch } = useForm<PackageFormData>(); 
  const [showAutoGenerator, setShowAutoGenerator] = useState(false);
  const [activeTab, setActiveTab] = useState("geral");
  const [isMediaOpen, setIsMediaOpen] = useState(false);
  const [isPresetOpen, setIsPresetOpen] = useState(false);
  
  const formData = watch();
  const basePriceValue = watch("base_price");

  const allCategories = logic.data.allCategories || [];
  const categoryNames = useMemo(() => allCategories.map(c => c.name), [allCategories]);

  const { isValid } = usePackageValidation(formData, logic.state.config.slots);

  const sanitizedSlots = useMemo(() => {
    return (logic.state.config.slots || []).map(slot => ({
      ...slot,
      groups: (slot.groups || []).map(g => ({
        ...g,
        id: String(g.id),
        customLabel: g.customLabel || "Acompanhamento"
      }))
    }));
  }, [logic.state.config.slots]);
  
  const { clearDraft } = usePackageDraft(
    open, 
    !!pkg, 
    formData, 
    sanitizedSlots as unknown as GeneratedSlot[], // ✅ Trocado any por cast seguro
    reset, 
    (slots) => logic.actions.loadSlots({ slots: slots as GeneratedSlot[] })
  );

  const totalSuggestedPrice = useMemo(() => {
    return (logic.state.config.slots || []).reduce((acc, slot) => {
      const firstDishId = slot.dishIds?.[0];
      if (!firstDishId) return acc;
      const dish = (logic.data.allDishes || []).find(d => String(d.id) === String(firstDishId));
      return acc + (Number(dish?.price) || 0);
    }, 0);
  }, [logic.state.config.slots, logic.data.allDishes]);

  const handleOnGenerated = (newSlots: GeneratedSlot[]) => {
    if (newSlots.length > 0) {
      logic.actions.loadSlots({ slots: newSlots }); 
      setValue("number_of_options", newSlots.length);
      setShowAutoGenerator(false);
      setActiveTab("estrutura");
    }
  };

  const handleApplyPreset = (preset: PackagePreset) => {
    setValue("name", preset.name);
    setValue("category", preset.category);
    setValue("number_of_options", preset.numberOfOptions);
    setActiveTab("estrutura");
  };

  const handleFormSubmit = async (data: PackageFormData) => {
    await onSubmit(data);
    clearDraft();
  };

  useEffect(() => {
    if (open) {
      if (pkg) {
        reset({
          name: pkg.name || "", slug: pkg.slug || "", description: pkg.description || "",
          highlights: pkg.highlights || "", category: pkg.category || "Todos", 
          is_popular: Boolean(pkg.isPopular),
          base_price: String(pkg.base_price || pkg.price || "0.00"), 
          sale_price: String(pkg.salePrice || pkg.sale_price || ""),
          image_url: pkg.imageUrl || pkg.image_url || "",
          number_of_options: pkg.numberOfOptions || pkg.number_of_options || 10,
          display_order: pkg.displayOrder || pkg.display_order || 0,
          size_id: pkg.sizeId ? String(pkg.sizeId) : "",
          isActive: pkg.isActive ?? (pkg.status === "active"),
          status: pkg.status || "active"
        });
      } else {
        reset({ 
          name: "", slug: "", description: "", highlights: "", category: "Todos", is_popular: false,
          base_price: "0.00", sale_price: "", image_url: "", number_of_options: 10, 
          display_order: 0, size_id: "", isActive: true, status: "active" 
        });
      }
      setActiveTab("geral");
    }
  }, [pkg, open, reset]);

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:max-w-4xl p-0 border-none bg-white flex flex-col h-screen outline-none shadow-2xl text-left">
        
        <div className="px-8 py-6 border-b border-slate-100 shrink-0 bg-white">
          <SheetHeader className="text-left">
            <div className="flex items-center justify-between">
              <div className="space-y-1 text-left">
                <div className="flex items-center gap-2">
                  <PackageIcon size={14} className="text-slate-400" />
                  {isValid ? (
                    <div className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                      <CheckCircle2 size={10} />
                      <span className="text-[9px] font-black uppercase tracking-widest">Pronto</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-red-500 bg-red-50 px-2 py-0.5 rounded-full border border-red-100">
                      <AlertCircle size={10} />
                      <span className="text-[9px] font-black uppercase tracking-widest">Pendências</span>
                    </div>
                  )}
                </div>
                <SheetTitle className="text-2xl font-bold text-slate-900 tracking-tight leading-none text-left">
                  {pkg ? "Editar Pacote" : "Novo Pacote"}
                </SheetTitle>
              </div>
              {!pkg && (
                <Button onClick={() => setIsPresetOpen(true)} variant="outline" className="h-9 gap-2 text-[10px] font-bold uppercase border-slate-200 rounded-full hover:bg-slate-50 transition-all text-slate-600">
                  <Wand2 size={14} className="text-orange-500" /> Presets
                </Button>
              )}
            </div>
          </SheetHeader>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
          <div className="px-8 bg-slate-50/40 border-b border-slate-100">
            <TabsList className="bg-transparent h-12 p-0 gap-8 justify-start">
              {[
                { id: "geral", label: "Vitrine", icon: Layout },
                { id: "estrutura", label: "Marmitas", icon: Box },
                { id: "regras", label: "Visibilidade", icon: Settings2 },
                { id: "preview", label: "Preview", icon: Eye },
              ].map(tab => (
                <TabsTrigger key={tab.id} value={tab.id} className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-slate-900 data-[state=active]:border-b-2 data-[state=active]:border-slate-900 rounded-none h-full px-0 text-[11px] font-bold text-slate-400 gap-2 transition-all uppercase tracking-wider">
                  <tab.icon size={14} /> {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-8 text-left">
            <form id="pkg-form" onSubmit={handleSubmit(handleFormSubmit)} className="pb-12 text-left">
              
              <TabsContent value="geral" className="m-0 focus-visible:ring-0">
                <PackageDrawerGeral register={register} watch={watch} setValue={setValue} setIsMediaOpen={setIsMediaOpen} categories={categoryNames} />
              </TabsContent>

              <TabsContent value="estrutura" className="m-0 focus-visible:ring-0">
                <div className="flex items-center justify-between mb-6">
                  <div className="space-y-1 text-left">
                    <h4 className="text-xs font-black uppercase text-slate-900">Arquitetura do Kit</h4>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight italic">Use o Magic Build para gerar o lote inteligente</p>
                  </div>
                  <Button type="button" variant="outline" onClick={() => setShowAutoGenerator(!showAutoGenerator)} className={cn("h-9 gap-2 text-[10px] font-black uppercase rounded-full transition-all", showAutoGenerator ? "bg-slate-900 text-white" : "border-orange-200 text-orange-600")}>
                    <Wand2 size={14} /> {showAutoGenerator ? "Fechar Magic Build" : "Magic Build"}
                  </Button>
                </div>

                {showAutoGenerator && (
                  <div className="mb-8">
                    <PackageAutoGenerator 
                      categories={allCategories} 
                      allOptions={logic.data.allOptions} 
                      allSizes={logic.data.allSizes || []} 
                      allDishes={logic.data.allDishes} 
                      onGenerated={handleOnGenerated}
                    />
                  </div>
                )}

                <PackageDrawerSlots 
                  logic={logic as any} // ✅ Cast temporário necessário pela complexidade do logic action
                  selectedSizeId={formData.size_id || ""} 
                />
              </TabsContent>

              <TabsContent value="regras" className="m-0 focus-visible:ring-0">
                <PackageDrawerConfig register={register} setValue={setValue} isActive={Boolean(formData.isActive)} isPopular={Boolean(formData.is_popular)} selectedSizeId={String(formData.size_id || "")} allSizes={logic.data.allSizes || []} />
              </TabsContent>

              <TabsContent value="preview" className="m-0 focus-visible:ring-0">
                <PackagePreviewPanel 
                  data={{
                    name: formData.name,
                    description: formData.description || "",
                    image_url: formData.image_url,
                    base_price: formData.base_price || 0,
                    sale_price: formData.sale_price,
                    category: formData.category || "Geral",
                    highlights: formData.highlights || "",
                    number_of_options: Number(formData.number_of_options || 0),
                    slots: sanitizedSlots as unknown as GeneratedSlot[] // ✅ Tipado
                  }} 
                />
              </TabsContent>
            </form>
          </div>
        </Tabs>

        <div className="p-6 bg-white border-t border-slate-100 shrink-0">
          <div className="max-w-3xl mx-auto flex flex-col gap-6">
            <div className="flex items-center justify-between px-2">
               <div className="flex gap-10">
                  <div className="space-y-0.5 text-left">
                     <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest text-left">Soma Unitários</span>
                     <p className="text-sm font-bold text-slate-500 italic">R$ {totalSuggestedPrice.toFixed(2)}</p>
                  </div>
                  <div className="h-8 w-px bg-slate-100 hidden md:block" />
                  <div className="space-y-0.5 text-left">
                     <span className="text-[9px] font-bold text-slate-900 uppercase tracking-widest text-left">Preço Final Kit</span>
                     <p className="text-2xl font-black text-slate-900 leading-none">R$ {Number(basePriceValue || 0).toFixed(2)}</p>
                  </div>
               </div>
               <Button type="button" onClick={() => { setValue("base_price", totalSuggestedPrice.toFixed(2)); toast.success("Sincronizado!"); }} variant="ghost" className="text-[10px] font-bold text-orange-500 uppercase tracking-widest hover:underline">Sincronizar</Button>
            </div>

            <div className="flex gap-3">
              <Button variant="ghost" onClick={onClose} className="flex-1 h-12 text-slate-400 font-bold text-xs uppercase">Descartar</Button>
              <Button form="pkg-form" type="submit" disabled={!isValid || logic.mutations.createMutation.isPending || logic.mutations.updateMutation.isPending} className={cn("flex-2 h-14 text-white font-bold text-xs uppercase tracking-[0.2em] rounded-xl shadow-lg transition-all flex items-center justify-center", isValid ? "bg-slate-950" : "bg-slate-200")}>
                {logic.mutations.createMutation.isPending || logic.mutations.updateMutation.isPending ? <Loader2 className="animate-spin mr-2" size={16} /> : <Save size={16} className="mr-2" />}
                {pkg ? "Salvar Alterações" : "Publicar Kit"}
              </Button>
            </div>
          </div>
        </div>

        <MediaPickerModal open={isMediaOpen} onClose={() => setIsMediaOpen(false)} onSelect={(url) => { setValue("image_url", url, { shouldDirty: true }); setIsMediaOpen(false); }} />
        <PackagePresetSelector open={isPresetOpen} onOpenChange={setIsPresetOpen} onSelect={handleApplyPreset} />
      </SheetContent>
    </Sheet>
  );
}