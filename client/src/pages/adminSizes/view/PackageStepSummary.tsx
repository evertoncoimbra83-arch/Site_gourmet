import React from "react";
import { cn } from "@/lib/utils";
import { Check, Utensils, ChevronRight } from "lucide-react";

// --- INTERFACES ---

interface AccompanimentSelection {
  id: number | string;
  name: string;
  [key: string]: unknown;
}

interface Step {
  dishId?: string | number;
  dishName?: string;
  selectedAccompaniments: AccompanimentSelection[];
}

interface PackageStepSummaryProps {
  steps: Step[];
  currentStep: number;
  onStepClick: (index: number) => void;
}

export default function PackageStepSummary({ steps, currentStep, onStepClick }: PackageStepSummaryProps) {
  return (
    <div className="flex gap-3 px-8 pb-6 overflow-x-auto no-scrollbar border-b border-slate-50 bg-white/50 backdrop-blur-sm sticky top-0 z-20">
      {steps.map((step, idx) => {
        const isCompleted = !!step.dishId;
        const isActive = currentStep === idx;

        return (
          <button
            key={idx}
            type="button"
            onClick={() => onStepClick(idx)}
            className={cn(
              "flex-shrink-0 relative group transition-all duration-300",
              "w-16 flex flex-col items-center gap-1.5"
            )}
          >
            {/* Círculo do Ícone */}
            <div className={cn(
              "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 border-2",
              isActive 
                ? "bg-slate-950 border-slate-950 shadow-lg shadow-slate-200 scale-110" 
                : isCompleted 
                  ? "bg-white border-emerald-500 shadow-sm" 
                  : "bg-slate-50 border-slate-100 opacity-60"
            )}>
              {isCompleted ? (
                <Check size={16} className={cn(isActive ? "text-emerald-400" : "text-emerald-500")} />
              ) : (
                <Utensils size={16} className={cn(isActive ? "text-white" : "text-slate-300")} />
              )}
            </div>

            {/* Label da Etapa */}
            <div className="flex flex-col items-center">
              <span className={cn(
                "text-[8px] font-black uppercase tracking-tighter",
                isActive ? "text-slate-950" : "text-slate-400"
              )}>
                Item {idx + 1}
              </span>
              {step.dishName && (
                <span className="text-[7px] font-bold text-slate-500 truncate max-w-[60px] leading-tight">
                  {step.dishName.split(' ')[0]}...
                </span>
              )}
            </div>

            {/* Indicador de progresso entre itens */}
            {idx < steps.length - 1 && (
              <div className="absolute -right-2 top-5 text-slate-200">
                <ChevronRight size={12} />
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}