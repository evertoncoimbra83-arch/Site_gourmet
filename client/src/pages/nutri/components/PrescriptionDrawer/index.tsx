// e:/IA/projects/Site_React/client/src/pages/nutri/components/PrescriptionDrawer/index.tsx

import React, { useEffect, useState, useRef } from "react";
import { trpc } from "@/_core/trpc";
import { X, Layout, PenTool, BookOpen, Loader2 } from "lucide-react"; 
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { appToast as toast } from "@/lib/app-toast";

import { usePrescriptionBuilder } from "./usePrescriptionBuilder";
import { CatalogSidebar, type CatalogProduct } from "./CatalogSidebar";
import { AccompanimentSidebar } from "./AccompanimentSidebar";
import { PrescriptionMealCard } from "./PrescriptionMealCard";
import { normalizePrescriptionData, type CatalogItem } from "./utils/normalization";

import { TemplateLibraryTab } from "../TemplateLibraryTab"; 
import { TemplateSaveDialog } from "../TemplateSaveDialog";

import { usePrescriptionActions } from "../../logic/usePrescriptionActions";
import type { FullPrescription, PrescriptionMeal, PrescriptionOption } from "../../../../../../server/routers/storefront/nutri/types";

// ✅ Criamos um tipo limpo e independente para o nosso uso interno, removendo os conflitos do banco
type CleanPrescriptionState = Omit<FullPrescription, 'id'> & { 
  id?: string; 
  discountPercentage?: number;
};

interface SanitizableOption extends Omit<PrescriptionOption, 'price' | 'macros' | 'nutritionalData' | 'allowedAccompaniments' | 'multiplier'> {
  dishId: string;
  sizeId?: string | number | null;
  price?: number | null;
  priceAtCreation?: number | null;
  multiplier?: string | number;
  macros?: Record<string, unknown> | null;
  nutritionalData?: { baseMacros?: Record<string, unknown>; [key: string]: unknown } | null;
  allowedAccompaniments?: unknown[];
}

interface PrescriptionDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  clientId: string;
  clientName: string;
  currentPrescription?: CleanPrescriptionState | null;
  isTemplateMode?: boolean;
}

const PrescriptionDrawer = ({ 
  isOpen, onClose, clientId, clientName, currentPrescription, isTemplateMode = false 
}: PrescriptionDrawerProps) => {

  // 🛡️ Memória blindada contra re-renders
  const originalIdRef = useRef<string | undefined>(currentPrescription?.id && currentPrescription.id !== "NEW" ? currentPrescription.id : undefined);

  // Instância do Builder
  const builder = usePrescriptionBuilder(currentPrescription as unknown as FullPrescription);
  const [activeTab, setActiveTab] = useState<string>("editor");

  const builderPrescription = builder.prescription as unknown as CleanPrescriptionState;
  const setBuilderPrescription = builder.setPrescription as React.Dispatch<React.SetStateAction<FullPrescription>>;

  // Passamos os dados para as Actions. Usamos um casting simplificado.
  const actions = usePrescriptionActions({
    clientId,
    prescriptionId: originalIdRef.current || null,
    // ✅ FIX TS2344 / TS2339: Casting seguro de entrada direta
    builder: {
      prescription: builder.prescription as unknown as FullPrescription & { id?: string; discountPercentage?: number; }
    },
    onClose
  });

  const { data: catalog, isLoading: loadingCatalog } = trpc.nutri.getAvailableCatalog.useQuery(undefined, { enabled: isOpen });
  const { data: templates, isLoading: loadingTemplates } = trpc.nutri.getMyTemplates.useQuery(undefined, { enabled: isOpen && !isTemplateMode });
  const { data: accompaniments, isLoading: loadingAccs } = trpc.nutri.getAvailableAccompaniments.useQuery(undefined, { enabled: !!builder.isPickingAccFor });

  useEffect(() => {
    if (!isOpen) {
      originalIdRef.current = undefined; // Reseta ao fechar totalmente
      setBuilderPrescription({ planName: "", meals: [] } as unknown as FullPrescription);
      return;
    }
    
    if (currentPrescription?.id && currentPrescription.id !== "NEW" && !originalIdRef.current) {
      originalIdRef.current = currentPrescription.id;
    }

    const builderHasId = builderPrescription.id && builderPrescription.id !== "NEW";

    if (catalog && !loadingCatalog && currentPrescription?.id && !builderHasId) {
      // ✅ FIX TS2352: Casting passa por unknown primeiro
      const normalized = normalizePrescriptionData(
        (currentPrescription || {}) as unknown as Record<string, unknown>, 
        catalog as CatalogItem[]
      ) as unknown as CleanPrescriptionState;
      
      if (originalIdRef.current) {
        normalized.id = originalIdRef.current;
      } else {
        const editable = normalized as Partial<CleanPrescriptionState>;
        delete editable.id;
      }
      
      normalized.discountPercentage = currentPrescription?.discountPercentage || 0;

      setBuilderPrescription(normalized as unknown as FullPrescription);
      setActiveTab("editor");
    }
  }, [isOpen, catalog, loadingCatalog, setBuilderPrescription, builderPrescription.id, currentPrescription?.id, currentPrescription?.discountPercentage]); 

  if (!isOpen) return null;

  const activeSidebar = builder.isPickingFor ? "catalog" : builder.isPickingAccFor ? "acc" : null;

  return (
    <>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-100" onClick={onClose} />
      <div className={cn(
        "fixed right-0 top-0 h-dvh bg-slate-50 shadow-2xl z-101 flex transition-all duration-500 w-full overflow-hidden", 
        activeSidebar ? "md:max-w-312.5" : "md:max-w-3xl"
      )}>
        
        <div className={cn("flex-1 flex flex-col border-r border-slate-200 bg-slate-50 relative h-full transition-all", activeSidebar && "hidden md:flex")}>
          
          <div className="p-4 md:p-6 border-b bg-slate-900 text-white flex justify-between items-center shrink-0">
            <div className="flex-1 text-left min-w-0 group">
              <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400 block mb-1">
                {isTemplateMode ? "Editor de Modelos" : `Paciente: ${clientName}`}
              </span>
              <div className="relative flex items-center gap-2">
                <input 
                  value={builderPrescription.planName || ""}
                  onChange={(e) => setBuilderPrescription((prev) => ({ ...prev, planName: e.target.value }))}
                  className="bg-transparent border-none text-xl font-black uppercase italic w-full focus:outline-none hover:bg-white/5 px-2 -ml-2 rounded-md transition-all truncate"
                  placeholder="NOME DO PLANO..."
                />
                <PenTool size={16} className="text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X size={24} /></button>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
            <div className="px-6 py-3 border-b bg-white shrink-0">
              <TabsList className="grid grid-cols-2 w-full max-w-sm mx-auto h-10 bg-slate-100 rounded-xl p-1">
                <TabsTrigger value="editor" className="rounded-lg font-black uppercase text-[9px] gap-2 data-[state=active]:bg-white shadow-none">
                  <PenTool size={12} /> Editor
                </TabsTrigger>
                {!isTemplateMode && (
                  <TabsTrigger value="library" className="rounded-lg font-black uppercase text-[9px] gap-2 data-[state=active]:bg-white shadow-none">
                    <BookOpen size={12} /> Biblioteca
                  </TabsTrigger>
                )}
              </TabsList>
            </div>

            <div className="flex-1 overflow-y-auto bg-slate-50/50 custom-scrollbar">
              <TabsContent value="editor" className="p-4 md:p-6 m-0 outline-none h-full">
                {loadingCatalog ? (
                  <div className="h-full min-h-75 flex flex-col items-center justify-center text-emerald-600">
                    <Loader2 className="animate-spin mb-4" size={40} />
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Sincronizando catálogo...</p>
                  </div>
                ) : (!builderPrescription.meals?.length) ? (
                  <div className="h-full min-h-75 flex flex-col items-center justify-center border-4 border-dashed border-slate-200 rounded-4xl text-slate-300 bg-white">
                    <Layout size={48} strokeWidth={1} className="mb-4" />
                    <Button onClick={() => builder.addMeal()} className="bg-emerald-600 hover:bg-emerald-500 font-black uppercase text-[10px] px-8 shadow-lg shadow-emerald-200">
                      Iniciar Novo Plano
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-10 pb-10">
                    {builderPrescription.meals.map((meal, idx) => (
                      <PrescriptionMealCard 
                        key={meal.id || idx} 
                        meal={meal as PrescriptionMeal} 
                        // ✅ Passagem limpa
                        builder={builder as unknown as React.ComponentProps<typeof PrescriptionMealCard>['builder']} 
                      />
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="library" className="p-6 m-0 outline-none">
                <TemplateLibraryTab 
                  templates={(templates || []) as React.ComponentProps<typeof TemplateLibraryTab>['templates']} 
                  isLoading={loadingTemplates} 
                  onApply={(t: Record<string, unknown>) => {
                    // ✅ FIX TS2352: Passa por unknown primeiro
                    const normalized = normalizePrescriptionData(t, catalog as CatalogItem[], true) as unknown as CleanPrescriptionState;
                    
                    if (originalIdRef.current) {
                      normalized.id = originalIdRef.current;
                    } else {
                      const editable = normalized as Partial<CleanPrescriptionState>;
                      delete editable.id;
                    }

                    normalized.discountPercentage = currentPrescription?.discountPercentage || 0;
                    setBuilderPrescription(normalized as unknown as FullPrescription);
                    setActiveTab("editor");
                    toast.success("Modelo aplicado!");
                  }} 
                />
              </TabsContent>
            </div>
          </Tabs>

          <div className="p-4 md:p-6 border-t border-slate-200 bg-white flex justify-end items-center gap-3 shrink-0 shadow-[0_-10px_40px_rgba(0,0,0,0.03)] relative z-20 text-left">
            <Button variant="ghost" onClick={onClose} className="h-12 px-6 rounded-xl font-black uppercase text-[10px] text-slate-400">
              Cancelar
            </Button>
            {!isTemplateMode && (
              <Button 
                variant="outline"
                disabled={actions.isSaving || (builderPrescription.meals?.length === 0)}
                onClick={() => {
                  actions.setShowTemplateModal(true);
                }}
                className="h-12 px-6 rounded-xl border-2 border-slate-200 hover:border-slate-300 font-black uppercase text-[10px] text-slate-600 gap-2"
              >
                Salvar como Modelo
              </Button>
            )}
            <Button 
              disabled={actions.isSaving || (builderPrescription.meals?.length === 0)}
              onClick={() => {
                const sanitizedMeals = builderPrescription.meals.map(meal => ({
                  ...meal,
                  groups: meal.groups.map(group => ({
                    ...group,
                    options: group.options.map((opt) => {
                      const o = opt as unknown as SanitizableOption;
                      const base = (o.nutritionalData?.baseMacros || o.macros || {}) as Record<string, unknown>;
                      
                      return {
                        ...o,
                        dishId: String(o.dishId),
                        sizeId: o.sizeId ? Number(o.sizeId) : undefined,
                        priceAtCreation: Number(o.price || o.priceAtCreation || 0),
                        multiplier: String(o.multiplier || "1.00"),
                        macros: {
                          kcal: Number(base.kcal || base.energyKcal || 0),
                          protein: Number(base.protein || base.proteins || 0),
                          carbs: Number(base.carbs || 0),
                          fat: Number(base.fat || base.fatTotal || 0),
                        },
                        nutritionalData: {
                          ...(o.nutritionalData || {}),
                          baseMacros: {
                            kcal: Number(base.kcal || base.energyKcal || 0),
                            protein: Number(base.protein || base.proteins || 0),
                            carbs: Number(base.carbs || 0),
                            fat: Number(base.fat || base.fatTotal || 0),
                          }
                        },
                        allowedAccompaniments: o.allowedAccompaniments || []
                      };
                    })
                  }))
                }));

                actions.handleSaveProcess(isTemplateMode, sanitizedMeals as unknown as PrescriptionMeal[]);
              }} 
              className="h-12 px-8 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase text-[10px] tracking-widest gap-2 shadow-lg shadow-emerald-200 transition-all active:scale-95"
            >
              {actions.isSaving ? <Loader2 className="animate-spin" size={16} /> : <PenTool size={16} strokeWidth={3} />}
              {isTemplateMode ? (originalIdRef.current ? "Atualizar Modelo" : "Salvar Modelo") : (originalIdRef.current ? "Atualizar Dieta" : "Salvar no Slot")}
            </Button>
          </div>
        </div>

        {activeSidebar === "catalog" ? (
          <CatalogSidebar 
            isPickingFor={builder.isPickingFor} 
            onClose={() => builder.setIsPickingFor(null)} 
            catalog={(catalog || []) as CatalogProduct[]} 
            loading={loadingCatalog} 
            prescription={builderPrescription as unknown as FullPrescription} 
            onAdd={builder.addOptionToGroup as React.ComponentProps<typeof CatalogSidebar>['onAdd']} 
          />
        ) : activeSidebar === "acc" ? (
          <AccompanimentSidebar 
            isPickingAccFor={builder.isPickingAccFor} 
            onClose={() => builder.setIsPickingAccFor(null)} 
            accompaniments={(accompaniments || []).map(acc => ({
              ...acc,
              energyKcal: acc.energyKcal ?? 0,
              proteins: acc.proteins ?? "0",
              carbs: acc.carbs ?? "0",
              fatTotal: acc.fatTotal ?? "0"
            })) as unknown as React.ComponentProps<typeof AccompanimentSidebar>['accompaniments']} 
            loading={loadingAccs} 
            prescription={builderPrescription as unknown as FullPrescription} 
            onAdd={builder.toggleAccompanimentToOption} 
          />
        ) : null}
      </div>

      <TemplateSaveDialog 
        isOpen={actions.showTemplateModal} 
        onClose={() => actions.setShowTemplateModal(false)} 
        onSave={(data) => actions.confirmSaveTemplate(data.name, data.description || "", builderPrescription.meals as unknown as PrescriptionMeal[])}
        initialName={builderPrescription.planName}
      />
    </>
  );
};

export default PrescriptionDrawer;