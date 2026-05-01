import React, { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { 
  GripVertical, ChevronDown, Layers, 
  Trash2, MessageSquare, Save,
  Copy, Plus, X
} from "lucide-react";
import { 
  Cube, Package, Tag, 
  CaretRight, CaretDoubleRight, ArrowCircleRight, 
  TrendUp, ArrowUp, List, Hash, Icon
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";

// --- INTERFACES ---

interface Group {
  id: number | string;
  name: string;
  [key: string]: unknown;
}

interface SizeData {
  id: number;
  name: string;
  price: string | number;
  weight?: string;
  color?: string;
  isActive: boolean;
  iconKey: string;
  priceModifier: string | number;
  mainDishWeight: string | number;
  noAccompanimentsMessage: string;
  description?: string;
  groupsOrder: number[];
  // Campos vindos do banco (snake_case)
  is_active?: boolean | number;
  icon_key?: string;
  price_modifier?: string | number;
  main_dish_weight?: string | number;
  no_accompaniments_message?: string;
}

interface SizeCardProps {
  size: SizeData;
  groups: Group[];
  linkedIds: number[];
  isExpanded: boolean;
  onToggleExpand: () => void;
  onUpdate: (id: number, data: Partial<SizeData>) => void;
  onDelete: (id: number) => void;
  onDuplicate: (size: SizeData) => void; 
  onToggleLink: (sizeId: number, groupId: number) => Promise<void>;
  innerRef?: React.Ref<HTMLDivElement>;
  draggableProps?: Record<string, unknown>;
  dragHandleProps?: Record<string, unknown>;
}

const AVAILABLE_ICONS: { key: string; icon: Icon }[] = [
  { key: "Cube", icon: Cube }, 
  { key: "Package", icon: Package },
  { key: "Box", icon: Package }, 
  { key: "CaretRight", icon: CaretRight },
  { key: "CaretDoubleRight", icon: CaretDoubleRight },
  { key: "ArrowRight", icon: ArrowCircleRight },
  { key: "ArrowUp", icon: ArrowUp },
  { key: "TrendUp", icon: TrendUp },
  { key: "Tag", icon: Tag }, 
  { key: "List", icon: List },
  { key: "Hash", icon: Hash },
];

const COLORS = [
  { name: "Slate", value: "slate", bg: "bg-slate-500", light: "bg-slate-100", text: "text-slate-600" },
  { name: "Emerald", value: "emerald", bg: "bg-emerald-500", light: "bg-emerald-100", text: "text-emerald-600" },
  { name: "Blue", value: "blue", bg: "bg-blue-500", light: "bg-blue-100", text: "text-blue-600" },
  { name: "Amber", value: "amber", bg: "bg-amber-500", light: "bg-amber-100", text: "text-amber-600" },
  { name: "Rose", value: "rose", bg: "bg-rose-500", light: "bg-rose-100", text: "text-rose-600" },
];

export function SizeCard({ 
  size, groups = [], linkedIds = [], isExpanded, onToggleExpand, 
  onUpdate, onDelete, onDuplicate, onToggleLink, innerRef,
  draggableProps, dragHandleProps 
}: SizeCardProps) {
  
  const [localSize, setLocalSize] = useState<SizeData>(size);

  useEffect(() => {
    if (size) {
      setLocalSize({
        ...size,
        isActive: size.is_active === 1 || size.is_active === true || size.isActive === true,
        iconKey: size.icon_key ?? size.iconKey ?? "Box",
        priceModifier: size.price_modifier ?? size.priceModifier ?? "0.00",
        mainDishWeight: size.main_dish_weight ?? size.mainDishWeight ?? "200.00",
        noAccompanimentsMessage: size.no_accompaniments_message ?? size.noAccompanimentsMessage ?? "",
        groupsOrder: size.groupsOrder || []
      });
    }
  }, [size]);

  const persistUpdate = (updatedData: SizeData) => {
    onUpdate(size.id, {
      ...updatedData,
      isActive: Boolean(updatedData.isActive),
      groupsOrder: updatedData.groupsOrder
    });
  };

  const handleInstantUpdate = <K extends keyof SizeData>(field: K, value: SizeData[K]) => {
    const updated = { ...localSize, [field]: value };
    setLocalSize(updated); 
    persistUpdate(updated);
  };

  const { orderedLinkedGroups, availableGroups } = useMemo(() => {
    const safeG = Array.isArray(groups) ? groups : [];
    const safeIds = Array.isArray(linkedIds) ? linkedIds.map(Number) : [];
    const order = localSize.groupsOrder || [];

    const linked = safeG.filter(g => safeIds.includes(Number(g.id)));
    const sortedLinked = linked.sort((a, b) => {
      const idxA = order.indexOf(Number(a.id));
      const idxB = order.indexOf(Number(b.id));
      if (idxA === -1) return 1;
      if (idxB === -1) return -1;
      return idxA - idxB;
    });

    const available = safeG.filter(g => !safeIds.includes(Number(g.id)));
    return { orderedLinkedGroups: sortedLinked, availableGroups: available };
  }, [groups, linkedIds, localSize.groupsOrder]);

  const onDragEndGroups = (result: DropResult) => {
    if (!result.destination) return;
    const items = Array.from(orderedLinkedGroups);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    handleInstantUpdate('groupsOrder', items.map(g => Number(g.id)));
  };

  const IconComponent = (AVAILABLE_ICONS.find(i => i.key === localSize.iconKey) || AVAILABLE_ICONS[0]).icon;
  const currentColorObj = COLORS.find(c => c.value === localSize.color) || COLORS[0];

  if (!size) return null;

  return (
    <div
      ref={innerRef}
      {...draggableProps}
      className={cn(
        "group flex flex-col rounded-[2rem] border transition-all duration-300 bg-white overflow-hidden mb-4 text-left",
        localSize.isActive ? "border-slate-100 shadow-sm" : "border-slate-100 bg-slate-50 opacity-70",
        isExpanded && "ring-2 ring-emerald-500/20 border-emerald-200 shadow-md"
      )}
    >
      {/* CABEÇALHO DO CARD */}
      <div className="flex items-center justify-between p-3 md:p-5 gap-2 text-left">
        <div className="flex items-center gap-2 md:gap-4 min-w-0 flex-1 text-left">
          <div {...dragHandleProps} className="cursor-grab active:cursor-grabbing text-slate-300 hover:text-slate-500 p-2 shrink-0">
            <GripVertical size={18} />
          </div>

          <div className="flex-1 min-w-0 cursor-pointer text-left" onClick={onToggleExpand}>
            <div className="flex items-center gap-3 text-left">
              <div className={cn("p-2.5 md:p-3 rounded-xl shrink-0 shadow-sm", currentColorObj.light, currentColorObj.text)}>
                <IconComponent size={20} weight="duotone" />
              </div>
              
              <div className="flex flex-col min-w-0 text-left">
                <span className="font-black text-[12px] md:text-sm uppercase text-slate-700 italic truncate leading-none mb-1 text-left">
                  {localSize.name}
                </span>
                <div className="flex items-center gap-1.5 text-[8px] md:text-[10px] font-bold uppercase tracking-tight text-left">
                  <span className="text-slate-400 whitespace-nowrap">{localSize.weight || '0g'}</span>
                  <span className="h-1 w-1 rounded-full bg-slate-200 shrink-0" />
                  <span className="text-emerald-500 italic whitespace-nowrap">{localSize.mainDishWeight}g Prot.</span>
                  {linkedIds.length > 0 && (
                    <span className="hidden xs:flex items-center gap-1 text-slate-300 ml-1">
                      <Layers size={10} /> {linkedIds.length}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 md:gap-2 shrink-0 ml-2 text-left">
          <div className={cn(
            "flex items-center px-2 py-1.5 rounded-xl border transition-all",
            localSize.isActive ? "bg-emerald-50 border-emerald-100" : "bg-slate-100 border-slate-200"
          )}>
            <Switch 
              checked={!!localSize.isActive}
              onCheckedChange={(checked) => handleInstantUpdate("isActive", checked)}
              className="scale-75 md:scale-90 data-[state=checked]:bg-emerald-500"
            />
          </div>

          <Button type="button" size="icon" variant="ghost" onClick={onToggleExpand} className={cn("h-9 w-9 md:h-10 md:w-10 rounded-xl", isExpanded && "bg-emerald-50 text-emerald-600")}>
            <ChevronDown className={cn("transition-transform duration-500", isExpanded && "rotate-180")} size={18} />
          </Button>
          
          <div className="hidden lg:flex items-center gap-1">
            <Button type="button" size="icon" variant="ghost" onClick={() => onDuplicate(localSize)} className="h-10 w-10 text-slate-300 hover:text-blue-500"><Copy size={16} /></Button>
            <Button type="button" size="icon" variant="ghost" onClick={() => onDelete(size.id)} className="h-10 w-10 text-slate-300 hover:text-red-500"><Trash2 size={18} /></Button>
          </div>
        </div>
      </div>

      {/* CONTEÚDO EXPANDIDO */}
      {isExpanded && (
        <div className="px-5 md:px-10 pb-8 pt-4 border-t border-slate-50 bg-slate-50/30 space-y-8 animate-in fade-in slide-in-from-top-4 text-left">
          
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 md:gap-6 text-left">
            <div className="space-y-1 text-left">
              <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Nome do Tamanho</label>
              <Input 
                value={localSize.name ?? ""} 
                onChange={(e) => setLocalSize({...localSize, name: e.target.value})} 
                className="h-10 rounded-xl text-xs font-black uppercase italic tracking-tighter" 
                placeholder="Ex: GRANDE"
              />
            </div>
            <div className="space-y-1 text-left">
              <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Preço Base</label>
              <Input type="number" value={String(localSize.price ?? "")} onChange={(e) => setLocalSize({...localSize, price: e.target.value})} className="h-10 rounded-xl text-xs font-bold" />
            </div>
            <div className="space-y-1 text-left">
              <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Modif. (%)</label>
              <Input type="number" value={String(localSize.priceModifier ?? "")} onChange={(e) => setLocalSize({...localSize, priceModifier: e.target.value})} className="h-10 rounded-xl text-xs font-bold" />
            </div>
            <div className="space-y-1 text-left">
              <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Proteína (g)</label>
              <Input type="number" value={String(localSize.mainDishWeight ?? "")} onChange={(e) => setLocalSize({...localSize, mainDishWeight: e.target.value})} className="h-10 rounded-xl text-xs font-bold" />
            </div>
            <div className="space-y-1 text-left">
              <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Label Peso</label>
              <Input value={localSize.weight || ""} onChange={(e) => setLocalSize({...localSize, weight: e.target.value})} className="h-10 rounded-xl text-xs font-bold" placeholder="Ex: 300g" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
            <div className="space-y-4 text-left">
              <div className="flex flex-col gap-3 p-4 bg-white rounded-2xl border border-slate-200 shadow-inner text-left">
                <div className="flex gap-2 pb-2 border-b border-slate-50 text-left">
                  {COLORS.map(c => (
                    <button key={c.value} type="button" onClick={() => handleInstantUpdate("color", c.value)} className={cn("w-6 h-6 rounded-full transition-all hover:scale-110", c.bg, localSize.color === c.value && "ring-2 ring-emerald-500 ring-offset-2 scale-110")} />
                  ))}
                </div>
                <div className="flex gap-2 flex-wrap text-left">
                  {AVAILABLE_ICONS.filter(i => i.key !== "Box").map(icon => (
                    <button key={icon.key} type="button" onClick={() => handleInstantUpdate("iconKey", icon.key)} className={cn("p-2 rounded-lg transition-all hover:bg-emerald-50", localSize.iconKey === icon.key ? "bg-emerald-500 text-white shadow-md" : "bg-slate-50 text-slate-400")}>
                      <icon.icon size={18} weight={localSize.iconKey === icon.key ? "duotone" : "regular"} />
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-1 text-left">
                <label className="text-[9px] font-black uppercase text-slate-400 flex items-center gap-2 text-left"><MessageSquare size={12} /> Alerta (Mensagem para quando não houver acompanhamentos)</label>
                <Input value={localSize.noAccompanimentsMessage || ""} onChange={(e) => setLocalSize({...localSize, noAccompanimentsMessage: e.target.value})} className="h-10 rounded-xl text-xs font-bold text-left" placeholder="Nenhum acompanhamento disponível..." />
              </div>
            </div>

            <div className="space-y-1 text-left">
              <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Descrição Comercial do Tamanho</label>
              <textarea value={localSize.description || ""} onChange={(e) => setLocalSize({...localSize, description: e.target.value})} className="w-full h-full min-h-[120px] md:min-h-0 rounded-2xl border border-slate-200 bg-white p-4 text-xs font-bold outline-none resize-none focus:ring-2 focus:ring-emerald-500/10 transition-all text-left" placeholder="Detalhes que ajudam o cliente a escolher..." />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4 border-t border-slate-100 text-left">
            <div className="flex gap-2 w-full sm:w-auto text-left">
              <Button type="button" onClick={() => onDuplicate(localSize)} variant="outline" className="flex-1 rounded-xl h-10 text-[9px] font-black uppercase"><Copy size={14} className="mr-2"/> Duplicar</Button>
              <Button type="button" onClick={() => onDelete(size.id)} variant="outline" className="flex-1 rounded-xl h-10 text-[9px] font-black uppercase text-red-500 hover:bg-red-50"><Trash2 size={14} className="mr-2"/> Excluir</Button>
            </div>
            <Button type="button" onClick={() => persistUpdate(localSize)} className="w-full sm:w-auto rounded-full bg-slate-900 text-emerald-400 hover:text-white hover:bg-emerald-600 font-black uppercase text-[10px] h-12 px-10 shadow-lg transition-all text-center">
              <Save size={16} className="mr-2" /> Salvar Alterações
            </Button>
          </div>

          {/* VÍNCULOS */}
          <div className="space-y-4 pt-4 border-t border-slate-100 text-left">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2 text-left">
              <Layers size={14} className="text-emerald-500" /> Grupos Vinculados
            </h4>
            <DragDropContext onDragEnd={onDragEndGroups}>
              <Droppable droppableId={`groups-${size.id}`} direction="horizontal">
                {(provided) => (
                  <div ref={provided.innerRef} {...provided.droppableProps} className="flex flex-wrap gap-2 text-left">
                    {orderedLinkedGroups.map((group, index) => (
                      <Draggable key={String(group.id)} draggableId={String(group.id)} index={index}>
                        {(p, snapshot) => (
                          <div ref={p.innerRef} {...p.draggableProps} {...p.dragHandleProps} className={cn("flex items-center gap-2 p-2 px-3 rounded-xl border text-[9px] font-black uppercase transition-all", snapshot.isDragging ? "bg-emerald-600 text-white shadow-xl scale-105" : "bg-white border-emerald-100 text-emerald-700 hover:border-emerald-300")}>
                            <GripVertical size={10} className="opacity-50" />
                            <span className="truncate max-w-[100px]">{group.name}</span>
                            <button type="button" onClick={() => onToggleLink(size.id, Number(group.id))} className="ml-1 hover:text-red-500 transition-colors text-center"><X size={12} /></button>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>

            {availableGroups.length > 0 && (
              <div className="pt-4 space-y-2 text-left">
                <p className="text-[9px] font-black uppercase text-slate-400 text-left">Disponíveis para Adicionar</p>
                <div className="flex flex-wrap gap-2 text-left">
                  {availableGroups.map((group) => (
                    <button key={group.id} type="button" onClick={() => onToggleLink(size.id, Number(group.id))} className="flex items-center gap-2 p-2 px-3 rounded-xl border border-slate-100 bg-white text-slate-400 hover:border-emerald-200 hover:text-emerald-600 transition-all text-[9px] font-black uppercase text-left">
                      {group.name} <Plus size={10} />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}