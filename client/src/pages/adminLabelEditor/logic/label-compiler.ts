// client/src/pages/adminLabelEditor/logic/label-compiler.ts
import { safeJsonParse } from "@/lib/safe-parse";
import { mmToZplDots, pxToZplDots } from "../print-engine/zplTextBlock";
import { generateZplText } from "./generators/zplText";
import { generateZplBarcode } from "./generators/zplBarcode";
import { generateZplNutritionTable } from "./generators/zplNutritionTable";

// --- INTERFACES ---

export interface LabelElement {
  id: string;
  type: "text" | "barcode" | "nutrition_table" | "line";
  x: number;
  y: number;
  fontSize: number;
  field: string;
  staticText: string;
  width: number;
  height: number;
  textAlign?: "left" | "center" | "right";
  maxLines?: number;
  lineSpacing?: number;
}

export interface LabelConfig {
  width: number;  // mm
  height: number; // mm
  dpi: 203 | 300; // DPI da impressora Zebra
}

export interface LabelData {
  dishName: string;
  customerName: string;
  ingredients: string;
  kcal: string;
  carbs: string;
  prots: string;
  fats: string;
  orderId: string;
  itemIndex: number;
  totalItems: number;
  accompaniments?: string;
}

// ─── Conversão de unidades ────────────────────────────────────────────────────
//
// O editor armazena coordenadas em PIXELS DE TELA (96dpi do browser).
// A Zebra usa DOTS:
//   - 203dpi → 8 dots/mm  → 1 dot = 0.125mm
//   - 300dpi → 12 dots/mm → 1 dot = 0.083mm
//
// O label é exibido com tamanho em `mm` via CSS.
// No browser a 96dpi: 1mm = 3.7795px
// Portanto:
//   dots = px * (dots_per_mm) / (px_per_mm)
//   dots = px * (dots_per_mm) / 3.7795

export function pxToDots(px: number, dpi: 203 | 300): number {
  return pxToZplDots(px, dpi);
}

export function mmToDots(mm: number, dpi: 203 | 300): number {
  return mmToZplDots(mm, dpi);
}

// ─── Tipos ────────────────────────────────────────────────────────────────────

type ZplGenerator = (
  el: LabelElement,
  data: LabelData,
  dpi: 203 | 300
) => string;

const GENERATORS: Record<string, ZplGenerator> = {
  text:            generateZplText,
  barcode:         generateZplBarcode,
  nutrition_table: generateZplNutritionTable,
};

// ─── Compilador ──────────────────────────────────────────────────────────────

export function compileToZPL(
  elementsJson: string,
  data: LabelData,
  config: LabelConfig = { width: 100, height: 60, dpi: 203 }
): string {
  const elements = safeJsonParse<LabelElement[]>(elementsJson, []);
  const { width, height, dpi } = config;

  const pw = mmToDots(width, dpi);   // ^PW — largura em dots
  const ll = mmToDots(height, dpi);  // ^LL — comprimento em dots

  // ^XA           início da etiqueta
  // ^CI28         UTF-8
  // ^PW           print width (evita corte lateral)
  // ^LL           label length (evita corte inferior)
  // ^LH0,0        label home (origem no canto superior esquerdo)
  let zpl = `^XA\n^CI28\n^PW${pw}\n^LL${ll}\n^LH0,0\n`;

  for (const el of elements) {
    const generator = GENERATORS[el.type];
    if (generator) {
      zpl += generator(el, data, dpi) + "\n";
    }
  }

  zpl += "^XZ";
  return zpl;
}
