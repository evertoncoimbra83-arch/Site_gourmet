import { useMemo, useState } from "react";
import { trpc } from "@/_core/trpc";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Search,
  Package as PackageIcon,
  Loader2,
  Zap,
  Plus as PlusIcon
} from "lucide-react";
import PackageDrawer from "@/components/PackageDrawer";
import { cn } from "@/lib/utils";
import { keepPreviousData } from "@tanstack/react-query";
import { SEO } from "@/components/SEO";
import { motion, AnimatePresence } from "framer-motion";

// --- CONFIGURAÇÃO DE ANIMAÇÕES ---
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 20 },
  show: { 
    opacity: 1, 
    scale: 1, 
    y: 0, 
    // ✅ CORREÇÃO TS: 'as const' garante que "spring" seja tratado como literal e não string
    transition: { type: "spring" as const, stiffness: 260, damping: 20 } 
  }
};

export default function Packages() {
  const [selectedPackageId, setSelectedPackageId] = useState<string | number | null>(null);
  const [search, setSearch] = useState("");

  const packagesQuery = trpc.packages.list.useQuery(
    search ? { search } : undefined,
    { placeholderData: keepPreviousData }
  );

  const packages = useMemo(() => packagesQuery.data ?? [], [packagesQuery.data]);

  return (
    <motion.div 
      className="min-h-screen bg-[#FBFBFC] pb-24"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <SEO 
        title="Pacotes Promocionais" 
        description="Economize com nossos combos de marmitas personalizadas."
        path="/pacotes"
      />

      {/* --- HERO SECTION --- */}
      <div className="relative pt-24 pb-16 overflow-hidden bg-white border-b border-slate-100">
        <div className="absolute top-0 right-0 p-20 opacity-[0.03] pointer-events-none rotate-12">
          <PackageIcon size={400} />
        </div>
        
        <div className="container-page relative z-10">
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="flex items-center gap-2 text-emerald-600 mb-4"
          >
            <Zap size={16} fill="currentColor" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em]">Combos Exclusivos</span>
          </motion.div>
          
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div className="max-w-2xl">
              <h1 className="text-5xl md:text-7xl font-black italic tracking-tighter text-slate-900 uppercase leading-[0.8] mb-6">
                Planeje sua <br /> <span className="text-emerald-600">Semana</span>
              </h1>
              <p className="text-slate-400 font-medium text-sm md:text-base max-w-md">
                Monte pacotes personalizados com suas refeições favoritas e garanta o melhor custo-benefício para sua dieta.
              </p>
            </div>

            <div className="w-full md:w-80 relative group">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-slate-400 group-focus-within:text-emerald-600 transition-colors" />
              </div>
              <Input
                placeholder="BUSCAR COMBO..."
                className="h-14 pl-12 rounded-2xl border-none bg-slate-50 font-bold text-xs uppercase tracking-widest focus-visible:ring-2 focus-visible:ring-emerald-600/10 transition-all"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* --- LISTAGEM DE PACOTES --- */}
      <div className="container-page pt-12">
        {packagesQuery.isLoading ? (
          <div className="py-40 flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
            <span className="text-[10px] font-black uppercase tracking-widest opacity-30">Carregando ofertas...</span>
          </div>
        ) : packages.length === 0 ? (
          <div className="py-32 text-center border-2 border-dashed border-slate-100 rounded-[3rem] bg-white">
            <PackageIcon className="w-12 h-12 text-slate-100 mx-auto mb-4" />
            <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Nenhum pacote encontrado</p>
          </div>
        ) : (
          <motion.div 
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8"
            variants={containerVariants}
            initial="hidden"
            animate="show"
          >
            <AnimatePresence mode="popLayout">
              {packages.map((pkg: any) => {
                const imageSrc = pkg.imageUrl || pkg.image_url || pkg.image || null;
                const optionsCount = pkg.numberOfOptions ?? pkg.number_of_options ?? 0;
                const price = Number(pkg.basePrice || pkg.base_price || pkg.price || 0);

                return (
                  <motion.div
                    key={pkg.id}
                    layout
                    variants={itemVariants}
                    className="group"
                  >
                    <div className="bg-white rounded-[2.5rem] border border-slate-100 p-2 transition-all duration-500 hover:shadow-2xl hover:shadow-emerald-900/5 hover:-translate-y-2 h-full flex flex-col">
                      
                      <div className="relative aspect-[1/1.1] rounded-4xl overflow-hidden bg-slate-50">
                        {imageSrc ? (
                          <img 
                            src={imageSrc} 
                            alt={pkg.name} 
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-slate-200 bg-slate-50">
                            <PackageIcon size={60} strokeWidth={1} />
                          </div>
                        )}
                        
                        <div className="absolute top-4 left-4">
                          <Badge className="bg-emerald-600/90 backdrop-blur text-white border-none font-black text-[9px] px-3 py-1 uppercase tracking-widest shadow-lg shadow-emerald-900/10">
                            Combo
                          </Badge>
                        </div>

                        <div className="absolute bottom-4 left-4 right-4">
                          <div className="bg-white/95 backdrop-blur-md p-4 rounded-2xl shadow-sm border border-white/20 flex items-center justify-between">
                            <div className="flex flex-col">
                               <span className="text-[8px] font-black text-slate-400 uppercase leading-none mb-1">A partir de</span>
                               <span className="text-lg font-black text-slate-900 tracking-tighter italic leading-none">
                                 R$ {price.toFixed(2)}
                               </span>
                            </div>
                            <div className="h-10 w-10 rounded-xl bg-slate-900 flex items-center justify-center text-white transition-colors group-hover:bg-emerald-500">
                               <PlusIcon size={18} />
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="p-6 text-center space-y-4 flex flex-col flex-1 justify-end">
                        <div className="space-y-1">
                          <h3 className="text-sm font-black text-slate-800 uppercase italic tracking-tight leading-tight line-clamp-2 min-h-[2.5em]">
                            {pkg.name}
                          </h3>
                          <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">
                            {optionsCount} REFEIÇÕES
                          </p>
                        </div>
                        
                        <Button 
                          onClick={() => setSelectedPackageId(pkg.id)}
                          disabled={pkg.isActive === false}
                          className={cn(
                            "w-full rounded-2xl h-12 font-black uppercase tracking-widest text-[10px] shadow-lg transition-all active:scale-95",
                            pkg.isActive === false 
                              ? "bg-slate-100 text-slate-400" 
                              : "bg-slate-900 hover:bg-emerald-500 text-white shadow-slate-200 hover:shadow-emerald-200"
                          )}
                        >
                          {pkg.isActive === false ? "INDISPONÍVEL" : "PERSONALIZAR"}
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      <PackageDrawer
        packageId={selectedPackageId}
        onClose={() => setSelectedPackageId(null)}
      />
    </motion.div>
  );
}