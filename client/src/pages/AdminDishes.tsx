import React, { useState, useMemo } from "react";
import { useAdminDishes } from "./adminDishes/logic/useAdminDishes";
import { Button } from "@/components/ui/button";
import { DishCard } from "./adminDishes/components/DishCard.tsx";
import { DishDrawer } from "./adminDishes/components/DishDrawer";
import { CategoryManager } from "./adminDishes/components/CategoryManager";
import { IngredientManager } from "./adminDishes/components/IngredientManager";

import {
  Search, Plus, Loader2,
  UtensilsCrossed, LayoutGrid, ListFilter, Tag, Eye, EyeOff, Beaker, ChevronDown,
  ChevronLeft, ChevronRight,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

// ✅ Interface reforçada
interface Dish {
  id: string | number;
  name: string;
  price: number | string;
  isActive: boolean | number;
  imageUrl?: string | null;
  categoryId?: number | string | null;
  [key: string]: unknown;
}

interface Category {
  id: string | number;
  name: string;
}

interface AdminDishesHook {
  state: {
    search: string;
    selectedCategory: number | undefined;
    isLoading: boolean;
    showInactive: boolean;
    page: number;
    pageSize: number;
    isDialogOpen: boolean;
    editingDish: Dish | null;
    editingDishId: string | number | null;
  };
  actions: {
    setSearch: (val: string) => void;
    setSelectedCategory: (val: number | undefined) => void;
    setShowInactive: (val: boolean) => void;
    setPage: (val: number) => void;
    setPageSize: (val: number) => void;
    setIsDialogOpen: (val: boolean) => void;
    handleEdit: (dish: Dish) => void;
    handleCreate: () => void;
    // ✅ FIX: Tipagem de ação sem 'any'
    handleSave: (data: Record<string, unknown>) => void;
  };
  data: {
    dishes: Dish[];
    categories: Category[];
    total: number;
    totalPages: number;
    pageSize: number;
  };
  mutations: {
    deleteMutation: { mutate: (params: { id: number }) => void };
    toggleActiveMutation: { mutate: (params: { id: string | number; isActive: boolean }) => void };
  };
}

export default function AdminDishes() {
  const { state, actions, data, mutations } = (useAdminDishes() as unknown) as AdminDishesHook;
  const [drawerTab, setDrawerTab] = useState<string>("geral");
  const [autoOpenMedia, setAutoOpenMedia] = useState(false);

  const rawDishes = useMemo(() => (Array.isArray(data?.dishes) ? data.dishes : []), [data?.dishes]);
  const categoriesList = useMemo(() => (Array.isArray(data?.categories) ? data.categories : []), [data?.categories]);

  const dishesList = rawDishes;
  const totalDishes = Number(data.total || 0);
  const currentPage = Math.max(Number(state.page || 1), 1);
  const totalPages = Math.max(Number(data.totalPages || 1), 1);
  const pageSize = Number(data.pageSize || state.pageSize || 50);
  const firstVisible = totalDishes === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const lastVisible = Math.min(currentPage * pageSize, totalDishes);
  const hasFilters = Boolean(state.search?.trim()) || state.selectedCategory !== undefined || !state.showInactive;

  const openEdit = (dish: Dish) => {
    setDrawerTab("geral");
    setAutoOpenMedia(false);
    actions.handleEdit(dish);
  };

  const openEditWithMedia = (dish: Dish) => {
    setDrawerTab("geral");
    setAutoOpenMedia(true);
    actions.handleEdit(dish);
  };

  const openCreate = () => {
    setDrawerTab("geral");
    setAutoOpenMedia(false);
    actions.handleCreate();
  };

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20 px-4 md:px-0 text-left">

      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between pt-4">
        <div className="space-y-2 text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-2 text-emerald-600">
            <UtensilsCrossed size={14} className="animate-pulse" />
            <span className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em]">Engenharia de Alimentos</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tighter italic uppercase leading-none">
            Produção <span className="text-emerald-600">&</span> Cardápio<span className="text-emerald-600">.</span>
          </h1>
        </div>

        <Button
          onClick={openCreate}
          className="h-14 px-8 rounded-4xl bg-slate-950 hover:bg-emerald-600 text-white shadow-xl transition-all font-black uppercase text-[10px] md:text-[11px] tracking-widest active:scale-95 group"
        >
          <Plus className="mr-2 h-5 w-5 group-hover:rotate-90 transition-transform" />
          Novo prato
        </Button>
      </div>

      <Tabs defaultValue="pratos" className="w-full">
        <div className="flex flex-col gap-4 mb-6 md:mb-8">
          <TabsList className="bg-slate-100 p-1 rounded-2xl h-14 md:h-16 w-full flex border border-slate-200/50 shadow-inner">
            <TabsTrigger value="pratos" className="flex-1 rounded-xl font-black text-[9px] md:text-[10px] uppercase h-full data-[state=active]:bg-white data-[state=active]:text-emerald-600 shadow-sm transition-all gap-2">
              <LayoutGrid size={14} /> Pratos
            </TabsTrigger>
            <TabsTrigger value="insumos" className="flex-1 rounded-xl font-black text-[9px] md:text-[10px] uppercase h-full data-[state=active]:bg-white data-[state=active]:text-emerald-600 shadow-sm transition-all gap-2">
              <Beaker size={14} /> Insumos
            </TabsTrigger>
            <TabsTrigger value="categorias" className="flex-1 rounded-xl font-black text-[9px] md:text-[10px] uppercase h-full data-[state=active]:bg-white data-[state=active]:text-emerald-600 shadow-sm transition-all gap-2">
              <ListFilter size={14} /> Categorias
            </TabsTrigger>
          </TabsList>

          <div
            className={cn(
                "flex items-center justify-between md:justify-start gap-3 px-5 h-12 rounded-2xl border transition-all cursor-pointer select-none",
                state.showInactive ? "bg-slate-900 border-slate-900" : "bg-white border-slate-100"
            )}
            onClick={() => actions.setShowInactive(!state.showInactive)}
          >
              <div className="flex items-center gap-3">
                {state.showInactive ? <Eye size={16} className="text-emerald-400" /> : <EyeOff size={16} className="text-slate-300" />}
                <span className={cn("text-[9px] font-black uppercase tracking-widest", state.showInactive ? "text-white" : "text-slate-400")}>
                    {state.showInactive ? "Mostrando Tudo" : "Ocultando Inativos"}
                </span>
              </div>
              <Switch checked={!!state.showInactive} onCheckedChange={(v) => actions.setShowInactive(v)} className="scale-75" />
          </div>
        </div>

        <TabsContent value="pratos" className="space-y-6 md:space-y-8 outline-none m-0">
          <div className="flex flex-col sm:flex-row items-stretch gap-3 md:gap-4 w-full">
            <div className="relative grow group">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300 group-focus-within:text-emerald-500 transition-colors z-10" />
              <Input
                placeholder="Pesquisar prato..."
                className="h-14 md:h-16 pl-14 pr-6 rounded-[1.5rem] border-none bg-white shadow-sm text-sm md:text-base text-slate-600 font-medium w-full focus-visible:ring-4 focus-visible:ring-emerald-500/5 transition-all"
                value={state.search || ""}
                onChange={(e) => actions.setSearch(e.target.value)}
              />
            </div>

            <div className="relative w-full sm:w-72 shrink-0">
              <Tag className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-500 z-10" />
              <select
                className="w-full h-14 md:h-16 pl-12 pr-10 rounded-[1.5rem] border-none bg-white shadow-sm text-[10px] font-black uppercase text-slate-600 outline-none appearance-none cursor-pointer focus:ring-4 focus:ring-emerald-500/5 transition-all"
                value={state.selectedCategory || "all"}
                onChange={(e) => {
                  const val = e.target.value;
                  actions.setSelectedCategory(val === "all" ? undefined : Number(val));
                }}
              >
                <option value="all">TODAS AS CATEGORIAS</option>
                {categoriesList.map((cat: Category) => (
                  <option key={String(cat.id)} value={cat.id}>{String(cat.name).toUpperCase()}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 pointer-events-none" />
            </div>
          </div>

          <div className="flex flex-col gap-3 rounded-[1.5rem] bg-white px-5 py-4 shadow-sm md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                {totalDishes === 0
                  ? "Nenhum prato para exibir"
                  : `Mostrando ${firstVisible}-${lastVisible} de ${totalDishes} pratos`}
              </p>
              <p className="mt-1 text-xs font-semibold text-slate-400">
                Pagina {currentPage} de {totalPages}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                className="h-10 rounded-xl border border-slate-100 bg-slate-50 px-3 text-[10px] font-black uppercase text-slate-500 outline-none"
                value={pageSize}
                onChange={(event) => actions.setPageSize(Number(event.target.value))}
              >
                <option value={25}>25 por pagina</option>
                <option value={50}>50 por pagina</option>
                <option value={100}>100 por pagina</option>
                <option value={200}>200 por pagina</option>
              </select>
              <Button
                type="button"
                variant="outline"
                className="h-10 rounded-xl border-slate-100 px-3"
                disabled={currentPage <= 1 || state.isLoading}
                onClick={() => actions.setPage(currentPage - 1)}
              >
                <ChevronLeft size={16} />
                Anterior
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-10 rounded-xl border-slate-100 px-3"
                disabled={currentPage >= totalPages || state.isLoading}
                onClick={() => actions.setPage(currentPage + 1)}
              >
                Proxima
                <ChevronRight size={16} />
              </Button>
            </div>
          </div>

          {state.isLoading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <Loader2 className="h-10 w-10 animate-spin text-emerald-500" />
              <p className="text-[10px] font-black uppercase text-slate-400">Carregando Cozinha...</p>
            </div>
          ) : (
            dishesList.length === 0 ? (
              <div className="rounded-[2rem] border border-dashed border-slate-200 bg-white px-6 py-14 text-center">
                <p className="text-sm font-black uppercase tracking-widest text-slate-400">
                  {hasFilters ? "Nenhum prato encontrado pelos filtros" : "Nenhum prato cadastrado"}
                </p>
                <p className="mt-2 text-sm text-slate-400">
                  {hasFilters
                    ? "Ajuste a busca, categoria ou visibilidade para ampliar a listagem."
                    : "Crie o primeiro prato para iniciar o cardapio."}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4 md:gap-6">
                <AnimatePresence mode="popLayout">
                  {dishesList.map((dish, index) => (
                    <motion.div
                      key={String(dish.id)}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.2, delay: index * 0.02 }}
                    >
                      <DishCard
                        dish={dish}
                        onEdit={() => openEdit(dish)}
                        onImageClick={() => openEditWithMedia(dish)}
                        onDelete={() => mutations.deleteMutation.mutate({ id: Number(dish.id) })}
                        onToggle={(id, active) => mutations.toggleActiveMutation.mutate({ id, isActive: active })}
                        isEditing={state.editingDishId === dish.id}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )
          )}
        </TabsContent>

        <TabsContent value="insumos">
          <IngredientManager />
        </TabsContent>

        <TabsContent value="categorias">
          <CategoryManager />
        </TabsContent>
      </Tabs>

      <DishDrawer
        open={state.isDialogOpen}
        onClose={() => {
            actions.setIsDialogOpen(false);
            setAutoOpenMedia(false);
        }}
        dish={state.editingDish}
        defaultTab={drawerTab}
        autoOpenMedia={autoOpenMedia}
        // ✅ FIX: Removido 'any' e aplicado saneamento tipado
        onSubmit={(data) => {
          const sanitizedData = { ...(data as Record<string, unknown>) };

          if (!sanitizedData.categoryId || sanitizedData.categoryId === "all") {
            delete sanitizedData.categoryId;
          } else {
            sanitizedData.categoryId = Number(sanitizedData.categoryId);
          }

          actions.handleSave(sanitizedData);
        }}
        categories={categoriesList}
      />
    </div>
  );
}
