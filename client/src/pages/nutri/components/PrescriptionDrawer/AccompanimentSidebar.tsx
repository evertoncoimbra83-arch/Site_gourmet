import React, { useState } from "react";
import { Search, X, Loader2, Plus, CheckCircle2, ChevronRight, ChevronLeft } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { FullPrescription } from "../../../../../../server/routers/storefront/nutri/types";
// Importação da interface de acompanhamento definida no componente de card
import type { Accompaniment } from "./PrescriptionMealCard";

interface AccompanimentSidebarProps {
  isPickingAccFor: { mealId: string; groupId: string; optionId: string } | null;
  onClose: () => void;
  accompaniments: Accompaniment[] | undefined;
  loading: boolean;
  onAdd: (acc: Accompaniment) => void;
  prescription: FullPrescription;
}

export function AccompanimentSidebar({ 
  isPickingAccFor, 
  onClose, 
  accompaniments, 
  loading, 
  onAdd, 
  prescription 
}: AccompanimentSidebarProps) {
  const [searchTerm, setSearchTerm] = useState("");

  if (!isPickingAccFor) return null;

  // Localização segura do prato atual dentro da estrutura da prescrição
  const currentOption = prescription?.meals
    ?.find((m) => m.id === isPickingAccFor.mealId)
    ?.groups?.find((g) => g.id === isPickingAccFor.groupId)
    ?.options?.find((o) => o.id === isPickingAccFor.optionId);

  const filteredAccs = accompaniments?.filter((acc) => 
    acc.name.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <div className="w-full md:w-100 bg-white border-l border-slate-200 flex flex-col z-20 animate-in slide-in-from-right-10 duration-300 shrink-0 shadow-2xl h-full overflow-hidden">
      
      {/* HEADER MOBILE */}
      <div className="md:hidden p-4 border-b flex items-center gap-3 bg-slate-50 shrink-0">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onClose}
          className="rounded-full h-10 w-10 p-0"
        >
          <ChevronLeft size={20} />
        </Button>
        <span className="text-[10px] font-black uppercase tracking-widest">Voltar para Edição</span>
      </div>

      {/* HEADER DA SIDEBAR */}
      <div className="p-6 border-b bg-emerald-900 text-white flex justify-between items-center shrink-0">
        <div className="text-left min-w-0">
          <div className="flex items-center gap-2 text-emerald-400 mb-1">
            <span className="text-[8px] font-black uppercase tracking-[0.2em]">Configurador de Combos</span>
          </div>
          <h3 className="font-black uppercase italic text-sm leading-none truncate">
            {currentOption?.name || "Configurar Item"}
          </h3>
          <p className="text-[9px] font-bold text-emerald-300/60 uppercase mt-1 truncate">
            Substituições permitidas para este prato
          </p>
        </div>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={onClose} 
          className="hidden md:flex text-white hover:bg-white/10 rounded-full shrink-0"
        >
          <X size={20} />
        </Button>
      </div>

      {/* BARRA DE PESQUISA */}
      <div className="p-4 border-b bg-white shrink-0">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <Input 
            placeholder="PROCURAR ITEM..." 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-11 h-12 rounded-2xl text-[10px] font-black uppercase bg-slate-50 border-none focus-visible:ring-emerald-500 transition-all"
          />
        </div>
      </div>

      {/* LISTA DE ACOMPANHAMENTOS */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-slate-50/50 custom-scrollbar text-left">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
            <Loader2 className="animate-spin text-emerald-600" />
            <span className="text-[10px] font-black uppercase tracking-widest italic">Buscando itens...</span>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredAccs.map((acc) => {
              // ✅ CORREÇÃO: Cast para Accompaniment[] evita o erro de 'never' e 'any'
              const isAlreadyLinked = (currentOption?.allowedAccompaniments as Accompaniment[] | undefined)?.some(
                (a) => String(a.id) === String(acc.id)
              );

              return (
                <div 
                  key={acc.id} 
                  onClick={() => onAdd(acc)}
                  className={cn(
                    "group p-4 rounded-2xl border shadow-sm transition-all flex items-center justify-between cursor-pointer active:scale-[0.98] min-w-0",
                    isAlreadyLinked 
                      ? "bg-emerald-50 border-emerald-200 ring-2 ring-emerald-500/5" 
                      : "bg-white border-slate-100 hover:border-emerald-500 hover:shadow-md"
                  )}
                >
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <p className={cn(
                      "text-[10px] font-black uppercase leading-tight tracking-tight truncate",
                      isAlreadyLinked ? "text-emerald-900" : "text-slate-800"
                    )}>
                      {acc.name}
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-bold text-emerald-600 uppercase whitespace-nowrap">
                        {Number(acc.energyKcal || 0)} kcal
                      </span>
                      <span className="h-1 w-1 rounded-full bg-slate-300" />
                      <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter truncate">
                        P: {Number(acc.proteins || 0)}g | C: {Number(acc.carbs || 0)}g
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 ml-4">
                    {isAlreadyLinked ? (
                      <div className="h-8 w-8 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-200 animate-in zoom-in duration-200">
                        <CheckCircle2 size={16} strokeWidth={3} />
                      </div>
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-slate-50 text-slate-300 flex items-center justify-center group-hover:bg-emerald-100 group-hover:text-emerald-600 transition-colors border border-slate-100">
                        <Plus size={16} strokeWidth={3} />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {filteredAccs.length === 0 && (
              <div className="py-20 text-center opacity-30 flex flex-col items-center gap-4">
                <Search size={40} />
                <p className="text-[10px] font-black uppercase tracking-widest">Nenhum item encontrado</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* FOOTER */}
      <div className="p-4 bg-white border-t border-slate-100 shrink-0">
        <div className="flex items-center gap-2 text-slate-400">
          <ChevronRight size={14} className="text-emerald-500 shrink-0" />
          <span className="text-[8px] font-black uppercase tracking-widest leading-tight">
            Os itens marcados serão opções de troca no app do paciente.
          </span>
        </div>
      </div>
    </div>
  );
}