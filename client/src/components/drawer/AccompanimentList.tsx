import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue, 
  SelectPortal 
} from "@/components/ui/select";
import { X } from "lucide-react";
import { CategoryIcon } from "@/components/drawer/CategoryIcon";
import { cn } from "@/lib/utils";

export function AccompanimentList({ groups, selectedAccs, onAdd, onRemove }: any) {
  if (!groups?.length) return null;

  // ✅ Ordenação Alfabética A-Z
  const sortAZ = (a: any, b: any) => 
    (a.name || "").localeCompare(b.name || "", 'pt-BR');

  return (
    <div className="space-y-10">
      {groups.map((group: any) => {
        const currentGroupSelections = selectedAccs.filter(
          (a: any) => Number(a.groupId) === Number(group.id)
        );
        const isFull = currentGroupSelections.length >= Number(group.maxSelections || 1);

        return (
          <div key={group.id} className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <Label className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em]">
                {group.name}
              </Label>
              <div className="flex flex-col items-end">
                <Badge className={cn(
                  "text-[9px] font-black rounded-lg border-none",
                  isFull ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                )}>
                  SELECIONE {group.maxSelections}
                </Badge>
                <span className="text-[8px] font-bold text-slate-400 uppercase mt-1">
                  {currentGroupSelections.length} de {group.maxSelections}
                </span>
              </div>
            </div>

            {/* ✅ KEY DINÂMICA: Força o Select a resetar o visual quando um item é removido */}
            <Select 
              key={`${group.id}-${currentGroupSelections.length}`} 
              onValueChange={(val) => onAdd(group, val)}
              disabled={isFull}
            >
              <SelectTrigger className="w-full h-16 rounded-3xl border-2 border-slate-200 bg-slate-50 px-6 font-bold text-sm uppercase transition-all focus:border-emerald-400 focus:ring-0 shadow-sm text-slate-600">
                <SelectValue placeholder={isFull ? "Limite atingido" : `Escolha os itens...`} />
              </SelectTrigger>
              
              <SelectPortal>
                <SelectContent 
                  position="popper" 
                  sideOffset={8}
                  className="rounded-3xl z-9999 w-[--radix-select-trigger-width] max-h-80 overflow-y-auto bg-white shadow-2xl border border-slate-200 p-2"
                >
                  {[...(group.options || [])].sort(sortAZ).map((opt: any) => {
                    const isAlreadySelected = selectedAccs.some(
                      (s: any) => Number(s.id) === Number(opt.id) && Number(s.groupId) === Number(group.id)
                    );

                    return (
                      <SelectItem 
                        key={opt.id} 
                        value={String(opt.id)} 
                        disabled={isAlreadySelected}
                        className="font-bold uppercase text-[11px] py-4 px-4 cursor-pointer rounded-2xl focus:bg-slate-100 border-b border-slate-50 last:border-none"
                      >
                        <div className="flex justify-between items-center w-full gap-3">
                          <div className="flex items-center gap-3">
                            {opt.category && (
                              <div className="shrink-0 p-1.5 rounded-full bg-white border border-slate-200 flex items-center justify-center w-8 h-8">
                                <CategoryIcon 
                                  iconKey={opt.category.iconKey} 
                                  color={opt.category.color}
                                />
                              </div>
                            )}
                            <span className={cn(isAlreadySelected ? "text-slate-300" : "text-slate-700")}>
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

            <div className="flex flex-wrap gap-3 pt-1">
              {currentGroupSelections.sort(sortAZ).map((a: any) => (
                <Badge 
                  key={`${a.id}-${a.groupId}`} 
                  className="bg-slate-900 text-white px-4 py-2 rounded-full text-[10px] font-black uppercase flex items-center gap-3 animate-in zoom-in-95 hover:bg-slate-800 transition-colors shadow-md"
                >
                  {a.category && (
                    <div className="w-4 h-4 flex items-center justify-center brightness-200">
                       <CategoryIcon iconKey={a.category.iconKey} color={a.category.color} />
                    </div>
                  )}
                  <span className="tracking-wide">{a.name}</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onRemove(a.id, a.groupId);
                    }}
                    className="hover:text-red-400 p-0.5 transition-colors border-l border-slate-700 pl-2"
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