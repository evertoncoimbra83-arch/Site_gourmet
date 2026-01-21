import { useAdminDishes } from "./adminDishes/logic/useAdminDishes";
import { Button } from "@/components/ui/button";
import { DishCard } from "./adminDishes/components/DishCard";
import { DishDrawer } from "./adminDishes/components/DishDrawer"; 
import { CategoryManager } from "./adminDishes/components/CategoryManager"; 
import { 
  Search, Plus, Loader2, ChevronLeft, ChevronRight, 
  UtensilsCrossed, LayoutGrid, ListFilter 
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"; 

export default function AdminDishes() {
  const { state, actions, data, mutations } = useAdminDishes();

  const dishesList = data?.dishes || [];

  // ✅ CORRIGIDO: Agora usa o helper centralizado do hook
  const openCreate = () => {
    actions.handleCreate();
  };

  // ✅ CORRIGIDO: Agora usa o helper que dispara a busca por ID
  const openEdit = (dish: any) => {
    actions.handleEdit(dish);
  };

  const handleDelete = (id: number) => {
    if (window.confirm("Excluir este prato permanentemente?")) {
      mutations.deleteMutation.mutate({ id });
    }
  };

  const canPaginate = (data?.totalPages || 0) > 1;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      
      {/* 1. TOPBAR PADRONIZADA */}
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between px-2">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-emerald-600">
            <UtensilsCrossed size={16} className="animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em]">Catálogo Profissional</span>
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter italic uppercase leading-none">
            Cardápio <span className="text-emerald-600">&</span> Categorias<span className="text-emerald-600">.</span>
          </h1>
          <p className="text-sm text-slate-500 font-medium italic">
            Gerencie o menu, regras de acompanhamentos e identidade visual dos itens.
          </p>
        </div>

        <Button 
          onClick={openCreate} 
          className="h-14 px-8 rounded-3xl bg-slate-950 hover:bg-emerald-600 text-white shadow-xl shadow-slate-200 transition-all font-black uppercase text-[11px] tracking-widest active:scale-95 group"
        >
          <Plus className="mr-2 h-5 w-5 group-hover:rotate-90 transition-transform" />
          Novo prato
        </Button>
      </div>

      {/* 2. NAVEGAÇÃO POR ABAS */}
      <Tabs defaultValue="pratos" className="w-full">
        <TabsList className="bg-slate-100 p-1 rounded-2xl h-16 mb-10 w-full max-w-md border border-slate-200/50 shadow-inner">
          <TabsTrigger 
            value="pratos" 
            className="flex-1 rounded-xl font-black text-[10px] uppercase tracking-widest h-full data-[state=active]:bg-white data-[state=active]:text-emerald-600 data-[state=active]:shadow-md transition-all gap-2"
          >
            <LayoutGrid size={16} />
            Pratos
          </TabsTrigger>
          <TabsTrigger 
            value="categorias" 
            className="flex-1 rounded-xl font-black text-[10px] uppercase tracking-widest h-full data-[state=active]:bg-white data-[state=active]:text-emerald-600 data-[state=active]:shadow-md transition-all gap-2"
          >
            <ListFilter size={16} />
            Categorias
          </TabsTrigger>
        </TabsList>

        {/* --- CONTEÚDO DA ABA PRATOS --- */}
        <TabsContent value="pratos" className="space-y-8 outline-none animate-in fade-in zoom-in-95 duration-300">
          <div className="group relative">
            <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
            </div>
            <Input
              placeholder="Buscar pelo nome do prato ou ingrediente..."
              className="h-16 pl-14 pr-6 rounded-3xl border-none bg-white shadow-sm focus-visible:ring-2 focus-visible:ring-emerald-500/20 text-slate-600 font-medium placeholder:text-slate-300 transition-all"
              value={state.search || ""}
              onChange={(e) => actions.setSearch(e.target.value)}
            />
          </div>

          {state.isLoading ? (
            <div className="flex flex-col items-center justify-center gap-4 rounded-[2.5rem] border-2 border-dashed border-slate-100 bg-white/50 py-32">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Sincronizando catálogo...</p>
            </div>
          ) : (
            <div className="space-y-10">
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <AnimatePresence mode="popLayout">
                  {dishesList.map((dish: any, index: number) => (
                    <motion.div
                      key={dish.id}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                    >
                      <DishCard
                        dish={dish}
                        onEdit={() => openEdit(dish)}
                        onDelete={() => handleDelete(dish.id)}
                        onToggle={(id, active) =>
                          mutations.toggleActiveMutation.mutate({ id, isActive: active })
                        }
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              {canPaginate && (
                <div className="flex items-center justify-center gap-4 py-10">
                  <Button
                    variant="outline"
                    className="h-14 px-6 rounded-2xl border-none bg-white shadow-sm hover:bg-slate-50 font-bold uppercase text-[10px] tracking-widest transition-all disabled:opacity-30"
                    onClick={() => actions.setPage(Math.max(1, state.page - 1))}
                    disabled={state.page === 1}
                  >
                    <ChevronLeft className="mr-2 h-4 w-4" />
                    Anterior
                  </Button>

                  <div className="h-14 flex items-center px-6 rounded-2xl bg-white border border-emerald-50 shadow-sm text-[10px] font-black">
                    <span className="text-emerald-600 italic text-base">{state.page}</span>
                    <span className="mx-3 text-slate-200">/</span>
                    <span className="text-slate-400">{data?.totalPages || 0}</span>
                  </div>

                  <Button
                    variant="outline"
                    className="h-14 px-6 rounded-2xl border-none bg-white shadow-sm hover:bg-slate-50 font-bold uppercase text-[10px] tracking-widest transition-all disabled:opacity-30"
                    onClick={() => actions.setPage(Math.min(data?.totalPages || 1, state.page + 1))}
                    disabled={state.page === data?.totalPages}
                  >
                    Próximo
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="categorias" className="outline-none animate-in fade-in slide-in-from-right-4 duration-500">
          <CategoryManager />
        </TabsContent>
      </Tabs>

      {/* ✅ COMPONENTE INTEGRADO */}
      <DishDrawer
        open={state.isDialogOpen}
        onClose={() => actions.setIsDialogOpen(false)}
        dish={state.editingDish} // Agora recebe o prato completo buscado por ID no hook
        onSubmit={(values: any) => mutations.upsertMutation.mutate(values)}
        categories={data?.categories || []}
      />
    </div>
  );
}