import { ChevronDown, Package, Edit2, Trash2, Info, LayoutGrid } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch"; // ✅ Importando o Switch
import { cn } from "@/lib/utils";

export function PackageCard({ pkg, isExpanded, onToggleExpand, onEdit, onDelete, onToggleVisibility }: any) {
  const slots = pkg.config?.slots || [];
  // Consideramos visível se o status for 'active' ou se isActive for true
  const isActive = pkg.status === "active" || pkg.isActive === true;

  return (
    <div className={cn(
      "group bg-white rounded-[2.5rem] border shadow-sm overflow-hidden transition-all duration-500",
      !isActive ? "border-slate-200 opacity-60 grayscale-[0.5]" : "border-slate-100 hover:shadow-md hover:border-emerald-100"
    )}>
      <div className="p-6 md:p-8 flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-8 relative">
        
        {/* INDICADOR DE STATUS (CANTO SUPERIOR) */}
        <div className="absolute top-6 right-8 flex items-center gap-3 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-2xl border border-slate-100 shadow-sm z-10">
          <span className={cn(
            "text-[9px] font-black uppercase tracking-widest",
            isActive ? "text-emerald-600" : "text-slate-400"
          )}>
            {isActive ? "Visível" : "Oculto"}
          </span>
          <Switch 
            checked={isActive} 
            onCheckedChange={() => onToggleVisibility(pkg.id, pkg.status)}
            className="data-[state=checked]:bg-emerald-500"
          />
        </div>

        {/* COLUNA ESQUERDA: ÍCONE + AÇÕES */}
        <div className="flex flex-col gap-3 shrink-0">
          <div className={cn(
            "h-20 w-20 md:h-24 md:w-24 rounded-[2rem] flex items-center justify-center border relative group-hover:scale-105 transition-transform duration-500 shadow-sm",
            !isActive ? "bg-slate-100 text-slate-400 border-slate-200" : "bg-gradient-to-br from-emerald-50 to-slate-50 text-emerald-600 border-emerald-100"
          )}>
            <Package size={32} className="md:w-10 md:h-10" />
          </div>

          <div className="flex gap-2 w-full">
            <Button 
              variant="secondary" 
              size="icon" 
              className="flex-1 h-10 rounded-xl bg-slate-100 text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 active:scale-90 transition-all" 
              onClick={(e) => { e.stopPropagation(); onEdit(); }}
            >
              <Edit2 size={16}/>
            </Button>
            <Button 
              variant="secondary" 
              size="icon" 
              className="flex-1 h-10 rounded-xl bg-slate-100 text-slate-600 hover:text-red-500 hover:bg-red-50 active:scale-90 transition-all" 
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
            >
              <Trash2 size={16}/>
            </Button>
          </div>
        </div>

        {/* CONTEÚDO CENTRAL */}
        <div className="flex-1 min-w-0 text-center md:text-left py-1">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <h3 className={cn(
                "text-2xl md:text-3xl font-black uppercase italic tracking-tighter leading-none transition-colors",
                !isActive ? "text-slate-400" : "text-slate-900"
              )}>
                {pkg.name}
              </h3>
              
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                <Badge className="bg-slate-100 text-slate-500 border-none font-black text-[9px] tracking-[0.15em] uppercase px-3 py-1 rounded-full">
                  {slots.length} {slots.length === 1 ? 'Marmita' : 'Marmitas por ciclo'}
                </Badge>
              </div>
            </div>

            {/* PREÇO E EXPANDIR */}
            <div className="flex items-center justify-center gap-6">
              <div className="flex flex-col items-center md:items-end">
                <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1">Valor do Plano</span>
                <div className={cn(
                  "text-2xl md:text-3xl font-black tracking-tighter italic uppercase leading-none",
                  !isActive ? "text-slate-400" : "text-slate-900"
                )}>
                  <span className={cn("mr-1 text-sm md:text-base", !isActive ? "text-slate-300" : "text-emerald-500")}>R$</span>
                  {Number(pkg.base_price || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </div>
              </div>
              
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={onToggleExpand} 
                className={cn(
                  "h-12 w-12 rounded-2xl transition-all duration-300 shadow-sm", 
                  isExpanded ? "bg-slate-900 text-white" : "bg-slate-50 text-slate-400"
                )}
              >
                <ChevronDown className={cn("transition-transform duration-500", isExpanded && "rotate-180")} />
              </Button>
            </div>
          </div>

          <p className="text-slate-400 font-medium text-xs md:text-sm line-clamp-2 mt-4 leading-relaxed max-w-2xl">
            {pkg.description || "Este pacote permite a personalização completa das marmitas conforme as categorias permitidas."}
          </p>
        </div>
      </div>

      {/* DETALHES TÉCNICOS DOS SLOTS */}
      {isExpanded && (
        <div className="px-8 pb-10 pt-4 bg-[#FBFDFF] border-t border-slate-50 animate-in slide-in-from-top-2 duration-500">
          <div className="flex items-center gap-2 mb-6 text-slate-400">
            <LayoutGrid size={14} />
            <span className="text-[10px] font-black uppercase tracking-[0.3em]">Arquitetura do Pacote</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {slots.map((slot: any, i: number) => (
              <div key={i} className="group/slot bg-white p-5 rounded-[1.5rem] border border-slate-100 shadow-sm transition-all hover:border-emerald-200">
                <span className="text-[10px] font-black uppercase text-emerald-600 tracking-widest italic block mb-3">
                  {slot.name || `Config ${i+1}`}
                </span>
                <div className="space-y-2 text-[9px] font-bold text-slate-400 uppercase tracking-tight">
                  <div className="flex items-center justify-between">
                    <span>Habilitados:</span>
                    <span className="text-slate-900">{(slot.dishIds || []).length}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}