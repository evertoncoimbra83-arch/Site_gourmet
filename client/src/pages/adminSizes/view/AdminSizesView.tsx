import React from "react";
import { useAdminSizes, AdminTab } from "../logic/useAdminSizes";
import { SizeCard } from "../components/SizeCard";
import { GroupOptionsList } from "../components/GroupOptionsList";
import { MasterAccompanimentsList } from "../components/MasterAccompanimentsList"; 
import { Button } from "@/components/ui/button";
import { Settings2, Layers, Plus, Trash2, Ruler, Database } from "lucide-react";
import { cn } from "@/lib/utils";
import { trpc } from "@/_core/trpc"; 
import { toast } from "@/components/ui/use-toast";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";

export function AdminSizesView() {
  const { state, actions, data, mutations } = useAdminSizes();
  const utils = trpc.useUtils();

  const getSizeStyle = (name: string) => {
    const n = name.toUpperCase();
    if (n.includes('P') || n.includes('PEQUENO')) return { color: "text-blue-500", bg: "bg-blue-50", label: "Compacto" };
    if (n.includes('G') || n.includes('GRANDE')) return { color: "text-amber-500", bg: "bg-amber-50", label: "Família" };
    return { color: "text-emerald-500", bg: "bg-emerald-50", label: "Padrão" };
  };

  const upsertGroup = trpc.admin.accompaniments.groups.upsert.useMutation({
    onSuccess: () => {
      utils.admin.accompaniments.groups.list.invalidate(); 
      toast.success("Grupo salvo!");
    }
  });

  const deleteGroup = trpc.admin.accompaniments.groups.delete.useMutation({
    onSuccess: () => {
      utils.admin.accompaniments.groups.list.invalidate();
      toast.success("Grupo removido.");
    }
  });

  const onDragEnd = (result: DropResult) => {
    const { destination, source, type } = result;

    if (!destination) return;
    if (destination.index === source.index && destination.droppableId === source.droppableId) return;

    // 📦 REORDENAÇÃO DE TAMANHOS (Lista Principal)
    if (type === "SIZE") {
        const items = Array.from(data.sizes || []);
        const [reorderedItem] = items.splice(source.index, 1);
        items.splice(destination.index, 0, reorderedItem);

        items.forEach((item: any, index: number) => {
          if (item.displayOrder !== index) {
            mutations.updateSize.mutate({ id: item.id, displayOrder: index });
          }
        });
        toast.success("Ordem dos tamanhos atualizada!");
    }

    // 📂 REORDENAÇÃO DE GRUPOS (Interno do Card)
    if (type === "GROUP") {
        const sizeId = Number(destination.droppableId.split('-')[2]);
        const size = data.sizes.find((s: any) => s.id === sizeId);
        
        if (!size) return;

        const linkedIds = state.linkedGroups[sizeId] || [];
        const linkedGroups = data.groups.filter((g: any) => linkedIds.includes(Number(g.id)));

        const orderMap = Array.isArray(size.groupsOrder) ? size.groupsOrder : [];
        const currentItems = [...linkedGroups].sort((a, b) => {
          const idxA = orderMap.indexOf(Number(a.id));
          const idxB = orderMap.indexOf(Number(b.id));
          return (idxA === -1 ? 999 : idxA) - (idxB === -1 ? 999 : idxB);
        });

        const [reordered] = currentItems.splice(source.index, 1);
        currentItems.splice(destination.index, 0, reordered);

        const newOrderIds = currentItems.map((g: any) => Number(g.id));

        actions.updateSize(sizeId, { groupsOrder: newOrderIds });
        toast.success("Nova ordem dos grupos salva!");
    }
  };

  const handleCreateGroup = () => {
    const name = prompt("Nome do novo grupo:");
    if (!name) return;
    upsertGroup.mutate({ name: name.toUpperCase(), maxSelections: 1, minSelections: 0, isActive: true });
  };

  const handleCreateSize = () => {
    const name = prompt("Nome do tamanho (ex: Marmita P):");
    if (!name) return;
    mutations.createSize.mutate({ name, priceModifier: 0, displayOrder: (data.sizes?.length || 0) });
  };

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-700 p-4 md:p-6 pb-24 bg-[#F8FAFC]">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 md:gap-6 mb-6 md:mb-10">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-emerald-600 font-bold">
            <Settings2 size={18} />
            <span className="text-[10px] uppercase tracking-[0.3em]">Engenharia de Porções</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">
            Menu <span className="text-emerald-600">Master</span>.
          </h1>
        </div>
        <Button onClick={state.activeTab === 'sizes' ? handleCreateSize : handleCreateGroup} className={cn("h-16 px-10 rounded-[2rem] font-black text-[11px] uppercase tracking-widest gap-2 shadow-xl transition-all active:scale-95", state.activeTab === 'sizes' ? "bg-slate-900 text-white" : "bg-emerald-600 text-white shadow-emerald-900/20")}>
          <Plus size={18}/> {state.activeTab === 'sizes' ? "Novo Tamanho" : "Novo Grupo"}
        </Button>
      </header>

      <div className="flex p-1.5 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm sticky top-4 z-20 overflow-x-auto no-scrollbar max-w-2xl">
        {(['sizes', 'groups', 'items'] as const).map((tab) => (
          <button key={tab} onClick={() => actions.setActiveTab(tab as AdminTab)} className={cn("flex-1 min-w-[100px] flex items-center justify-center gap-3 py-4 rounded-[1.8rem] text-[10px] font-black uppercase tracking-widest transition-all", state.activeTab === tab ? "bg-slate-900 text-white shadow-lg" : "text-slate-400 hover:text-slate-600")}>
            {tab === 'sizes' && <Ruler size={14} />}
            {tab === 'groups' && <Layers size={14} />}
            {tab === 'items' && <Database size={14} />}
            <span>{tab === 'sizes' ? 'Tamanhos' : tab === 'groups' ? 'Grupos' : 'Itens'}</span>
          </button>
        ))}
      </div>

      <div className="min-h-[400px]">
        <DragDropContext onDragEnd={onDragEnd}>
          {state.activeTab === 'sizes' && (
            <Droppable droppableId="sizes-list" type="SIZE">
              {(provided) => (
                <div {...provided.droppableProps} ref={provided.innerRef} className="grid grid-cols-1 gap-8">
                  {data.sizes?.map((size: any, index: number) => {
                    const style = getSizeStyle(size.name);
                    return (
                      <Draggable key={`size-${size.id}`} draggableId={`size-${size.id}`} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            style={{ ...provided.draggableProps.style }}
                            className={cn("relative transition-all", snapshot.isDragging && "z-50")}
                          >
                            <div className={cn("absolute -top-2.5 left-12 px-4 py-1 rounded-full text-[8px] font-black uppercase tracking-widest z-10 shadow-sm border", style.bg, style.color, "border-current/10")}>
                              {style.label}
                            </div>
                            
                            <SizeCard 
                              size={size}
                              groups={data.groups}
                              linkedIds={state.linkedGroups[size.id]}
                              isExpanded={state.expandedSize === size.id}
                              dragHandleProps={provided.dragHandleProps}
                              onToggleExpand={() => actions.setExpandedSize(state.expandedSize === size.id ? null : size.id)}
                              onUpdate={(id: number, updated: any) => actions.updateSize(id, updated)}
                              onDelete={() => mutations.deleteSize.mutate({ id: size.id })}
                              onToggleLink={(sizeId: number, groupId: number) => actions.toggleLink(sizeId, groupId)}
                            />
                          </div>
                        )}
                      </Draggable>
                    );
                  })}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          )}
        </DragDropContext>

        {state.activeTab === 'groups' && (
          <div className="grid grid-cols-1 gap-6">
             {data.groups?.map((group: any) => (
               <div key={group.id} className="group overflow-hidden rounded-[3rem] border border-slate-100 bg-white shadow-sm transition-all hover:border-emerald-100">
                 <div className="flex justify-between items-center p-8 gap-6">
                    <div className="flex items-center gap-6">
                       <div className="h-16 w-16 rounded-[1.5rem] bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-emerald-600 group-hover:text-white transition-all duration-500 shadow-inner"><Layers size={28} /></div>
                       <div>
                         <span className="text-[9px] font-black uppercase tracking-[0.2em] text-emerald-600 block mb-0.5">Customização</span>
                         <h3 className="text-3xl font-black uppercase tracking-tighter italic text-slate-900 leading-none truncate">{group.name}</h3>
                       </div>
                    </div>
                    <div className="flex items-center gap-2">
                       <Button variant="ghost" size="icon" onClick={() => confirm(`Remover grupo?`) && deleteGroup.mutate({ id: group.id })} className="text-slate-200 hover:text-red-500 rounded-xl h-12 w-12"><Trash2 size={18} /></Button>
                       <Button onClick={() => actions.setExpandedGroup(state.expandedGroup === group.id ? null : group.id)} className={cn("h-14 px-10 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all shadow-md", state.expandedGroup === group.id ? "bg-slate-900 text-white" : "bg-slate-50 text-slate-600")}>{state.expandedGroup === group.id ? "Fechar" : "Gerenciar"}</Button>
                    </div>
                 </div>
                 {state.expandedGroup === group.id && (
                   <div className="border-t border-slate-50 bg-[#FBFBFC] p-4 md:p-10 animate-in slide-in-from-top-2 duration-300">
                     <GroupOptionsList groupId={group.id} />
                   </div>
                 )}
               </div>
             ))}
          </div>
        )}

        {state.activeTab === 'items' && <div className="animate-in slide-in-from-right-4 duration-500"><MasterAccompanimentsList /></div>}
      </div>
    </div>
  );
}