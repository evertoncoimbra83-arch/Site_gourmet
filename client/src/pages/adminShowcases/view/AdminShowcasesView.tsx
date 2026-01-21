// client/src/pages/adminShowcases/view/AdminShowcasesView.tsx
import { useAdminShowcases } from "../logic/useAdminShowcases";
import { ShowcaseCard } from "../components/ShowcaseCard";
import { ShowcaseDrawer } from "../components/ShowcaseDrawer"; // Criar conforme lógica anterior
import { Button } from "@/components/ui/button";
import { Plus, LayoutTemplate, Loader2 } from "lucide-react";

export function AdminShowcasesView() {
  const { state, actions } = useAdminShowcases();

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-emerald-600">
            <LayoutTemplate size={18} />
            <span className="text-[10px] font-black uppercase tracking-[0.3em]">Merchandising</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">
            Gestão de <span className="text-emerald-600">Vitrines</span>
          </h1>
        </div>
        
        <Button 
          onClick={() => actions.openEditor()}
          className="h-16 px-10 rounded-[2rem] bg-slate-900 hover:bg-emerald-600 text-white font-black uppercase text-[11px] tracking-widest shadow-2xl transition-all"
        >
          <Plus className="mr-2" /> Nova Vitrine
        </Button>
      </header>

      {state.isLoading ? (
        <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-emerald-600" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {state.showcases.map((sc) => (
            <ShowcaseCard 
              key={sc.id} 
              showcase={sc} 
              onClick={() => actions.openEditor(sc)} 
            />
          ))}
        </div>
      )}

      {/* O Drawer que criamos, agora recebendo as actions da logic */}
      <ShowcaseDrawer 
        open={state.isDrawerOpen}
        onClose={actions.closeEditor}
        state={state}
        actions={actions}
      />
    </div>
  );
}