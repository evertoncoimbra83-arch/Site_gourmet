import React from "react"; // ✅ Adicionado React para corrigir escopo JSX

/**
 * Componente com padrões geométricos SVG reutilizáveis
 * Adiciona profundidade visual e interesse estético às imagens
 */

interface GeometricPatternProps {
  patternId: string;
  type?: "dots" | "grid" | "lines" | "waves" | "hexagon" | "circles";
  opacity?: number;
  color?: string;
}

export function DotPattern({ patternId, opacity = 0.05, color = "currentColor" }: GeometricPatternProps) {
  return (
    <pattern id={patternId} x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
      <circle cx="20" cy="20" r="2" fill={color} opacity={opacity} />
      <circle cx="0" cy="0" r="1.5" fill={color} opacity={opacity * 0.5} />
      <circle cx="40" cy="40" r="1.5" fill={color} opacity={opacity * 0.5} />
    </pattern>
  );
}

export function GridPattern({ patternId, opacity = 0.05, color = "currentColor" }: GeometricPatternProps) {
  return (
    <pattern id={patternId} x="0" y="0" width="50" height="50" patternUnits="userSpaceOnUse">
      <path
        d="M 50 0 L 0 0 0 50"
        fill="none"
        stroke={color}
        strokeWidth="0.5"
        opacity={opacity}
      />
    </pattern>
  );
}

export function LinePattern({ patternId, opacity = 0.05, color = "currentColor" }: GeometricPatternProps) {
  return (
    <pattern id={patternId} x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
      <line x1="0" y1="0" x2="20" y2="20" stroke={color} strokeWidth="0.5" opacity={opacity} />
      <line x1="20" y1="0" x2="0" y2="20" stroke={color} strokeWidth="0.5" opacity={opacity} />
    </pattern>
  );
}

export function WavePattern({ patternId, opacity = 0.05, color = "currentColor" }: GeometricPatternProps) {
  return (
    <pattern id={patternId} x="0" y="0" width="100" height="50" patternUnits="userSpaceOnUse">
      <path
        d="M0,25 Q25,0 50,25 T100,25"
        fill="none"
        stroke={color}
        strokeWidth="1"
        opacity={opacity}
      />
    </pattern>
  );
}

export function HexagonPattern({ patternId, opacity = 0.05, color = "currentColor" }: GeometricPatternProps) {
  return (
    <pattern id={patternId} x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
      <polygon
        points="30,0 60,15 60,45 30,60 0,45 0,15"
        fill="none"
        stroke={color}
        strokeWidth="0.5"
        opacity={opacity}
      />
    </pattern>
  );
}

export function CirclePattern({ patternId, opacity = 0.05, color = "currentColor" }: GeometricPatternProps) {
  return (
    <pattern id={patternId} x="0" y="0" width="80" height="80" patternUnits="userSpaceOnUse">
      <circle cx="40" cy="40" r="30" fill="none" stroke={color} strokeWidth="0.5" opacity={opacity} />
      <circle cx="40" cy="40" r="20" fill="none" stroke={color} strokeWidth="0.5" opacity={opacity * 0.7} />
      <circle cx="40" cy="40" r="10" fill="none" stroke={color} strokeWidth="0.5" opacity={opacity * 0.5} />
    </pattern>
  );
}

type PatternType = "dots" | "grid" | "lines" | "waves" | "hexagon" | "circles";

interface PatternBackgroundProps {
  patternType?: PatternType;
  opacity?: number;
  color?: string;
  className?: string;
}

/**
 * Componente que renderiza um fundo com padrão geométrico
 */
export function PatternBackground({
  patternType = "dots",
  opacity = 0.05,
  color = "currentColor",
  className = "",
}: PatternBackgroundProps) {
  const patternId = `pattern-${patternType}-${Math.random().toString(36).substring(2, 11)}`;

  const PatternComponents: Record<PatternType, React.ComponentType<GeometricPatternProps>> = {
    dots: DotPattern,
    grid: GridPattern,
    lines: LinePattern,
    waves: WavePattern,
    hexagon: HexagonPattern,
    circles: CirclePattern,
  };

  const PatternComponent = PatternComponents[patternType];

  return (
    <svg
      className={`absolute inset-0 w-full h-full opacity-100 pointer-events-none ${className}`}
      preserveAspectRatio="none"
    >
      <defs>
        <PatternComponent patternId={patternId} opacity={opacity} color={color} />
      </defs>
      <rect width="100%" height="100%" fill={`url(#${patternId})`} />
    </svg>
  );
}

/**
 * Componente de gradiente com efeito de profundidade
 */
export function DepthGradient({ className = "" }: { className?: string }) {
  return (
    <div
      className={`absolute inset-0 bg-linear-to-b from-transparent via-transparent to-black/15 pointer-events-none ${className}`}
    />
  );
}

/**
 * Componente de efeito de brilho (shine effect)
 */
export function ShineEffect({ className = "" }: { className?: string }) {
  return (
    <div className={`absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-500 pointer-events-none ${className}`}>
      <div className="absolute inset-0 bg-linear-to-r from-transparent via-white to-transparent transform -skew-x-12 translate-x-full group-hover:translate-x-0 transition-transform duration-1000" />
    </div>
  );
}