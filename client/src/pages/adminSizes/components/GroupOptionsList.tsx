import { trpc } from "@/_core/trpc";
import { CheckCircle2, Circle, Loader2, GripVertical, Trash2 } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { useMemo, useState, useEffect } from "react";

export function GroupOptionsList({ groupId }: { groupId: number }) {
  const utils = trpc.useUtils();
  
  const { data: allOptions, isLoading } = trpc.admin.accompaniments.options.listAll.useQuery();
  const { data: groups } = trpc.admin.accompaniments.groups.list.useQuery();
  const currentGroup = groups?.find(g => g.id === groupId);

  const [localOrderedItems, setLocalOrderedItems] = useState<any[]>([]);

  const updateGroup = trpc.admin.accompaniments.groups.update.useMutation({
    onSuccess: () => {
      utils.admin.accompaniments.groups.list.invalidate();
    },
    onError: () => {
      toast.error("Erro ao salvar ordem");
      utils.admin.accompaniments.groups.list.invalidate();
    }
  });

  const upsertOption = trpc.admin.accompaniments.options.upsert.useMutation({
    onSuccess: () => {
      utils.admin.accompaniments.options.listAll.invalidate();
    }
  });

  const getSafeGroups = (config: any) => {
    if (!config) return [];
    if (Array.isArray(config)) return config;
    try { return typeof config === 'string' ? JSON.parse(config) : []; } catch { return []; }
  };

  const linkedOptions = useMemo(() => {
    if (!allOptions) return [];
    const linked = allOptions.filter(opt => 
      getSafeGroups(opt.groupsConfig).some((g: any) => Number(g.group_id) === groupId)
    );
    const orderIds = currentGroup?.itemsOrder || [];
    return [...linked].sort((a, b) => {
      const indexA = orderIds.indexOf(Number(a.id));
      const indexB = orderIds.indexOf(Number(b.id));
      return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
    });
  }, [allOptions, currentGroup, groupId]);

  useEffect(() => {
    setLocalOrderedItems(linkedOptions);
  }, [linkedOptions]);

  const onDragEnd = (result: DropResult) => {
    const { destination, source } = result;
    if (!destination || destination.index === source.index) return;

    const items = Array.from(localOrderedItems);
    const [reorderedItem] = items.splice(source.index, 1);
    items.splice(destination.index, 0, reorderedItem);

    setLocalOrderedItems(items);

    const newOrderIds = items.map(i => Number(i.id));
    updateGroup.mutate({ id: groupId, itemsOrder: newOrderIds });
  };

  const toggleLink = (opt: any) => {
    const configs = getSafeGroups(opt.groupsConfig);
    const isLinked = configs.some((g: any) => Number(g.group_id) === groupId);

    const newConfig = isLinked
      ? configs.filter((g: any) => Number(g.group_id) !== groupId)
      : [...configs, { group_id: groupId, price_modifier: "0.00" }];

    upsertOption.mutate({
      id: opt.id,
      name: opt.name,
      groupsConfig: newConfig,
      isActive: opt.isActive,
      accompanimentCategoryId: opt.accompanimentCategoryId
    });
  };

  if (isLoading) return <Loader2 className="animate-spin text-emerald-500" />;

  const availableOptions = allOptions?.filter(opt => 
    !getSafeGroups(opt.groupsConfig).some((g: any) => Number(g.group_id) === groupId)
  ) || [];

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <h4 className="text-[10px] font-black uppercase text-emerald-600 tracking-widest flex items-center gap-2">
          <GripVertical size={14} /> Ordem dos itens neste grupo
        </h4>

        {/* ⚠️ IMPORTANTE: 
          Se o componente pai (AdminSizesView) já tiver um DragDropContext,
          este aqui PODE FALHAR. Verifique se no AdminSizesView o Contexto
          só envolve a lista de Tamanhos, e não a tela inteira.
        */}
        <DragDropContext onDragEnd={onDragEnd}>
          {/* ✅ type="ITEM" para não chocar com "SIZE" ou "GROUP" do pai */}
          <Droppable droppableId={`drop-options-${groupId}`} direction="vertical" type="ITEM">
            {(provided) => (
              <div 
                {...provided.droppableProps} 
                ref={provided.innerRef}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 min-h-[100px] p-2 border-2 border-dashed border-slate-50 rounded-[2rem]"
              >
                {localOrderedItems.map((opt, index) => (
                  <Draggable key={`opt-${opt.id}`} draggableId={`drag-opt-${opt.id}`} index={index}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        style={{ ...provided.draggableProps.style }}
                        className={cn(
                          "flex items-center justify-between p-4 rounded-2xl border-2 transition-all bg-white",
                          snapshot.isDragging 
                            ? "border-emerald-500 scale-105 z-[100] shadow-2xl ring-4 ring-emerald-500/10" 
                            : "border-emerald-50 shadow-sm hover:border-emerald-200"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          {/* ✅ O dragHandleProps deve estar aqui */}
                          <div {...provided.dragHandleProps} className="p-1 cursor-grab active:cursor-grabbing text-slate-300 hover:text-emerald-500">
                            <GripVertical size={16} />
                          </div>
                          <CheckCircle2 size={18} className="text-emerald-500" />
                          <span className="text-[11px] font-black uppercase italic text-slate-700">{opt.name}</span>
                        </div>
                        <button 
                          onClick={(e) => { e.stopPropagation(); toggleLink(opt); }} 
                          className="p-2 hover:bg-red-50 rounded-full text-red-300 hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </div>

      <div className="pt-6 border-t border-dashed border-slate-200">
        <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-4">Adicionar ao Grupo</h4>
        <div className="flex flex-wrap gap-3">
          {availableOptions.map((opt) => (
            <button
              key={opt.id}
              onClick={() => toggleLink(opt)}
              className="flex items-center gap-3 px-6 py-4 rounded-2xl border-2 border-dashed border-slate-100 bg-slate-50/50 hover:bg-white hover:border-emerald-300 transition-all text-left"
            >
              <Circle size={18} className="text-slate-200" />
              <span className="text-[11px] font-black uppercase italic text-slate-400">{opt.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}