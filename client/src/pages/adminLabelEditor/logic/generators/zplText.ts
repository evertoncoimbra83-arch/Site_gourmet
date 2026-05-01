// client/src/pages/adminLabelEditor/logic/generators/zplText.ts
import { LabelElement, LabelData, pxToDots } from "../label-compiler";

export function generateZplText(
  el: LabelElement,
  data: LabelData,
  dpi: 203 | 300 = 203
): string {
  const x    = pxToDots(el.x, dpi);
  const y    = pxToDots(el.y, dpi);
  const size = pxToDots(el.fontSize, dpi);

  let content =
    el.staticText ||
    String(data[el.field as keyof LabelData] ?? "");

  // Remove caracteres que quebram ZPL
  content = content.replace(/\^/g, "").replace(/~/g, "").trim();

  // ^FO x,y   — Field Origin
  // ^A0N,h,w  — Fonte Zebra 0, sentido Normal, altura, largura
  // ^FD       — Field Data
  // ^FS       — Field Separator
  return `^FO${x},${y}^A0N,${size},${size}^FD${content}^FS`;
}