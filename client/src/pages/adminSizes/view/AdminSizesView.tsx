import React from "react";
import { useAdminSizes, AdminTab } from "../logic/useAdminSizes";
import { SizeCard } from "../components/SizeCard";
import { GroupOptionsList } from "../components/GroupOptionsList";
import { MasterAccompanimentsList } from "../components/MasterAccompanimentsList"; 
import { Button } from "@/components/ui/button";
import { 
  Settings2, Layers, ChevronUp, Plus, Trash2, 
  Loader2, Ruler, Database, InfoIcon
} from "lucide-react";
import { cn } from "@/lib/utils";
import { trpc } from "@/_core/trpc"; 
import { toast } from "@/components/ui/use-toast";

// ✅ CERTIFIQUE-SE DE QUE ESTA LINHA COMEÇA COM "export function"
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

  const handleCreateGroup = () => {
    const name = prompt("Nome do novo grupo:");
    if (!name) return;
    upsertGroup.mutate({ name: name.toUpperCase(), maxSelections: 1, minSelections: 0, isActive: true });
  };

  const handleCreateSize = () => {
    const name = prompt("Nome do tamanho (ex: Marmita P):");
    if (!name) return;
    mutations.createSize.mutate({ name, priceModifier: 0 });
  };

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-700 p-4 md:p-6 pb-24 bg-[#F8FAFC]">
      
      {/* HEADER DINÂMICO */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 md:gap-6 mb-6 md:mb-10">
        <div className="space-y-1 md:space-y-2">
          <div className="flex items-center gap-2 text-emerald-600">
            <Settings2 size={16} className="md:w-[18px]" />
            <span className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em]">Engenharia de Porções</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">
            Menu <span className="text-emerald-600">Master</span>.
          </h1>
        </div>

        <Button 
          onClick={state.activeTab === 'sizes' ? handleCreateSize : handleCreateGroup}
          className={cn(
            "w-full md:w-auto h-14 md:h-16 px-6 md:px-10 rounded-[1.5rem] md:rounded-[2rem] font-black text-[10px] md:text-[11px] uppercase tracking-widest gap-2 shadow-xl transition-all active:scale-95",
            state.activeTab === 'sizes' ? "bg-slate-900 text-white" : "bg-emerald-600 text-white shadow-emerald-900/20"
          )}
        >
          <Plus size={18}/>
          {state.activeTab === 'sizes' ? "Novo Tamanho" : "Novo Grupo"}
        </Button>
      </header>

      {/* TABS SELECTOR */}
      <div className="flex p-1.5 bg-white rounded-[2rem] md:rounded-[2.5rem] border border-slate-100 shadow-sm sticky top-4 z-20 overflow-x-auto no-scrollbar max-w-2xl">
        {(['sizes', 'groups', 'items'] as const).map((tab) => (
          <button 
            key={tab}
            onClick={() => actions.setActiveTab(tab as AdminTab)}
            className={cn(
              "flex-1 min-w-[100px] flex items-center justify-center gap-2 md:gap-3 px-4 md:px-6 py-3 md:py-4 rounded-[1.4rem] md:rounded-[1.8rem] text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all",
              state.activeTab === tab ? "bg-slate-900 text-white shadow-lg" : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
            )}
          >
            {tab === 'sizes' && <Ruler size={14} />}
            {tab === 'groups' && <Layers size={14} />}
            {tab === 'items' && <Database size={14} />}
            <span className="inline">{tab === 'sizes' ? 'Tamanhos' : tab === 'groups' ? 'Grupos' : 'Itens'}</span>
          </button>
        ))}
      </div>

      <div className="min-h-[400px]">
        {state.activeTab === 'sizes' && (
          <div className="grid grid-cols-1 gap-6 md:gap-8 animate-in slide-in-from-bottom-4 duration-500">
            {data.sizes?.map((size: any) => {
              const style = getSizeStyle(size.name);
              return (
                <div key={size.id} className="relative">
                  <div className={cn("absolute -top-2.5 left-6 md:left-12 px-3 md:px-4 py-0.5 md:py-1 rounded-full text-[7px] md:text-[8px] font-black uppercase tracking-widest z-10 shadow-sm border", style.bg, style.color, "border-current/10")}>
                    {style.label}
                  </div>
                  <SizeCard 
                    size={size}
                    groups={data.groups}
                    linkedIds={state.linkedGroups[size.id]}
                    isExpanded={state.expandedSize === size.id}
                    onToggleExpand={() => actions.setExpandedSize(state.expandedSize === size.id ? null : size.id)}
                    onUpdate={(id: number, updated: any) => mutations.updateSize.mutate({ id, ...updated })}
                    onDelete={() => mutations.deleteSize.mutate({ id: size.id })}
                  />
                </div>
              );
            })}
          </div>
        )}

        {state.activeTab === 'groups' && (
          <div className="grid grid-cols-1 gap-4 md:gap-6 animate-in fade-in duration-500">
             {data.groups?.map((group: any) => (
               <div key={group.id} className="group overflow-hidden rounded-[2rem] md:rounded-[3rem] border border-slate-100 bg-white shadow-sm transition-all hover:border-emerald-100">
                 <div className="flex flex-col sm:flex-row justify-between items-center p-6 md:p-8 gap-6">
                   <div className="flex items-center gap-4 md:gap-6 w-full sm:w-auto">
                      <div className="h-12 w-12 md:h-16 md:w-16 rounded-[1rem] md:rounded-[1.5rem] bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-emerald-600 group-hover:text-white transition-all duration-500 shadow-inner shrink-0">
                        <Layers size={22} className="md:w-7 md:h-7" />
                      </div>
                      <div className="min-w-0">
                        <span className="text-[8px] md:text-[9px] font-black uppercase tracking-[0.2em] text-emerald-600 block mb-0.5">Customização</span>
                        <h3 className="text-xl md:text-3xl font-black uppercase tracking-tighter italic text-slate-900 leading-none truncate">
                          {group.name}
                        </h3>
                      </div>
                   </div>
                   
                   <div className="flex items-center gap-2 w-full sm:w-auto">
                     <Button
                       variant="ghost"
                       size="icon"
                       onClick={() => confirm(`Deseja remover o grupo "${group.name}"?`) && deleteGroup.mutate({ id: group.id })}
                       className="text-slate-200 hover:text-red-500 hover:bg-red-50 rounded-xl h-12 w-12"
                     >
                       <Trash2 size={18} />
                     </Button>

                     <Button 
                       onClick={() => actions.setExpandedGroup(state.expandedGroup === group.id ? null : group.id)}
                       className={cn(
                         "flex-1 sm:flex-none h-12 md:h-14 px-6 md:px-10 rounded-xl md:rounded-2xl font-black text-[9px] md:text-[11px] uppercase tracking-widest transition-all shadow-md",
                         state.expandedGroup === group.id ? "bg-slate-900 text-white" : "bg-slate-50 text-slate-600 hover:bg-emerald-50"
                       )}
                     >
                       {state.expandedGroup === group.id ? "Fechar" : "Gerenciar"}
                     </Button>
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

        {(state.activeTab as string) === 'items' && (
          <div className="animate-in slide-in-from-right-4 duration-500">
            <MasterAccompanimentsList />
          </div>
        )}
      </div>
    </div>
  );
}