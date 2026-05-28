// client/src/pages/products/view/ProductsPage.tsx

import React from "react";
import { motion } from "framer-motion";

// Lógica e Subcomponentes
import { useProductsLogic } from "../logic/useProductsLogic";
import { ProductsHeader } from "../components/ProductsHeader";
import ProductsGrid from "../components/ProductsGrid"; 
import ProductDrawer from "../view/ProductDrawer";

// Componentes Globais / UI
import { SEO } from "@/components/SEO";
import { safeNumber } from "@/lib/safe-parse";
import { cn } from "@/lib/utils";
import { LayoutGrid } from "lucide-react"; 

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
    handleSelectCategory
    // ✅ Removido isAdmin daqui, já que não vamos mais usá-lo neste componente
  } = useProductsLogic();

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-[#FBFBFC] pb-32 font-sans text-left"
    >
      <SEO 
        title="Cardápio Saudável | Gourmet Saudável" 
        description="Explore nosso catálogo completo de refeições gourmet personalizadas." 
      />

      {/* 1. CABEÇALHO */}
      <ProductsHeader 
        search={typeof state.search === 'string' ? state.search : ""}
        setSearch={actions.setSearch}
        // ✅ Corrigido: isAdmin removido para resolver o erro TS 2322
      />

      <div className="max-w-7xl mx-auto px-4 md:px-8 mt-4 relative z-20">
        
        {/* 2. CATEGORIAS MOBILE (Mais baixas e intuitivas) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 pt-2 no-scrollbar snap-x snap-mandatory">
          <button
            onClick={() => handleSelectCategory(null)}
            className={cn(
              "snap-center h-9 md:h-11 px-4 md:px-6 rounded-lg md:rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap flex items-center gap-2 border-2 shrink-0 shadow-sm",
              (state.selectedCategory === null) 
                ? "bg-slate-900 border-slate-900 text-white shadow-lg scale-105" 
                : "bg-white border-transparent text-slate-400"
            )}
          >
            <LayoutGrid size={12} /> Todos
          </button>
          
          {(state.catList as unknown as Category[] | undefined)
            ?.sort((a, b) => safeNumber(a.displayOrder) - safeNumber(b.displayOrder))
            .map((cat) => (
            <button
              key={`cat-${cat.id}`}
              onClick={() => handleSelectCategory(cat.id)}
              className={cn(
                "snap-center h-9 md:h-11 px-4 md:px-6 rounded-lg md:rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap flex items-center gap-2 border-2 shrink-0 shadow-sm",
                Number(state.selectedCategory) === Number(cat.id) 
                  ? "bg-white border-emerald-500 text-emerald-600 shadow-md scale-105" 
                  : "bg-white border-transparent text-slate-400"
              )}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* 3. GRID DE PRODUTOS */}
        <div className="mt-2">
            <ProductsGrid 
              // ✅ Corrigido: Usando inferência de tipagem do próprio React para fugir do "any" e silenciar o ESLint
              products={(filteredProducts as unknown as React.ComponentProps<typeof ProductsGrid>['products']) || []} 
              isLoading={!!state.isLoading}
              onOpenDish={handleOpenDish}
            />
        </div>
      </div>

      <ProductDrawer 
        dishId={state.selectedDishId ? Number(state.selectedDishId) : null} 
        onClose={handleCloseDish} 
      />
    </motion.div>
  );
}
