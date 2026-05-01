// client/src/pages/packages/view/PackageDrawer.tsx

import React, { useState, useMemo, useEffect, useRef } from "react";
import { trpc } from "@/_core/trpc";
import { usePackageViewModel } from "../logic/usePackageViewModel";
import { PackageMealSlot } from "../components/PackageMealSlot";
import { Sheet, SheetContent, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Loader2, X, Terminal, ShoppingBag, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

// --- INTERFACES DE CONTRATO ---
export interface TRPCBaseItem extends Record<string, unknown> {
  id: string | number;
  name: string;
}

export interface TRPCGroupMeta {
  id: string | number;
  name: string;
  minSelections?: number | string;
  maxSelections?: number | string;
}

export interface PackageSlot {
  name?: string;
  label?: string;
  dishes: TRPCBaseItem[];
  accompanimentGroups?: Array<Record<string, unknown>>; 
  allowedGroups?: Array<Record<string, unknown>>;
}

interface PackageDrawerProps {
  packageId: string | null;
  onClose: () => void;
}

interface PackageDetails extends Record<string, unknown> {
  id: string | number;
  name: string;
  options: PackageSlot[];
  allowedAccompaniments: TRPCBaseItem[];
  accompanimentGroups: TRPCGroupMeta[];
  imageUrl?: string;
  salePrice?: number;
  price?: number;
  size?: {
    proteinWeight?: number;
    defaultMainWeight?: number;
  };
}

export default function PackageDrawer({ packageId, onClose }: PackageDrawerProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [showDebug, setShowDebug] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  const money = (v: number) => new Intl.NumberFormat('pt-BR', { 
    style: 'currency', 
    currency: 'BRL' 
  }).format(v);

  const { data: pkgRaw, isLoading } = trpc.packages.getById.useQuery(
    { id: packageId as string },
    { enabled: !!packageId, staleTime: Infinity }
  );

  const pkg = pkgRaw as unknown as PackageDetails | undefined;

  const packageData = useMemo(() => ({
    id: String(pkg?.id || ""),
    name: String(pkg?.name || ""),
    capacity: Array.isArray(pkg?.options) ? pkg.options.length : 0,
    image: String(pkg?.imageUrl || ""),
    price: Number(pkg?.salePrice || pkg?.price || 0)
  }), [pkg]);

  const { items, progress, canSubmit, actions } = usePackageViewModel(packageData);
  
  const sizeWeight = Number(pkg?.size?.proteinWeight || pkg?.size?.defaultMainWeight || 300);

  useEffect(() => {
    if (scrollContainerRef.current) {
      const activeItem = scrollContainerRef.current.querySelector(`[data-index="${currentStep}"]`);
      if (activeItem) {
        activeItem.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    }
  }, [currentStep]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-white/50 backdrop-blur-sm z-50">
        <Loader2 className="animate-spin text-emerald-600 h-10 w-10" />
      </div>
    );
  }

  if (!pkg) return null;

  const options = pkg.options || [];
  const completedCount = items.filter(it => it.dishId).length;

  return (
    <Sheet open={!!packageId} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-xl p-0 flex flex-col h-full bg-[#F8FAFC] border-none shadow-2xl overflow-hidden text-slate-900">
        <SheetTitle className="sr-only">Configurar {pkg.name}</SheetTitle>
        <SheetDescription className="sr-only">Personalize seu combo fit</SheetDescription>
        
        {/* HEADER PREMIUM (Sticky) */}
        <div className="sticky top-0 z-50 bg-slate-950 text-white p-6 shadow-2xl shrink-0">
          <button onClick={onClose} className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors">
            <X size={24} />
          </button>
          
          <button onClick={() => setShowDebug(!showDebug)} className="absolute top-4 left-4 text-slate-800 hover:text-emerald-500 transition-colors">
            <Terminal size={16} />
          </button>

          <div className="flex justify-between items-start mb-6 mt-4">
            <div>
              <h2 className="text-2xl font-black uppercase italic tracking-tighter leading-none">
                {pkg.name}
              </h2>
              <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest mt-1">
                Monte seu combo gourmet
              </p>
            </div>
            <div className="text-right">
              <span className="text-xl font-black italic text-emerald-400">{money(packageData.price)}</span>
              <div className="flex gap-1 mt-2 justify-end">
                {options.map((_, i) => (
                  <div key={i} className={cn(
                    "h-1 rounded-full transition-all duration-500",
                    items[i]?.dishId ? "w-4 bg-emerald-500" : "w-2 bg-slate-800"
                  )} />
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                className="h-full bg-linear-to-r from-emerald-600 to-emerald-400" 
                transition={{ duration: 0.8, ease: "circOut" }}
              />
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[9px] font-black uppercase text-slate-500 tracking-tighter">
                {completedCount} de {packageData.capacity} refeições prontas
              </span>
              {progress === 100 && (
                <span className="text-[9px] font-black uppercase text-emerald-500 animate-pulse">
                  Combo pronto para adicionar!
                </span>
              )}
            </div>
          </div>
        </div>

        {/* PAINEL DE DEBUG (Opcional) */}
        <AnimatePresence>
          {showDebug && (
            <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="bg-slate-900 border-b border-emerald-900/30 overflow-hidden font-mono text-[10px] text-emerald-400 p-4">
               <p>Step: {currentStep} | CanSubmit: {canSubmit ? "YES" : "NO"}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* BODY (Scrollable) */}
        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto px-4 py-8 space-y-6 no-scrollbar scroll-smooth">
          <AnimatePresence mode="popLayout">
            {options.map((slot, index) => (
              <div key={`${packageId}-slot-${index}`} data-index={index}>
                <PackageMealSlot
                  index={index}
                  slot={slot}
                  pkg={pkg} 
                  currentState={items[index]}
                  isExpanded={currentStep === index}
                  isLocked={index > 0 && !items[index - 1]?.dishId}
                  onExpand={() => setCurrentStep(index)}
                  onNext={() => setCurrentStep(index + 1)}
                  isLast={index === options.length - 1} 
                  actions={actions}
                  sizeWeight={sizeWeight}
                />
              </div>
            ))}
          </AnimatePresence>
        </div>

        {/* FOOTER FIXO PREMIUM */}
        <div className="sticky bottom-0 bg-white border-t border-slate-200 p-6 shadow-[0_-20px_40px_rgba(0,0,0,0.05)] shrink-0 z-50">
          <AnimatePresence mode="wait">
            {!canSubmit && completedCount > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="flex items-center gap-2 mb-4 justify-center text-amber-600"
              >
                <AlertCircle size={14} />
                <span className="text-[10px] font-black uppercase italic tracking-tight">
                  Finalize os acompanhamentos das refeições
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          <Button 
            disabled={!canSubmit || isSubmitting} 
            onClick={async () => { 
              setIsSubmitting(true);
              try {
                await actions.handleAddToCart(); 
                onClose(); 
              } finally {
                setIsSubmitting(false);
              }
            }}
            className={cn(
              "w-full h-16 font-black uppercase rounded-3xl tracking-[0.15em] transition-all duration-500 text-sm", 
              canSubmit 
                ? "bg-slate-900 text-white shadow-2xl shadow-slate-200 hover:bg-emerald-600 hover:scale-[1.02] active:scale-95" 
                : "bg-slate-100 text-slate-300 cursor-not-allowed"
            )}
          >
            {isSubmitting ? (
              <Loader2 className="animate-spin" />
            ) : (
              <div className="flex items-center gap-3">
                <ShoppingBag size={18} />
                <span>Adicionar ao Carrinho</span>
              </div>
            )}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}