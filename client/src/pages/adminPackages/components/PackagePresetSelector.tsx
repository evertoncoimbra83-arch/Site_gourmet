// client/src/pages/adminPackages/components/PackagePresetSelector.tsx

import React from "react";
import { PackagePreset, PACKAGE_PRESETS } from "../logic/constants/package-presets";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ChevronRight, Wand2, Flame, LayoutGrid, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (preset: PackagePreset) => void;
}

export function PackagePresetSelector({ open, onOpenChange, onSelect }: Props) {
  
  // Mapeamento de ícones por categoria para um visual mais intuitivo
  const getIcon = (category: string) => {
    switch (category) {
      case "Inteligência BI": return <Flame size={18} className="text-orange-500" />;
      case "Padrão": return <LayoutGrid size={18} className="text-blue-500" />;
      default: return <Zap size={18} className="text-purple-500" />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-125 p-0 overflow-hidden border-none shadow-2xl bg-white">
        
        {/* Header Visual */}
        <DialogHeader className="p-8 bg-slate-50 border-b border-slate-100 text-left">
          <div className="flex items-center gap-2 text-slate-400 mb-2">
            <Wand2 size={16} />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Configuração Rápida</span>
          </div>
          <DialogTitle className="text-2xl font-bold text-slate-900 tracking-tight">
            Escolha um Modelo
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500 font-medium">
            Selecione uma estrutura base para carregar automaticamente nomes, quantidades e pratos sugeridos.
          </DialogDescription>
        </DialogHeader>

        {/* Lista de Presets */}
        <div className="p-6 space-y-3">
          {PACKAGE_PRESETS.map((preset) => (
            <button
              key={preset.id}
              onClick={() => {
                onSelect(preset);
                onOpenChange(false);
              }}
              className={cn(
                "w-full group flex items-center justify-between p-4 rounded-2xl border transition-all text-left",
                "border-slate-100 hover:border-slate-300 hover:bg-slate-50/50 hover:shadow-sm"
              )}
            >
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-white border border-slate-100 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                  {getIcon(preset.category)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-sm text-slate-800">{preset.name}</h4>
                    {preset.type === "dynamic" && (
                      <span className="bg-orange-100 text-orange-600 text-[8px] px-1.5 py-0.5 rounded-full font-black uppercase">Data-Driven</span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 font-medium leading-tight mt-0.5">
                    {preset.description}
                  </p>
                </div>
              </div>
              
              <div className="h-8 w-8 rounded-full flex items-center justify-center group-hover:bg-white transition-colors">
                <ChevronRight size={16} className="text-slate-300 group-hover:text-slate-900" />
              </div>
            </button>
          ))}
        </div>

        {/* Footer Informativo */}
        <div className="px-8 py-4 bg-slate-50/50 border-t border-slate-100">
           <p className="text-[9px] text-slate-400 font-medium text-center uppercase tracking-widest">
             Você poderá editar todos os detalhes após aplicar o modelo.
           </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}