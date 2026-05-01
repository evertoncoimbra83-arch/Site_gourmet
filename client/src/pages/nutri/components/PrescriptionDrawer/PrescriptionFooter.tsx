import React from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Save, Info } from "lucide-react";
import type { FullPrescription } from "../../../../../../server/routers/storefront/nutri/types";

interface DailyTotals {
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface PrescriptionFooterProps {
  prescription: FullPrescription;
  setPrescription: React.Dispatch<React.SetStateAction<FullPrescription>>;
  dailyTotals: DailyTotals;
  onSave: () => void;
  onCancel: () => void;
  isPending: boolean;
}

export function PrescriptionFooter({ 
  prescription, 
  setPrescription, 
  dailyTotals, 
  onSave, 
  onCancel, 
  isPending 
}: PrescriptionFooterProps) {
  
  // ✅ GARANTIA NUMÉRICA: Blindagem total contra NaN durante o cálculo do Builder
  const safeKcal = Math.round(dailyTotals?.kcal || 0);
  const safeProtein = Number(dailyTotals?.protein || 0).toFixed(1);
  const safeCarbs = Number(dailyTotals?.carbs || 0).toFixed(1);
  const safeFat = Number(dailyTotals?.fat || 0).toFixed(1);

  // ✅ CÁLCULO DE META: Se a meta for 0, usamos 2000 como referência visual
  const target = Number(prescription.totalKcalTarget) || 2000;
  const kcalPct = Math.min((safeKcal / target) * 100, 100) || 0;

  return (
    <div className="p-6 border-t bg-white flex flex-col gap-4 shrink-0 shadow-[0_-10px_40px_rgba(0,0,0,0.03)] relative z-20">
      
      {/* AVISO DE MÉDIA SEMANAL */}
      <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-lg w-fit border border-slate-100">
        <Info size={12} className="text-slate-400" />
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">
          Valores representam a <span className="text-slate-900">média diária</span> da semana
        </span>
      </div>

      {/* GRID DE MACROS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MacroBar 
          label="Energia (Média)" 
          value={`${safeKcal} kcal`} 
          pct={kcalPct} 
          color="bg-slate-900" 
          bg="bg-slate-100" 
          text="text-slate-500" 
        />
        <MacroBar 
          label="Proteína" 
          value={`${safeProtein}g`} 
          pct={100} 
          color="bg-emerald-500" 
          bg="bg-emerald-50" 
          text="text-emerald-600" 
        />
        <MacroBar 
          label="Carbo" 
          value={`${safeCarbs}g`} 
          pct={100} 
          color="bg-blue-500" 
          bg="bg-blue-50" 
          text="text-blue-600" 
        />
        <MacroBar 
          label="Gordura" 
          value={`${safeFat}g`} 
          pct={100} 
          color="bg-orange-500" 
          bg="bg-orange-50" 
          text="text-orange-600" 
        />
      </div>

      <div className="h-px w-full bg-slate-100 my-1" />

      {/* AÇÕES E META */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-col items-center md:items-start">
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Meta Diária Alvo</span>
          <div className="flex items-center gap-1">
            <input 
              type="number" 
              value={prescription.totalKcalTarget || ""}
              onChange={(e) => {
                // ✅ Bloqueia valores negativos e NaN na meta
                const val = Math.max(0, Number(e.target.value));
                setPrescription((p) => ({ ...p, totalKcalTarget: val }));
              }}
              placeholder="Ex: 2000" 
              className="text-lg font-black italic text-slate-900 border-none p-0 focus:ring-0 w-24 h-6 outline-none bg-transparent"
            />
            <span className="text-slate-300 font-black italic text-sm">kcal</span>
          </div>
        </div>
        
        <div className="flex gap-3 w-full md:w-auto">
          <Button 
            variant="ghost" 
            onClick={onCancel} 
            className="flex-1 md:flex-none h-12 px-6 rounded-xl font-black uppercase text-[10px] text-slate-400 hover:text-slate-600"
          >
            Cancelar
          </Button>
          <Button 
            disabled={isPending || (prescription.meals?.length === 0)} 
            onClick={onSave}
            className="flex-1 md:flex-none h-12 px-8 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase text-[10px] tracking-widest gap-2 shadow-lg shadow-emerald-200 transition-all active:scale-95"
          >
            {isPending ? (
              <Loader2 className="animate-spin" size={16} />
            ) : (
              <Save size={16} strokeWidth={3} />
            )}
            Finalizar Plano Semanal
          </Button>
        </div>
      </div>
    </div>
  );
}

// Subcomponente de barra de macros
interface MacroBarProps {
  label: string;
  value: string;
  pct: number;
  color: string;
  bg: string;
  text: string;
}

function MacroBar({ label, value, pct, color, bg, text }: MacroBarProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className={`flex justify-between text-[9px] font-black uppercase tracking-widest ${text}`}>
        <span>{label}</span>
        <span className="text-slate-900">{value}</span>
      </div>
      <div className={`h-2 w-full ${bg} rounded-full overflow-hidden border border-white shadow-inner`}>
        <div 
          className={`h-full ${color} transition-all duration-700 ease-in-out`} 
          style={{ width: `${pct}%` }} 
        />
      </div>
    </div>
  );
}