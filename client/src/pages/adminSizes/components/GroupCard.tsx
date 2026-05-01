import React, { useMemo, useState, useEffect } from "react";
import * as Icons from "lucide-react"; 
import { 
  CheckCircle2, GripVertical, Trash2, Plus, Tag, 
  ChevronDown, Layers, Weight, DollarSign 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";

// ===================================================================
// INTERFACES
// ===================================================================

interface LinkedItemConfig {
  id: number;
  group_id?: number;
  price_modifier: string | number;
}

interface GroupOption {
  id: number;
  name: string;
  iconKey?: string;
  categoryName?: string;
  price_modifier?: string | number;
}

interface GroupData {
  id: number;
  name: string;
  isActive: boolean;
  minSelections: number;
  maxSelections: number;
  defaultGrammage: number;
  itemsOrder?: string | LinkedItemConfig[];
}

// ===================================================================
// SUB-COMPONENTE: LISTA DE ITENS VINCULADOS
// ===================================================================

interface GroupOptionsListProps {
  groupId: number;
  group: GroupData;
  items: GroupOption[]; 
  onToggleOption: (groupId: number, optId: number) => void;
  onUpdatePrice: (groupId: number, optId: number, newPrice: string) => void;
  onReorder: (groupId: number, newItems: LinkedItemConfig[]) => void;
}

function GroupOptionsList({ groupId, group, items: allOptions, onToggleOption, onUpdatePrice, onReorder }: GroupOptionsListProps) {
  const [localOrderedItems, setLocalOrderedItems] = useState<GroupOption[]>([]);

  const currentItemsConfig = useMemo<LinkedItemConfig[]>(() => {
    try {
      const raw = group?.itemsOrder || "[]";
      return typeof raw === 'string' ? JSON.parse(raw) : (raw as LinkedItemConfig[]);
    } catch { return []; }
  }, [group?.itemsOrder]);

  useEffect(() => {
    if (!allOptions || !currentItemsConfig) return;
    
    const linked = currentItemsConfig.reduce((acc: GroupOption[], conf) => {
      const targetId = Number(conf.id || conf.group_id);
      const base = allOptions.find(o => Number(o.id) === targetId);
      if (base) {
        acc.push({ ...base, price_modifier: conf.price_modifier || "0.00" });
      }
      return acc;
    }, []);

    setLocalOrderedItems(linked);
  }, [allOptions, currentItemsConfig]);

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const items = Array.from(localOrderedItems);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    setLocalOrderedItems(items);
    onReorder(groupId, items.map(i => ({ 
      id: i.id, 
      price_modifier: i.price_modifier || "0.00" 
    })));
  };

  const availableOptions = allOptions?.filter(opt => 
    !currentItemsConfig.some((co) => Number(co.id || co.group_id) === Number(opt.id))
  ) || [];

  return (
    <div className="space-y-6 mt-4 text-left">
      <div className="space-y-4">
        <h4 className="text-[10px] font-black uppercase text-emerald-600 tracking-widest flex items-center gap-2 px-2">
          <CheckCircle2 size={14} /> Itens Vinculados ({localOrderedItems.length})
        </h4>

        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId={`drop-options-${groupId}`}>
            {(provided) => (
              <div {...provided.droppableProps} ref={provided.innerRef} className="grid grid-cols-1 gap-2 p-2 md:p-4 border-2 border-dashed border-slate-100 rounded-[2rem] bg-slate-50/50">
                {localOrderedItems.map((opt, index) => {
                  const lucideIcons = Icons as unknown as Record<string, React.ElementType>;
                  const IconComponent = (opt.iconKey && opt.iconKey in lucideIcons) 
                    ? lucideIcons[opt.iconKey] 
                    : Tag;

                  return (
                    <Draggable key={`opt-${opt.id}`} draggableId={`drag-opt-${opt.id}`} index={index}>
                      {(p, snapshot) => (
                        <div ref={p.innerRef} {...p.draggableProps} className={cn(
                          "flex flex-col sm:flex-row items-center justify-between p-3 md:p-4 rounded-2xl border-2 bg-white shadow-sm transition-all gap-3",
                          snapshot.isDragging ? "border-emerald-500 shadow-xl z-50 scale-[1.02]" : "border-white"
                        )}>
                          <div className="flex items-center gap-3 w-full sm:w-auto">
                            <div {...p.dragHandleProps} className="text-slate-300 hover:text-slate-500 cursor-grab shrink-0">
                              <GripVertical size={16} />
                            </div>
                            <div className="h-9 w-9 shrink-0 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                              <IconComponent size={18} />
                            </div>
                            <div className="flex flex-col min-w-0 flex-1">
                              <span className="text-[11px] font-black uppercase italic text-slate-700 truncate leading-none mb-1">{opt.name}</span>
                              <span className="text-[9px] text-slate-400 font-bold uppercase truncate">{opt.categoryName || 'S/ Categoria'}</span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between w-full sm:w-auto gap-4 border-t sm:border-none pt-2 sm:pt-0">
                            <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 flex-1 sm:flex-none">
                              <DollarSign size={10} className="text-emerald-500 shrink-0" />
                              <input 
                                type="text"
                                value={opt.price_modifier || "0.00"}
                                onChange={(e) => onUpdatePrice(groupId, opt.id, e.target.value)}
                                className="w-full sm:w-16 bg-transparent border-none text-[10px] font-black text-slate-700 p-0 focus:ring-0 text-center"
                              />
                            </div>
                            <button onClick={() => onToggleOption(groupId, opt.id)} className="p-2 text-slate-200 hover:text-red-500 transition-colors shrink-0">
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      )}
                    </Draggable>
                  );
                })}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </div>

      <div className="pt-4 border-t border-slate-100">
        <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-4 px-2">Disponíveis para Adicionar</h4>
        <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-4 gap-2 px-1">
          {availableOptions.map((opt) => (
            <button key={opt.id} onClick={() => onToggleOption(groupId, opt.id)} className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-slate-100 bg-white hover:border-emerald-200 transition-all shadow-sm text-left min-w-0 group">
              <Plus size={14} className="text-slate-300 group-hover:text-emerald-500 shrink-0" />
              <span className="text-[10px] font-black uppercase italic text-slate-400 group-hover:text-emerald-700 truncate flex-1">{opt.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ===================================================================
// COMPONENTE PRINCIPAL
// ===================================================================

interface GroupCardProps {
  group: GroupData;
  allOptions: GroupOption[];
  isExpanded: boolean;
  onToggleExpand: () => void;
  onUpdate: (id: number, data: GroupData) => void;
  onDelete: (input: { id: number }) => void;
  onToggleOption: (groupId: number, optId: number) => void;
}

export function GroupCard({ group, allOptions, isExpanded, onToggleExpand, onUpdate, onDelete, onToggleOption }: GroupCardProps) {
  const [editName, setEditName] = useState(group.name);
  const [editMin, setEditMin] = useState(group.minSelections);
  const [editMax, setEditMax] = useState(group.maxSelections);
  const [editGrammage, setEditGrammage] = useState(group.defaultGrammage || 100); 

  useEffect(() => {
    setEditName(group.name);
    setEditMin(group.minSelections);
    setEditMax(group.maxSelections);
    setEditGrammage(group.defaultGrammage || 100);
  }, [group]);

  const handleFastUpdate = (newData: Partial<GroupData>) => {
    onUpdate(group.id, {
      ...group,
      ...newData
    } as GroupData);
  };

  const handleUpdatePrice = (gId: number, oId: number, newPrice: string) => {
    const rawOrder = group.itemsOrder || "[]";
    const currentOptions: LinkedItemConfig[] = typeof rawOrder === 'string' ? JSON.parse(rawOrder) : (rawOrder as LinkedItemConfig[]);
    const updated = currentOptions.map((opt) => 
      Number(opt.id || opt.group_id) === oId ? { ...opt, price_modifier: newPrice } : opt
    );
    // ✅ Enviamos o objeto atualizado. Se o seu backend exigir string, o hook de lógica deve tratar
    onUpdate(gId, { ...group, itemsOrder: updated });
  };

  const handleSaveConfig = () => {
    // ✅ Garantimos que os valores são enviados como números e o itemsOrder é preservado
    const updatedPayload: GroupData = {
      ...group,
      name: editName.trim(),
      minSelections: Number(editMin),
      maxSelections: Number(editMax),
      defaultGrammage: Number(editGrammage),
      // Garantimos que itemsOrder vá como objeto se já estiver parseado, 
      // ou mantemos o que veio do banco.
      itemsOrder: group.itemsOrder 
    };

    onUpdate(group.id, updatedPayload);
  };

  return (
    <div className={cn(
      "flex flex-col rounded-[2.5rem] border transition-all duration-300 bg-white overflow-hidden text-left",
      group.isActive ? "border-slate-100 shadow-sm" : "border-slate-100 bg-slate-50/50 opacity-75",
      isExpanded && "ring-2 ring-emerald-500/20 border-emerald-200"
    )}>
      <div className="flex items-center justify-between p-4 md:p-5 gap-2">
        <div className="flex-1 min-w-0 cursor-pointer" onClick={onToggleExpand}>
          <div className="flex flex-col min-w-0">
            <h3 className="font-black text-slate-800 uppercase italic flex items-center gap-2 leading-none truncate text-sm md:text-base">
              <Layers size={18} className="text-emerald-500 shrink-0" /> <span className="truncate">{group.name}</span>
            </h3>
            <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1.5">
              <span className="text-[8px] md:text-[9px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Min: {group.minSelections} | Max: {group.maxSelections}</span>
              <span className="text-[8px] md:text-[9px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-1 whitespace-nowrap"><Weight size={10} /> {group.defaultGrammage}g</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-1 shrink-0">
          <Switch 
            checked={!!group.isActive} 
            onCheckedChange={(v) => handleFastUpdate({ isActive: v })} 
            className="data-[state=checked]:bg-emerald-500 scale-75 md:scale-90" 
          />
          <Button type="button" size="icon" variant="ghost" onClick={onToggleExpand} className={cn("h-9 w-9 rounded-xl shrink-0", isExpanded && "text-emerald-500 bg-emerald-50")}>
            <ChevronDown className={cn("transition-transform duration-300", isExpanded && "rotate-180")} size={18} />
          </Button>
        </div>
      </div>

      {isExpanded && (
        <div className="p-4 md:p-8 border-t border-slate-50 bg-slate-50/30 space-y-6">
            <div className="bg-white p-4 md:p-6 rounded-[2rem] border border-slate-100 shadow-sm space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="flex flex-col gap-1.5 md:col-span-1">
                    <span className="text-[9px] font-black text-slate-400 uppercase px-1 italic">Nome do Grupo</span>
                    <Input 
                      value={editName} 
                      onChange={e => setEditName(e.target.value)} 
                      className="h-10 rounded-xl font-black text-xs uppercase italic tracking-tighter"
                      placeholder="Ex: ESCOLHA SUA PROTEÍNA"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <span className="text-[9px] font-black text-slate-400 uppercase px-1">Mínimo</span>
                    <Input type="number" value={editMin} onChange={e => setEditMin(Number(e.target.value))} className="h-10 rounded-xl font-black text-center text-xs"/>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[9px] font-black text-slate-400 uppercase px-1">Máximo</span>
                    <Input type="number" value={editMax} onChange={e => setEditMax(Number(e.target.value))} className="h-10 rounded-xl font-black text-center text-xs"/>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[9px] font-black text-emerald-500 uppercase px-1 tracking-widest text-center md:text-left">Gramagem (g)</span>
                    <Input type="number" value={editGrammage} onChange={e => setEditGrammage(Number(e.target.value))} className="h-10 rounded-xl font-black text-center text-xs text-emerald-600 bg-emerald-50/50 border-emerald-100"/>
                  </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <Button 
                  onClick={handleSaveConfig} 
                  className="w-full sm:flex-1 h-11 bg-emerald-500 text-white font-black text-[10px] uppercase rounded-xl shadow-lg shadow-emerald-100"
                >
                  Salvar Configurações
                </Button>
                <Button variant="ghost" onClick={() => onDelete({ id: group.id })} className="w-full sm:w-auto text-red-400 text-[10px] font-black uppercase hover:bg-red-50 text-center">Excluir Grupo</Button>
              </div>
            </div>
            
            <GroupOptionsList 
              groupId={group.id} 
              group={group}
              items={allOptions} 
              onToggleOption={onToggleOption} 
              onUpdatePrice={handleUpdatePrice}
              onReorder={(gId, newItems) => onUpdate(gId, { ...group, itemsOrder: newItems })}
            />
        </div>
      )}
    </div>
  );
}