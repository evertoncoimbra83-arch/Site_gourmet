import { LabelElement, LabelData, pxToDots } from "../label-compiler";
import {
  generateZplTextBlock,
  getZplTextMaxLines,
} from "../../print-engine/zplTextBlock";

export function generateZplText(
  el: LabelElement,
  data: LabelData,
  dpi: 203 | 300 = 203
): string {
  const x = pxToDots(el.x, dpi);
  const y = pxToDots(el.y, dpi);
  const size = pxToDots(el.fontSize, dpi);
  const width = pxToDots(el.width, dpi);
  const height = pxToDots(el.height, dpi);

  const content =
    el.staticText ||
    String(data[el.field as keyof LabelData] ?? "");

  return generateZplTextBlock({
    x,
    y,
    width,
    fontSize: size,
    fontWidth: Math.round(size * 0.9),
    text: content,
    maxLines: el.maxLines ?? getZplTextMaxLines(height, size),
    lineSpacing: el.lineSpacing,
    alignment: el.textAlign,
  });
}
