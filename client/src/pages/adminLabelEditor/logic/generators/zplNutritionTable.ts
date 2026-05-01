// client/src/pages/adminLabelEditor/logic/generators/zplNutritionTable.ts
import { LabelElement, LabelData, pxToDots } from "../label-compiler";

export function generateZplNutritionTable(
  el: LabelElement,
  data: LabelData,
  dpi: 203 | 300 = 203
): string {
  const x = pxToDots(el.x, dpi);
  const y = pxToDots(el.y, dpi);
  const w = pxToDots(el.width, dpi);
  const h = pxToDots(el.height, dpi);

  // Proporções internas (baseadas no layout visual)
  const titleH   = Math.round(h * 0.22); // ~22% para o título
  const rowH     = Math.round((h - titleH) / 4); // 4 linhas de nutrição
  const halfW    = Math.round(w / 2);
  const pad      = Math.round(w * 0.05); // margem interna ~5%
  const fontSize = Math.max(Math.round(rowH * 0.7), 18); // fonte proporcional, mín 18

  let zpl = "";

  // 1. Caixa externa
  zpl += `^FO${x},${y}^GB${w},${h},2^FS\n`;

  // 2. Título
  const titleFontSize = Math.max(Math.round(titleH * 0.65), 18);
  zpl += `^FO${x + pad},${y + Math.round(titleH * 0.15)}^A0N,${titleFontSize},${titleFontSize}^FDInfo. Nutricional^FS\n`;

  // 3. Linha divisória horizontal (abaixo do título)
  const dividerY = y + titleH;
  zpl += `^FO${x},${dividerY}^GB${w},0,2^FS\n`;

  // 4. Linha divisória vertical (meio da tabela)
  zpl += `^FO${x + halfW},${dividerY}^GB0,${h - titleH},2^FS\n`;

  // 5. Coluna esquerda: Kcal e Proteína
  const col1X   = x + pad;
  const row1Y   = dividerY + Math.round(rowH * 0.1);
  const row2Y   = row1Y + rowH;
  const row3Y   = row2Y + rowH;
  const row4Y   = row3Y + rowH;

  zpl += `^FO${col1X},${row1Y}^A0N,${fontSize},${fontSize}^FDKcal: ${data.kcal || "0"}^FS\n`;
  zpl += `^FO${col1X},${row2Y}^A0N,${fontSize},${fontSize}^FDProt: ${data.prots || "0"}g^FS\n`;
  zpl += `^FO${col1X},${row3Y}^A0N,${fontSize},${fontSize}^FDCarb: ${data.carbs || "0"}g^FS\n`;
  zpl += `^FO${col1X},${row4Y}^A0N,${fontSize},${fontSize}^FDGord: ${data.fats || "0"}g^FS\n`;

  // 6. Coluna direita: separadores de linha e espaço para valores adicionais
  // (linhas horizontais entre as linhas de nutrição)
  [row2Y, row3Y, row4Y].forEach(rowY => {
    zpl += `^FO${x},${rowY}^GB${w},0,1^FS\n`;
  });

  return zpl;
}