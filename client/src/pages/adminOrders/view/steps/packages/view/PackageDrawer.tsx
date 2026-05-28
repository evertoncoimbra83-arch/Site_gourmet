// client/src/pages/adminOrders/view/steps/packages/view/PackageDrawer.tsx

import React, { useMemo, useRef, useState } from "react";
import { trpc } from "@/_core/trpc";
import { cn } from "@/lib/utils";
import { appToast as toast } from "@/lib/app-toast";

// ✅ COMPONENTES
import PackageNutritionDashboard from "@/pages/packages/components/PackageNutritionDashboard";
import AccompanimentSelector from "@/components/AccompanimentSelector";
import PackageStepSummary from "@/pages/packages/view/PackageStepSummary";

// ✅ LÓGICA CENTRALIZADA
import { usePackageSelection } from "../logic/usePackageSelection";
import { calculatePackageTotals, mapPackageMealNutrition } from "@/pages/packages/logic/nutritionCalculator";

// ✅ UI BASE
import { Sheet, SheetContent, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { UtensilsCrossed, Loader2, ArrowLeft, Scale, X } from "lucide-react"; 
import { Select, SelectContent, SelectValue, SelectTrigger, SelectItem } from "@/components/ui/select";
import { motion, AnimatePresence } from "framer-motion";

// --- INTERFACES SEGURAS ---
interface PackageSelectionResult {
  unitPrice: number;
  quantity: number;
  options: string;
  applied_nutrition: string;
}

interface PackageDrawerProps {
  packageId: string | number | null;
  onClose: () => void;
  onConfirm: (selection: PackageSelectionResult) => void;
}

interface PackageSize {
  name?: string;
  proteinWeight?: string | number;
  defaultMainWeight?: string | number;
}

interface PackageData {
  id: string | number;
  name: string;
  price?: string | number;
  salePrice?: string | number;
  size?: PackageSize;
}

interface Accompaniment {
  id: string | number;
  name: string;
  groupName?: string;
  group?: string;
  groupId?: string | number;
  group_id?: string | number;
  weight?: string | number;
  defaultGrammage?: string | number;
  ingredients?: string;
}

interface AccompanimentGroup {
  id: string | number;
  minSelections?: string | number;
  label?: string;
  accompaniments?: Accompaniment[];
}

interface ExtendedMealState {
  dishId: string | number | null;
  dishName?: string;
  slotName?: string;
  label?: string;
  dishData?: {
    ingredients?: string;
    [key: string]: unknown;
  };
  selectedAccompaniments?: Accompaniment[];
  allowedDishes?: { id: string | number; name: string }[];
  accompanimentGroups?: AccompanimentGroup[];
}

export default function PackageDrawer({ packageId, onClose, onConfirm }: PackageDrawerProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const footerRef = useRef<HTMLDivElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const idToQuery = packageId !== null ? String(packageId) : undefined;

  const { data: pkgRaw, isLoading: loadingPkg } = trpc.packages.getById.useQuery(
    { id: idToQuery as string },
    { enabled: !!idToQuery, staleTime: Infinity }
  );

  const pkg = pkgRaw as unknown as PackageData;

  // Tipagem do usePackageSelection baseada no contrato esperado
  const { 
    currentStep, 
    setCurrentStep, 
    selectedMeals, 
    currentMeal, 
    handleSelectDish, 
    handleSelectAcc 
  } = usePackageSelection(pkg as unknown as Parameters<typeof usePackageSelection>[0]);

  const packageSize = useMemo(() => pkg?.size, [pkg]);
  
  const defaultWeight = useMemo(() => {
    const dbWeight = pkg?.size?.proteinWeight || pkg?.size?.defaultMainWeight;
    return dbWeight ? Number(dbWeight) : 300;
  }, [pkg]);

  // Narrowing para garantir que grupos de acompanhamentos sejam arrays
  const accompanimentGroups = useMemo<AccompanimentGroup[]>(() => {
    if (!currentMeal) return [];
    const meal = currentMeal as ExtendedMealState;
    return (meal.accompanimentGroups || meal.dishData?.accompanimentGroups || []) as AccompanimentGroup[];
  }, [currentMeal]);

  const totals = useMemo(() => {
    const mealsForCalc = (selectedMeals as unknown as ExtendedMealState[]).map(m => ({
      dishId: m.dishId,
      dishData: m.dishData as Record<string, unknown>,
      selectedAccompaniments: m.selectedAccompaniments as unknown as Record<string, unknown>[]
    }));
    return calculatePackageTotals(mealsForCalc, Number(pkg?.salePrice || pkg?.price || 0));
  }, [selectedMeals, pkg]);

  const scrollTo = (ref: React.RefObject<HTMLDivElement>) => {
    setTimeout(() => {
      ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 200);
  };

  const onDishChange = (val: string) => {
    handleSelectDish(val);
    scrollTo(contentRef);
  };

  const onAccChange = (groupId: string, optionId: string) => {
    handleSelectAcc(groupId, optionId);
    
    setTimeout(() => {
      const meal = currentMeal as ExtendedMealState;
      const isCurrentMealComplete = accompanimentGroups.every((group) => {
        const count = (meal.selectedAccompaniments || []).filter(
          (a) => Number(a.groupId || a.group_id) === Number(group.id)
        ).length;
        return count >= Number(group.minSelections || 0);
      });

      if (isCurrentMealComplete) {
        scrollTo(footerRef);
      }
    }, 100);
  };

  const formattedSelections = useMemo(() => {
    const selections: Record<number, Accompaniment[]> = {};
    const meal = currentMeal as ExtendedMealState;
    if (!meal?.selectedAccompaniments) return selections;

    meal.selectedAccompaniments.forEach((a) => {
      const gId = Number(a.groupId || a.group_id);
      if (gId) {
        if (!selections[gId]) selections[gId] = [];
        selections[gId].push(a);
      }
    });
    return selections;
  }, [currentMeal]);

  const handleFinish = async () => {
    setIsSubmitting(true);
    const r3 = (num: string | number | null | undefined) => Number(Number(num || 0).toFixed(3));
    const r2 = (num: string | number | null | undefined) => Number(Number(num || 0).toFixed(2));

    const extendedMeals = selectedMeals as unknown as ExtendedMealState[];

    const structuralOptions = {
      isPackage: true,
      _type: 'package',
      packageName: pkg?.name,
      sizeName: packageSize?.name || "Padrão",
      meals: extendedMeals.map((meal) => ({
        dishId: meal.dishId,
        dishName: meal.dishName,
        slotName: meal.label || meal.slotName,
        // ✅ Leitura segura de ingredientes (sem any)
        dishIngredients: meal.dishData?.ingredients || "", 
        selectedAccompaniments: (meal.selectedAccompaniments || []).map((acc) => ({
          id: acc.id,
          name: acc.name,
          group: acc.groupName || acc.group || "Acompanhamento",
          weight: Number(acc.weight || acc.defaultGrammage || 0),
          ingredients: acc.ingredients || "" // Salva ficha técnica do acompanhamento
        }))
      }))
    };

    const technicalNutrition = extendedMeals.map((meal) => {
      const n = mapPackageMealNutrition(
        meal.dishData as Record<string, unknown>, 
        meal.selectedAccompaniments as unknown as Record<string, unknown>[]
      );

      return {
        dishId: meal.dishId,
        dishName: meal.dishName,
        slotName: meal.label || meal.slotName,
        energy_kcal: r2(n.energyKcal),
        energy_kj: r2(n.energyKj),
        proteins: r3(n.proteins),
        carbs: r3(n.carbs),
        fat_total: r3(n.fatTotal),
        fat_saturated: r3(n.fatSaturated),
        fat_trans: r3(n.fatTrans),
        fiber: r3(n.fiber),
        sodium: r2(n.sodium),
        added_sugars: r2(n.addedSugars),
        calcium: r2(n.calcium),
        iron: r2(n.iron),
        yield_weight: r2(n.yieldWeight),
        composition_ids: {
            dish: meal.dishId,
            accs: meal.selectedAccompaniments?.map((a) => a.id) || []
        }
      };
    });

    onConfirm({
      unitPrice: Number(totals.totalPrice || pkg?.salePrice || pkg?.price || 0), 
      quantity: 1,
      options: JSON.stringify(structuralOptions), 
      applied_nutrition: JSON.stringify(technicalNutrition)
    });
    
    setIsSubmitting(false);
    toast.success("Pacote configurado!");
  };

  if (loadingPkg) return (
    <div className="flex h-screen items-center justify-center bg-white">
      <Loader2 className="animate-spin text-emerald-600 h-10 w-10" />
    </div>
  );

  const mealState = currentMeal as ExtendedMealState | undefined;
  const isCurrentStepValid = !!mealState?.dishId;

  return (
    <AnimatePresence>
      <Sheet open={!!packageId} onOpenChange={(open) => !open && onClose()}>
        <SheetContent side="right" className="w-full sm:max-w-xl p-0 flex flex-col h-full bg-[#FBFBFC] border-none shadow-2xl focus:outline-none overflow-hidden">
          <SheetTitle className="sr-only">Configurar {pkg?.name}</SheetTitle>
          <SheetDescription className="sr-only">Escolha as marmitas do seu kit.</SheetDescription>

          <div className="pt-10 px-8 pb-6 bg-slate-950 text-white shrink-0 relative">
            <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors">
              <X size={24} />
            </button>
            <div className="relative z-10 space-y-3">
              <span className="text-[9px] font-black uppercase tracking-[0.3em] text-emerald-400 italic">
                Marmita {currentStep + 1} de {selectedMeals.length}
              </span>
              <h2 className="text-2xl font-black uppercase italic tracking-tighter leading-none">
                {pkg?.name}
              </h2>
              <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                <motion.div 
                  className="h-full bg-emerald-500" 
                  animate={{ width: `${totals.progress}%` }} 
                />
              </div>
            </div>
          </div>

          <PackageStepSummary 
            steps={selectedMeals as unknown as React.ComponentProps<typeof PackageStepSummary>["steps"]} 
            currentStep={currentStep} 
            onStepClick={(index) => setCurrentStep(index)} 
          />

          <div className="flex-1 overflow-y-auto no-scrollbar scroll-smooth">
            <div className="p-6 md:p-8 space-y-8 pb-20">
              <AnimatePresence mode="wait">
                <motion.div 
                  key={currentStep} 
                  initial={{ opacity: 0, x: 10 }} 
                  animate={{ opacity: 1, x: 0 }} 
                  exit={{ opacity: 0, x: -10 }} 
                  className="space-y-6"
                >
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest italic ml-1">Selecione o Prato</label>
                    <Select value={String(mealState?.dishId || "")} onValueChange={onDishChange}>
                      <SelectTrigger className="h-14 rounded-2xl border-2 border-slate-100 bg-white px-6 font-bold text-slate-900 shadow-sm transition-all focus:border-emerald-500/50">
                        <div className="flex items-center gap-3">
                          <UtensilsCrossed size={16} className="text-emerald-500" />
                          <SelectValue placeholder="Toque para escolher..." />
                        </div>
                      </SelectTrigger>
                      <SelectContent className="bg-white rounded-xl border-slate-100 shadow-2xl max-h-80">
                        {mealState?.allowedDishes?.map((d) => (
                          <SelectItem key={d.id} value={String(d.id)} className="font-bold py-3 uppercase italic text-[11px]">
                            {d.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {mealState?.dishId && (
                    <div ref={contentRef} className="animate-in fade-in slide-in-from-bottom-2 duration-500 space-y-6">
                      <PackageNutritionDashboard 
                        dish={mealState.dishData as React.ComponentProps<typeof PackageNutritionDashboard>["dish"]} 
                        selectedAccs={mealState.selectedAccompaniments as React.ComponentProps<typeof PackageNutritionDashboard>["selectedAccs"] || []}
                        groups={accompanimentGroups as unknown as React.ComponentProps<typeof PackageNutritionDashboard>["groups"]} 
                        defaultWeight={defaultWeight}
                      />
                      
                      <div className="pt-2">
                        {accompanimentGroups.length > 0 ? (
                          <AccompanimentSelector 
                            groups={accompanimentGroups as React.ComponentProps<typeof AccompanimentSelector>["groups"]}
                            selections={formattedSelections as React.ComponentProps<typeof AccompanimentSelector>["selections"]}
                            onToggle={(group, optionId) => onAccChange(String(group.id), String(optionId))}
                          />
                        ) : (
                          <div className="p-8 border-2 border-dashed border-slate-100 rounded-3xl text-center bg-slate-50/50">
                            <Scale className="mx-auto text-slate-200 mb-2" size={20} />
                            <p className="text-[9px] font-black uppercase text-slate-500 tracking-widest">Prato sem adicionais</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          <div ref={footerRef} className="p-4 md:p-6 border-t bg-white shrink-0 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] z-50">
            <div className="flex flex-col gap-3 w-full">
              <div className="flex justify-between items-center px-5 py-3 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="flex flex-col">
                  <span className="text-[8px] font-black uppercase text-slate-400">Preço do Kit</span>
                  <span className={cn("text-[9px] font-black italic uppercase leading-none mt-1", totals.isComplete ? "text-emerald-600" : "text-amber-500")}>
                    {totals.isComplete ? "✓ Completo" : `Restam ${selectedMeals.length - selectedMeals.filter(m => (m as ExtendedMealState).dishId).length}`}
                  </span>
                </div>
                <p className="text-lg font-black italic text-slate-900 tracking-tighter">
                  R$ {totals.totalPrice.toFixed(2)}
                </p>
              </div>

              <div className="flex gap-2">
                {currentStep > 0 && (
                  <Button 
                    variant="outline" 
                    className="h-14 w-14 rounded-2xl border-2 border-slate-100" 
                    onClick={() => setCurrentStep((prev: number) => prev - 1)}
                  >
                    <ArrowLeft size={18} />
                  </Button>
                )}
                
                <Button 
                  disabled={currentStep < selectedMeals.length - 1 ? !isCurrentStepValid : !totals.isComplete || isSubmitting}
                  onClick={currentStep < selectedMeals.length - 1 ? () => { setCurrentStep((prev: number) => prev + 1); scrollTo(contentRef); } : handleFinish} 
                  className={cn(
                    "flex-1 h-14 font-black rounded-2xl uppercase tracking-widest transition-all shadow-md",
                    (currentStep < selectedMeals.length - 1 ? isCurrentStepValid : totals.isComplete)
                      ? "bg-slate-900 text-white" 
                      : "bg-slate-100 text-slate-300"
                  )}
                >
                  {isSubmitting ? (
                    <Loader2 className="animate-spin" size={20} />
                  ) : (
                    <div className="flex items-center justify-between w-full px-2">
                      <span className="italic truncate text-[11px]">
                          {currentStep < selectedMeals.length - 1 ? "Próxima Marmita" : "Finalizar Pacote"}
                      </span>
                      <span className="bg-white/10 px-2.5 py-1 rounded-lg text-[10px] border border-white/5 font-black">
                          {currentStep + 1} / {selectedMeals.length}
                      </span>
                    </div>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </AnimatePresence>
  );
}