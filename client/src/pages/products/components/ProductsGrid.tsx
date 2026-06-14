import React from "react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { Utensils, Zap, ChevronRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { getImageFallback, resolveImageUrl } from "@shared/utils/image-url";

// Interface definida para os itens da lista
interface Product {
  id: number | string;
  name: string;
  price?: string | number | null;
  salePrice?: string | number | null;
  description?: string | null;
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

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);

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
            className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-6"
            variants={containerVariants}
            initial="hidden"
            animate="show"
          >
            {products.map((dish) => {
              const basePrice = Number(dish.price || 0);
              const salePrice = Number(dish.salePrice || 0);
              const hasPromo = salePrice > 0 && (!basePrice || salePrice < basePrice);
              const displayPrice = hasPromo ? salePrice : basePrice;

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
                    "bg-white rounded-3xl md:rounded-4xl p-2 md:p-3 transition-all duration-500 hover:shadow-2xl border h-full flex flex-row md:flex-col gap-3 md:gap-0",
                    hasPromo ? "border-emerald-100 shadow-[0_10px_30px_rgba(16,185,129,0.05)]" : "border-slate-50"
                  )}>
                    <div className="relative w-24 h-24 sm:w-28 sm:h-28 md:w-full md:h-auto md:aspect-square rounded-2xl md:rounded-[2rem] overflow-hidden bg-slate-50 md:mb-2 flex shrink-0 items-center justify-center">
                      {dish.imageUrl ? (
                        <img
                          src={resolveImageUrl(dish.imageUrl, "product")}
                          alt={dish.name}
                          loading="lazy"
                          width="240"
                          height="240"
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                          onError={(event) => {
                            event.currentTarget.src = getImageFallback("product");
                          }}
                        />
                      ) : (
                        <Utensils size={32} strokeWidth={1} className="text-slate-200 md:size-12" />
                      )}

                      {hasPromo && (
                        <div className="absolute top-2 left-2 md:top-4 md:left-4 bg-emerald-500 text-white p-1.5 md:p-2 rounded-xl md:rounded-2xl shadow-lg z-20 flex items-center gap-1">
                          <Zap size={10} fill="currentColor" />
                          <span className="text-[8px] font-black uppercase italic">Promo</span>
                        </div>
                      )}

                      <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>

                    <div className="min-w-0 px-1 md:px-2 flex-1 flex flex-col justify-between">
                      <div className="min-w-0">
                        <h3 className="text-xs md:text-base font-black text-slate-800 uppercase italic tracking-tighter line-clamp-2 leading-[1.12] mb-1.5 md:mb-4">
                          {dish.name}
                        </h3>
                        {dish.description && (
                          <p className="mb-2 text-[10px] md:text-[11px] font-bold text-slate-400 leading-snug md:leading-relaxed line-clamp-1 md:line-clamp-2">
                            {dish.description}
                          </p>
                        )}
                        {displayPrice > 0 && (
                          <div className="mb-2 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                            <span className="text-[9px] md:text-[10px] font-black uppercase tracking-tighter text-emerald-600">
                              A partir de {formatCurrency(displayPrice)}
                            </span>
                            {hasPromo && basePrice > 0 && (
                              <span className="text-[9px] text-slate-300 line-through font-bold">
                                {formatCurrency(basePrice)}
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="w-full pb-1 md:pb-2">
                        <div className={cn(
                          "flex items-center justify-between w-full h-9 md:h-12 px-3 md:px-5 rounded-2xl md:rounded-[1.5rem] transition-all shadow-md",
                          hasPromo ? "bg-emerald-500 text-white" : "bg-slate-900 text-white"
                        )}>
                          <span className="text-[8px] md:text-[9px] font-black uppercase tracking-widest italic">Ver Prato</span>
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
