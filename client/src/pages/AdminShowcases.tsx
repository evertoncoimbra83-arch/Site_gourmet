import React from "react";
import { useAdminShowcases } from "./adminShowcases/logic/useAdminShowcases";
import { ShowcaseCard } from "./adminShowcases/components/ShowcaseCard";
import { ShowcaseDrawer } from "./adminShowcases/components/ShowcaseDrawer";
import { Button } from "@/components/ui/button";
import { Plus, LayoutTemplate, Loader2, Sparkles } from "lucide-react";

export default function AdminShowcasesView() {
  const { state, actions } = useAdminShowcases();

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      
      {/* HEADER PREMIUM */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-emerald-600">
            <Sparkles size={18} />
            <span className="text-[10px] font-black uppercase tracking-[0.3em]">Merchandising Visual</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">
            Gestão de <span className="text-emerald-600">Vitrines</span>
          </h1>
          <p className="text-sm md:text-base text-slate-500 font-medium italic">
            Configure quais produtos ganham destaque nos carrosséis da sua página inicial.
          </p>
        </div>
        
        <Button 
          onClick={() => actions.openEditor()}
          className="h-16 px-10 rounded-[2rem] bg-slate-900 hover:bg-emerald-600 text-white font-black uppercase text-[11px] tracking-widest shadow-2xl transition-all active:scale-95 group"
        >
          <Plus className="mr-2 group-hover:rotate-90 transition-transform" /> Nova Vitrine
        </Button>
      </header>

      {/* GRID DE VITRINES */}
      {state.isLoading && state.showcases.length === 0 ? (
        <div className="py-32 flex flex-col items-center justify-center gap-4">
          <Loader2 className="animate-spin text-emerald-600" size={48} />
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sincronizando Vitrines...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {state.showcases.map((showcase) => (
            <ShowcaseCard 
              key={showcase.id} 
              showcase={showcase} 
              onClick={() => actions.openEditor(showcase)} 
            />
          ))}

          {/* Estado Vazio */}
          {state.showcases.length === 0 && !state.isLoading && (
            <div className="col-span-full py-20 border-2 border-dashed border-slate-100 rounded-[3rem] flex flex-col items-center justify-center bg-slate-50/50">
              <LayoutTemplate size={48} className="text-slate-200 mb-4" />
              <p className="text-slate-400 font-black text-[10px] uppercase tracking-widest">Nenhuma vitrine configurada</p>
            </div>
          )}
        </div>
      )}

      {/* DRAWER DE EDIÇÃO (COMPONENTE ISOLADO) */}
      <ShowcaseDrawer 
        open={state.isDrawerOpen}
        onClose={actions.closeEditor}
        editingShowcase={state.editingShowcase}
        allProducts={state.allProducts}
        searchTerm={state.searchTerm}
        onSearchChange={actions.setSearchTerm}
        onToggleProduct={actions.toggleProduct}
        onSave={actions.handleSave}
        isSaving={state.isSaving}
        onFieldChange={(field, value) => actions.updateFields(field, value)}
      />
    </div>
  );
}