// client/src/pages/products/view/ProductDrawer.tsx
// Fix UX mobile: side="bottom" em mobile, side="right" em desktop (sm+)
// Fix: padding inferior respeitando safe-area do iOS

import React, { useMemo, useRef } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Loader2,
  ChevronDown,
  Activity,
  Info,
  X,
  Snowflake,
  Clock3,
  Salad,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

// Lógica e Tipos
import { useProductDrawer } from "../logic/useProductDrawer";
import { DishSize, AccOption } from "../logic/types";
import { NutritionValues } from "@/_core/type/utils";

// Componentes Refatorados
import { NutritionInfo } from "../drawer/NutritionInfo"; 
import { SizeSelector } from "../drawer/SizeSelector";
import { DrawerFooter } from "../drawer/DrawerFooter"; 

interface ProductDrawerProps {
  dishId: string | number | null;
  onClose: () => void;
}

// Hook simples para detectar viewport mobile
function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState(
    () => typeof window !== "undefined" && window.innerWidth < 640
  );

  React.useEffect(() => {
    const mq = window.matchMedia("(max-width: 639px)");
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  return isMobile;
}

export default function ProductDrawer({ dishId, onClose }: ProductDrawerProps) {
  const isMobile = useIsMobile();

  const {
    dish,
    isLoading,
    quantity,
    setQuantity,
    selectedSize,
    selectedAccs,
    showFullNutrition,
    setShowFullNutrition,
    totalNutrition,
    totalUnitPrice,
    isAccompanimentsComplete,
    isAdding,
    footerRef,
    handleSizeSelect,
    handleAccSelection,
    handleAddToCart
  } = useProductDrawer(dishId, onClose);

  const accompanimentsRef = useRef<HTMLDivElement>(null);

  const canAddToCart = useMemo(() => {
    const hasGroups = selectedSize?.accompanimentGroups && selectedSize.accompanimentGroups.length > 0;
    if (!hasGroups) return !!selectedSize; 
    return isAccompanimentsComplete;
  }, [selectedSize, isAccompanimentsComplete]);

  const trustBadges = useMemo(
    () => [
      { label: "Pronto em poucos minutos", icon: Clock3 },
      { label: "Ideal para freezer", icon: Snowflake },
      { label: "Porção controlada", icon: ShieldCheck },
      { label: "Comida saudável pronta", icon: Salad },
    ],
    [],
  );

  const nutritionBenefits = useMemo(() => {
    if (!selectedSize || !totalNutrition) return [];

    const badges: string[] = [];
    if (totalNutrition.proteins >= 25) badges.push("Alta proteína");
    if (totalNutrition.carbs <= 20) badges.push("Low carb");
    if (totalNutrition.energyKcal <= 400) {
      badges.push("Leve");
    } else if (totalNutrition.energyKcal <= 650) {
      badges.push("Refeição completa");
    }

    return badges;
  }, [selectedSize, totalNutrition]);

  const onSizeClick = (s: unknown) => {
    handleSizeSelect(s as DishSize);
    setTimeout(() => {
      accompanimentsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 150);
  };

  // Em mobile: sheet sobe do rodapé (bottom).
  // Em desktop (sm+): entra pela direita como era antes.
  const sheetSide = isMobile ? "bottom" : "right";

  return (
    <Sheet open={!!dishId} onOpenChange={(open) => !open && onClose()}>
      <SheetContent 
        side={sheetSide}
        data-testid="drawer-prato"
        className={cn(
          "p-0 flex flex-col border-none shadow-2xl focus:outline-none overflow-hidden",
          // Mobile: ocupa até 92% da altura da tela, com cantos arredondados no topo
          isMobile
            ? "w-full max-h-[92dvh] rounded-t-[2rem]"
            // Desktop: painel lateral à direita, largura máxima
            : "h-full w-full sm:max-w-xl"
        )}
      >
        <SheetTitle className="sr-only">Configurar {dish?.name || "Prato"}</SheetTitle>
        <SheetDescription className="sr-only">Escolha o tamanho e os acompanhamentos do seu prato.</SheetDescription>
        
        {/* Indicador de arrasto (só mobile) */}
        {isMobile && (
          <div className="flex justify-center pt-3 pb-1 shrink-0">
            <div className="w-10 h-1 bg-slate-200 rounded-full" />
          </div>
        )}

        {/* Botão fechar (desktop) */}
        {!isMobile && (
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 z-50 p-2.5 bg-black/40 backdrop-blur-md hover:bg-black/60 text-white rounded-full transition-all"
          >
            <X size={20} strokeWidth={2.5} />
          </button>
        )}

        {/* ÁREA ROLÁVEL PRINCIPAL */}
        <div className="flex-1 overflow-y-auto overscroll-contain no-scrollbar scroll-smooth">
          
          {!isLoading && dish?.imageUrl && (
            <div className={cn(
              "relative w-full shrink-0",
              isMobile ? "h-40" : "h-48 sm:h-56"
            )}>
              <img
                src={dish.imageUrl}
                alt={dish.name}
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-black/10" />
              
              <div className="absolute bottom-4 left-4 right-4 text-white">
                <h2 className="text-xl md:text-3xl font-black tracking-tighter leading-none drop-shadow-md line-clamp-2">
                  {dish.name}
                </h2>
                {selectedSize && (
                  <p className="mt-1 text-xl md:text-3xl font-semibold tracking-tighter text-emerald-400 drop-shadow-md">
                    R$ {totalUnitPrice.toFixed(2)}
                  </p>
                )}
              </div>

              {Boolean((dish as unknown as Record<string, unknown>)?.isPopular) && (
                <div className="absolute top-4 left-4 bg-red-500/90 backdrop-blur-sm text-white text-[10px] font-black tracking-widest px-3 py-1.5 rounded-full shadow-lg border border-red-400">
                  🔥 POPULAR
                </div>
              )}
            </div>
          )}

          {/* CONTEÚDO DE SELEÇÃO */}
          <div className="px-4 md:px-6 pt-5 pb-32">
            {isLoading ? (
              <div className="flex h-40 items-center justify-center">
                <Loader2 className="animate-spin text-emerald-500 h-8 w-8" />
              </div>
            ) : (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-5">
                <div className="rounded-[2rem] border border-slate-100 bg-linear-to-br from-white via-slate-50 to-emerald-50/40 p-4 shadow-sm">
                  <div className="flex flex-wrap gap-2">
                    {trustBadges.map((badge) => {
                      const Icon = badge.icon;
                      return (
                        <span
                          key={badge.label}
                          className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white/90 px-3 py-2 text-[10px] font-black uppercase tracking-tight text-slate-600"
                        >
                          <Icon size={12} className="text-emerald-600" />
                          {badge.label}
                        </span>
                      );
                    })}
                  </div>

                  {nutritionBenefits.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {nutritionBenefits.map((benefit) => (
                        <span
                          key={benefit}
                          className="inline-flex items-center rounded-full bg-emerald-600 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-white"
                        >
                          {benefit}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <SizeSelector 
                  sizes={(dish?.sizes || []) as unknown as React.ComponentProps<typeof SizeSelector>["sizes"]} 
                  selectedId={selectedSize?.id || null} 
                  onSelect={onSizeClick} 
                  selectedAccs={selectedAccs as AccOption[]} 
                  onAddAcc={handleAccSelection}
                  onRemoveAcc={handleAccSelection}
                />

                {selectedSize?.accompanimentGroups && selectedSize.accompanimentGroups.length > 0 && (
                  <div ref={accompanimentsRef} className="pt-2" tabIndex={-1} />
                )}
              </div>
            )}
          </div>
        </div>

        {/* FOOTER FIXO */}
        <div 
          ref={footerRef} 
          className={cn(
            "bg-white border-t border-slate-100 shadow-[0_-30px_50px_-10px_rgba(0,0,0,0.1)] shrink-0 z-50",
            isMobile ? "rounded-t-none" : "rounded-t-4xl"
          )}
          // Safe area para iPhone com home indicator
          style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
        >
          {/* BARRA NUTRICIONAL */}
          {selectedSize && dish?.showNutrition && totalNutrition && (
            <div 
              className={cn(
                "mx-4 md:mx-6 -mt-8 mb-4 relative z-10 rounded-3xl p-4 md:p-5 transition-all duration-300",
                "bg-white/90 backdrop-blur-xl border border-white/70 shadow-xl",
                showFullNutrition ? "bg-white" : "hover:bg-white/95 cursor-pointer"
              )}
              onClick={!showFullNutrition ? () => setShowFullNutrition(true) : undefined}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="h-9 w-9 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                    <Activity size={16} strokeWidth={2.5} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none mb-1">
                      3. Confira os valores nutricionais
                    </span>
                    <span className="text-lg font-black text-slate-900 italic leading-none tracking-tighter">
                      {Math.round(totalNutrition.energyKcal)} <span className="text-[10px] not-italic font-bold text-slate-400">kcal</span>
                    </span>
                  </div>
                </div>

                <div className="flex-1 max-w-28 space-y-1.5">
                  <div className="h-1.5 w-full flex rounded-full overflow-hidden bg-slate-100">
                    <div className="h-full bg-blue-500 transition-all duration-500" style={{ width: `${(totalNutrition.carbs / (totalNutrition.carbs + totalNutrition.proteins + totalNutrition.fatTotal || 1)) * 100}%` }} />
                    <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${(totalNutrition.proteins / (totalNutrition.carbs + totalNutrition.proteins + totalNutrition.fatTotal || 1)) * 100}%` }} />
                    <div className="h-full bg-amber-500 transition-all duration-500" style={{ width: `${(totalNutrition.fatTotal / (totalNutrition.carbs + totalNutrition.proteins + totalNutrition.fatTotal || 1)) * 100}%` }} />
                  </div>
                  <div className="flex justify-between text-[9px] font-black text-slate-500 uppercase tracking-tighter">
                    <span>C: {Math.round(totalNutrition.carbs)}g</span>
                    <span>P: {Math.round(totalNutrition.proteins)}g</span>
                    <span>G: {Math.round(totalNutrition.fatTotal)}g</span>
                  </div>
                </div>

                <button 
                  type="button" 
                  onClick={(e) => { e.stopPropagation(); setShowFullNutrition(!showFullNutrition); }} 
                  className="p-1.5 hover:bg-slate-100 rounded-full transition-colors shrink-0"
                >
                  <ChevronDown className={cn("transition-transform duration-500 text-slate-400", showFullNutrition && "rotate-180 text-emerald-500")} size={18} />
                </button>
              </div>

              <AnimatePresence>
                {showFullNutrition && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-5 pt-5 border-t border-slate-100">
                      <NutritionInfo 
                        data={totalNutrition as unknown as NutritionValues & Record<string, unknown>} 
                        totalWeight={totalNutrition.yieldWeight} 
                      />
                      <div className="mt-3 flex justify-center items-center gap-1.5 text-slate-400">
                        <Info size={10} />
                        <span className="text-[8px] font-bold uppercase tracking-widest">Valores ajustados conforme seleções.</span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* BOTÕES DE COMPRA */}
          <div className="px-4 pb-5">
            <DrawerFooter 
              dishExists={!!dish}
              isComplete={canAddToCart}
              isAdding={isAdding}
              selectedSize={selectedSize as DishSize | null}
              quantity={quantity}
              totalPrice={totalUnitPrice}
              setQuantity={setQuantity}
              onAdd={handleAddToCart}
            />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
