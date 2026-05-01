import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { 
  Trash2, Link as LinkIcon, 
  Unlink, Layers, Plus, Tag,
  GripVertical, Weight, MessageCircle, Info, Percent
} from "lucide-react";
import { Cube, Package, GridFour } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Droppable, Draggable } from "@hello-pangea/dnd";

interface SizeCardProps {
  size: any;
  groups?: any[];
  linkedIds?: number[];
  isExpanded: boolean;
  onToggleExpand: () => void;
  onToggleLink: (sizeId: number, groupId: number) => void;
  onDelete: () => void;
  onUpdate: (id: number, data: any) => void;
  dragHandleProps?: any;
}

export function SizeCard({ 
  size, 
  groups = [], 
  linkedIds = [], 
  isExpanded, 
  onToggleExpand, 
  onToggleLink, 
  onDelete,
  onUpdate,
  dragHandleProps 
}: SizeCardProps) {

  const [localDesc, setLocalDesc] = useState(size.description || "");

  useEffect(() => {
    setLocalDesc(size.description || "");
  }, [size.description]);

  const iconOptions = [
    { key: "Cube", icon: Cube, label: "Marmita" },
    { key: "Package", icon: Package, label: "Pacote" },
    { key: "GridFour", icon: GridFour, label: "Divisórias" },
  ];

  // ✅ Interpretando como Porcentagem
  const priceModifier = Number(size.priceModifier || 0);

  const sortedLinkedGroups = useMemo(() => {
    const linked = groups.filter((g: any) => linkedIds.includes(Number(g.id)));
    const orderMap = Array.isArray(size.groupsOrder) ? size.groupsOrder : [];

    return [...linked].sort((a: any, b: any) => {
      const indexA = orderMap.indexOf(Number(a.id));
      const indexB = orderMap.indexOf(Number(b.id));
      return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
    });
  }, [groups, linkedIds, size.groupsOrder]);

  const availableGroups = groups.filter((g: any) => !linkedIds.includes(Number(g.id)));

  return (
    <div className={cn(
      "group relative border rounded-[2.5rem] bg-white transition-all duration-300",
      isExpanded ? "border-emerald-200 shadow-xl" : "border-slate-100 shadow-sm hover:border-emerald-100"
    )}>
      
      <div 
        {...dragHandleProps} 
        className="absolute left-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing text-slate-300 hover:text-emerald-500 p-2 z-30"
      >
        <GripVertical size={20} />
      </div>

      <div className="p-5 md:p-8 flex flex-col md:flex-row gap-6 md:items-center justify-between pl-10 md:pl-14">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
          
          <div className="flex gap-2 p-1.5 bg-slate-50 rounded-[1.8rem] border border-slate-100 shadow-inner">
            {iconOptions.map((opt) => {
              const IconComp = opt.icon;
              const isSelected = size.iconKey === opt.key;
              return (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => onUpdate(size.id, { iconKey: opt.key })}
                  className={cn(
                    "relative h-12 w-12 flex flex-col items-center justify-center rounded-2xl transition-all",
                    isSelected ? "bg-white text-emerald-600 shadow-sm ring-1 ring-slate-200" : "text-slate-400 hover:text-slate-600"
                  )}
                >
                  <IconComp size={20} weight={isSelected ? "fill" : "bold"} />
                  <span className="text-[6px] font-black uppercase mt-1 tracking-tighter">{opt.label}</span>
                </button>
              );
            })}
          </div>

          <div className="space-y-1.5 min-w-0">
            <div className="flex items-center gap-3">
              <h3 className="font-black text-xl md:text-2xl text-slate-900 uppercase tracking-tighter italic leading-none truncate">
                {size.name}
              </h3>
              <div className="flex items-center gap-2">
                <Badge className="bg-emerald-50 text-emerald-600 border-none font-black text-[9px] uppercase px-3 py-1 rounded-full">
                  {size.weight}g
                </Badge>
                {/* ✅ Badge atualizado para mostrar % */}
                <Badge className="bg-slate-900 text-white border-none font-black text-[9px] uppercase px-3 py-1 rounded-full">
                  <Plus size={8} className="mr-1" /> {priceModifier}%
                </Badge>
              </div>
            </div>
            <p className="text-slate-400 font-bold text-[9px] uppercase tracking-widest leading-none">
              #ORDEM EXIBIÇÃO {size.displayOrder || 0}
            </p>
          </div>
        </div>

        <div className="flex gap-2 justify-end">
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
            className="h-12 w-12 rounded-2xl bg-slate-50 text-slate-300 hover:text-red-500" 
            onClick={() => confirm(`Excluir o tamanho "${size.name}"?`) && onDelete()}
          >
            <Trash2 size={18} />
          </Button>
        </div>
      </div>

      {isExpanded && (
        <div className="bg-[#FBFDFF] border-t border-slate-50 animate-in slide-in-from-top-2 duration-300">
          
          <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-8 border-b border-slate-100">
             <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label className="text-[9px] font-black uppercase text-slate-400 flex items-center gap-2">
                      <Weight size={12}/> Peso (G)
                    </Label>
                    <Input 
                      type="number" 
                      defaultValue={size.weight} 
                      onBlur={(e) => onUpdate(size.id, { weight: e.target.value })} 
                      className="bg-slate-50 border-none h-12 font-black text-lg rounded-2xl" 
                    />
                </div>
                <div className="space-y-2">
                    {/* ✅ Título e ícone atualizados para Porcentagem */}
                    <Label className="text-[9px] font-black uppercase text-slate-400 flex items-center gap-2">
                      <Percent size={12}/> Acréscimo (%)
                    </Label>
                    <div className="relative">
                      <Input 
                        type="number" 
                        step="1" 
                        defaultValue={priceModifier} 
                        onBlur={(e) => onUpdate(size.id, { priceModifier: e.target.value })} 
                        className="bg-slate-50 border-none h-12 font-black text-lg rounded-2xl pr-10" 
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 font-black text-slate-300">%</span>
                    </div>
                </div>
             </div>
             <div className="space-y-2">
                <Label className="text-[9px] font-black uppercase text-slate-400 flex items-center gap-2">
                  <MessageCircle size={12}/> Informativo Cliente
                </Label>
                <textarea 
                  value={localDesc} 
                  onChange={(e) => setLocalDesc(e.target.value)} 
                  onBlur={() => onUpdate(size.id, { description: localDesc })} 
                  className="w-full h-24 bg-white border border-slate-100 rounded-3xl p-4 text-sm outline-none focus:ring-2 focus:ring-emerald-500/10" 
                  placeholder="Ex: Ideal para quem busca uma refeição leve..." 
                />
             </div>
          </div>

          <div className="p-6 md:p-8">
            <div className="flex items-center gap-2 mb-6 text-slate-400">
              <Layers size={14} />
              <span className="text-[10px] font-black uppercase tracking-[0.3em]">Ordem dos Grupos</span>
            </div>

            <Droppable droppableId={`groups-size-${size.id}`} direction="horizontal" type="GROUP">
                {(provided) => (
                  <div 
                    {...provided.droppableProps} 
                    ref={provided.innerRef} 
                    className="flex flex-wrap gap-3 min-h-[60px]"
                  >
                    {sortedLinkedGroups.map((group: any, index: number) => {
                      const uniqueDragId = `size-${size.id}-group-${group.id}`;

                      return (
                        <Draggable key={uniqueDragId} draggableId={uniqueDragId} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              style={{ ...provided.draggableProps.style }}
                              className={cn(
                                "relative flex items-center gap-3 p-4 rounded-2xl border transition-all bg-white",
                                "border-emerald-500 shadow-sm",
                                snapshot.isDragging && "z-50 scale-105 border-emerald-600 shadow-xl"
                              )}
                            >
                              <div {...provided.dragHandleProps} className="cursor-grab active:cursor-grabbing text-slate-300 hover:text-emerald-500">
                                <GripVertical size={16} />
                              </div>
                              <p className="text-[10px] font-black uppercase text-emerald-700">{group.name}</p>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onToggleLink(size.id, group.id);
                                }}
                                className="p-1.5 rounded-lg bg-emerald-500 text-white hover:bg-red-500 transition-colors"
                              >
                                <Unlink size={12}/>
                              </button>
                            </div>
                          )}
                        </Draggable>
                      );
                    })}
                    {provided.placeholder}
                  </div>
                )}
            </Droppable>

            {availableGroups.length > 0 && (
              <div className="mt-8 pt-6 border-t border-dashed border-slate-200">
                <p className="text-[9px] font-black uppercase text-slate-400 mb-4 tracking-widest">Disponíveis para Adicionar</p>
                <div className="flex flex-wrap gap-2">
                  {availableGroups.map((group: any) => (
                    <button
                      key={group.id}
                      onClick={() => onToggleLink(size.id, group.id)}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl border border-dashed border-slate-200 bg-slate-50/50 hover:bg-emerald-50 hover:border-emerald-200 transition-all text-[10px] font-bold text-slate-500 uppercase"
                    >
                      <Plus size={12} className="text-emerald-500" />
                      {group.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="px-8 py-4 bg-slate-50/50 flex items-center gap-3 rounded-b-[2.5rem]">
             <Info size={14} className="text-emerald-500" />
             <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">A porcentagem de acréscimo é aplicada sobre o valor base do prato escolhido.</p>
          </div>
        </div>
      )}
    </div>
  );
}