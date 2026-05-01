import React, { useMemo } from "react"; // ✅ Adicionado React para corrigir escopo JSX
import { Leaf, Zap, Heart, Star } from "lucide-react";

interface ProductImageOverlayProps {
  imageUrl: string;
  productName: string;
  isPromotion?: boolean;
  isNew?: boolean;
  isBestseller?: boolean;
  attributes?: {
    isVegan?: boolean;
    isGlutenFree?: boolean;
    highProtein?: boolean;
  };
}

/**
 * Componente que adiciona grafismos, badges e overlays às imagens de produtos
 * Melhora a apresentação visual sem depender de muitas imagens diferentes
 */
export default function ProductImageOverlay({
  imageUrl,
  productName,
  isPromotion = false,
  isNew = false,
  isBestseller = false,
  attributes = {},
}: ProductImageOverlayProps) {
  // Gerar ID único para o padrão SVG usando substring (substr está depreciado)
  const patternId = useMemo(() => `pattern-${Math.random().toString(36).substring(2, 11)}`, []);

  return (
    <div className="relative w-full h-full overflow-hidden bg-muted group text-left">
      {/* SVG Padrão Geométrico de Fundo */}
      <svg
        className="absolute inset-0 w-full h-full opacity-5 pointer-events-none"
        preserveAspectRatio="none"
      >
        <defs>
          <pattern
            id={patternId}
            x="0"
            y="0"
            width="40"
            height="40"
            patternUnits="userSpaceOnUse"
          >
            <circle cx="20" cy="20" r="2" fill="currentColor" className="text-primary" />
            <path d="M0 20 L40 20 M20 0 L20 40" stroke="currentColor" strokeWidth="0.5" className="text-primary" opacity="0.3" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#${patternId})`} />
      </svg>

      {/* Imagem do Produto com Efeito de Hover */}
      <img
        src={imageUrl}
        alt={productName}
        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
      />

      {/* Overlay de Cor Suave (Verde Esmeralda com Transparência) */}
      <div className="absolute inset-0 bg-emerald-900/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

      {/* Efeito de Sombra 3D */}
      <div className="absolute inset-0 shadow-lg shadow-black/20 group-hover:shadow-2xl group-hover:shadow-black/30 transition-shadow duration-300 pointer-events-none" />

      {/* Badges (Promoção, Novo, Bestseller) */}
      <div className="absolute top-3 right-3 flex flex-col gap-2">
        {isPromotion && (
          <div className="bg-gradient-to-r from-orange-500 to-yellow-500 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg animate-pulse">
            🔥 Promoção
          </div>
        )}
        {isNew && (
          <div className="bg-gradient-to-r from-emerald-500 to-green-400 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg">
            ✨ Novo
          </div>
        )}
        {isBestseller && (
          <div className="bg-gradient-to-r from-slate-900 to-slate-700 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg flex items-center gap-1.5">
            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
            Bestseller
          </div>
        )}
      </div>

      {/* Ícones Informativos (Vegano, Sem Glúten, Alto Teor de Proteína) */}
      {(attributes.isVegan || attributes.isGlutenFree || attributes.highProtein) && (
        <div className="absolute bottom-3 left-3 flex gap-2">
          {attributes.isVegan && (
            <div
              className="bg-white/90 backdrop-blur-sm rounded-full p-2 shadow-md hover:bg-white transition-colors group/icon"
              title="Vegano"
            >
              <Leaf className="w-4 h-4 text-emerald-600 transition-transform group-hover/icon:scale-110" />
            </div>
          )}
          {attributes.isGlutenFree && (
            <div
              className="bg-white/90 backdrop-blur-sm rounded-full p-2 shadow-md hover:bg-white transition-colors group/icon"
              title="Sem Glúten"
            >
              <Zap className="w-4 h-4 text-amber-500 transition-transform group-hover/icon:scale-110" />
            </div>
          )}
          {attributes.highProtein && (
            <div
              className="bg-white/90 backdrop-blur-sm rounded-full p-2 shadow-md hover:bg-white transition-colors group/icon"
              title="Alto Teor de Proteína"
            >
              <Heart className="w-4 h-4 text-red-500 transition-transform group-hover/icon:scale-110" />
            </div>
          )}
        </div>
      )}

      {/* Gradiente Sutil de Cima para Baixo */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/20 pointer-events-none" />

      {/* Efeito de Brilho ao Hover (Shine Effect) */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-500 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent transform -skew-x-12 translate-x-full group-hover:translate-x-0 transition-transform duration-1000" />
      </div>
    </div>
  );
}