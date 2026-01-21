import React from "react";
import { Trash2, Utensils, LayoutGrid } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PackageSlotsEditorProps {
  slots: any[];
  allDishes: any[];
  allGroups: any[];
  onUpdateName: (index: number, name: string) => void;
  onUpdateDishes: (index: number, dishIds: number[]) => void;
  onUpdateGroups: (index: number, groups: any[]) => void;
  onRemoveSlot: (index: number) => void;
}

export function PackageSlotsEditor({ 
  slots = [], 
  allDishes = [], 
  allGroups = [], 
  onUpdateName,
  onUpdateDishes, 
  onUpdateGroups, 
  onRemoveSlot 
}: PackageSlotsEditorProps) {
    
  return (
    <div className="space-y-6">
      {slots.map((slot: any, sIdx: number) => (
        <div 
          key={sIdx} 
          className="bg-white border-2 border-slate-100 rounded-[2rem] p-6 shadow-sm hover:border-[#D4AF37]/30 transition-all group"
        >
          {/* HEADER DO SLOT */}
          <div className="flex justify-between items-start mb-6">
            <div className="flex-1 max-w-sm">
              <Input 
                value={slot.name} 
                onChange={(e) => onUpdateName(sIdx, e.target.value)}
                placeholder="Nome da Marmita (ex: Marmita Fit 1)"
                className="font-black uppercase tracking-tighter italic border-none text-xl p-0 h-auto focus-visible:ring-0 bg-transparent text-slate-800" 
              />
              <div className="h-0.5 w-12 bg-[#D4AF37] mt-1 transition-all group-hover:w-full" />
            </div>
            
            <Button 
              type="button" 
              variant="ghost" 
              size="icon" 
              onClick={() => onRemoveSlot(sIdx)} 
              className="text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
            >
              <Trash2 size={20} />
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* COLUNA 1: SELEÇÃO DE PRATOS */}
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                <Utensils size={14} className="text-[#2D5A3D]" /> Pratos Permitidos
              </label>
              <div className="grid grid-cols-1 gap-1.5 max-h-56 overflow-y-auto p-3 border border-slate-100 rounded-2xl bg-slate-50/50 custom-scrollbar">
                {allDishes.map((dish: any) => {
                  const isChecked = (slot.dishIds || []).includes(dish.id);
                  return (
                    <label 
                      key={dish.id} 
                      className={cn(
                        "flex items-center gap-3 text-xs font-bold p-2.5 rounded-xl cursor-pointer transition-all border border-transparent",
                        isChecked ? "bg-white border-slate-200 shadow-sm text-slate-900" : "text-slate-500 hover:bg-white/50"
                      )}
                    >
                      <input 
                        type="checkbox" 
                        className="w-4 h-4 rounded border-slate-300 text-[#2D5A3D] focus:ring-[#2D5A3D]"
                        checked={isChecked}
                        onChange={(e) => {
                          const currentIds = slot.dishIds || [];
                          const newIds = e.target.checked 
                            ? [...currentIds, dish.id]
                            : currentIds.filter((id: number) => id !== dish.id);
                          onUpdateDishes(sIdx, newIds);
                        }}
                      />
                      {dish.name}
                    </label>
                  );
                })}
              </div>
            </div>

            {/* COLUNA 2: SELEÇÃO DE CATEGORIAS + LABELS */}
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                <LayoutGrid size={14} className="text-[#D4AF37]" /> Regras de Acompanhamento
              </label>
              <div className="space-y-3 max-h-56 overflow-y-auto p-3 border border-slate-100 rounded-2xl bg-slate-50/50 custom-scrollbar">
                {allGroups.map((group: any) => {
                  const selectedGroup = (slot.groups || []).find((g: any) => g.id === group.id);
                  
                  return (
                    <div 
                      key={group.id} 
                      className={cn(
                        "space-y-2 p-3 rounded-xl border transition-all",
                        selectedGroup ? "bg-white border-slate-200 shadow-sm" : "border-transparent opacity-60"
                      )}
                    >
                      <label className="flex items-center gap-3 text-[11px] font-black uppercase text-slate-700 cursor-pointer">
                        <input 
                          type="checkbox" 
                          className="w-4 h-4 rounded border-slate-300 text-[#D4AF37] focus:ring-[#D4AF37]"
                          checked={!!selectedGroup}
                          onChange={(e) => {
                            const currentGroups = slot.groups || [];
                            const newGroups = e.target.checked
                              ? [...currentGroups, { id: group.id, customLabel: "" }]
                              : currentGroups.filter((g: any) => g.id !== group.id);
                            onUpdateGroups(sIdx, newGroups);
                          }}
                        />
                        {group.name}
                      </label>
                      
                      {selectedGroup && (
                        <div className="pl-7 animate-in fade-in slide-in-from-top-1 duration-200">
                           <Input 
                            placeholder="Título customizado (ex: Escolha seu Carboidrato)" 
                            className="h-8 text-[10px] font-bold uppercase tracking-tight rounded-lg bg-slate-50 border-slate-100 focus:bg-white"
                            value={selectedGroup.customLabel || ""}
                            onChange={(e) => {
                              const newGroups = slot.groups.map((g: any) => 
                                g.id === group.id ? { ...g, customLabel: e.target.value } : g
                              );
                              onUpdateGroups(sIdx, newGroups);
                            }}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        </div>
      ))}
      
      {slots.length === 0 && (
        <div className="py-12 text-center border-2 border-dashed border-slate-200 rounded-[2.5rem] bg-slate-50/50">
          <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">
            Nenhuma marmita configurada. Adicione uma para começar.
          </p>
        </div>
      )}
    </div>
  );
}