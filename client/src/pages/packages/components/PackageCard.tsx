// client/src/pages/packages/components/PackageCard.tsx

import React, { useMemo } from "react";
import { ArrowRight, CheckCircle2, Star, Utensils } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getImageFallback, resolveImageUrl } from "@shared/utils/image-url";

// Interface rigorosa para refletir o Schema do Drizzle
export interface PackageCardData {
  id: string | number;
  name: string;
  description?: string | null;
  highlights?: string[] | string | null;
  imageUrl?: string | null;
  price: number | string;
  salePrice?: number | string | null;
  numberOfOptions?: number | null; // Usamos este campo para contar as refeições
  isPopular?: boolean | number | null;
  intentLabel?: string;
}

interface PackageCardProps {
  pkg: PackageCardData;
  onSelect: (id: string | number) => void;
}

export function PackageCard({ pkg, onSelect }: PackageCardProps) {
  // Normalização de valores numéricos
  const mealCount = Number(pkg.numberOfOptions || 0);
  const basePrice = Number(pkg.price || 0);
  const salePrice = pkg.salePrice ? Number(pkg.salePrice) : null;

  const currentPrice = salePrice && salePrice > 0 ? salePrice : basePrice;
  const pricePerMeal = mealCount > 0 ? currentPrice / mealCount : 0;
  const isPopular = pkg.isPopular === true || pkg.isPopular === 1;

  const money = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  // ✅ Lógica Dinâmica para Highlights (Bullets) vindo do DB
  const displayHighlights = useMemo(() => {
    if (Array.isArray(pkg.highlights) && pkg.highlights.length > 0) {
      return pkg.highlights;
    }

    if (typeof pkg.highlights === 'string' && pkg.highlights.trim() !== '') {
      return pkg.highlights.split(',').map(h => h.trim());
    }

    // Fallback padrão caso os campos novos estejam vazios
    return [
      "Escolha seus pratos favoritos",
      "Combine acompanhamentos gourmet",
      "Nutrição calculada em tempo real"
    ];
  }, [pkg.highlights]);

  return (
    <div className={cn(
      "relative flex flex-col bg-white rounded-4xl border-2 transition-all duration-500 overflow-hidden group hover:-translate-y-1 hover:shadow-2xl h-full",
      isPopular ? "border-emerald-500 shadow-xl shadow-emerald-100" : "border-slate-100 hover:border-emerald-200"
    )}>
      {/* Badge de Destaque */}
      {isPopular && (
        <div className="absolute top-0 inset-x-0 h-8 bg-emerald-500 text-white flex items-center justify-center gap-1.5 text-[10px] font-black uppercase tracking-widest z-10">
          <Star size={12} fill="currentColor" /> Recomendado pela Nutri
        </div>
      )}

      {/* Container da Imagem */}
      <div className={cn("relative w-full overflow-hidden shrink-0", isPopular ? "h-52 mt-8" : "h-52")}>
        {pkg.imageUrl && pkg.imageUrl.trim() !== "" ? (
          <img
            src={resolveImageUrl(pkg.imageUrl, "package")}
            alt={pkg.name}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            onError={(event) => {
              event.currentTarget.src = getImageFallback("package");
            }}
          />
        ) : (
          /* ✅ Lettering — exibido quando não há foto */
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

        {/* Label de Intenção (Ex: Emagrecimento) */}
        {pkg.intentLabel && (
          <div className="absolute bottom-4 left-4 bg-slate-900/80 backdrop-blur-md text-white text-[9px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest shadow-sm">
            {pkg.intentLabel}
          </div>
        )}
      </div>

      <div className="flex flex-col flex-1 p-8">
        <div className="flex-1">
          {/* Contador de Refeições */}
          <div className="flex items-center gap-2 text-emerald-600 mb-3">
            <Utensils size={14} />
            <span className="text-[11px] font-black uppercase tracking-[0.2em]">
              {mealCount} Refeições
            </span>
          </div>

          {/* Título do Pacote */}
          <h3 className="text-2xl font-black uppercase italic tracking-tighter text-slate-900 leading-[0.9] mb-4">
            {pkg.name}
          </h3>

          {/* Descrição Dinâmica */}
          <p className="text-xs text-slate-500 font-medium leading-relaxed mb-6 line-clamp-3">
            {pkg.description || "Combine os sabores que você mais gosta em um plano nutricional completo e equilibrado para sua rotina."}
          </p>

          {/* Lista de Highlights */}
          <ul className="space-y-3 mb-8">
            {displayHighlights.map((bullet, i) => (
              <li key={i} className="flex items-start gap-3 text-[10px] font-bold text-slate-600 uppercase tracking-widest leading-snug">
                <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                <span>{bullet}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Footer com Preços - Ajustado para não encavalar */}
        <div className="pt-6 border-t border-slate-100 mt-auto">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
            <div className="space-y-1">
              <span className="block text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Total do Combo</span>
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="text-3xl font-black italic text-slate-900 tracking-tighter leading-none">
                  {money(currentPrice)}
                </span>
                {salePrice && basePrice > salePrice && (
                  <span className="text-sm font-bold text-slate-300 line-through decoration-slate-300">
                    {money(basePrice)}
                  </span>
                )}
              </div>
            </div>

            <div className="inline-flex shrink-0">
              <span className="bg-emerald-50 text-emerald-600 px-3 py-2 rounded-xl border border-emerald-100 text-[10px] font-black uppercase tracking-tighter whitespace-nowrap">
                {money(pricePerMeal)} / un
              </span>
            </div>
          </div>

          <Button
            onClick={() => onSelect(pkg.id)}
            className={cn(
              "w-full h-16 rounded-[1.5rem] font-black uppercase tracking-[0.15em] text-[11px] transition-all active:scale-[0.98] group-hover:shadow-xl flex items-center justify-center gap-2",
              isPopular ? "bg-emerald-600 text-white shadow-emerald-500/20 hover:bg-emerald-700" : "bg-slate-950 text-white hover:bg-emerald-600"
            )}
          >
            Personalizar Agora <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
          </Button>
        </div>
      </div>
    </div>
  );
}
