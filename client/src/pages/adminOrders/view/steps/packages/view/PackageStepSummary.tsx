import { cn } from "@/lib/utils";
import { Check, Utensils } from "lucide-react";
import { motion } from "framer-motion";

interface Step {
  dishId?: string | number;
  dishName?: string;
  selectedAccompaniments: any[];
}

interface PackageStepSummaryProps {
  steps: Step[];
  currentStep: number;
  onStepClick: (index: number) => void;
}

export default function PackageStepSummary({ steps, currentStep, onStepClick }: PackageStepSummaryProps) {
  return (
    <div className="w-full bg-white border-b border-slate-100/80 sticky top-0 z-20">
      {/* Scroll horizontal com padding lateral para não colar na borda */}
      <div className="flex gap-4 px-6 py-4 overflow-x-auto no-scrollbar items-center">
        {steps.map((step, idx) => {
          const isCompleted = !!step.dishId;
          const isActive = currentStep === idx;

          return (
            <button
              key={idx}
              onClick={() => onStepClick(idx)}
              className={cn(
                "flex-shrink-0 flex items-center transition-all duration-300 gap-2 px-3 py-2 rounded-2xl border",
                isActive 
                  ? "bg-slate-950 border-slate-950 shadow-lg ring-4 ring-slate-950/5" 
                  : isCompleted 
                    ? "bg-emerald-50 border-emerald-100" 
                    : "bg-slate-50 border-transparent opacity-60"
              )}
            >
              {/* Indicador Visual Menor */}
              <div className={cn(
                "w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-colors",
                isActive 
                  ? "bg-emerald-500" 
                  : isCompleted 
                    ? "bg-emerald-500" 
                    : "bg-slate-200"
              )}>
                {isCompleted ? (
                  <Check size={12} className="text-white" strokeWidth={4} />
                ) : (
                  <span className={cn(
                    "text-[10px] font-black",
                    isActive ? "text-white" : "text-slate-500"
                  )}>
                    {idx + 1}
                  </span>
                )}
              </div>

              {/* Nome do Prato (Aparece apenas se for o ATIVO ou se já estiver COMPLETO) */}
              <div className="flex flex-col items-start overflow-hidden max-w-[100px]">
                <span className={cn(
                  "text-[8px] font-black uppercase tracking-tighter leading-none whitespace-nowrap",
                  isActive ? "text-emerald-400" : "text-slate-400"
                )}>
                  {idx + 1}º Prato
                </span>
                
                {(isActive || isCompleted) && (
                  <span className={cn(
                    "text-[9px] font-bold truncate w-full mt-0.5",
                    isActive ? "text-white italic" : "text-slate-600"
                  )}>
                    {step.dishName || "Escolhendo..."}
                  </span>
                )}
              </div>

              {/* Barra de progresso interna (Apenas para o ativo) */}
              {isActive && (
                <motion.div 
                  layoutId="active-pill"
                  className="absolute inset-0 border-2 border-emerald-500 rounded-2xl pointer-events-none"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}