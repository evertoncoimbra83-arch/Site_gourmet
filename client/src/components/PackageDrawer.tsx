import { useMemo, useState } from "react";
import { trpc } from "@/_core/trpc";
import { useCartDrawer } from "@/_core/hooks/useCartDrawer"; 
import { cn } from "@/lib/utils";
import { toast } from "@/components/ui/use-toast";

// ✅ Hooks e Libs
import { usePackageSelection } from "../hooks/usePackageSelection";
import { calculatePackageTotals } from "../lib/nutrition-calculator";

// ✅ Componentes de UI
import { 
  Sheet, 
  SheetContent, 
  SheetTitle, 
  SheetDescription 
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { 
  Flame, 
  UtensilsCrossed, 
  Loader2, 
  ArrowRight, 
  ArrowLeft
} from "lucide-react";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { motion, AnimatePresence } from "framer-motion";

// ✅ Componente Seletor
import AccompanimentSelector from "@/components/AccompanimentSelector";

// ✅ CORREÇÃO: Aceita string ou number para o ID
export default function PackageDrawer({ packageId, onClose }: { packageId: string | number | null, onClose: () => void }) {
  const { addToCart, isAdding } = useCartDrawer();
  
  // Busca os dados do pacote
  const { data: pkg, isLoading: loadingPkg } = trpc.packages.getById.useQuery(
    { id: packageId! },
    { enabled: !!packageId, staleTime: Infinity }
  );

  // Hook de lógica de seleção
  const { 
    currentStep, 
    setCurrentStep, 
    selectedMeals, 
    currentMeal, 
    handleSelectDish, 
    handleSelectAcc 
  } = usePackageSelection(pkg);

  // Cálculos de totais
  const totals = useMemo(() => 
    calculatePackageTotals(selectedMeals, Number(pkg?.price || 0)), 
    [selectedMeals, pkg]
  );

  const currentMealCalories = useMemo(() => {
    if (!currentMeal?.dishId) return 0;
    const completedMealsCount = selectedMeals.filter((m: any) => m.dishId).length;
    return Math.round(totals.nutrition.kcal / (completedMealsCount || 1));
  }, [currentMeal, totals, selectedMeals]);

  // Prepara seleção para o componente visual
  const formattedSelections = useMemo(() => {
    const selections: Record<number, any[]> = {};
    if (!currentMeal?.selectedAccompaniments) return selections;

    currentMeal.selectedAccompaniments.forEach((acc: any) => {
      if (acc && acc.groupId) {
        const gId = Number(acc.groupId);
        if (!selections[gId]) selections[gId] = [];
        selections[gId].push(acc);
      }
    });
    return selections;
  }, [currentMeal?.selectedAccompaniments]);

  // ✅ HANDLER OTIMIZADO (Sem redundância)
  const handleAddToCart = async () => {
    if (!pkg || !totals.isComplete) {
        toast.error("Complete todas as escolhas antes de adicionar.");
        return;
    }

    // Payload Limpo (apenas o que o carrinho precisa)
    const cleanOptions = {
      _type: "multi",
      packageName: pkg.name,
      showNutrition: totals.nutrition.kcal > 0, 
      meals: selectedMeals.map((m: any) => ({
        slotName: m.label,
        dishId: m.dishId,
        dishName: m.dishName,
        // Apenas os acompanhamentos escolhidos, com dados essenciais
        selectedAccompaniments: (m.selectedAccompaniments || []).map((acc: any) => ({
          id: acc.id,
          name: acc.name,
          groupId: acc.groupId,
          groupName: acc.groupName,
          priceModifier: Number(acc.price || acc.priceModifier || 0),
          category: acc.category // Inclui ícone/cor para exibição no carrinho
        }))
      }))
    };

    const cartItemPayload = { 
      id: pkg.id, 
      name: pkg.name, 
      image: pkg.imageUrl, 
      price: totals.totalPrice,
      options: cleanOptions,
      nutrition: totals.nutrition
    };

    // Envio real
    await addToCart(cartItemPayload, 1, cleanOptions, onClose);
    toast.success("Kit adicionado ao carrinho!");
  };

  if (loadingPkg) return (
    <div className="flex h-screen items-center justify-center bg-white">
      <Loader2 className="animate-spin text-emerald-600 h-10 w-10" />
    </div>
  );

  return (
    <Sheet open={!!packageId} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-xl p-0 flex flex-col h-full bg-[#FBFBFC] border-none shadow-2xl overflow-hidden focus:outline-none">
        
        <SheetTitle className="sr-only">Configurar {pkg?.name}</SheetTitle>
        <SheetDescription className="sr-only">Personalização.</SheetDescription>

        {/* Header */}
        <div className="pt-10 px-8 pb-8 bg-slate-950 text-white relative shrink-0">
          <div className="relative z-10 space-y-5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-400 italic">Personalização</span>
              <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">{currentStep + 1} de {selectedMeals.length}</span>
            </div>
            <h2 className="text-3xl font-black uppercase italic tracking-tighter leading-none">{pkg?.name}</h2>
            <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
              <motion.div className="h-full bg-emerald-500" initial={{ width: 0 }} animate={{ width: `${totals.progress}%` }} />
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto bg-[#FBFBFC] p-8 space-y-8 scrollbar-hide">
          <AnimatePresence mode="wait">
            <motion.div key={currentStep} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
              
              <div className="space-y-1">
                <h3 className="text-2xl font-black text-slate-900 uppercase italic leading-none">{currentMeal?.label}</h3>
              </div>

              {/* SELECT PRATO */}
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-2">Prato Principal</label>
                <Select value={String(currentMeal?.dishId || "")} onValueChange={handleSelectDish}>
                  <SelectTrigger className="h-16 rounded-3xl border-2 border-slate-100 bg-white px-6 font-bold text-slate-900">
                    <div className="flex items-center gap-3">
                      <UtensilsCrossed size={18} className="text-emerald-500" />
                      <SelectValue placeholder="Selecione o prato..." />
                    </div>
                  </SelectTrigger>
                  <SelectContent className="z-1001 bg-white rounded-2xl p-2 max-h-80">
                    {currentMeal?.allowedDishes?.map((dish: any) => (
                      <SelectItem key={dish.id} value={String(dish.id)} className="font-bold py-4 cursor-pointer">
                        {dish.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* SELETOR DE ACOMPANHAMENTOS */}
              {currentMeal?.dishId && (
                <div className="space-y-6 animate-in fade-in duration-500">
                  {currentMealCalories > 0 && (
                    <div className="flex items-center gap-4 p-5 bg-orange-50/50 rounded-3xl border border-orange-100">
                      <Flame size={20} className="text-orange-500 fill-orange-500" />
                      <div>
                        <p className="text-[9px] font-black uppercase text-orange-600 mb-1">Kcal Estimadas</p>
                        <p className="text-xl font-black text-slate-900 leading-none">{currentMealCalories} Kcal</p>
                      </div>
                    </div>
                  )}

                  <AccompanimentSelector 
                    groups={currentMeal.accompanimentGroups || []}
                    selections={formattedSelections}
                    onToggle={(group, optionId) => handleSelectAcc(String(group.id), String(optionId))}
                  />
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* RODAPÉ */}
        <div className="p-8 border-t border-slate-100 bg-white/95 shrink-0">
          <div className="flex gap-4 items-center max-w-lg mx-auto">
            {currentStep > 0 && (
              <Button variant="outline" className="h-16 w-16 rounded-full" onClick={() => setCurrentStep(prev => prev - 1)}>
                <ArrowLeft size={20} />
              </Button>
            )}
            
            {currentStep < selectedMeals.length - 1 ? (
              <Button 
                disabled={!currentMeal?.dishId}
                onClick={() => setCurrentStep(prev => prev + 1)}
                className="flex-1 h-16 bg-slate-950 text-white rounded-full font-black uppercase text-[11px]"
              >
                Próxima Marmita <ArrowRight size={18} className="ml-2 text-emerald-400" />
              </Button>
            ) : (
              <Button 
                disabled={!totals.isComplete || isAdding}
                onClick={handleAddToCart}
                className={cn(
                  "flex-1 h-16 font-black rounded-full uppercase text-[12px]",
                  totals.isComplete ? "bg-slate-950 text-emerald-400" : "bg-slate-100 text-slate-400"
                )}
              >
                {isAdding ? <Loader2 className="animate-spin" /> : `Finalizar Kit - R$ ${totals.totalPrice.toFixed(2)}`}
              </Button>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}   