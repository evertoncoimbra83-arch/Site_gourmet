// client/src/pages/adminPackages/components/PackageSlotsEditor.tsx

import React, { useState, memo } from "react"; 
import { 
  Trash2, Utensils, GripVertical, 
  ChevronDown, CheckCircle2, ListFilter, 
  Search, Copy, PlusCircle, Scale, Sparkles
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { 
  DragDropContext, 
  Droppable, 
  Draggable, 
  DropResult, 
  DraggableProvided, 
  DraggableStateSnapshot 
} from "@hello-pangea/dnd";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// --- INTERFACES ---
interface Dish { id: string; name: string; category?: string; }
interface Group { id: string; name: string; }
interface SlotGroup { id: string; customLabel: string; optionIds?: (string | number)[]; }
interface Slot { name: string; dishIds?: string[]; groups?: SlotGroup[]; sizeId?: string | number; }

interface PackageSlotsEditorProps {
  slots: Slot[];
  allDishes: Dish[];
  allGroups: Group[];
  allSizes: { id: string | number; name: string; defaultMainWeight?: number }[];
  selectedSizeId: string | number;
  onUpdateName: (index: number, name: string) => void;
  onUpdateDishes: (index: number, dishIds: string[]) => void;
  onUpdateGroups: (index: number, groups: SlotGroup[]) => void;
  onRemoveSlot: (index: number) => void;
  onReorderSlots: (sourceIndex: number, destIndex: number) => void;
  onDuplicateSlot: (index: number) => void;
  onUpdateSlotSize: (index: number, sizeId: string | number | undefined) => void;
}

interface SlotCardProps extends Omit<PackageSlotsEditorProps, 'onReorderSlots' | 'slots'> {
  slot: Slot;
  sIdx: number;
  isExpanded: boolean;
  onToggle: () => void;
  provided: DraggableProvided;
  snapshot: DraggableStateSnapshot;
}

// ✅ Detecta se um grupo é do Smart Generator (UUID) ou do banco (ID numérico)
function isSmartGroup(groupId: string, allGroups: Group[]): boolean {
  return !allGroups.some(g => String(g.id) === groupId);
}

const SlotCard = memo(({ 
  slot, sIdx, isExpanded, onToggle, 
  allDishes, allGroups, allSizes, onUpdateName, onUpdateDishes, 
  onUpdateGroups, onRemoveSlot, onDuplicateSlot, onUpdateSlotSize,
  provided, snapshot
}: SlotCardProps) => {
  const [dishSearch, setDishSearch] = useState("");
  const currentIds = slot.dishIds || [];
  
  const searchedDishes = allDishes.filter((d) => 
    d.name.toLowerCase().includes(dishSearch.toLowerCase())
  );

  const selectedInSlot = searchedDishes.filter((d) => currentIds.includes(d.id));
  const availableInSlot = searchedDishes.filter((d) => !currentIds.includes(d.id));

  // ✅ Só mostra grupos do banco que ainda não estão no slot
  // Grupos do Smart Generator (UUIDs) não aparecem aqui — eles já estão no slot
  const availableDbGroups = allGroups.filter(g => 
    !(slot.groups || []).some(sg => String(sg.id) === String(g.id))
  );

  return (
    <div
      ref={provided.innerRef}
      {...provided.draggableProps}
      style={{ ...provided.draggableProps.style }}
      className={cn(
        "bg-white border transition-all duration-200 rounded-2xl overflow-hidden mb-3 text-left",
        isExpanded ? "border-slate-300 shadow-md" : "border-slate-100 shadow-sm",
        snapshot.isDragging && "shadow-2xl border-orange-500/50 ring-2 ring-orange-500/10 z-50 bg-white"
      )}
    >
      {/* HEADER DO SLOT */}
      <div className="flex items-center justify-between p-4 cursor-pointer" onClick={onToggle}>
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div {...provided.dragHandleProps} className="p-2 -ml-2 text-slate-300 hover:text-orange-500 transition-colors">
            <GripVertical size={16} />
          </div>
          <div className="min-w-0 flex-1 text-left space-y-1">
            <div className="flex items-center gap-3">
              <Input 
                value={slot.name} 
                onChange={(e) => onUpdateName(sIdx, e.target.value)}
                onClick={(e) => e.stopPropagation()}
                className="font-bold border-none text-sm p-0 h-auto bg-transparent shadow-none focus-visible:ring-0 text-slate-900 w-auto min-w-30" 
              />
              <div onClick={(e) => e.stopPropagation()} className="flex items-center">
                <Select 
                  value={String(slot.sizeId || "")} 
                  onValueChange={(val) => onUpdateSlotSize(sIdx, val)}
                >
                  <SelectTrigger className="h-6 px-2 py-0 border-slate-100 bg-slate-50 text-[9px] font-black uppercase rounded-md w-auto gap-1">
                    <Scale size={10} className="text-slate-400" />
                    <SelectValue placeholder="Tam." />
                  </SelectTrigger>
                  <SelectContent>
                    {allSizes.map(s => (
                      <SelectItem key={s.id} value={String(s.id)} className="text-[10px] font-bold uppercase">{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-[9px] font-black border-slate-100 text-slate-400">{currentIds.length} PRATOS</Badge>
              <Badge variant="outline" className="text-[9px] font-black border-orange-100 text-orange-600 uppercase">{(slot.groups || []).length} REGRAS</Badge>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-1">
          <Button type="button" variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); onDuplicateSlot(sIdx); }} className="h-8 w-8 text-slate-400">
            <Copy size={14} />
          </Button>
          <Button type="button" variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); onRemoveSlot(sIdx); }} className="h-8 w-8 text-slate-400 hover:text-red-500">
            <Trash2 size={14} />
          </Button>
          <ChevronDown className={cn("text-slate-400 transition-transform duration-300 ml-1", isExpanded && "rotate-180")} size={16} />
        </div>
      </div>

      {/* CONTEÚDO EXPANDIDO */}
      <AnimatePresence initial={false}>
        {isExpanded && !snapshot.isDragging && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="overflow-hidden border-t border-slate-50 bg-white"
          >
            <div className="p-5 grid grid-cols-1 lg:grid-cols-2 gap-8 text-left">
              
              {/* PAINEL: PRATOS */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-1.5">
                    <Utensils size={12} className="text-orange-500" /> Seleção de Pratos
                  </label>
                  <div className="relative">
                    <Search size={10} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                      type="text" 
                      placeholder="Filtrar..." 
                      className="pl-6 pr-2 py-1 text-[10px] font-bold border-b border-slate-100 outline-none focus:border-slate-400 bg-transparent"
                      onChange={(e) => setDishSearch(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2 p-2 border rounded-xl bg-slate-50/40 max-h-60 overflow-y-auto custom-scrollbar">
                  {selectedInSlot.map((dish) => (
                    <div key={dish.id} onClick={() => onUpdateDishes(sIdx, currentIds.filter(id => id !== dish.id))} className="flex items-center justify-between p-2.5 rounded-lg cursor-pointer bg-white border border-orange-100 shadow-sm group">
                      <span className="text-[11px] font-bold text-slate-700 uppercase">{dish.name}</span>
                      <div className="relative flex items-center justify-center">
                        <CheckCircle2 size={14} className="text-orange-500 group-hover:opacity-0 transition-opacity" />
                        <Trash2 size={12} className="text-red-500 opacity-0 group-hover:opacity-100 absolute transition-opacity" />
                      </div>
                    </div>
                  ))}
                  {availableInSlot.map((dish) => (
                    <div key={dish.id} onClick={() => onUpdateDishes(sIdx, [...currentIds, dish.id])} className="flex items-center justify-between p-2.5 rounded-lg cursor-pointer hover:bg-white border border-transparent hover:border-slate-200 transition-all opacity-70 hover:opacity-100">
                      <span className="text-[11px] font-medium text-slate-500 uppercase">{dish.name}</span>
                      <PlusCircle size={14} className="text-slate-300 group-hover:text-orange-500" />
                    </div>
                  ))}
                </div>
              </div>

              {/* PAINEL: REGRAS */}
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-1.5">
                  <ListFilter size={12} className="text-blue-500" /> Rótulos e Grupos
                </label>
                <div className="space-y-2 p-2 border rounded-xl bg-slate-50/40 min-h-25">
                  
                  {(slot.groups || []).map((selectedGroup, gIdx) => {
                    const isSmart = isSmartGroup(selectedGroup.id, allGroups);
                    const dbGroup = allGroups.find(g => String(g.id) === selectedGroup.id);

                    // ✅ Para grupos do Smart Generator: mostra customLabel + badge
                    // Para grupos do banco: mostra nome do banco
                    const displayName = selectedGroup.customLabel || dbGroup?.name || "Acompanhamento";
                    const optionCount = selectedGroup.optionIds?.length ?? 0;

                    return (
                      <div key={`${selectedGroup.id}-${gIdx}`} className="bg-white p-2.5 rounded-lg border border-slate-100 shadow-sm space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 min-w-0">
                            {isSmart && (
                              <Sparkles size={10} className="text-orange-400 shrink-0" />
                            )}
                            <span className="text-[10px] font-bold text-slate-700 uppercase truncate">
                              {displayName}
                            </span>
                            {isSmart && optionCount > 0 && (
                              <span className="text-[8px] font-black text-orange-500 bg-orange-50 px-1.5 py-0.5 rounded shrink-0">
                                {optionCount} itens
                              </span>
                            )}
                          </div>
                          <button 
                            onClick={() => onUpdateGroups(sIdx, (slot.groups || []).filter((_, i) => i !== gIdx))} 
                            className="text-slate-300 hover:text-red-500 shrink-0 ml-2"
                          >
                            <Trash2 size={11} />
                          </button>
                        </div>
                        <Input 
                          placeholder="Ex: Carboidrato, Proteína..." 
                          className="h-8 text-[10px] rounded-md bg-slate-50 border-none shadow-none uppercase font-bold focus-visible:ring-1 focus-visible:ring-slate-200" 
                          value={selectedGroup.customLabel || ""} 
                          onChange={(e) => onUpdateGroups(sIdx, (slot.groups || []).map((g, i) => i === gIdx ? { ...g, customLabel: e.target.value } : g))}
                        />
                      </div>
                    );
                  })}

                  {/* ✅ Só mostra grupos do banco disponíveis — grupos Smart Generator não aparecem aqui */}
                  {availableDbGroups.length > 0 && (
                    <div className="pt-2 grid grid-cols-2 gap-1.5">
                      {availableDbGroups.map((g) => (
                        <button 
                          key={g.id} 
                          type="button" 
                          onClick={() => onUpdateGroups(sIdx, [...(slot.groups || []), { id: String(g.id), customLabel: "" }])} 
                          className="p-1.5 text-[9px] font-black uppercase bg-white border border-slate-100 text-slate-400 hover:text-blue-600 hover:border-blue-200 rounded-lg transition-all"
                        >
                          + {g.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

SlotCard.displayName = "SlotCard";

export function PackageSlotsEditor(props: PackageSlotsEditorProps) {
  const [openSlotIdx, setOpenSlotIdx] = useState<number | null>(0);

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    props.onReorderSlots(result.source.index, result.destination.index);
  };
    
  return (
    <div className="space-y-4">
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="all-slots" type="SLOT">
          {(provided) => (
            <div {...provided.droppableProps} ref={provided.innerRef} className="min-h-12.5">
              {props.slots.map((slot, sIdx) => (
                <Draggable key={`slot-${sIdx}`} draggableId={`slot-${sIdx}`} index={sIdx}>
                  {(providedSlot, snapshot) => (
                    <SlotCard 
                      slot={slot}
                      sIdx={sIdx}
                      isExpanded={openSlotIdx === sIdx}
                      onToggle={() => setOpenSlotIdx(openSlotIdx === sIdx ? null : sIdx)}
                      provided={providedSlot}
                      snapshot={snapshot}
                      allDishes={props.allDishes}
                      allGroups={props.allGroups}
                      allSizes={props.allSizes}
                      selectedSizeId={props.selectedSizeId}
                      onUpdateName={props.onUpdateName}
                      onUpdateDishes={props.onUpdateDishes}
                      onUpdateGroups={props.onUpdateGroups}
                      onRemoveSlot={props.onRemoveSlot}
                      onDuplicateSlot={props.onDuplicateSlot}
                      onUpdateSlotSize={props.onUpdateSlotSize}
                    />
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  );
}