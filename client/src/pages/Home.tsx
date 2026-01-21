import React from "react";
import { Link } from "wouter";
import { trpc } from "@/_core/trpc"; 
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { 
  ArrowRight, Leaf, Zap, Heart, Star, 
  LayoutTemplate, CheckCircle2, ShoppingBag 
} from "lucide-react";

export default function Home() {
  // 🔄 Busca as vitrines reais do banco de dados (ex: "Mais Vendidos", "Novidades")
  const { data: showcases, isLoading } = trpc.store.getShowcases.useQuery();

  // Dados estáticos para secções informativas
  const features = [
    {
      icon: <Leaf className="w-6 h-6 text-emerald-600" />,
      title: "100% Natural",
      description: "Ingredientes frescos, sem conservantes. Comida de verdade.",
    },
    {
      icon: <Zap className="w-6 h-6 text-amber-500" />,
      title: "Ultra Rápido",
      description: "Do congelador para o prato em 5 minutos. Praticidade total.",
    },
    {
      icon: <Heart className="w-6 h-6 text-rose-500" />,
      title: "Saúde & Sabor",
      description: "Nutricionalmente equilibrado sem abrir mão do gosto.",
    },
  ];

  const categories = [
    { name: "Marmitas Fit", icon: "🍱", color: "bg-emerald-100 text-emerald-800" },
    { name: "Executivas", icon: "💼", color: "bg-blue-100 text-blue-800" },
    { name: "Low Carb", icon: "🥑", color: "bg-rose-100 text-rose-800" },
    { name: "Sopas & Caldos", icon: "🍲", color: "bg-amber-100 text-amber-800" },
  ];

  const testimonials = [
    { name: "Mariana S.", text: "Salvou minha dieta! A comida é deliciosa e muito prática.", rating: 5 },
    { name: "Carlos M.", text: "Melhor investimento. Qualidade de restaurante em casa.", rating: 5 },
    { name: "Ana P.", text: "Entrega super rápida e tudo vem muito bem embalado.", rating: 5 },
  ];

  return (
    <div className="min-h-screen bg-[#FBFBFC] text-slate-900 pb-20">
      <SEO title="Home" description="Refeições gourmet saudáveis entregues em sua casa." />

      {/* ================= HERO SECTION ================= */}
      <section className="relative overflow-hidden pt-8 pb-16 lg:pt-16">
        <div className="absolute top-0 left-0 right-0 h-125 bg-linear-to-b from-emerald-50/50 to-transparent -z-10" />
        
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            
            {/* Texto Hero */}
            <div className="space-y-8 animate-in slide-in-from-left duration-700">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-slate-100 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-bold uppercase tracking-widest text-slate-500">Nova Coleção Disponível</span>
              </div>
              
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-black tracking-tighter text-slate-900 leading-[0.9]">
                Comer bem, <br />
                <span className="text-transparent bg-clip-text bg-linear-to-r from-emerald-600 to-teal-500 italic">
                  sem esforço.
                </span>
              </h1>
              
              <p className="text-lg text-slate-500 max-w-md font-medium leading-relaxed">
                Refeições chef-made, ultracongeladas para manter o sabor e nutrientes. 
                A sua rotina merece este cuidado.
              </p>

              <div className="flex flex-wrap gap-4">
                <Link href="/produtos">
                  <Button className="h-14 px-8 rounded-full bg-slate-900 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-widest shadow-xl shadow-slate-900/20 transition-all hover:scale-105">
                    Ver Cardápio <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </Link>
                <Link href="/sobre">
                  <Button variant="outline" className="h-14 px-8 rounded-full border-2 border-slate-200 hover:bg-white font-bold text-xs uppercase tracking-widest">
                    Como Funciona
                  </Button>
                </Link>
              </div>
            </div>

            {/* Imagem Hero */}
            <div className="relative animate-in slide-in-from-right duration-1000">
              <div className="relative z-10 aspect-4/3 rounded-[2.5rem] overflow-hidden shadow-2xl shadow-emerald-900/10 border-4 border-white">
                <img 
                  src="https://images.unsplash.com/photo-1543353071-873f17a7a088?q=80&w=800&auto=format&fit=crop" 
                  alt="Prato Gourmet" 
                  className="object-cover w-full h-full transform transition-transform duration-1000 hover:scale-105"
                />
                
                {/* Float Card */}
                <div className="absolute bottom-6 left-6 right-6 bg-white/95 backdrop-blur-md p-4 rounded-2xl shadow-lg border border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-emerald-100 p-2 rounded-full text-emerald-700">
                      <CheckCircle2 size={20} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase">Nutrição Aprovada</p>
                      <p className="text-sm font-black text-slate-900">100% Balanceado</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex text-amber-400">
                      {[1,2,3,4,5].map(i => <Star key={i} size={12} fill="currentColor" />)}
                    </div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">4.9/5 Avaliações</p>
                  </div>
                </div>
              </div>
              
              {/* Elementos Decorativos de Fundo */}
              <div className="absolute -top-10 -right-10 w-64 h-64 bg-emerald-200/30 rounded-full blur-3xl -z-10" />
              <div className="absolute -bottom-10 -left-10 w-64 h-64 bg-amber-200/30 rounded-full blur-3xl -z-10" />
            </div>

          </div>
        </div>
      </section>

      {/* ================= VITRINES (SHOWCASES) ================= */}
      <section className="py-20 container mx-auto px-4">
        {isLoading ? (
          // SKELETON LOADING
          <div className="space-y-12">
            {[1, 2].map(i => (
               <div key={i} className="space-y-6">
                 <div className="h-8 w-48 bg-slate-200 rounded animate-pulse" />
                 <div className="flex gap-4 overflow-hidden">
                   {[1,2,3,4].map(j => <div key={j} className="min-w-70 h-87.5 bg-slate-100 rounded-4xl animate-pulse" />)}
                 </div>
               </div>
            ))}
          </div>
        ) : (
          <div className="space-y-24">
            {showcases?.map((showcase: any) => (
              <div key={showcase.id} className="space-y-8 group/showcase">
                
                {/* Cabeçalho da Vitrine */}
                <div className="flex items-end justify-between border-b border-slate-100 pb-4">
                  <div>
                    <h2 className="text-3xl font-black uppercase italic tracking-tighter text-slate-900">
                      {showcase.title}
                    </h2>
                    <p className="text-sm text-slate-400 uppercase tracking-widest font-bold mt-1">
                      Seleção exclusiva
                    </p>
                  </div>
                  <Link href={`/produtos?collection=${showcase.id}`}>
                    <Button variant="ghost" className="text-emerald-600 font-bold uppercase text-xs tracking-widest hover:bg-emerald-50">
                      Ver Tudo <ArrowRight className="ml-2 w-4 h-4" />
                    </Button>
                  </Link>
                </div>

                {/* Carrossel de Produtos */}
                <div className="flex gap-6 overflow-x-auto pb-8 -mx-4 px-4 snap-x cursor-grab active:cursor-grabbing no-scrollbar">
                  {showcase.items?.length > 0 ? (
                    showcase.items.map((product: any) => (
                      <div key={product.id} className="min-w-70 md:min-w-[320px] snap-start">
                        <Link href={`/produto/${product.id}`}>
                          <div className="group relative bg-white rounded-4xl border border-slate-100 overflow-hidden hover:shadow-2xl hover:shadow-slate-200/50 hover:-translate-y-2 transition-all duration-500 cursor-pointer h-full flex flex-col">
                            
                            {/* Imagem */}
                            <div className="aspect-4/3 bg-slate-100 relative overflow-hidden">
                              {product.imageUrl ? (
                                <img 
                                  src={product.imageUrl} 
                                  alt={product.name} 
                                  className="object-cover w-full h-full transition-transform duration-700 group-hover:scale-110" 
                                />
                              ) : (
                                <div className="flex items-center justify-center h-full text-slate-300">
                                  <LayoutTemplate size={40} />
                                </div>
                              )}
                              
                              {/* Tag de Preço Flutuante */}
                              <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-3 py-1.5 rounded-xl text-xs font-black text-slate-900 shadow-sm border border-slate-100">
                                {Number(product.price).toFixed(2)}€
                              </div>
                            </div>

                            {/* Info */}
                            <div className="p-6 flex flex-col flex-1">
                              <h3 className="font-black text-lg text-slate-800 uppercase italic tracking-tight leading-none mb-2 line-clamp-2">
                                {product.name}
                              </h3>
                              <p className="text-xs text-slate-400 line-clamp-2 mb-4 flex-1">
                                {product.description || "Sem descrição disponível."}
                              </p>
                              <Button className="w-full rounded-xl bg-slate-100 hover:bg-slate-900 text-slate-900 hover:text-white font-black uppercase text-[10px] tracking-widest h-10 transition-colors">
                                <ShoppingBag className="w-3 h-3 mr-2" /> Adicionar
                              </Button>
                            </div>

                          </div>
                        </Link>
                      </div>
                    ))
                  ) : (
                    <div className="w-full py-12 text-center border-2 border-dashed border-slate-200 rounded-4xl">
                      <p className="text-slate-400 font-bold uppercase text-xs tracking-widest">Nenhum produto nesta vitrine</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ================= FEATURES ================= */}
      <section className="bg-slate-900 text-white py-20 rounded-t-[3rem] -mt-10 relative z-10">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-12 text-center">
            {features.map((f, i) => (
              <div key={i} className="flex flex-col items-center space-y-4 p-6 rounded-3xl hover:bg-white/5 transition-colors">
                <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center mb-2">
                  {f.icon}
                </div>
                <h3 className="text-xl font-black italic uppercase tracking-tight">{f.title}</h3>
                <p className="text-slate-400 text-sm max-w-xs leading-relaxed">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= CATEGORIAS ================= */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 space-y-2">
            <h2 className="text-4xl font-black uppercase italic tracking-tighter text-slate-900">Explore por Categoria</h2>
            <p className="text-slate-400 font-bold uppercase text-xs tracking-widest">Encontre exatamente o que procura</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {categories.map((cat) => (
              <Link key={cat.name} href="/produtos">
                <div className="group cursor-pointer">
                  <div className={cn("aspect-square rounded-4xl flex flex-col items-center justify-center gap-4 transition-all duration-300 hover:scale-95 hover:shadow-lg", cat.color)}>
                    <span className="text-5xl drop-shadow-sm group-hover:scale-110 transition-transform duration-300">{cat.icon}</span>
                    <span className="font-black uppercase text-xs tracking-widest">{cat.name}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ================= TESTIMONIALS ================= */}
      <section className="py-20 bg-[#FBFBFC]">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-black uppercase italic tracking-tighter text-slate-900 mb-12 text-center">
            Quem prova, aprova
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((t, i) => (
              <div key={i} className="bg-white p-8 rounded-4xl border border-slate-100 shadow-sm relative">
                <div className="text-amber-400 flex mb-4">
                  {[...Array(t.rating)].map((_, idx) => <Star key={idx} size={16} fill="currentColor" />)}
                </div>
                <p className="text-slate-600 italic mb-6 leading-relaxed">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center font-bold text-slate-400 text-xs">
                    {t.name[0]}
                  </div>
                  <span className="font-bold text-sm text-slate-900 uppercase">{t.name}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
}