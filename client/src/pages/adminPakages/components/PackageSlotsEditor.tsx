import React from "react";
import { Trash2, Utensils, LayoutGrid, GripVertical } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

interface PackageSlotsEditorProps {
  slots: any[];
  allDishes: any[];
  allGroups: any[];
  onUpdateName: (index: number, name: string) => void;
  onUpdateDishes: (index: number, dishIds: number[]) => void;
  onUpdateGroups: (index: number, groups: any[]) => void;
  onRemoveSlot: (index: number) => void;
  onReorderSlots: (startIndex: number, endIndex: number) => void;
}

export function PackageSlotsEditor({ 
  slots = [], 
  allDishes = [], 
  allGroups = [], 
  onUpdateName,
  onUpdateDishes, 
  onUpdateGroups, 
  onRemoveSlot,
  onReorderSlots
}: PackageSlotsEditorProps) {

  const handleReorderGroups = (slotIdx: number, startIndex: number, endIndex: number) => {
    const currentGroups = Array.from(slots[slotIdx].groups || []);
    const [removed] = currentGroups.splice(startIndex, 1);
    currentGroups.splice(endIndex, 0, removed);
    onUpdateGroups(slotIdx, currentGroups);
  };

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;
    
    if (result.type === "SLOT") {
      onReorderSlots(result.source.index, result.destination.index);
    } else if (result.type.startsWith("GROUP-")) {
      const slotIdx = parseInt(result.type.split("-")[1]);
      handleReorderGroups(slotIdx, result.source.index, result.destination.index);
    }
  };
    
  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <Droppable droppableId="all-slots" type="SLOT">
        {(provided) => (
          <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-6">
            {slots.map((slot: any, sIdx: number) => (
              <Draggable key={`draggable-slot-${sIdx}`} draggableId={`draggable-slot-${sIdx}`} index={sIdx}>
                {(providedSlot) => (
                  <div 
                    ref={providedSlot.innerRef}
                    {...providedSlot.draggableProps}
                    className="bg-white border-2 border-slate-100 rounded-[2rem] p-6 shadow-sm hover:border-emerald-100 transition-all group relative"
                  >
                    <div {...providedSlot.dragHandleProps} className="absolute left-1/2 -top-3 -translate-x-1/2 bg-white border border-slate-100 p-1 rounded-full text-slate-300 hover:text-emerald-500 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity z-10">
                      <GripVertical size={14} />
                    </div>

                    <div className="flex justify-between items-start mb-6">
                      <div className="flex-1 max-w-sm">
                        <Input 
                          value={slot.name} 
                          onChange={(e) => onUpdateName(sIdx, e.target.value)}
                          placeholder="Nome da Marmita (ex: Marmita Fit 1)"
                          className="font-black uppercase tracking-tighter italic border-none text-xl p-0 h-auto focus-visible:ring-0 bg-transparent text-slate-800 shadow-none" 
                        />
                        <div className="h-0.5 w-12 bg-emerald-500 mt-1 transition-all group-hover:w-full" />
                      </div>
                      
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => onRemoveSlot(sIdx)} 
                        className="text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                      >
                        <Trash2 size={20} />
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                          <Utensils size={14} className="text-emerald-600" /> Pratos Permitidos
                        </label>
                        <div className="grid grid-cols-1 gap-1.5 p-3 border border-slate-100 rounded-2xl bg-slate-50/50">
                          {allDishes.map((dish: any) => {
                            const isChecked = (slot.dishIds || []).includes(dish.id);
                            const checkboxId = `slot-${sIdx}-dish-${dish.id}`;
                            return (
                              <label key={checkboxId} htmlFor={checkboxId} className={cn(
                                "flex items-center gap-3 text-xs font-bold p-2.5 rounded-xl cursor-pointer transition-all border border-transparent",
                                isChecked ? "bg-white border-slate-200 shadow-sm text-slate-900" : "text-slate-500 hover:bg-white/50"
                              )}>
                                <input 
                                  id={checkboxId}
                                  type="checkbox" 
                                  className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                                  checked={isChecked}
                                  onChange={(e) => {
                                    const currentIds = slot.dishIds || [];
                                    const newIds = e.target.checked 
                                      ? [...currentIds, dish.id]
                                      : currentIds.filter((id: number) => id !== dish.id);
                                    onUpdateDishes(sIdx, newIds);
                                  }}
                                />
                                {dish.name}
                              </label>
                            );
                          })}
                        </div>
                      </div>

                      <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                          <LayoutGrid size={14} className="text-emerald-600" /> Ordem dos Acompanhamentos
                        </label>
                        
                        <Droppable droppableId={`droppable-groups-${sIdx}`} type={`GROUP-${sIdx}`}>
                          {(providedGroup) => (
                            <div 
                              {...providedGroup.droppableProps} 
                              ref={providedGroup.innerRef}
                              className="space-y-3 p-3 border border-slate-100 rounded-2xl bg-slate-50/50 min-h-[80px]"
                            >
                              {(slot.groups || []).map((selectedGroup: any, gIdx: number) => {
                                const groupData = allGroups.find(g => g.id === selectedGroup.id);
                                if (!groupData) return null;
                                
                                /* ✅ SOLUÇÃO DA DUPLICAÇÃO: A key e o DraggableId agora usam o ÍNDICE (gIdx) 
                                   Isso permite que o mesmo grupo exista várias vezes no mesmo slot sem conflito */
                                const uniqueId = `slot-${sIdx}-group-${selectedGroup.id}-idx-${gIdx}`;
                                
                                return (
                                  <Draggable key={uniqueId} draggableId={uniqueId} index={gIdx}>
                                    {(p) => (
                                      <div ref={p.innerRef} {...p.draggableProps} className="bg-white p-3 rounded-xl border border-emerald-100 shadow-sm space-y-2">
                                        <div className="flex items-center gap-2">
                                          <div {...p.dragHandleProps} className="cursor-grab text-slate-300 hover:text-emerald-500">
                                            <GripVertical size={14} />
                                          </div>
                                          <span className="text-[11px] font-black uppercase text-slate-700">{groupData.name}</span>
                                          <input 
                                            type="checkbox" 
                                            checked={true}
                                            readOnly
                                            className="ml-auto w-4 h-4 rounded border-slate-300 text-emerald-600"
                                            onClick={() => {
                                              const newGroups = slot.groups.filter((_: any, i: number) => i !== gIdx);
                                              onUpdateGroups(sIdx, newGroups);
                                            }}
                                          />
                                        </div>
                                        <Input 
                                          placeholder="Título customizado" 
                                          className="h-8 text-[10px] font-bold uppercase tracking-tight rounded-lg bg-slate-50 border-none focus-visible:ring-emerald-500/20 shadow-none"
                                          value={selectedGroup.customLabel || ""}
                                          onChange={(e) => {
                                            const newGroups = slot.groups.map((g: any, i: number) => 
                                              i === gIdx ? { ...g, customLabel: e.target.value } : g
                                            );
                                            onUpdateGroups(sIdx, newGroups);
                                          }}
                                        />
                                      </div>
                                    )}
                                  </Draggable>
                                );
                              })}
                              
                              {providedGroup.placeholder}

                              <div className="pt-2 border-t border-slate-100 space-y-1">
                                <span className="text-[8px] font-black text-slate-300 uppercase block mb-2">Disponíveis:</span>
                                {allGroups.map((group: any) => (
                                    <div 
                                      key={`avail-${sIdx}-${group.id}`} 
                                      onClick={() => onUpdateGroups(sIdx, [...(slot.groups || []), { id: group.id, customLabel: "" }])}
                                      className="p-2 text-[10px] font-bold text-slate-500 hover:bg-white hover:text-emerald-600 rounded-lg cursor-pointer transition-all border border-transparent hover:border-emerald-100"
                                    >
                                      + {group.name}
                                    </div>
                                  ))
                                }
                              </div>
                            </div>
                          )}
                        </Droppable>
                      </div>
                    </div>
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
}