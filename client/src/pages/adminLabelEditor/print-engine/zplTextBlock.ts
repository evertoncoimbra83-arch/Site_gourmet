import { sanitizeZplText } from "./zplEscaping";

export const PX_PER_MM = 3.7795;

export type ZplTextAlignment = "left" | "center" | "right" | "L" | "C" | "R";

export interface ZplTextBlockOptions {
  x: number;
  y: number;
  width: number;
  fontSize: number;
  text: unknown;
  maxLines?: number;
  lineSpacing?: number;
  alignment?: ZplTextAlignment;
  fontWidth?: number;
}

export function pxToZplDots(px: number, dpi: 203 | 300): number {
  const dotsPerMm = dpi === 300 ? 12 : 8;
  return Math.round(px * (dotsPerMm / PX_PER_MM));
}

export function mmToZplDots(mm: number, dpi: 203 | 300): number {
  const dotsPerMm = dpi === 300 ? 12 : 8;
  return Math.round(mm * dotsPerMm);
}

export function getZplTextMaxLines(height: number, fontSize: number): number {
  return Math.max(1, Math.floor(height / Math.max(1, fontSize)));
}

function normalizeAlignment(alignment: ZplTextAlignment = "left"): "L" | "C" | "R" {
  if (alignment === "center" || alignment === "C") return "C";
  if (alignment === "right" || alignment === "R") return "R";
  return "L";
}

function normalizePositiveInteger(value: number, fallback: number): number {
  const normalized = Number.isFinite(value) ? Math.round(value) : fallback;
  return Math.max(1, normalized);
}

export function generateZplTextBlock({
  x,
  y,
  width,
  fontSize,
  fontWidth,
  text,
  maxLines,
  lineSpacing = 0,
  alignment = "left",
}: ZplTextBlockOptions): string {
  const safeX = Math.max(0, Math.round(Number.isFinite(x) ? x : 0));
  const safeY = Math.max(0, Math.round(Number.isFinite(y) ? y : 0));
  const safeWidth = normalizePositiveInteger(width, 1);
  const safeFontSize = normalizePositiveInteger(fontSize, 12);
  const safeFontWidth = normalizePositiveInteger(fontWidth ?? safeFontSize, safeFontSize);
  const safeMaxLines = normalizePositiveInteger(maxLines ?? 1, 1);
  const safeLineSpacing = Math.max(0, Math.round(Number.isFinite(lineSpacing) ? lineSpacing : 0));
  const safeAlignment = normalizeAlignment(alignment);
  const safeText = sanitizeZplText(text);

  return [
    `^FO${safeX},${safeY}`,
    `^A0N,${safeFontSize},${safeFontWidth}`,
    `^FB${safeWidth},${safeMaxLines},${safeLineSpacing},${safeAlignment},0`,
    "^FH_",
    `^FD${safeText}^FS`,
  ].join("\n");
}
