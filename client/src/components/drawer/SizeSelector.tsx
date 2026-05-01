import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { Check, Info } from "lucide-react"; 
import { Label } from "@/components/ui/label";
import { Cube, Package, GridFour } from "@phosphor-icons/react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export function SizeSelector({ sizes, selectedId, onSelect }: any) {
  if (!sizes?.length) return null;

  // ✅ ORDENAÇÃO POR DISPLAY_ORDER
  // Isso garante que a ordem definida no Drag and Drop do Admin seja respeitada aqui.
  const sortedSizes = useMemo(() => {
    return [...sizes].sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
  }, [sizes]);

  const renderSizeIcon = (iconKey: string, isSelected: boolean) => {
    const iconProps = {
      size: 24,
      weight: isSelected ? "fill" as const : "bold" as const,
      className: isSelected ? "text-white" : "text-slate-400"
    };

    switch (iconKey) {
      case "GridFour": return <GridFour {...iconProps} />;
      case "Package": return <Package {...iconProps} />;
      case "Cube":
      default: return <Cube {...iconProps} />;
    }
  };

  return (
    <div className="space-y-4">
      <Label className="text-[9px] font-black uppercase text-slate-400 tracking-[0.2em]">
        1. Escolha o Tamanho
      </Label>

      <div className="grid gap-2">
        {sortedSizes.map((size: any) => { // ✅ Mapeando a lista ordenada
          const isSelected = selectedId === size.id;

          return (
            <div key={size.id} className="relative group">
              <button
                onClick={() => onSelect(size)}
                className={cn(
                  "w-full flex items-center justify-between p-5 rounded-[1.8rem] border-2 transition-all",
                  isSelected
                    ? "border-slate-900 bg-slate-900 text-white shadow-lg"
                    : "border-slate-100 bg-white hover:border-emerald-200"
                )}
              >
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "flex items-center justify-center w-10 h-10 rounded-2xl",
                    isSelected ? "bg-white/10" : "bg-slate-50"
                  )}>
                    {renderSizeIcon(size.iconKey, isSelected)}
                  </div>

                  <div className="flex flex-col items-start">
                    <span className="font-black text-[11px] uppercase italic">
                      {size.name}
                    </span>
                    {size.weight && (
                      <span className={cn(
                        "text-[9px] font-bold",
                        isSelected ? "text-slate-400" : "text-slate-500"
                      )}>
                        {size.weight}g
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {size.description && (
                    <Popover>
                      <PopoverTrigger asChild>
                        <button 
                          onClick={(e) => e.stopPropagation()} 
                          className={cn(
                            "p-2 rounded-full transition-colors",
                            isSelected ? "hover:bg-white/10 text-white" : "hover:bg-slate-100 text-slate-300"
                          )}
                        >
                          <Info size={16} />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent 
                        side="top" 
                        className="w-[280px] rounded-2xl p-4 shadow-2xl border-slate-100 bg-white"
                      >
                        <div className="space-y-2">
                          <p className="text-[10px] font-black uppercase text-emerald-600 tracking-widest">
                            Informações do Prato
                          </p>
                          <p className="text-xs font-medium text-slate-600 leading-relaxed">
                            {size.description}
                          </p>
                        </div>
                      </PopoverContent>
                    </Popover>
                  )}

                  {isSelected && (
                    <Check size={16} className="text-emerald-500" strokeWidth={4} />
                  )}
                </div>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}