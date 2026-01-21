import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Search, Utensils, Sparkles, Plus } from "lucide-react";
import ProductDrawer from "@/components/ProductDrawer";
import { cn } from "@/lib/utils";
import { useProducts } from "./products/logic/useProducts";
import { SEO } from "@/components/SEO";
import { motion, AnimatePresence, Variants } from "framer-motion";

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { 
      staggerChildren: 0.05,
      delayChildren: 0.1
    }
  }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { 
    opacity: 1, 
    y: 0, 
    transition: { 
      duration: 0.4, 
      ease: "easeOut" 
    } 
  },
  exit: { 
    opacity: 0, 
    scale: 0.95, 
    transition: { duration: 0.2 } 
  }
};

export default function ProductsPage() {
  const { state, actions } = useProducts();

  const handleCategoryClick = (id: number | null) => {
    actions.setSelectedCategory(id);
  };

  return (
    <motion.div 
      className="min-h-screen bg-[#FBFBFC] pb-24"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <SEO title="Cardápio Saudável" description="Escolha sua refeição." path="/produtos" />

      {/* HEADER DINÂMICO */}
      <div className="relative pt-20 pb-16 overflow-hidden bg-white border-b border-slate-100">
        <div className="absolute top-0 right-0 p-20 opacity-5 pointer-events-none">
          <Utensils size={300} strokeWidth={1} />
        </div>
        
        <div className="container-page relative z-10">
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="flex items-center gap-2 text-primary mb-4"
          >
            <Sparkles size={16} />
            <span className="text-[10px] font-black uppercase tracking-[0.3em]">Gastronomia Premium</span>
          </motion.div>
          
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="max-w-xl">
              <h1 className="text-5xl md:text-7xl font-black italic tracking-tighter text-slate-900 uppercase leading-[0.8] mb-4">
                Nosso <br /> <span className="text-primary">Cardápio</span>
              </h1>
              <p className="text-slate-400 font-medium text-sm md:text-base max-w-sm">
                Refeições ultracongeladas com sabor de feitas na hora.
              </p>
            </div>

            {/* BUSCA ESTILIZADA */}
            <div className="w-full md:w-80 relative group">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-slate-400 group-focus-within:text-primary transition-colors" />
              </div>
              <input
                placeholder="PROCURAR SABOR..."
                className="w-full h-14 pl-12 pr-4 rounded-2xl border-none bg-slate-50 font-bold text-xs uppercase tracking-widest focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                value={state.search}
                onChange={(e) => actions.setSearch(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="container-page -mt-7 relative z-20">
        {/* CATEGORIAS EM CAPSULA */}
        <div className="flex gap-2 overflow-x-auto pb-6 no-scrollbar snap-x">
          <button
            onClick={() => handleCategoryClick(null)}
            className={cn(
              "snap-start h-14 px-8 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap",
              state.selectedCategory === null 
                ? "bg-slate-900 text-white shadow-xl shadow-slate-900/20" 
                : "bg-white border border-slate-100 text-slate-400 hover:bg-slate-50"
            )}
          >
            Todos
          </button>
          {state.catList.map((cat: any) => (
            <button
              key={`cat-btn-${cat.id}`}
              onClick={() => handleCategoryClick(Number(cat.id))}
              className={cn(
                "snap-start h-14 px-8 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap",
                Number(state.selectedCategory) === Number(cat.id)
                  ? "bg-slate-900 text-white shadow-xl shadow-slate-900/20"
                  : "bg-white border border-slate-100 text-slate-400 hover:bg-slate-50"
              )}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* LISTAGEM DE PRODUTOS REVISADA */}
        <div className="min-h-[400px]">
          <AnimatePresence mode="wait">
            {state.isLoading ? (
              <motion.div 
                key="loader"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="py-40 flex flex-col items-center gap-4"
              >
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="text-[10px] font-black uppercase tracking-widest opacity-30">Sincronizando pratos...</span>
              </motion.div>
            ) : state.products.length > 0 ? (
              <motion.div 
                key={`grid-${state.selectedCategory || 'all'}`}
                /* ✅ GRID AJUSTADO: Itens menores em telas grandes */
                className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6 pt-4"
                variants={containerVariants}
                initial="hidden"
                animate="show"
                exit="hidden"
              >
                {state.products.map((dish: any) => (
                  <motion.div
                    key={`dish-${dish.id}`}
                    layout
                    variants={itemVariants}
                    onClick={() => actions.setSelectedDishId(dish.id)}
                    className="group relative cursor-pointer"
                  >
                    <div className="bg-white rounded-[2rem] border border-slate-100 p-2 transition-all duration-500 hover:shadow-xl hover:shadow-slate-200/50 group-hover:-translate-y-1">
                      {/* FOTO DO PRATO */}
                      <div className="relative aspect-square rounded-[1.5rem] overflow-hidden bg-slate-50">
                        {dish.imageUrl ? (
                          <img 
                            src={dish.imageUrl} 
                            alt={dish.name} 
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-slate-200">
                            <Utensils size={32} />
                          </div>
                        )}
                        
                        {/* PREÇO FLUTUANTE */}
                        <div className="absolute bottom-3 left-3 right-3">
                          <div className="bg-white/95 backdrop-blur-md p-2 px-3 rounded-xl shadow-sm flex items-center justify-between border border-white/20">
                             <span className="text-[11px] font-black text-slate-900 italic">
                               R$ {Number(dish.price).toFixed(2)}
                             </span>
                             <div className="bg-primary h-5 w-5 rounded-md flex items-center justify-center text-white shadow-lg shadow-primary/30">
                                <Plus size={12} strokeWidth={3} />
                             </div>
                          </div>
                        </div>
                      </div>

                      {/* TEXTO ABAIXO DA FOTO */}
                      <div className="p-3 pt-4 text-center">
                        <h3 className="text-[10px] font-black text-slate-800 uppercase italic tracking-tight leading-tight line-clamp-2 min-h-[1.5rem]">
                          {dish.name}
                        </h3>
                        <p className="mt-1 text-[8px] font-bold text-slate-300 uppercase tracking-widest">
                          {dish.categoryName || "Gourmet"}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <motion.div 
                key="empty"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="py-40 text-center space-y-4"
              >
                <Utensils className="h-12 w-12 mx-auto text-slate-200" />
                <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">
                  Nenhum prato encontrado.
                </p>
                <Button 
                  variant="link" 
                  onClick={() => handleCategoryClick(null)} 
                  className="text-primary font-black text-xs uppercase"
                >
                  Ver todo o cardápio
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <ProductDrawer 
        dishId={state.selectedDishId} 
        onClose={() => actions.setSelectedDishId(null)} 
      />
    </motion.div>
  );
}