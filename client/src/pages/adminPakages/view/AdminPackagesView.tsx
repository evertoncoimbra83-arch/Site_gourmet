import { useState, useMemo } from "react";
import { useAdminPackages } from "../logic/useAdminPackages";
import { PackageDrawer } from "../components/PackageDrawer";
import { PackageCard } from "../components/PackageCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Loader2, Box, LayoutGrid, Search, X } from "lucide-react";

export function AdminPackagesView() {
  const { state, actions, data, mutations } = useAdminPackages();
  const [searchTerm, setSearchTerm] = useState("");

  // ✅ Filtro por nome + Ordenação por display_order
  // Isso garante que a vitrine do admin reflita exatamente a ordem do site
  const filteredAndSortedPackages = useMemo(() => {
    const list = [...(data.packages || [])];
    
    const filtered = list.filter((pkg: any) => 
      pkg.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return filtered.sort((a: any, b: any) => {
      const orderA = Number(a.displayOrder ?? a.display_order ?? 0);
      const orderB = Number(b.displayOrder ?? b.display_order ?? 0);
      return orderA - orderB;
    });
  }, [data.packages, searchTerm]);

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      
      {/* HEADER PREMIUM */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-emerald-600">
            <LayoutGrid size={18} />
            <span className="text-[10px] font-black uppercase tracking-[0.3em]">Combos & Kits</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">
            Gestão de <span className="text-emerald-600">Pacotes</span><span className="text-emerald-600">.</span>
          </h1>
          <p className="text-slate-500 font-medium text-sm md:text-base italic">
            Arquitete kits inteligentes, marmitas recorrentes e regras de escala.
          </p>
        </div>
        
        <Button 
          onClick={actions.handleCreate} // ✅ Usando a ação centralizada do logic
          className="h-16 px-10 rounded-[2rem] bg-slate-900 hover:bg-emerald-600 text-white font-black uppercase text-[11px] tracking-widest shadow-2xl transition-all active:scale-95 group"
        >
          <Plus className="mr-2 h-5 w-5 transition-transform group-hover:rotate-90" /> 
          Novo Pacote
        </Button>
      </header>

      {/* BARRA DE BUSCA ESTILIZADA */}
      {!state.isLoading && data.packages?.length > 0 && (
        <div className="relative max-w-md group">
          <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors">
            <Search size={20} />
          </div>
          <Input
            placeholder="Pesquisar pacotes pelo nome..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-14 pl-14 pr-12 rounded-[1.5rem] border-none bg-white shadow-sm font-bold text-slate-600 placeholder:text-slate-300 focus-visible:ring-2 focus-visible:ring-emerald-500/20 transition-all outline-none"
          />
          {searchTerm && (
            <button 
              onClick={() => setSearchTerm("")}
              className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 hover:text-red-500 transition-colors"
            >
              <X size={18} />
            </button>
          )}
        </div>
      )}

      {/* LISTAGEM DE PACOTES */}
      {state.isLoading ? (
        <div className="flex flex-col items-center justify-center py-40 gap-4">
          <div className="relative">
             <Loader2 className="animate-spin text-emerald-600" size={40} />
             <div className="absolute inset-0 blur-xl bg-emerald-600/20 animate-pulse" />
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">
            Sincronizando Catálogo...
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-8">
          {filteredAndSortedPackages.length > 0 ? (
            filteredAndSortedPackages.map((pkg: any) => (
              <PackageCard 
                key={pkg.id} 
                pkg={pkg} 
                isExpanded={state.expandedPackageId === pkg.id}
                onToggleExpand={() => actions.setExpandedPackageId(state.expandedPackageId === pkg.id ? null : pkg.id)}
                onEdit={() => actions.handleEdit(pkg)}
                onDelete={() => actions.handleDelete(pkg.id)}
                onToggleVisibility={(id: string, currentStatus: string) => actions.handleToggleStatus(id, currentStatus)}
              />
            ))
          ) : (
            <div className="py-32 flex flex-col items-center justify-center bg-white rounded-[3.5rem] border-2 border-dashed border-slate-100 shadow-sm transition-all hover:bg-slate-50/50 group">
                <Box className="text-slate-100 mb-4 transition-colors group-hover:text-emerald-100" size={64} />
                <p className="text-slate-300 font-black uppercase text-[10px] tracking-[0.3em] group-hover:text-slate-400 px-8 text-center leading-relaxed">
                  {searchTerm 
                    ? `Nenhum resultado para "${searchTerm}"`
                    : "Nenhum pacote configurado no catálogo"
                  }
                </p>
                {searchTerm && (
                  <Button 
                    variant="ghost" 
                    onClick={() => setSearchTerm("")}
                    className="mt-4 text-[9px] font-black uppercase tracking-widest text-emerald-600 hover:bg-emerald-50 rounded-full"
                  >
                    Limpar Busca
                  </Button>
                )}
            </div>
          )}
        </div>
      )}

      {/* DRAWER LATERAL */}
      <PackageDrawer 
        open={state.isDialogOpen} 
        onClose={actions.closeDialog}
        pkg={state.editingPackage}
        onSubmit={actions.handleSave} 
        logic={{ state, actions, data, mutations }}
      />
    </div>
  );
}