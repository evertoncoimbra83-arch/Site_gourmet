// client/src/pages/admin/packages/view/AdminPackagesView.tsx
import React, { useState, useMemo, useCallback, ComponentProps } from "react"; // ✅ ComponentProps adicionado novamente
import { useAdminPackages, AdminPackage, PackageFormData } from "../logic/hooks/useAdminPackages";
import { PackageDrawer } from "../components/PackageDrawer";
import { PackageCard } from "../components/PackageCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Loader2, Box, LayoutGrid, Search, X, Filter } from "lucide-react";
import { appToast as toast } from "@/lib/app-toast";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

// ✅ Interface local estendida
interface ExtendedAdminPackage extends AdminPackage {
  category?: string;
  highlights?: string;
  isPopular?: boolean | number;
  sale_price?: string | number | null;
}

export function AdminPackagesView() {
  const { state, actions, data, mutations } = useAdminPackages();
  const [searchTerm, setSearchTerm] = useState("");
  const [packageToDelete, setPackageToDelete] = useState<string | number | null>(null);

  // 1. Filtro e Ordenação
  const filteredAndSortedPackages = useMemo(() => {
    const list = (data.packages as unknown as ExtendedAdminPackage[]) || [];

    const filtered = list.filter((pkg) =>
      pkg.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pkg.category?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return filtered.sort((a, b) => {
      const orderA = Number(a.display_order ?? 0);
      const orderB = Number(b.display_order ?? 0);
      return orderA - orderB;
    });
  }, [data.packages, searchTerm]);

  // 2. Mapeamento de dados para o Drawer
  const drawerData = useMemo(() => ({
    allDishes: data.allDishes || [],
    allOptions: data.allOptions || [],
    allAccompanimentGroups: data.allAccompanimentGroups || [],
    allCategories: data.allCategories || [],
    allSizes: (data.allSizes || []).map(size => ({
      ...size,
      defaultMainWeight: size.defaultMainWeight ? Number(size.defaultMainWeight) : undefined
    }))
  }), [data.allDishes, data.allOptions, data.allAccompanimentGroups, data.allSizes, data.allCategories]);

  // 3. Handler de salvamento
  const onFormSubmit = useCallback(async (payload: PackageFormData) => {
    try {
      await actions.handleSave(payload);
    } catch (err) {
      console.error("❌ Erro no View:", err);
      toast.error("Erro ao processar dados.");
    }
  }, [actions]);

  return (
    <div className="space-y-6 md:space-y-10 animate-in fade-in duration-700 pb-24 px-4 md:px-0 text-left">

      {/* HEADER */}
      <header className="flex flex-col md:flex-row justify-between items-center md:items-end gap-6 pt-4">
        <div className="space-y-2 w-full md:w-auto">
          <div className="flex items-center gap-2 text-slate-400">
            <LayoutGrid size={16} />
            <span className="text-[10px] font-bold uppercase tracking-[0.3em]">Gestão de Catálogo</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">
            Pacotes <span className="text-orange-600">&</span> Kits.
          </h1>
        </div>

        <Button
          onClick={actions.handleCreate}
          className="h-14 md:h-16 w-full md:w-auto px-10 rounded-2xl bg-slate-900 hover:bg-orange-600 text-white font-bold uppercase text-[11px] tracking-widest shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2"
        >
          <Plus size={18} />
          Novo Pacote
        </Button>
      </header>

      {/* FERRAMENTAS */}
      {!state.isLoading && data.packages && data.packages.length > 0 && (
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="relative w-full md:max-w-md group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-orange-500 transition-colors" size={18} />
            <Input
              placeholder="Buscar por nome ou categoria..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-12 md:h-14 pl-12 pr-12 rounded-2xl border-none bg-white shadow-sm font-medium text-sm focus-visible:ring-2 focus-visible:ring-orange-500/20 outline-none transition-all"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 hover:text-red-500"
              >
                <X size={18} />
              </button>
            )}
          </div>

          <div className="hidden md:flex gap-2">
            <div className="h-12 px-5 bg-white rounded-2xl flex items-center gap-3 text-slate-400 border border-slate-50 shadow-sm">
              <Filter size={14} />
              <span className="text-[10px] font-bold uppercase tracking-widest">Total: {filteredAndSortedPackages.length}</span>
            </div>
          </div>
        </div>
      )}

      {/* LISTA DE CARDS */}
      <main className="grid grid-cols-1 gap-4">
        {state.isLoading ? (
          <div className="flex flex-col items-center justify-center py-40 gap-4">
            <Loader2 className="animate-spin text-orange-600" size={32} />
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Sincronizando Inteligência...</p>
          </div>
        ) : filteredAndSortedPackages.length > 0 ? (
          filteredAndSortedPackages.map((pkg) => (
            <PackageCard
              key={pkg.id}
              // ✅ CORREÇÃO TS2741: Injetamos o `price` a partir do `base_price` para evitar quebra no Card e usamos ComponentProps para cast seguro.
              pkg={{ ...pkg, price: pkg.base_price } as unknown as ComponentProps<typeof PackageCard>["pkg"]}
              onEdit={() => actions.handleEdit(pkg)}
              onDelete={() => setPackageToDelete(pkg.id)}
              onToggleStatus={() => {
                const currentStatus = pkg.isActive ? "active" : "hidden";
                actions.handleToggleStatus(pkg.id, currentStatus);
              }}
            />
          ))
        ) : (
          <div className="py-24 flex flex-col items-center justify-center bg-white rounded-[2rem] border-2 border-dashed border-slate-100">
            <Box className="text-slate-100 mb-6 w-16 h-16" strokeWidth={1} />
            <h3 className="text-slate-300 font-bold uppercase text-[11px] tracking-[0.3em]">Nenhum item encontrado</h3>
          </div>
        )}
      </main>

      {/* DRAWER */}
      <PackageDrawer
        open={state.isDialogOpen}
        onClose={actions.closeDialog}
        // ✅ CORREÇÃO TS2322: Compatibiliza as diferenças sutis de nulidade (ex: null vs undefined em description)
        pkg={state.editingPackage as unknown as ComponentProps<typeof PackageDrawer>["pkg"]}
        onSubmit={onFormSubmit}
        logic={{
          state,
          // ✅ CORREÇÃO ESLINT: Remove o `any` e força o formato exato esperado pela interface do PackageDrawer
          actions: actions as unknown as ComponentProps<typeof PackageDrawer>["logic"]["actions"],
          data: drawerData,
          mutations: {
            createMutation: mutations.createMutation,
            updateMutation: mutations.updateMutation
          }
        }}
      />

      <ConfirmDialog
        open={packageToDelete !== null}
        title="Excluir Pacote"
        description="Deseja realmente excluir este pacote permanentemente?"
        confirmLabel="Confirmar"
        cancelLabel="Cancelar"
        destructive={true}
        onConfirm={() => {
          if (packageToDelete !== null) {
            actions.handleDelete(packageToDelete);
            setPackageToDelete(null);
          }
        }}
        onCancel={() => setPackageToDelete(null)}
      />
    </div>
  );
}

export default AdminPackagesView;
