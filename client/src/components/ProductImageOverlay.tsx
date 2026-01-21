import { useMemo } from "react";
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
  // Gerar ID único para o padrão SVG
  const patternId = useMemo(() => `pattern-${Math.random().toString(36).substr(2, 9)}`, []);

  return (
    <div className="relative w-full h-full overflow-hidden bg-muted group">
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
        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
      />

      {/* Overlay de Cor Suave (Verde Esmeralda com Transparência) */}
      <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

      {/* Efeito de Sombra 3D */}
      <div className="absolute inset-0 shadow-lg shadow-black/20 group-hover:shadow-2xl group-hover:shadow-black/30 transition-shadow duration-300 pointer-events-none" />

      {/* Badges (Promoção, Novo, Bestseller) */}
      <div className="absolute top-3 right-3 flex flex-col gap-2">
        {isPromotion && (
          <div className="bg-gradient-to-r from-secondary to-yellow-500 text-secondary-foreground px-3 py-1 rounded-full text-xs font-bold shadow-lg animate-pulse">
            🔥 Promoção
          </div>
        )}
        {isNew && (
          <div className="bg-gradient-to-r from-accent to-green-400 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
            ✨ Novo
          </div>
        )}
        {isBestseller && (
          <div className="bg-gradient-to-r from-primary to-accent text-primary-foreground px-3 py-1 rounded-full text-xs font-bold shadow-lg flex items-center gap-1">
            <Star className="w-3 h-3 fill-current" />
            Bestseller
          </div>
        )}
      </div>

      {/* Ícones Informativos (Vegano, Sem Glúten, Alto Teor de Proteína) */}
      {(attributes.isVegan || attributes.isGlutenFree || attributes.highProtein) && (
        <div className="absolute bottom-3 left-3 flex gap-2">
          {attributes.isVegan && (
            <div
              className="bg-white/90 backdrop-blur-sm rounded-full p-2 shadow-md hover:bg-white transition-colors"
              title="Vegano"
            >
              <Leaf className="w-4 h-4 text-green-600" />
            </div>
          )}
          {attributes.isGlutenFree && (
            <div
              className="bg-white/90 backdrop-blur-sm rounded-full p-2 shadow-md hover:bg-white transition-colors"
              title="Sem Glúten"
            >
              <Zap className="w-4 h-4 text-yellow-600" />
            </div>
          )}
          {attributes.highProtein && (
            <div
              className="bg-white/90 backdrop-blur-sm rounded-full p-2 shadow-md hover:bg-white transition-colors"
              title="Alto Teor de Proteína"
            >
              <Heart className="w-4 h-4 text-red-600" />
            </div>
          )}
        </div>
      )}

      {/* Gradiente Sutil de Cima para Baixo */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/10 pointer-events-none" />

      {/* Efeito de Brilho ao Hover (Shine Effect) */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-500 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent transform -skew-x-12 translate-x-full group-hover:translate-x-0 transition-transform duration-1000" />
      </div>
    </div>
  );
}
