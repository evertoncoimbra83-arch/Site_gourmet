import React from "react";
import { motion } from "framer-motion";

// Lógica e Subcomponentes
import { useProductsLogic } from "./products/logic/useProductsLogic";
import { ProductsHeader } from "./products/components/ProductsHeader";
import ProductsGrid from "./products/components/ProductsGrid"; 
import { CategoryIcon } from "@/pages/products/drawer/CategoryIcon";
import ProductDrawer from "./products/view/ProductDrawer";

// Componentes Globais / UI
import { SEO } from "@/components/SEO";
import { safeNumber } from "@/lib/safe-parse";
import { cn } from "@/lib/utils";
import { Utensils as UtensilsIcon } from "lucide-react";

interface Category {
  id: number;
  name: string;
  displayOrder?: number | string | null;
  iconKey?: string;
}

export default function ProductsPage() {
  const {
    state,
    actions,
    filteredProducts,
    handleOpenDish,
    handleCloseDish,
    handleSelectCategory,
  } = useProductsLogic();

  return (
    <motion.div 
      className="min-h-screen bg-[#FBFBFC] pb-32 font-sans"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <SEO 
        title="Cardápio de Marmitas Saudáveis e Fitness" 
        description="Explore nosso cardápio completo de marmitas congeladas saudáveis, fitness e low carb feitas com ingredientes selecionados e contagem de macros precisa." 
        path="/produtos"
      />

      {/* 1. CABEÇALHO (Busca e Filtros) */}
      {/* ✅ FIX TS2322: Removidas props que não existem mais no ProductsHeader */}
      <ProductsHeader 
        search={state.search || ""}
        setSearch={actions.setSearch}
      />

      <div className="max-w-7xl mx-auto -mt-7 md:-mt-9 relative z-20 px-4">
        
        {/* 2. NAVEGAÇÃO DE CATEGORIAS */}
        <div className="flex items-center gap-3 overflow-x-auto pb-8 pt-2 no-scrollbar snap-x snap-mandatory">
          <button
            onClick={() => handleSelectCategory(null)}
            className={cn(
              "snap-center h-12 md:h-14 px-6 md:px-8 rounded-xl md:rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap flex items-center gap-3 border-2 shrink-0 shadow-sm",
              (state.selectedCategory === null) 
                ? "bg-slate-900 border-slate-900 text-white shadow-xl scale-105" 
                : "bg-white border-white text-slate-400 hover:text-slate-600"
            )}
          >
            <UtensilsIcon size={14} /> Todos
          </button>
          
          {(state.catList as unknown as Category[] | undefined)
            ?.sort((a, b) => safeNumber(a.displayOrder) - safeNumber(b.displayOrder))
            .map((cat) => (
            <button
              key={`cat-${cat.id}`}
              onClick={() => handleSelectCategory(cat.id)}
              className={cn(
                "snap-center h-12 md:h-14 px-6 md:px-8 rounded-xl md:rounded-2xl text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap flex items-center gap-3 border-2 shrink-0 shadow-sm",
                Number(state.selectedCategory) === Number(cat.id) 
                  ? "bg-white border-emerald-500 text-emerald-600 shadow-xl scale-105" 
                  : "bg-white border-white text-slate-400 hover:text-slate-600"
              )}
            >
              <CategoryIcon 
                iconKey={cat.iconKey} 
                color={Number(state.selectedCategory) === Number(cat.id) ? "emerald" : "slate"} 
              />
              {cat.name}
            </button>
          ))}
        </div>

        {/* 3. GRID DE PRODUTOS */}
        <ProductsGrid 
          /* ✅ FIX TS2322: Usando ComponentProps para garantir que o tipo case perfeitamente com o Grid */
          products={filteredProducts as unknown as React.ComponentProps<typeof ProductsGrid>['products']} 
          isLoading={state.isLoading} 
          onOpenDish={handleOpenDish}
        />
      </div>
      
      {/* 4. DRAWER DE DETALHES */}
      <ProductDrawer 
        dishId={state.selectedDishId as number | null} 
        onClose={handleCloseDish} 
      />
    </motion.div>
  );
}
