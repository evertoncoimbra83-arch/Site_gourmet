import React from "react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { Utensils, Zap, ChevronRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

// Interface definida para os itens da lista
interface Product {
  id: number | string;
  name: string;
  salePrice?: string | number | null;
  imageUrl?: string | null; // Ajustado para aceitar null
  slug?: string;
  [key: string]: unknown; // Permite outras propriedades vindas do banco sem usar any
}

interface ProductsGridProps {
  products: Product[];
  isLoading: boolean;
  // ✅ FIX: Trocado 'any' por 'Product' para bater com o linter e com a lista
  onOpenDish: (dish: Product) => void; 
}

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: { 
    opacity: 1, 
    transition: { staggerChildren: 0.05, delayChildren: 0.1 } 
  }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 15, scale: 0.98 },
  show: { 
    opacity: 1, y: 0, scale: 1, 
    transition: { type: "spring", stiffness: 120, damping: 14 } 
  },
  exit: { opacity: 0, scale: 0.95, transition: { duration: 0.2 } }
};

const ProductsGrid: React.FC<ProductsGridProps> = ({ products, isLoading, onOpenDish }) => {
  return (
    <div className="min-h-100 mt-8 text-left">
      <h2 className="sr-only">Nossos Pratos Saudáveis</h2>
      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div 
            key="loader" 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="py-40 flex flex-col items-center gap-6"
          >
            <Loader2 className="h-10 w-10 animate-spin text-emerald-500" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300">Sincronizando...</span>
          </motion.div>
        ) : products.length > 0 ? (
          <motion.div 
            key="grid" 
            className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6"
            variants={containerVariants} 
            initial="hidden" 
            animate="show"
          >
            {products.map((dish) => {
              const hasPromo = !!(dish.salePrice && Number(dish.salePrice) > 0);
              return (
                <motion.div
                  key={`dish-${dish.id}`}
                  variants={itemVariants}
                  layout
                  onClick={() => onOpenDish(dish)}
                  data-testid="btn-ver-prato"
                  className="group relative cursor-pointer"
                >
                  <div className={cn(
                    "bg-white rounded-4xl p-3 transition-all duration-500 hover:shadow-2xl border h-full flex flex-col",
                    hasPromo ? "border-emerald-100 shadow-[0_10px_30px_rgba(16,185,129,0.05)]" : "border-slate-50"
                  )}>
                    <div className="relative aspect-square rounded-[2rem] overflow-hidden bg-slate-50 mb-2 flex items-center justify-center">
                      {dish.imageUrl ? (
                        <img 
                          src={dish.imageUrl} 
                          alt={dish.name} 
                          loading="lazy"
                          width="240"
                          height="240"
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                        />
                      ) : (
                        <Utensils size={48} strokeWidth={1} className="text-slate-200" />
                      )}
                      
                      {hasPromo && (
                        <div className="absolute top-4 left-4 bg-emerald-500 text-white p-2 rounded-2xl shadow-lg z-20 flex items-center gap-1">
                          <Zap size={10} fill="currentColor" />
                          <span className="text-[8px] font-black uppercase italic">Promo</span>
                        </div>
                      )}
                      
                      <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>

                    <div className="px-2 flex-1 flex flex-col justify-between">
                      <h3 className="text-sm md:text-base font-black text-slate-800 uppercase italic tracking-tighter line-clamp-2 leading-[1.1] mb-4">
                        {dish.name}
                      </h3>
                      
                      <div className="w-full pb-2">
                        <div className={cn(
                          "flex items-center justify-between w-full h-12 px-5 rounded-[1.5rem] transition-all shadow-md",
                          hasPromo ? "bg-emerald-500 text-white" : "bg-slate-900 text-white"
                        )}>
                          <span className="text-[9px] font-black uppercase tracking-widest italic">Ver Prato</span>
                          <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        ) : (
          <motion.div 
            key="empty" 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="py-32 flex flex-col items-center text-center"
          >
            <Utensils className="h-12 w-12 text-slate-200 mb-4" />
            <h3 className="text-lg font-black text-slate-900 uppercase italic">Nada por aqui.</h3>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProductsGrid;
