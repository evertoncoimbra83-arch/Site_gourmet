import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue, 
  SelectPortal 
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { CategoryIcon } from "@/components/drawer/CategoryIcon";

interface Props {
  groups: any[];
  selections: Record<number, any[]>;
  onToggle: (group: any, optionId: string) => void;
}

export default function AccompanimentSelector({ groups = [], selections = {}, onToggle }: Props) {
  
  const sortedGroups = useMemo(() => {
    if (!groups || !Array.isArray(groups)) return [];

    const getNumericValue = (text: string | null | undefined) => {
      if (!text || typeof text !== 'string') return 0;
      const match = text.match(/(\d+)/);
      return match ? parseInt(match[0], 10) : 0;
    };

    return [...groups]
      .filter(g => !!g)
      .sort((a, b) => {
        const valA = getNumericValue(a.name);
        const valB = getNumericValue(b.name);
        if (valA !== valB) return valA - valB;
        return (a.displayOrder ?? 0) - (b.displayOrder ?? 0);
      })
      .map(group => {
        const safeOptions = Array.isArray(group.options) ? group.options : [];
        const sortedOptions = [...safeOptions]
          .filter(o => !!o)
          .sort((a, b) => {
            const weightA = getNumericValue(a.name);
            const weightB = getNumericValue(b.name);
            if (weightA !== weightB) return weightA - weightB;
            // Ordenação A-Z para as opções
            return (a.name || "").localeCompare(b.name || "", 'pt-BR');
          });
        return { ...group, options: sortedOptions };
      });
  }, [groups]);

  if (sortedGroups.length === 0) return null;

  return (
    <div className="space-y-10">
      {sortedGroups.map((group) => {
        const gId = Number(group.id);
        const currentItems = selections[gId] || [];
        const max = Number(group.maxSelections || 1);
        const isFull = currentItems.length >= max;

        return (
          <div key={`group-pkg-${gId}`} className="space-y-4">
            {/* Header: Nome e Badge de Quantidade */}
            <div className="flex items-center justify-between px-1">
              <Label className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em]">
                {group.name}
              </Label>
              <div className="flex flex-col items-end">
                <Badge className={cn(
                  "text-[9px] font-black rounded-lg border-none shadow-none",
                  isFull 
                    ? "bg-emerald-100 text-emerald-700" 
                    : "bg-amber-100 text-amber-700"
                )}>
                  SELECIONE {max}
                </Badge>
                <span className="text-[8px] font-bold text-slate-400 uppercase mt-1">
                  {currentItems.length} de {max} selecionados
                </span>
              </div>
            </div>

            {/* ✅ Select com Reset Dinâmico e Contraste */}
            <Select 
              key={`${gId}-${currentItems.length}`} // Força reset ao remover item
              onValueChange={(val) => onToggle(group, val)}
              disabled={isFull}
            >
              <SelectTrigger className="w-full h-16 rounded-3xl border-2 border-slate-200 bg-slate-50 px-6 font-bold text-sm uppercase transition-all focus:border-emerald-400 focus:ring-0 shadow-sm text-slate-600">
                <SelectValue placeholder={isFull ? "Limite atingido" : `Escolha os itens...`} />
              </SelectTrigger>
              
              <SelectPortal>
                <SelectContent 
                  position="popper" 
                  sideOffset={8}
                  className="rounded-3xl z-9999 w-[--radix-select-trigger-width] max-h-72 overflow-y-auto bg-white shadow-2xl border border-slate-200 p-2"
                >
                  {group.options?.map((opt: any) => {
                    const isSelected = currentItems.some(i => Number(i.id) === Number(opt.id));
                    return (
                      <SelectItem 
                        key={opt.id} 
                        value={String(opt.id)}
                        disabled={isSelected}
                        className="font-bold uppercase text-[10px] py-4 px-4 cursor-pointer rounded-2xl focus:bg-slate-100 border-b border-slate-50 last:border-none"
                      >
                        <div className="flex justify-between items-center w-full gap-2">
                          <div className="flex items-center gap-3">
                            {/* ✅ Adicionado Ícone da Categoria */}
                            {opt.category && (
                              <div className="shrink-0 p-1.5 rounded-full bg-white border border-slate-200 flex items-center justify-center w-8 h-8">
                                <CategoryIcon 
                                  iconKey={opt.category.iconKey} 
                                  color={opt.category.color}
                                />
                              </div>
                            )}
                            <span className={cn(isSelected ? "text-slate-300" : "text-slate-700")}>
                              {opt.name}
                            </span>
                          </div>
                          
                          {Number(opt.priceModifier) > 0 && (
                            <span className="text-emerald-600 font-black shrink-0 bg-emerald-50 px-2 py-1 rounded-lg text-[10px]">
                              + R$ {Number(opt.priceModifier).toFixed(2)}
                            </span>
                          )}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </SelectPortal>
            </Select>

            {/* Lista de Badges (Itens selecionados) com Ícones */}
            <div className="flex flex-wrap gap-3 pt-1 min-h-5">
              {currentItems.map((item: any) => (
                <Badge 
                  key={item.id} 
                  className="bg-slate-900 text-white px-4 py-2 rounded-full text-[10px] font-black uppercase flex items-center gap-3 animate-in zoom-in-95 hover:bg-slate-800 transition-colors shadow-md"
                >
                  {item.category && (
                    <div className="w-4 h-4 flex items-center justify-center brightness-200">
                       <CategoryIcon iconKey={item.category.iconKey} color={item.category.color} />
                    </div>
                  )}
                  <span className="tracking-wide">{item.name}</span>
                  <button
                    type="button"
                    onClick={() => onToggle(group, String(item.id))}
                    className="hover:text-red-400 p-0.5 transition-colors border-l border-slate-700 pl-2 ml-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}