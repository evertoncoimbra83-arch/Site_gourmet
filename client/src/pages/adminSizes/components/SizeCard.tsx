import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { 
  ChevronDown, ChevronUp, Trash2, Link as LinkIcon, 
  Unlink, Layers, Check, MessageCircle, Info, Weight, Tag
} from "lucide-react";
import { Cube, Package, GridFour } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function SizeCard({ 
  size, 
  groups = [], 
  linkedIds = [], 
  isExpanded, 
  onToggleExpand, 
  onToggleLink, 
  onDelete,
  onUpdate // Usaremos esta prop única para todas as atualizações (ícone, peso, desc)
}: any) {

  const [localDesc, setLocalDesc] = useState(size.description || "");

  useEffect(() => {
    setLocalDesc(size.description || "");
  }, [size.description]);

  const iconOptions = [
    { key: "Cube", icon: Cube, label: "Sem divisória" },
    { key: "Package", icon: Package, label: "Sem divisória" },
    { key: "GridFour", icon: GridFour, label: "Com divisória" },
  ];

  // Helper seguro para disparar atualizações
  const safeUpdate = (data: any) => {
    if (typeof onUpdate === "function") {
      onUpdate(size.id, data);
    }
  };

  return (
    <div className={cn(
      "group border rounded-[2.5rem] bg-white transition-all duration-300 overflow-hidden",
      isExpanded ? "border-emerald-200 shadow-xl" : "border-slate-100 shadow-sm"
    )}>
      {/* CABEÇALHO DO CARD - Responsivo */}
      <div className="p-5 md:p-8 flex flex-col md:flex-row gap-6 md:items-center justify-between">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
          
          {/* SELETOR DE ÍCONE DINÂMICO */}
          <div className="flex gap-2 p-1.5 bg-slate-50 rounded-[1.8rem] border border-slate-100 shadow-inner">
            {iconOptions.map((opt) => {
              const IconComp = opt.icon;
              const isSelected = size.iconKey === opt.key;
              
              return (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => safeUpdate({ iconKey: opt.key })}
                  className={cn(
                    "relative h-12 w-12 flex flex-col items-center justify-center rounded-2xl transition-all",
                    isSelected 
                      ? "bg-white text-emerald-600 shadow-sm ring-1 ring-slate-200" 
                      : "text-slate-400 hover:text-slate-600 hover:bg-white/50"
                  )}
                >
                  <IconComp size={20} weight={isSelected ? "fill" : "bold"} />
                  <span className="text-[6px] font-black uppercase mt-1 tracking-tighter">
                    {opt.label}
                  </span>
                  {isSelected && (
                    <div className="absolute -top-1 -right-1 bg-emerald-500 text-white rounded-full p-0.5 shadow-sm">
                      <Check size={8} strokeWidth={4} />
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-3">
              <h3 className="font-black text-xl md:text-2xl text-slate-900 uppercase tracking-tighter italic leading-none truncate">
                {size.name}
              </h3>
              <div className="px-2 py-1 rounded-lg bg-emerald-50 text-emerald-600 text-[9px] font-black border border-emerald-100 shrink-0">
                {size.weight}g
              </div>
            </div>
            <p className="text-slate-400 font-bold text-[9px] uppercase tracking-widest leading-none">
               Configuração de Engenharia
            </p>
          </div>
        </div>

        {/* AÇÕES DE CABEÇALHO */}
        <div className="flex gap-2 justify-end border-t border-slate-50 pt-4 md:pt-0 md:border-none">
          <Button 
            variant="ghost" 
            className={cn(
              "h-12 px-6 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all",
              isExpanded ? "bg-slate-900 text-white" : "bg-slate-50 text-slate-400"
            )} 
            onClick={onToggleExpand}
          >
            {isExpanded ? "Fechar" : "Gerenciar"}
          </Button>
          
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-12 w-12 rounded-2xl bg-slate-50 text-slate-300 hover:text-red-500 hover:bg-red-50" 
            onClick={() => confirm("Excluir este tamanho?") && onDelete()}
          >
            <Trash2 size={18} />
          </Button>
        </div>
      </div>

      {/* ÁREA EXPANDIDA - Configurações Técnicas e Vínculos */}
      {isExpanded && (
        <div className="bg-[#FBFDFF] border-t border-slate-50 animate-in slide-in-from-top-2 duration-300">
          
          {/* GRID DE CONFIGURAÇÕES (PESO E FAQ) */}
          <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-8 border-b border-slate-100">
            <div className="space-y-4">
               <div className="flex items-center gap-2 text-slate-400">
                 <Tag size={14} />
                 <span className="text-[10px] font-black uppercase tracking-widest">Atributos</span>
               </div>
               <div className="bg-white p-5 rounded-3xl border border-slate-100 space-y-3">
                  <Label className="flex items-center gap-2 text-[9px] font-black uppercase text-slate-400">
                    <Weight size={14} className="text-emerald-500" /> Peso Médio da Marmita (g)
                  </Label>
                  <Input 
                    type="number"
                    defaultValue={size.weight}
                    onBlur={(e) => safeUpdate({ weight: e.target.value })}
                    className="bg-slate-50 border-none h-12 font-black text-lg rounded-2xl"
                  />
               </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2 text-amber-500">
                <MessageCircle size={14} />
                <span className="text-[10px] font-black uppercase tracking-widest">Informativo para o Cliente</span>
              </div>
              <textarea 
                value={localDesc}
                onChange={(e) => setLocalDesc(e.target.value)}
                onBlur={() => safeUpdate({ description: localDesc })}
                placeholder="Ex: Ideal para quem busca uma refeição leve..."
                className="w-full h-28 bg-white border border-slate-100 rounded-3xl p-5 text-sm font-medium text-slate-600 outline-none focus:ring-2 focus:ring-emerald-500/10 shadow-sm"
              />
            </div>
          </div>

          {/* LISTA DE VÍNCULOS */}
          <div className="p-6 md:p-8">
            <div className="flex items-center gap-2 mb-6 text-slate-400">
              <Layers size={14} />
              <span className="text-[10px] font-black uppercase tracking-[0.3em]">Grupos Disponíveis</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {groups.map((group: any) => {
                const isLinked = linkedIds?.includes(Number(group.id));
                return (
                  <button 
                    key={group.id}
                    onClick={() => onToggleLink(size.id, group.id)}
                    className={cn(
                      "flex items-center justify-between p-4 rounded-2xl border transition-all text-left",
                      isLinked 
                        ? "bg-white border-emerald-500 shadow-sm" 
                        : "bg-white border-slate-100 opacity-60 hover:opacity-100"
                    )}
                  >
                    <div className="min-w-0 pr-2">
                      <p className={cn(
                        "text-[10px] font-black uppercase truncate",
                        isLinked ? "text-emerald-700" : "text-slate-600"
                      )}>
                        {group.name}
                      </p>
                    </div>
                    <div className={cn(
                      "p-1.5 rounded-lg shrink-0",
                      isLinked ? "bg-emerald-500 text-white" : "bg-slate-50 text-slate-300"
                    )}>
                      {isLinked ? <Unlink size={12}/> : <LinkIcon size={12}/>}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* RODAPÉ DO CARD */}
          <div className="px-8 py-4 bg-slate-50/50 flex items-center gap-3">
             <Info size={14} className="text-emerald-500" />
             <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
               As alterações de peso e informativo são salvas automaticamente ao clicar fora do campo.
             </p>
          </div>
        </div>
      )}
    </div>
  );
}