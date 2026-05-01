import React from "react";
import { Loader2, BookOpen, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

// ✅ Interface revisada: trocado 'any' por 'unknown' para propriedades dinâmicas
// e garantido que campos opcionais estejam bem definidos.
interface TemplateItem {
  id: string;
  name: string;
  totalKcalTarget?: number | null;
  meals?: unknown[];
  nutritionalInfo?: {
    totalKcalTarget?: number;
  };
  [key: string]: unknown; 
}

interface TemplateLibraryTabProps {
  templates: TemplateItem[] | undefined;
  isLoading: boolean;
  onApply: (template: TemplateItem) => void;
}

export function TemplateLibraryTab({ templates, isLoading, onApply }: TemplateLibraryTabProps) {
  if (isLoading) {
    return (
      <div className="py-20 flex justify-center">
        <Loader2 className="animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-left mb-6">
        <h3 className="font-black uppercase italic text-slate-800 text-lg">Sua Biblioteca</h3>
        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-relaxed">
          Para substituir a dieta atual do paciente por um modelo salvo, clique no botão abaixo.
        </p>
      </div>
      
      <div className="grid gap-4">
        {templates?.map((t) => (
          <div 
            key={t.id} 
            className="p-5 rounded-3xl bg-white border border-slate-100 hover:border-emerald-500 hover:shadow-lg transition-all text-left flex flex-col gap-4 group"
          >
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:text-emerald-500 transition-colors shrink-0">
                <BookOpen size={18} />
              </div>
              <div className="min-w-0 flex-1">
                <span className="block font-black uppercase italic text-slate-800 group-hover:text-emerald-700 truncate">
                  {t.name}
                </span>
                <span className="text-[9px] font-bold text-slate-400 uppercase">
                  {/* ✅ Fallback seguro para o cálculo de calorias e refeições */}
                  {(t.totalKcalTarget ?? t.nutritionalInfo?.totalKcalTarget ?? 0)} kcal • {t.meals?.length ?? 0} refeições
                </span>
              </div>
            </div>
            
            <Button 
              onClick={() => onApply(t)}
              className="w-full bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white rounded-xl h-10 font-black uppercase text-[10px] tracking-widest gap-2 transition-all active:scale-95 shadow-none"
            >
              <RefreshCw size={14} strokeWidth={3} />
              Substituir / Atualizar Dieta
            </Button>
          </div>
        ))}

        {/* ✅ Estado vazio tratado explicitamente */}
        {(!templates || templates.length === 0) && (
          <div className="py-16 text-center border-2 border-dashed border-slate-100 rounded-4xl bg-slate-50/50">
            <BookOpen className="mx-auto text-slate-200 mb-2" size={32} />
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Nenhum modelo encontrado</p>
          </div>
        )}
      </div>
    </div>
  );
}