// client/src/pages/Home.tsx
import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { trpc } from "@/_core/trpc";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  ArrowRight, Leaf, Zap, Heart,
  Clock, Flame, Package, Star,
  UtensilsCrossed, Truck, Snowflake
} from "lucide-react";

import ProductDrawer from "./products/view/ProductDrawer";
import PackageDrawer from "./packages/view/PackageDrawer";
import { useAuth } from "@/_core/hooks/useAuth";
import { ActiveDietBanner } from "@/components/ActiveDietBanner";
import { ProductCard } from "@/components/ProductCard";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

// --- INTERFACES ---
interface ShowcaseProduct {
  id: string | number;
  name: string;
  price?: string | number | null;
  salePrice?: string | number | null;
  imageUrl?: string | null;
  image?: string | null;
  kcal?: number | string | null;
  nutritional_info?: {
    kcal?: number | string | null;
  } | null;
  description?: string | null;
  sizes?: { id: string | number; name: string }[];
}

interface HomeCategory {
  id: string | number;
  name: string;
  color?: string | null;
  description?: string | null;
  dishCount?: number;
}

function getCategoryColorClasses(colorName: string | null | undefined, catName: string) {
  const normColor = (colorName || "").toLowerCase();
  const normName = catName.toLowerCase();

  if (normColor === "emerald" || normColor === "green" || normName.includes("fit") || normName.includes("funcional")) {
    return {
      bg: "bg-emerald-50/20",
      border: "border-emerald-100/50 hover:border-emerald-300/80 hover:shadow-emerald-50/50",
      topBar: "bg-emerald-600",
      countText: "group-hover:text-emerald-700"
    };
  }
  if (normColor === "orange" || normColor === "amber" || normName.includes("low") || normName.includes("carb")) {
    return {
      bg: "bg-amber-50/20",
      border: "border-amber-100/50 hover:border-amber-300/80 hover:shadow-amber-50/50",
      topBar: "bg-amber-600",
      countText: "group-hover:text-amber-700"
    };
  }
  if (normColor === "rose" || normColor === "red" || normName.includes("doce") || normName.includes("sobre")) {
    return {
      bg: "bg-rose-50/20",
      border: "border-rose-100/50 hover:border-rose-300/80 hover:shadow-rose-50/50",
      topBar: "bg-rose-600",
      countText: "group-hover:text-rose-700"
    };
  }
  if (normColor === "blue" || normColor === "cyan" || normName.includes("sopa") || normName.includes("caldo")) {
    return {
      bg: "bg-blue-50/20",
      border: "border-blue-100/50 hover:border-blue-300/80 hover:shadow-blue-50/50",
      topBar: "bg-blue-600",
      countText: "group-hover:text-blue-700"
    };
  }
  if (normColor === "violet" || normColor === "purple" || normName.includes("vegan") || normName.includes("vegeta")) {
    return {
      bg: "bg-violet-50/20",
      border: "border-violet-100/50 hover:border-violet-300/80 hover:shadow-violet-50/50",
      topBar: "bg-violet-600",
      countText: "group-hover:text-violet-700"
    };
  }

  return {
    bg: "bg-slate-50/40",
    border: "border-slate-100 hover:border-slate-300/80 hover:shadow-slate-50/50",
    topBar: "bg-slate-600",
    countText: "group-hover:text-slate-900"
  };
}

function getCategoryFallbackDescription(name: string): string {
  const norm = name.toLowerCase();
  if (norm.includes("fit") || norm.includes("funcional")) {
    return "Equilíbrio e sabor para o seu dia a dia ativo.";
  }
  if (norm.includes("low")) {
    return "Refeições com baixo teor de carboidratos.";
  }
  if (norm.includes("vegan") || norm.includes("vegeta")) {
    return "Pratos saborosos feitos 100% à base de plantas.";
  }
  if (norm.includes("sopa") || norm.includes("caldo")) {
    return "Opções leves, nutritivas e reconfortantes.";
  }
  if (norm.includes("doce") || norm.includes("sobre")) {
    return "Sobremesas saudáveis sem açúcar refinado.";
  }
  if (norm.includes("bebida") || norm.includes("suco")) {
    return "Bebidas naturais, funcionais e sem conservantes.";
  }
  if (norm.includes("massa")) {
    return "Massas artesanais com molhos funcionais ricos.";
  }
  if (norm.includes("peixe") || norm.includes("fruto")) {
    return "Peixes frescos e ricos em proteínas nobres.";
  }
  if (norm.includes("carne") || norm.includes("bov")) {
    return "Cortes magros selecionados com sabor marcante.";
  }
  if (norm.includes("frango") || norm.includes("ave")) {
    return "Aves selecionadas temperadas com ervas finas.";
  }
  return "Comida saudável de verdade feita do seu jeito.";
}

interface ShowcaseData {
  id: string | number;
  title: string;
  items: ShowcaseProduct[];
}

interface PackageItem {
  id: string | number;
  name: string;
  description?: string | null;
  price?: string | number | null;
  salePrice?: string | number | null;
  imageUrl?: string | null;
  isPopular?: boolean;
  highlights?: string | string[] | null;
}

// --- HELPERS ---
function toPrice(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function parseHighlights(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((v) => typeof v === "string");
  if (typeof value === "string" && value.trim()) {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [value];
    } catch {
      return [value];
    }
  }
  return [];
}

export default function Home() {
  const { isAuthenticated } = useAuth();
  const [selectedDishId, setSelectedDishId] = useState<number | null>(null);
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null);

  const { data: showcases, isLoading: isShowcasesLoading } = trpc.store.getShowcases.useQuery();
  const { data: storeSettings } = trpc.store.public.getPublicSettings.useQuery();
  const { data: packages, isLoading: isPackagesLoading } = trpc.store.packages.list.useQuery();
  const { data: categoriesData } = trpc.public.dishes.categories.useQuery(undefined, { staleTime: 1000 * 60 * 30 });

  const isEmergency = !!storeSettings?.emergencyMode;

  const [cepInput, setCepInput] = useState("");
  const [checkingCep, setCheckingCep] = useState(false);
  const [cepStatus, setCepStatus] = useState<{ success: boolean; message: string } | null>(null);
  const trpcContext = trpc.useUtils();

  const handleCepChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, "");
    if (val.length > 5) {
      val = val.substring(0, 5) + "-" + val.substring(5, 8);
    }
    setCepInput(val);
    setCepStatus(null);
  };

  const handleCheckCep = async () => {
    const clean = cepInput.replace(/\D/g, "");
    if (clean.length < 8) return;
    setCheckingCep(true);
    try {
      const res = await trpcContext.store.public.getCep.fetch({ cep: clean });
      if (res && res.city) {
        setCepStatus({
          success: true,
          message: `✓ Entregamos em ${res.neighborhood || res.city} (${res.city} - ${res.state})!`,
        });
      } else {
        setCepStatus({
          success: false,
          message: "✗ CEP não localizado ou fora da área de entrega.",
        });
      }
    } catch (err) {
      setCepStatus({
        success: false,
        message: "✗ Erro ao consultar o CEP. Tente novamente.",
      });
    } finally {
      setCheckingCep(false);
    }
  };

  const company = (storeSettings as any)?.company_social_info || {};
  const phone = company.phone || "(11) 4526-5941";
  const addressText = company.address || "";
  const isAddressComplete = !!(addressText && addressText.length > 20 && /\d+/.test(addressText));

  const schemas = useMemo(() => {
    const siteUrl = import.meta.env.VITE_SITE_URL || "https://gourmetsaudavel.com";
    const logoUrl = `${siteUrl}/uploads/favicon-32x32.png`;
    const imageUrl = `${siteUrl}/og-image.jpg`;

    const orgSchema = {
      "@context": "https://schema.org",
      "@type": "Organization",
      "@id": `${siteUrl}/#organization`,
      "name": "Gourmet Saudável",
      "url": siteUrl,
      "logo": {
        "@type": "ImageObject",
        "url": logoUrl
      },
      "telephone": phone,
      "sameAs": company.instagram ? [`https://instagram.com/${company.instagram.replace('@', '')}`] : []
    };

    const businessSchema: Record<string, any> = {
      "@context": "https://schema.org",
      "@type": "FoodEstablishment",
      "@id": `${siteUrl}/#localbusiness`,
      "name": "Gourmet Saudável",
      "telephone": phone,
      "url": siteUrl,
      "logo": logoUrl,
      "image": imageUrl
    };

    if (isAddressComplete) {
      businessSchema.address = {
        "@type": "PostalAddress",
        "streetAddress": addressText,
        "addressLocality": "Jundiaí",
        "addressRegion": "SP",
        "addressCountry": "BR"
      };
    }

    const faqSchema = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "Como os pratos são conservados?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Nossos pratos são preparados com ingredientes 100% frescos e congelados através de um processo de ultracongelamento rápido. Isso impede a formação de cristais de gelo, conservando a textura, os nutrientes e o sabor original por até 90 dias no freezer."
          }
        },
        {
          "@type": "Question",
          "name": "Como aquecer as refeições?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Basta retirar o selo plástico protetor e levar a marmita diretamente ao micro-ondas por 5 a 7 minutos (o tempo varia de acordo com a potência do aparelho). Também é possível aquecer em forno convencional pré-aquecido por cerca de 25 minutos."
          }
        },
        {
          "@type": "Question",
          "name": "Aceitam Vale-Refeição e Vale-Alimentação?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Aceitamos Pix, cartões e principais vales-refeição/benefício. As opções exibidas no checkout seguem a configuração ativa da loja."
          }
        },
        {
          "@type": "Question",
          "name": "Como funciona o acúmulo de pontos de fidelidade?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "A cada pedido feito no site, 10% do valor total pago é convertido em pontos de fidelidade na sua conta. Cada 100 pontos equivalem a R$ 1.00 de desconto, que pode ser ativado a qualquer momento no carrinho de compras."
          }
        }
      ]
    };

    return [orgSchema, businessSchema, faqSchema];
  }, [storeSettings, phone, addressText, isAddressComplete]);

  const howItWorksSteps = [
    {
      step: "01",
      icon: <UtensilsCrossed className="w-6 h-6 text-emerald-600" />,
      title: "Monte Seu Cardápio",
      description: "Selecione pratos avulsos ou escolha um Kit pronto nutricionalmente equilibrado.",
    },
    {
      step: "02",
      icon: <Snowflake className="w-6 h-6 text-blue-500" />,
      title: "Cozido & Ultracongelado",
      description: "Cozinhamos tudo fresco e congelamos rapidamente para travar os nutrientes e sabor.",
    },
    {
      step: "03",
      icon: <Truck className="w-6 h-6 text-amber-500" />,
      title: "Receba em Casa",
      description: "Entregamos na sua temperatura ideal e dia agendado. Guarde direto no freezer.",
    },
    {
      step: "04",
      icon: <Clock className="w-6 h-6 text-rose-500" />,
      title: "Aqueça & Saboreie",
      description: "Esquente por apenas 5-7 minutos no micro-ondas e coma comida saudável de verdade.",
    },
  ];

  return (
    <div className={cn(
      "min-h-screen bg-[#FBFBFC] text-slate-900 pb-20 transition-all duration-500",
      storeSettings?.accessibility?.highContrast && "contrast-125 saturate-150",
      storeSettings?.accessibility?.dyslexicFont && "font-dyslexic"
    )}>
      <SEO
        title="Marmitas Fitness, Low Carb e Congeladas Saudáveis"
        description="Marmitas saudáveis, fitness e low carb ultracongeladas com sabor de comida caseira. Entregas em Jundiaí e região. Monte seu prato ou kit do seu jeito!"
        path="/"
        schemaMarkup={schemas}
      />

      {/* ================= HERO (LIMPO SEM IMAGEM) ================= */}
      <section className="relative overflow-hidden pt-12 pb-20 lg:pt-24 lg:pb-32">
        <div className="absolute top-0 left-0 right-0 h-160 bg-linear-to-b from-emerald-50/40 to-transparent -z-10" />

        <div className="container mx-auto px-4 max-w-4xl text-center space-y-10 animate-in fade-in duration-700">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-slate-100 shadow-sm mx-auto">
            <span className={cn(
              "w-2 h-2 rounded-full animate-pulse",
              isEmergency ? "bg-amber-500" : "bg-emerald-500"
            )} />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
              {isEmergency ? "Ajustando a Cozinha" : "Ingredientes Frescos Hoje"}
            </span>
          </div>

          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter text-slate-900 leading-[0.85] uppercase">
            Natural por essência, <br />
            <span className="text-transparent bg-clip-text bg-linear-to-r from-primary to-accent italic lowercase font-serif font-normal block pt-2">
              feita do seu jeito.
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-500 max-w-xl font-bold uppercase tracking-tight leading-relaxed mx-auto">
            Comida de verdade, sem conservantes e com o tempero que a sua saúde merece.
            Sabor autêntico para quem não abre mão do equilíbrio.
          </p>

          <div className="flex items-center justify-center gap-1.5 text-xs font-black text-slate-400 uppercase tracking-wider">
            <div className="flex text-amber-400">
              <Star className="w-3.5 h-3.5 fill-current" />
              <Star className="w-3.5 h-3.5 fill-current" />
              <Star className="w-3.5 h-3.5 fill-current" />
              <Star className="w-3.5 h-3.5 fill-current" />
              <Star className="w-3.5 h-3.5 fill-current" />
            </div>
            <span>• Alta Praticidade e Variedade</span>
          </div>

          <div className="flex flex-wrap justify-center gap-4 pt-2">
            {isEmergency ? (
              <div className="flex items-center gap-3 p-5 bg-amber-50 rounded-[2rem] border border-amber-200 text-amber-800 shadow-inner">
                <Clock className="animate-pulse" />
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest">Pausa Criativa</p>
                  <p className="text-xs font-bold italic">Nossos chefs voltam em instantes!</p>
                </div>
              </div>
            ) : (
              <div className="flex gap-4">
                <Link to="/produtos">
                  <Button className="h-16 px-10 rounded-2xl bg-slate-900 hover:bg-primary/90 text-white font-black text-xs uppercase tracking-[0.2em] shadow-2xl transition-all active:scale-95">
                    Ver Cardápio <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </Link>
                <Link to="/pacotes">
                  <Button variant="outline" className="h-16 px-8 rounded-2xl border-slate-200 text-slate-700 font-black text-xs uppercase tracking-[0.2em] hover:border-primary/50 hover:text-primary transition-all bg-white">
                    <Package className="mr-2 w-4 h-4" /> Kits
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {!isEmergency && (
            <div className="space-y-4 pt-6 border-t border-slate-100 max-w-md mx-auto">
              <div className="space-y-2">
                <label htmlFor="cep-input" className="text-[9px] font-black uppercase tracking-widest text-slate-400 block text-center">
                  Consultar área de entrega:
                </label>
                <div className="flex gap-2">
                  <input
                    id="cep-input"
                    type="text"
                    placeholder="Digite seu CEP (Ex: 13200-000)"
                    className="flex-1 h-12 px-4 rounded-xl border border-slate-200 text-xs font-bold focus:outline-none focus:border-primary bg-white transition-all uppercase text-center"
                    value={cepInput}
                    onChange={handleCepChange}
                    maxLength={9}
                  />
                  <Button
                    type="button"
                    onClick={handleCheckCep}
                    disabled={checkingCep || cepInput.replace(/\D/g, "").length < 8}
                    className="h-12 px-5 bg-slate-900 text-white hover:bg-primary rounded-xl font-black text-[10px] uppercase tracking-widest transition-all"
                  >
                    {checkingCep ? "..." : "Consultar"}
                  </Button>
                </div>
                {cepStatus && (
                  <p className={cn(
                    "text-[10px] font-bold uppercase tracking-wider text-center",
                    cepStatus.success ? "text-emerald-600" : "text-rose-500"
                  )}>
                    {cepStatus.message}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ================= CATEGORIAS PREMIUM ================= */}
      {categoriesData && categoriesData.length > 0 && (
        <section className="py-12 container mx-auto px-4 border-b border-slate-100">
          <h2 className="sr-only">Categorias de Marmitas Congeladas</h2>
          <div className="flex items-center gap-6 overflow-x-auto pb-4 -mx-4 px-4 snap-x no-scrollbar">
            {(categoriesData as HomeCategory[]).map((cat) => {
              const colors = getCategoryColorClasses(cat.color, cat.name);
              const descText = cat.description || getCategoryFallbackDescription(cat.name);

              return (
                <Link
                  key={cat.id}
                  to={`/produtos?category=${cat.id}`}
                  className={cn(
                    "w-48 h-36 md:w-60 md:h-40 rounded-3xl shrink-0 snap-start group border-2 relative flex flex-col p-5 md:p-6 pt-7 md:pt-8 overflow-hidden transition-all duration-500 hover:shadow-xl hover:scale-105 text-left",
                    colors.bg,
                    colors.border
                  )}
                >
                  <div className={cn("absolute top-0 left-0 right-0 h-1.5 rounded-t-3xl", colors.topBar)} />
                  <h3 className="text-xs md:text-sm font-black uppercase italic tracking-wider text-slate-800 leading-tight group-hover:text-slate-950 transition-colors">
                    {cat.name}
                  </h3>
                  <p className="text-[10px] md:text-xs text-slate-400 font-bold uppercase tracking-tight leading-snug mt-2 line-clamp-2">
                    {descText}
                  </p>
                  <div className="mt-auto pt-3 border-t border-slate-100/50 flex items-center justify-between w-full">
                    <span className={cn("text-[9px] md:text-[10px] font-black uppercase tracking-widest text-slate-400 transition-colors", colors.countText)}>
                      {cat.dishCount && cat.dishCount > 0 ? (
                        cat.dishCount === 1 ? "1 prato" : `${cat.dishCount} pratos`
                      ) : "Em breve"}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-600 group-hover:translate-x-1 transition-all" />
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* ================= SHOWCASES (MAIS VENDIDOS) ================= */}
      <section className="py-20 container mx-auto px-4">
        {isShowcasesLoading ? (
          <div className="flex gap-6 overflow-hidden">
            {[1, 2, 3].map((i) => (
              <div key={i} className="min-w-70 h-96 bg-slate-100 rounded-[3rem] animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="space-y-32">
            {(showcases as ShowcaseData[])?.filter((showcase) => (showcase.items?.length || 0) > 0).map((showcase) => (
              <div key={showcase.id} className="space-y-10 group/showcase">
                <div className="flex items-end justify-between border-b border-slate-100 pb-6">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Flame className="text-orange-500" size={18} />
                      <span className="text-[10px] font-black text-orange-500 uppercase tracking-[0.3em]">
                        Os Favoritos
                      </span>
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
                  {showcase.items?.slice(0, 8).map((product) => (
                    <div key={product.id} className="min-w-[240px] md:min-w-85 snap-start">
                      <ProductCard product={product} onClick={() => setSelectedDishId(Number(product.id))} />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ================= PACOTES / KITS ================= */}
      {(isPackagesLoading || (packages && packages.length > 0)) && (
        <section className="py-20 container mx-auto px-4">
          <div className="flex items-end justify-between border-b border-slate-100 pb-6 mb-12">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Package className="text-emerald-600" size={18} />
                <span className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.3em]">
                  Monte o Seu
                </span>
              </div>
              <h2 className="text-4xl font-black uppercase italic tracking-tighter text-slate-900">
                Kits & Pacotes
              </h2>
            </div>
            <Link to="/pacotes">
              <Button variant="ghost" className="text-slate-400 font-black uppercase text-[10px] tracking-widest hover:text-emerald-600">
                Ver Todos <ArrowRight className="ml-2 w-3 h-3" />
              </Button>
            </Link>
          </div>

          {isPackagesLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-80 bg-slate-100 rounded-[2.5rem] animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="flex gap-6 overflow-x-auto pb-12 -mx-4 px-4 snap-x no-scrollbar lg:grid lg:grid-cols-3 lg:gap-6 lg:overflow-x-visible lg:pb-0">
              {(packages as PackageItem[])?.slice(0, 6).map((pkg) => {
                const price = toPrice(pkg.price);
                const salePrice = toPrice(pkg.salePrice);
                const finalPrice = salePrice > 0 && salePrice < price ? salePrice : price;
                const hasDiscount = salePrice > 0 && salePrice < price;
                const highlights = parseHighlights(pkg.highlights);

                return (
                  <div
                    key={pkg.id}
                    className="min-w-[260px] md:min-w-0 snap-start group relative bg-white rounded-[2.5rem] border border-slate-100 overflow-hidden hover:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.12)] transition-all duration-500 flex flex-col lg:w-full"
                  >
                    {pkg.isPopular && (
                      <div className="absolute top-5 left-5 z-10 flex items-center gap-1 bg-amber-400 text-white px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest shadow-lg">
                        <Star size={10} className="fill-white" /> Mais Pedido
                      </div>
                    )}

                    {hasDiscount && (
                      <div className="absolute top-5 right-5 z-10 bg-rose-500 text-white px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest shadow-lg">
                        -{Math.round(((price - salePrice) / price) * 100)}%
                      </div>
                    )}

                    <div className="p-7 flex flex-col flex-1 pt-12">
                      <h3 className="font-black text-lg text-slate-900 uppercase italic tracking-tight mb-2 line-clamp-1">
                        {pkg.name}
                      </h3>

                      {pkg.description && (
                        <p className="text-xs text-slate-400 font-medium leading-relaxed mb-3 line-clamp-2">
                          {pkg.description}
                        </p>
                      )}

                      {highlights.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-4">
                          {highlights.slice(0, 3).map((h, i) => (
                            <span
                              key={i}
                              className="text-[9px] font-black text-emerald-600 uppercase bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full"
                            >
                              {h}
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-50">
                        <div className="flex flex-col">
                          {hasDiscount && (
                            <span className="text-[10px] text-slate-400 line-through font-medium">
                              R$ {price.toFixed(2)}
                            </span>
                          )}
                          <span className="text-2xl font-black text-slate-900 italic">
                            R$ {finalPrice.toFixed(2)}
                          </span>
                        </div>

                        {!isEmergency ? (
                          <Button
                            onClick={() => setSelectedPackageId(String(pkg.id))}
                            className="rounded-2xl bg-emerald-600 hover:bg-slate-900 text-white font-black text-[10px] uppercase tracking-widest px-5 h-11 shadow-lg shadow-emerald-900/20 transition-all"
                          >
                            Montar Kit
                          </Button>
                        ) : (
                          <Clock size={20} className="text-slate-300" />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* ================= SEÇÃO PERSONALIZADA (DIETAS & FIDELIDADE) ================= */}
      <section className="py-12 container mx-auto px-4">
        {isAuthenticated ? (
          <div className="grid md:grid-cols-2 gap-6 items-start">
            <div className="rounded-[2.5rem] border border-emerald-100 bg-linear-to-r from-emerald-50 to-white p-8 text-left shadow-sm">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-emerald-200 text-emerald-600 text-[9px] font-black uppercase tracking-widest">
                Clube Gourmet
              </div>
              <div className="mt-4 space-y-3">
                <h3 className="text-2xl font-black uppercase italic tracking-tighter leading-none text-slate-900">
                  Você ganha pontos em cada compra
                </h3>
                <p className="text-sm text-slate-600 font-medium max-w-xl leading-relaxed">
                  Continue comprando pelo site para acumular pontos e trocar por descontos nas próximas compras.
                </p>
                <div className="flex flex-wrap gap-3 pt-2">
                  <Link to="/perfil/fidelidade">
                    <Button className="h-12 px-6 rounded-2xl bg-slate-900 hover:bg-emerald-600 text-white font-black text-[10px] uppercase tracking-[0.15em]">
                      Ver meus pontos
                    </Button>
                  </Link>
                  <Link to="/produtos">
                    <Button variant="outline" className="h-12 px-6 rounded-2xl border-emerald-200 text-emerald-700 font-black text-[10px] uppercase tracking-[0.15em] hover:bg-emerald-50">
                      Continuar comprando
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <ActiveDietBanner />
            </div>
          </div>
        ) : (
          <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-[2.5rem] p-8 md:p-10 border border-slate-700/50 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 text-left">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[9px] font-black uppercase tracking-widest">
                Clube Gourmet
              </div>
              <h3 className="text-2xl md:text-3xl font-black uppercase italic tracking-tighter leading-none">
                Compre e ganhe pontos <br className="hidden md:inline" />
                <span className="text-emerald-400">no Clube Gourmet</span>
              </h3>
              <p className="text-xs text-slate-400 font-medium max-w-xl">
                Acumule pontos em cada pedido e troque por descontos nas próximas compras.
              </p>
            </div>
            <Button
              onClick={() => window.dispatchEvent(new CustomEvent("open-auth-drawer"))}
              className="h-14 px-8 rounded-2xl bg-primary hover:bg-primary/90 text-white font-black text-xs uppercase tracking-[0.15em] shrink-0 active:scale-95 transition-all border-none"
            >
              Criar conta
            </Button>
          </div>
        )}
      </section>

      {/* ================= COMO FUNCIONA (4 ETAPAS) ================= */}
      <section className="bg-slate-900 text-white py-20 rounded-[3.5rem] md:rounded-[5rem] mx-4 relative z-10 shadow-3xl text-left">
        <div className="container mx-auto px-6">
          <div className="text-center max-w-xl mx-auto mb-16 space-y-3">
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-400">
              Passo a Passo
            </span>
            <h2 className="text-3xl md:text-4xl font-black uppercase italic tracking-tighter text-white">
              Como Funciona
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12">
            {howItWorksSteps.map((s, i) => (
              <div key={i} className="flex flex-col space-y-4 group cursor-default relative">
                <div className="flex items-center justify-between">
                  <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10 group-hover:bg-emerald-600 transition-colors duration-500">
                    {s.icon}
                  </div>
                  <span className="text-3xl font-black text-white/10 italic select-none group-hover:text-emerald-500/20 transition-colors">
                    {s.step}
                  </span>
                </div>
                <h3 className="text-base font-black uppercase italic tracking-wider text-white pt-2">{s.title}</h3>
                <p className="text-slate-400 text-[11px] font-bold uppercase tracking-tight leading-relaxed">
                  {s.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= BANNER NUTRICIONISTA PARCEIRO RESTRUTURADO (TEXT-ONLY COMPACT) ================= */}
      <section className="py-24 bg-white rounded-t-[5rem] border-t border-slate-100">
        <div className="container mx-auto px-4 md:px-6">
          <div className="bg-slate-900 text-white rounded-[3.5rem] overflow-hidden border border-slate-800 shadow-2xl p-8 sm:p-12 lg:p-16 transition-all duration-500 hover:scale-[1.01]">
            <div className="max-w-3xl space-y-8 text-left">

              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[9px] font-black uppercase tracking-widest">
                  <Leaf size={10} className="animate-pulse" /> Área do Profissional
                </div>

                <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black uppercase italic tracking-tighter leading-[0.95] text-white">
                  Transforme prescrições <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">em refeições reais.</span>
                </h2>

                <p className="text-xs sm:text-sm text-slate-400 font-bold uppercase tracking-tight leading-relaxed max-w-xl">
                  Simplifique a rotina do seu consultório. Prescreva marmitas saudáveis, balanceadas e ultracongeladas da Gourmet Saudável diretamente para a casa do seu paciente.
                </p>
              </div>

              {/* Grid interno de benefícios */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="p-4 bg-white/5 rounded-2xl border border-white/10 flex items-start gap-3 hover:bg-white/10 transition-colors">
                  <Heart className="text-emerald-400 shrink-0 mt-0.5" size={16} />
                  <div>
                    <h4 className="text-xs font-black uppercase text-white tracking-wide">Adesão de 100%</h4>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight mt-0.5">Seu paciente segue a dieta com praticidade e sabor.</p>
                  </div>
                </div>

                <div className="p-4 bg-white/5 rounded-2xl border border-white/10 flex items-start gap-3 hover:bg-white/10 transition-colors">
                  <Zap className="text-amber-400 shrink-0 mt-0.5" size={16} />
                  <div>
                    <h4 className="text-xs font-black uppercase text-white tracking-wide">Painel Exclusivo</h4>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight mt-0.5">Monte cardápios personalizados e gerencie indicações.</p>
                  </div>
                </div>
              </div>

              {/* Botão de Ação */}
              <div className="pt-4 flex items-center gap-4">
                <Link to="/nutricionistas" className="shrink-0">
                  <Button className="h-14 px-8 rounded-2xl bg-primary hover:bg-primary/90 text-white font-black text-xs uppercase tracking-[0.15em] border-none shadow-lg shadow-slate-950/40 transition-all hover:scale-105 active:scale-95 flex items-center gap-2">
                    Quero ser Parceiro <ArrowRight size={14} />
                  </Button>
                </Link>
                <span className="text-[9px] font-black uppercase tracking-wider text-slate-500 max-w-[150px] hidden sm:inline leading-tight">
                  * Cadastro gratuito sujeito a validação de CRN.
                </span>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* ================= FAQ (PERGUNTAS FREQUENTES) ================= */}
      <section className="py-20 bg-slate-50 border-t border-slate-100">
        <div className="container mx-auto px-6 text-left max-w-3xl">
          <div className="text-center mb-16 space-y-3">
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-600">
              Dúvidas Frequentes
            </span>
            <h2 className="text-3xl md:text-4xl font-black uppercase italic tracking-tighter text-slate-900">
              Perguntas Frequentes
            </h2>
          </div>

          <Accordion type="single" collapsible className="w-full space-y-4">
            <AccordionItem value="item-1" className="bg-white px-6 py-2 rounded-3xl border border-slate-100 shadow-sm">
              <AccordionTrigger className="font-black uppercase italic text-xs tracking-wider text-slate-800 hover:no-underline">
                Como os pratos são conservados?
              </AccordionTrigger>
              <AccordionContent className="text-xs text-slate-500 font-bold uppercase tracking-tight leading-relaxed pt-2">
                Nossos pratos são preparados com ingredientes 100% frescos e congelados através de um processo de ultracongelamento rápido. Isso impede a formação de cristais de gelo, conservando a textura, os nutrientes e o sabor original por até 90 dias no freezer.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-2" className="bg-white px-6 py-2 rounded-3xl border border-slate-100 shadow-sm">
              <AccordionTrigger className="font-black uppercase italic text-xs tracking-wider text-slate-800 hover:no-underline">
                Como aquecer as refeições?
              </AccordionTrigger>
              <AccordionContent className="text-xs text-slate-500 font-bold uppercase tracking-tight leading-relaxed pt-2">
                Basta retirar o selo plástico protetor e levar a marmita diretamente ao micro-ondas por 5 a 7 minutes (o tempo varia de acordo com a potência do aparelho). Também é possível aquecer em forno convencional pré-aquecido por cerca de 25 minutos.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-3" className="bg-white px-6 py-2 rounded-3xl border border-slate-100 shadow-sm">
              <AccordionTrigger className="font-black uppercase italic text-xs tracking-wider text-slate-800 hover:no-underline">
                Aceitam Vale-Refeição e Vale-Alimentação?
              </AccordionTrigger>
              <AccordionContent className="text-xs text-slate-500 font-bold uppercase tracking-tight leading-relaxed pt-2">
                Aceitamos Pix, cartões e principais vales-refeição/benefício. As opções exibidas no checkout seguem a configuração ativa da loja.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-4" className="bg-white px-6 py-2 rounded-3xl border border-slate-100 shadow-sm">
              <AccordionTrigger className="font-black uppercase italic text-xs tracking-wider text-slate-800 hover:no-underline">
                Como funciona o acúmulo de pontos de fidelidade?
              </AccordionTrigger>
              <AccordionContent className="text-xs text-slate-500 font-bold uppercase tracking-tight leading-relaxed pt-2">
                A cada pedido feito no site, 10% do valor total pago é convertido em pontos de fidelidade na sua conta. Cada 100 pontos equivalem a R$ 1.00 de desconto, que pode ser ativado a qualquer momento no carrinho de compras.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>

      {/* ================= DRAWERS ================= */}
      <ProductDrawer dishId={selectedDishId} onClose={() => setSelectedDishId(null)} />
      <PackageDrawer packageId={selectedPackageId} onClose={() => setSelectedPackageId(null)} />
    </div>
  );
}