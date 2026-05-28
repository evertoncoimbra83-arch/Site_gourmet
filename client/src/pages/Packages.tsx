// client/src/pages/Packages.tsx
import React, { useMemo, useState } from "react";
import { trpc } from "@/_core/trpc";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Search,
  Package as PackageIcon,
  Loader2,
  ChefHat,
  Settings2,
  LineChart,
  Star,
  Utensils,
  CheckCircle2,
  ArrowRight,
  Zap
} from "lucide-react";
import PackageDrawer from "./packages/view/PackageDrawer";
import { keepPreviousData } from "@tanstack/react-query";
import { SEO } from "@/components/SEO";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

// --- TYPES ---
interface PackageItem {
  id: string | number;
  name: string;
  description?: string | null;
  highlights?: string[] | string | null; 
  imageUrl?: string | null;
  image_url?: string | null;
  image?: string | null;
  price?: string | number | null;
  base_price?: string | number | null;
  salePrice?: string | number | null;
  sale_price?: string | number | null;
  numberOfOptions?: number | null;
  number_of_options?: number | null;
  isPopular?: boolean | number | null;
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 20 },
  show: { 
    opacity: 1, 
    scale: 1, 
    y: 0, 
    transition: { type: "spring" as const, stiffness: 260, damping: 20 } 
  }
};

const FILTERS = ["Todos", "Emagrecimento", "Ganho de Massa", "Econômicos"];

export default function Packages() {
  const [selectedPackageId, setSelectedPackageId] = useState<string | number | null>(null);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<string>("Todos");

  const packagesQuery = trpc.packages.list.useQuery(
    undefined, 
    { placeholderData: keepPreviousData }
  );

  const filteredPackages = useMemo(() => {
    const data = (packagesQuery.data as PackageItem[]) ?? [];
    let filtered = data;

    if (search.trim()) {
      filtered = filtered.filter((pkg) => 
        pkg.name?.toLowerCase().includes(search.toLowerCase())
      );
    }
    return filtered;
  }, [packagesQuery.data, search]);

  const formatPrice = (val: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  return (
    <motion.div className="min-h-screen bg-[#F8FAFC] pb-32" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <SEO 
        title="Kits e Combos de Marmitas Saudáveis Semanais" 
        description="Monte seu plano de alimentação com nossos combos e kits semanais de marmitas congeladas saudáveis. Personalize seus pratos e acompanhe sua nutrição de forma prática." 
        path="/pacotes" 
      />

      {/* --- HERO PREMIUM --- */}
      <section className="bg-slate-950 text-white pt-28 pb-32 px-6 relative overflow-hidden text-center">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_top_right,var(--tw-gradient-stops))] from-emerald-500 via-transparent to-transparent pointer-events-none" />
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="flex items-center justify-center gap-2 text-emerald-400 mb-6 font-black uppercase tracking-[0.3em] text-[10px]">
            <Zap size={14} fill="currentColor" /> Combos Premium
          </div>
          <h1 className="text-5xl md:text-7xl font-black uppercase italic tracking-tighter mb-6 leading-none">
            Monte seu <br/><span className="text-emerald-400">Plano Ideal</span>
          </h1>
          <p className="text-slate-400 font-medium text-base md:text-lg max-w-2xl mx-auto mb-10 leading-relaxed">
            Escolha a quantidade de refeições, personalize seus pratos e acompanhe a nutrição em tempo real.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 md:gap-6">
            {[
              { icon: ChefHat, text: "Receitas de Chef" },
              { icon: Settings2, text: "100% Personalizável" },
              { icon: LineChart, text: "Nutrição Calculada" }
            ].map((chip, i) => (
              <div key={i} className="flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2.5 rounded-full text-[10px] font-black text-slate-300 uppercase tracking-widest backdrop-blur-sm">
                <chip.icon size={14} className="text-emerald-400" /> {chip.text}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- FILTROS E BUSCA --- */}
      <section className="max-w-6xl mx-auto px-6 -mt-10 relative z-20">
        <div className="bg-white p-2 rounded-[2rem] shadow-xl flex flex-col md:flex-row items-center justify-between gap-4 border border-slate-100">
          <div className="flex overflow-x-auto no-scrollbar w-full md:w-auto gap-1 p-1">
            {FILTERS.map(f => (
              <button key={f} onClick={() => setActiveFilter(f)} className={cn(
                "px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all",
                activeFilter === f ? "bg-slate-900 text-white shadow-md" : "text-slate-500 hover:bg-slate-50"
              )}>{f}</button>
            ))}
          </div>
          <div className="w-full md:w-80 relative px-2 pb-2 md:p-0">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="BUSCAR PLANO..."
              className="h-12 pl-12 rounded-2xl border-slate-100 bg-slate-50 font-black text-[10px] uppercase focus-visible:ring-emerald-500"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </section>

      {/* --- VITRINE DE CARDS --- */}
      <section className="max-w-7xl mx-auto px-6 pt-12">
        {packagesQuery.isLoading ? (
          <div className="py-40 flex justify-center"><Loader2 className="animate-spin text-emerald-500" /></div>
        ) : filteredPackages.length === 0 ? (
          <div className="py-32 text-center border-2 border-dashed border-slate-200 rounded-[3rem] bg-white">
            <PackageIcon className="w-12 h-12 text-slate-200 mx-auto mb-4" />
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Nenhum plano encontrado</p>
          </div>
        ) : (
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-10"
            variants={containerVariants}
            initial="hidden"
            animate="show"
          >
            <AnimatePresence mode="popLayout">
              {filteredPackages.map((pkg, index) => {
                const imageSrc = pkg.imageUrl || pkg.image_url || pkg.image || null;
                const optionsCount = pkg.numberOfOptions ?? pkg.number_of_options ?? 0;
                const basePrice = Number(pkg.price || pkg.base_price || 0);
                const salePrice = Number(pkg.salePrice || pkg.sale_price || 0);
                const hasDiscount = salePrice > 0 && salePrice < basePrice;
                const displayPrice = hasDiscount ? salePrice : basePrice;
                const pricePerMeal = optionsCount > 0 ? displayPrice / optionsCount : 0;
                const isPopular = pkg.isPopular || index === 1;

                // Lógica de Highlights (Características) dinâmica
                const highlights = Array.isArray(pkg.highlights) 
                  ? pkg.highlights 
                  : typeof pkg.highlights === 'string' 
                    ? pkg.highlights.split(',').map(h => h.trim()) 
                    : ["Escolha seus pratos favoritos", "Configure acompanhamentos", "Nutrição completa"];

                return (
                  <motion.div key={pkg.id} layout variants={itemVariants} className="group flex h-full">
                    <div className={cn(
                      "relative flex flex-col w-full bg-white rounded-[3rem] border-2 transition-all duration-500 overflow-hidden hover:shadow-2xl hover:-translate-y-1",
                      isPopular ? "border-emerald-500 shadow-emerald-500/10" : "border-slate-100 hover:border-emerald-200"
                    )}>
                      
                      {isPopular && (
                        <div className="absolute top-0 inset-x-0 h-8 bg-emerald-500 text-white flex items-center justify-center gap-1.5 text-[9px] font-black uppercase tracking-widest z-10">
                          <Star size={10} fill="currentColor" /> Recomendado pela Nutri
                        </div>
                      )}

                      <div className={cn("relative w-full overflow-hidden shrink-0", isPopular ? "h-56 mt-8" : "h-56")}>
                        {imageSrc ? (
                          <img 
                            src={imageSrc} 
                            alt={pkg.name} 
                            loading="lazy"
                            width="640"
                            height="360"
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                          />
                        ) : (
                          /* ✅ Lettering do nome quando não há foto */
                          <div style={{
                            position: "absolute", inset: 0,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            overflow: "hidden",
                            background: "linear-gradient(135deg, #0f172a 0%, #1e293b 55%, #064e3b 100%)",
                          }}>
                            <div style={{
                              position: "absolute", inset: 0,
                              backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.07) 1px, transparent 1px)",
                              backgroundSize: "18px 18px",
                            }} />
                            <div style={{
                              position: "absolute", top: -20, right: -20,
                              width: 130, height: 130,
                              background: "rgba(16,185,129,0.18)",
                              borderRadius: "50%", filter: "blur(35px)",
                            }} />
                            <div style={{
                              position: "absolute", bottom: -10, left: -10,
                              width: 80, height: 80,
                              background: "rgba(16,185,129,0.09)",
                              borderRadius: "50%", filter: "blur(20px)",
                            }} />
                            <div style={{ position: "relative", zIndex: 10, padding: "0 1.5rem", textAlign: "center", userSelect: "none" }}>
                              <span style={{
                                display: "block",
                                fontFamily: "'Poppins', sans-serif",
                                fontWeight: 900,
                                fontStyle: "italic",
                                textTransform: "uppercase",
                                lineHeight: 1,
                                letterSpacing: "-0.03em",
                                color: "#ffffff",
                                fontSize: pkg.name.length <= 8 ? "2.8rem"
                                       : pkg.name.length <= 14 ? "2.2rem"
                                       : pkg.name.length <= 20 ? "1.7rem"
                                       : pkg.name.length <= 28 ? "1.35rem"
                                       : "1.05rem",
                                textShadow: "0 2px 30px rgba(0,0,0,0.6), 0 0 60px rgba(16,185,129,0.2)",
                              }}>
                                {pkg.name}
                              </span>
                              <div style={{
                                marginTop: 14, marginLeft: "auto", marginRight: "auto",
                                height: 2, width: 44,
                                background: "linear-gradient(90deg, transparent, #10b981, transparent)",
                                borderRadius: 2,
                              }} />
                            </div>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-linear-to-t from-slate-900/60 to-transparent pointer-events-none" />
                        
                        <div className="absolute bottom-4 left-4 flex items-center gap-2 text-white bg-slate-950/60 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10">
                          <Utensils size={12} className="text-emerald-400" />
                          <span className="text-[10px] font-black uppercase tracking-widest">{optionsCount} Refeições</span>
                        </div>
                      </div>

                      <div className="flex flex-col flex-1 p-8">
                        <div className="flex-1">
                          <h3 className="text-2xl font-black uppercase italic tracking-tighter text-slate-900 leading-none mb-4">{pkg.name}</h3>
                          <p className="text-xs text-slate-500 font-medium leading-relaxed mb-6 line-clamp-3">
                            {pkg.description || "Combine os sabores que você mais gosta em um plano nutricional completo para sua rotina."}
                          </p>
                          <ul className="space-y-3 mb-8">
                            {highlights.map((h, i) => (
                              <li key={i} className="flex items-start gap-3 text-[10px] font-bold text-slate-600 uppercase tracking-widest leading-snug">
                                <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                                <span>{h}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* SEÇÃO DE PREÇOS REVISADA (Sem encavalar) */}
                        <div className="pt-6 border-t border-slate-100 mt-auto">
                          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
                            <div className="space-y-1">
                              <span className="block text-[9px] font-black text-slate-400 uppercase tracking-widest">Investimento Total</span>
                              <div className="flex items-baseline gap-2 flex-wrap">
                                <span className="text-3xl font-black italic text-slate-900 tracking-tighter leading-none">
                                  {formatPrice(displayPrice)}
                                </span>
                                {hasDiscount && (
                                  <span className="text-sm font-bold text-slate-300 line-through decoration-slate-300">
                                    {formatPrice(basePrice)}
                                  </span>
                                )}
                              </div>
                            </div>
                            
                            <div className="inline-flex shrink-0">
                               <span className="bg-emerald-50 text-emerald-600 px-3 py-2 rounded-xl border border-emerald-100 text-[10px] font-black uppercase tracking-tighter whitespace-nowrap">
                                 {formatPrice(pricePerMeal)} / un
                               </span>
                            </div>
                          </div>

                          <Button 
                            onClick={() => setSelectedPackageId(pkg.id)}
                            className={cn(
                              "w-full h-16 rounded-[1.5rem] font-black uppercase tracking-[0.2em] text-xs transition-all active:scale-95 flex items-center justify-center gap-3",
                              isPopular ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-xl shadow-emerald-200" : "bg-slate-900 hover:bg-emerald-600 text-white"
                            )}
                          >
                            <span>Personalizar Agora</span> <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.div>
        )}
      </section>

      <PackageDrawer packageId={selectedPackageId !== null ? String(selectedPackageId) : null} onClose={() => setSelectedPackageId(null)} />
    </motion.div>
  );
}