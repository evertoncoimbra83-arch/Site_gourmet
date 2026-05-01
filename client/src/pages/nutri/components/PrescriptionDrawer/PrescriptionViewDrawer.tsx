import React from "react";
import { 
  X, ChefHat, Star, Activity, 
  Pencil, Trash2, Info, Edit3 
} from "lucide-react";
import { 
  Sheet, SheetContent, SheetTitle, SheetClose 
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { FullPrescription, PrescriptionMeal, PrescriptionOption } from "../../../../../../server/routers/storefront/nutri/types";

// ✅ Interface para resolver o erro de 'never' no nutritionalData
interface NutritionalDataSnapshot {
  baseMacros?: {
    kcal: number;
    protein?: number;
    carbs?: number;
    fat?: number;
  };
}

interface PrescriptionViewDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  data: {
    client: { name: string; email: string };
    prescription: FullPrescription & { id?: string }; 
  } | null;
  onEditInBuilder: () => void;
  onDelete?: (id: string) => void;
}

export default function PrescriptionViewDrawer({ 
  isOpen, 
  onClose, 
  data, 
  onEditInBuilder,
  onDelete
}: PrescriptionViewDrawerProps) {
  if (!data) return null;

  const { prescription, client } = data;

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-md p-0 border-l-0 bg-slate-50">
        <div className="flex flex-col h-full">
          
          {/* HEADER */}
          <header className="p-6 bg-white border-b border-slate-100 shrink-0">
            <div className="flex justify-between items-start mb-4">
              <div 
                className="space-y-1 flex-1 cursor-pointer group/title" 
                onClick={onEditInBuilder}
                title="Clique para editar este plano"
              >
                <div className="flex items-center gap-2 text-emerald-600">
                  <Activity size={14} strokeWidth={3} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Prescrição Ativa</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <SheetTitle className="text-2xl font-black uppercase italic leading-none group-hover/title:text-emerald-600 transition-colors">
                    {prescription.planName || "Plano Alimentar"}
                  </SheetTitle>
                  <Edit3 
                    size={18} 
                    className="text-slate-300 group-hover/title:text-emerald-500 group-hover/title:scale-110 transition-all" 
                  />
                </div>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter opacity-0 group-hover/title:opacity-100 transition-opacity">
                  Clique no título para abrir o editor
                </p>
              </div>

              <SheetClose className="p-2 hover:bg-slate-100 rounded-xl transition-colors ml-2">
                <X size={20} className="text-slate-400" />
              </SheetClose>
            </div>

            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center shadow-sm text-slate-400">
                <ChefHat size={20} />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase text-slate-400 leading-none">Paciente</span>
                <span className="text-sm font-bold text-slate-700">{client.name}</span>
              </div>
            </div>
          </header>

          {/* LISTAGEM DAS REFEIÇÕES */}
          <ScrollArea className="flex-1 px-6 py-8">
            <div className="space-y-8 pb-10">
              {(prescription.meals || []).map((meal: PrescriptionMeal, mIdx: number) => (
                <section key={meal.id || String(mIdx)} className="space-y-4 text-left">
                  <div className="flex items-center gap-3">
                    <span className="h-6 w-6 rounded-lg bg-slate-900 text-white flex items-center justify-center text-[10px] font-black italic">
                      {mIdx + 1}
                    </span>
                    <h3 className="font-black uppercase text-sm tracking-tight text-slate-800">
                      {meal.name}
                    </h3>
                  </div>

                  <div className="space-y-3">
                    {(meal.groups || []).map((group) => (
                      <div key={group.id} className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm">
                        <header className="flex justify-between items-center mb-4">
                          <span className="text-[10px] font-black uppercase text-emerald-600 tracking-widest">
                            {group.name}
                          </span>
                        </header>

                        <div className="space-y-2">
                          {(group.options || []).map((opt: PrescriptionOption) => {
                            const nutri = opt.nutritionalData as unknown as NutritionalDataSnapshot;
                            
                            return (
                              <div 
                                key={opt.id} 
                                className={cn(
                                  "flex justify-between items-center p-3 rounded-2xl border transition-all",
                                  opt.isDefault ? "border-emerald-100 bg-emerald-50/30" : "border-transparent text-slate-500"
                                )}
                              >
                                <div className="flex items-center gap-2">
                                  {opt.isDefault && <Star size={12} className="fill-yellow-400 text-yellow-400" />}
                                  <span className="text-xs font-bold uppercase">{opt.name}</span>
                                  <span className="text-[10px] font-mono opacity-60">{opt.multiplier}x</span>
                                </div>
                                
                                <span className="text-[10px] font-black text-slate-400">
                                  {nutri?.baseMacros?.kcal || 0} kcal
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>

                  {meal.notes && (
                    <div className="flex gap-2 p-3 bg-amber-50/50 rounded-2xl border border-amber-100/50 text-amber-700">
                      {/* ✅ Corrigido: 'Info' com I maiúsculo */}
                      <Info size={14} className="shrink-0 mt-0.5" />
                      <p className="text-[10px] font-medium leading-relaxed">{meal.notes}</p>
                    </div>
                  )}
                </section>
              ))}
            </div>
          </ScrollArea>

          {/* FOOTER */}
          <footer className="p-6 bg-white border-t border-slate-100 space-y-3 shrink-0">
            <div className="flex justify-between items-center px-2 mb-2">
              <span className="text-[10px] font-black uppercase text-slate-400">Total Diário Estimado</span>
              <span className="text-lg font-black text-slate-900">{prescription.totalKcalTarget || 0} kcal</span>
            </div>
            
            <div className="flex gap-3">
              <Button 
                onClick={onEditInBuilder}
                className="flex-1 h-14 rounded-2xl bg-slate-900 hover:bg-emerald-600 text-white font-black uppercase text-[11px] tracking-widest gap-2 transition-all shadow-lg shadow-slate-200"
              >
                {/* ✅ Corrigido: 'Pencil' com P maiúsculo */}
                <Pencil size={16} /> Abrir no Editor
              </Button>
              <Button 
                variant="outline"
                onClick={() => {
                  if (onDelete && prescription.id) {
                    onDelete(prescription.id);
                  }
                }}
                className="h-14 w-14 rounded-2xl border-slate-200 text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all"
              >
                {/* ✅ Corrigido: 'Trash2' com T maiúsculo */}
                <Trash2 size={20} />
              </Button>
            </div>
          </footer>
        </div>
      </SheetContent>
    </Sheet>
  );
}