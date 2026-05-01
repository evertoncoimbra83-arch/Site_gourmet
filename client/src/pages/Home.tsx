// client/src/pages/Home.tsx
import React, { useState } from "react";
import { Link } from "react-router-dom"; 
import { trpc } from "@/_core/trpc"; 
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { 
  ArrowRight, Leaf, Zap, Heart, 
  ShoppingBag, Clock, ListFilter, Flame
} from "lucide-react";

// ✅ FIX: Importado o ProductDrawer para abrir o produto ao clicar
import ProductDrawer from "./products/view/ProductDrawer";

// --- INTERFACES ---
interface ShowcaseProduct {
  id: string | number;
  name: string;
  price: string | number;
  imageUrl?: string | null;
}

interface ShowcaseData {
  id: string | number;
  title: string;
  items: ShowcaseProduct[];
}

interface PublicSettings {
  emergencyMode?: boolean;
  accessibilityHighContrast?: boolean;
  accessibilityDyslexicFont?: boolean;
}

export default function Home() {
  // ✅ FIX: Estado para controlar qual produto está aberto no drawer
  const [selectedDishId, setSelectedDishId] = useState<number | null>(null);

  const { data: showcases, isLoading: isShowcasesLoading } = 
    (trpc.store as unknown as { getShowcases: { useQuery: () => { data: ShowcaseData[], isLoading: boolean } } })
    .getShowcases.useQuery();

  const { data: storeSettings } = 
    (trpc.public as unknown as { getPublicSettings: { useQuery: () => { data: PublicSettings } } })
    .getPublicSettings.useQuery();

  const isEmergency = !!storeSettings?.emergencyMode;

  const features = [
    {
      icon: <Leaf className="w-6 h-6 text-emerald-600" />,
      title: "100% Natural",
      description: "Ingredientes colhidos e preparados com pureza.",
    },
    {
      icon: <Zap className="w-6 h-6 text-amber-500" />,
      title: "Seu Momento",
      description: "Praticidade que respeita o seu tempo e paladar.",
    },
    {
      icon: <Heart className="w-6 h-6 text-rose-500" />,
      title: "Do Seu Jeito",
      description: "Combinações que se adaptam à sua rotina.",
    },
  ];

  return (
    <div className={cn(
      "min-h-screen bg-[#FBFBFC] text-slate-900 pb-20 transition-all duration-500",
      storeSettings?.accessibilityHighContrast && "contrast-125 saturate-150",
      storeSettings?.accessibilityDyslexicFont && "font-dyslexic"
    )}>
      <SEO title="Home" description="Comida de verdade, natural e feita do seu jeito." />

      {/* ================= HERO SECTION ================= */}
      <section className="relative overflow-hidden pt-8 pb-16 lg:pt-16">
        <div className="absolute top-0 left-0 right-0 h-125 bg-linear-to-b from-emerald-50/50 to-transparent -z-10" />
        
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            
            <div className="space-y-8 animate-in slide-in-from-left duration-700">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-slate-100 shadow-sm">
                <span className={cn("w-2 h-2 rounded-full animate-pulse", isEmergency ? "bg-amber-500" : "bg-emerald-500")} />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                  {isEmergency ? "Ajustando a Cozinha" : "Ingredientes Frescos Hoje"}
                </span>
              </div>
              
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-black tracking-tighter text-slate-900 leading-[0.9]">
                Natural por essência, <br />
                <span className="text-transparent bg-clip-text bg-linear-to-r from-emerald-600 to-teal-500 italic">
                  feita do seu jeito.
                </span>
              </h1>
              
              <p className="text-lg text-slate-500 max-w-md font-medium leading-relaxed">
                Comida de verdade, sem conservantes e com o tempero que a sua saúde merece. 
                Sabor autêntico para quem não abre mão do equilíbrio.
              </p>

              <div className="flex flex-wrap gap-4">
                {isEmergency ? (
                  <div className="flex items-center gap-3 p-5 bg-amber-50 rounded-[2rem] border border-amber-200 text-amber-800 shadow-inner">
                    <Clock className="animate-pulse" />
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest">Pausa Criativa</p>
                      <p className="text-xs font-bold italic">Nossos chefs voltam em instantes!</p>
                    </div>
                  </div>
                ) : (
                  <Link to="/produtos">
                    <Button className="h-16 px-10 rounded-full bg-slate-900 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-[0.2em] shadow-2xl transition-all hover:scale-105 active:scale-95">
                      Ver Cardápio <ArrowRight className="ml-2 w-4 h-4" />
                    </Button>
                  </Link>
                )}
              </div>
            </div>

            <div className="relative animate-in slide-in-from-right duration-1000">
              <div className="relative z-10 aspect-4/3 rounded-[3.5rem] overflow-hidden shadow-2xl border-[6px] border-white">
                <img 
                  src="https://images.unsplash.com/photo-1490645935967-10de6ba17061?q=80&w=800&auto=format&fit=crop" 
                  alt="Comida Saudável e Natural" 
                  className="object-cover w-full h-full transform transition-transform duration-1000 hover:scale-110"
                />
              </div>
              <div className="absolute -top-10 -right-10 w-64 h-64 bg-emerald-200/30 rounded-full blur-3xl -z-10" />
            </div>
          </div>
        </div>
      </section>

      {/* ================= SHOWCASES ================= */}
      <section className="py-20 container mx-auto px-4">
        {isShowcasesLoading ? (
          <div className="flex gap-6 overflow-hidden">
            {[1,2,3].map(i => <div key={i} className="min-w-70 h-96 bg-slate-100 rounded-[3rem] animate-pulse" />)}
          </div>
        ) : (
          <div className="space-y-32">
            {showcases?.map((showcase) => (
              <div key={showcase.id} className="space-y-10 group/showcase">
                <div className="flex items-end justify-between border-b border-slate-100 pb-6">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Flame className="text-orange-500" size={18} />
                      <span className="text-[10px] font-black text-orange-500 uppercase tracking-[0.3em]">Os Favoritos</span>
                    </div>
                    <h2 className="text-4xl font-black uppercase italic tracking-tighter text-slate-900">
                      {showcase.title}
                    </h2>
                  </div>
                  <Link to="/produtos">
                    <Button variant="ghost" className="text-slate-400 font-black uppercase text-[10px] tracking-widest hover:text-emerald-600">
                      Ver Tudo <ArrowRight className="ml-2 w-3 h-3" />
                    </Button>
                  </Link>
                </div>

                <div className="flex gap-8 overflow-x-auto pb-12 -mx-4 px-4 snap-x no-scrollbar cursor-grab active:cursor-grabbing">
                  {showcase.items?.map((product) => (
                    <div key={product.id} className="min-w-[288px] md:min-w-85 snap-start">
                      <div className="group relative bg-white rounded-[3rem] border border-slate-100 overflow-hidden hover:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] transition-all duration-700 h-full flex flex-col">
                        
                        <div className="aspect-square bg-slate-100 relative overflow-hidden">
                          <img 
                            src={product.imageUrl || "https://placehold.co/500x500?text=Natural"} 
                            alt={product.name} 
                            className="object-cover w-full h-full transition-transform duration-1000 group-hover:scale-110" 
                          />
                          <div className="absolute top-6 left-6 bg-white/95 backdrop-blur px-4 py-1.5 rounded-full text-[10px] font-black text-emerald-600 shadow-sm uppercase italic border border-slate-100">
                            Frescor Garantido
                          </div>
                        </div>

                        <div className="p-8 flex flex-col flex-1">
                          <h3 className="font-black text-xl text-slate-800 uppercase italic tracking-tighter mb-3 line-clamp-1">
                            {product.name}
                          </h3>
                          <div className="flex items-center justify-between mt-auto">
                            <span className="text-2xl font-black text-slate-900 italic">
                              R$ {Number(product.price).toFixed(2)}
                            </span>
                            
                            {/* ✅ FIX: onClick conectado ao drawer */}
                            {!isEmergency ? (
                              <Button
                                onClick={() => setSelectedDishId(Number(product.id))}
                                className="rounded-2xl bg-emerald-600 hover:bg-slate-900 text-white h-12 w-12 p-0 shadow-lg shadow-emerald-900/20 transition-all"
                              >
                                <ShoppingBag size={20} />
                              </Button>
                            ) : (
                              <Clock size={20} className="text-slate-300" />
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ================= FEATURES ================= */}
      <section className="bg-slate-900 text-white py-20 rounded-[5rem] mx-4 relative z-10 shadow-3xl">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-16 text-center">
            {features.map((f, i) => (
              <div key={i} className="flex flex-col items-center space-y-5 group cursor-default">
                <div className="w-16 h-16 rounded-3xl bg-white/5 flex items-center justify-center mb-2 border border-white/10 group-hover:bg-emerald-600 transition-colors duration-500">
                  {f.icon}
                </div>
                <h3 className="text-lg font-black uppercase italic tracking-widest">{f.title}</h3>
                <p className="text-slate-500 text-[11px] font-bold uppercase tracking-tight max-w-xs">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= QUICK MENU ================= */}
      <section className="py-32 bg-white rounded-b-[5rem]">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-end justify-between mb-16 gap-8">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <ListFilter className="text-emerald-600" size={20} />
                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Personalize sua Escolha</span>
              </div>
              <h2 className="text-5xl font-black uppercase italic tracking-tighter text-slate-900 leading-none">
                Menu <span className="text-emerald-600">Expresso</span>
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {showcases?.[0]?.items?.slice(0, 6).map((product) => (
              <div
                key={product.id}
                className="group flex items-center gap-5 p-5 rounded-4xl bg-slate-50 hover:bg-white border border-transparent hover:border-slate-100 hover:shadow-2xl transition-all duration-500"
              >
                <div className="w-28 h-28 rounded-[2rem] overflow-hidden shrink-0 bg-slate-200 shadow-inner">
                  <img 
                    src={product.imageUrl || "https://placehold.co/300x300?text=Natural"} 
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                </div>
                
                <div className="flex-1 min-w-0">
                  <h4 className="font-black text-sm uppercase italic text-slate-900 truncate mb-1">
                    {product.name}
                  </h4>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-[9px] font-black text-emerald-600 uppercase bg-emerald-100 px-2 py-0.5 rounded">
                      Natural
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-black text-lg text-slate-900 italic">
                      R$ {Number(product.price).toFixed(2)}
                    </span>
                    {/* ✅ FIX: onClick conectado ao drawer */}
                    {!isEmergency && (
                      <button
                        onClick={() => setSelectedDishId(Number(product.id))}
                        className="text-[9px] font-black text-emerald-600 hover:text-slate-900 uppercase tracking-tighter"
                      >
                        + Adicionar
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-20 text-center">
            <Link to="/produtos">
              <Button className="h-16 px-16 rounded-2xl bg-slate-900 hover:bg-emerald-600 text-white font-black text-xs uppercase tracking-[0.3em] shadow-3xl transition-all hover:-translate-y-2">
                Ver Cardápio Completo
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ✅ FIX: ProductDrawer adicionado — mesmo componente usado em /produtos */}
      <ProductDrawer
        dishId={selectedDishId}
        onClose={() => setSelectedDishId(null)}
      />
    </div>
  );
}