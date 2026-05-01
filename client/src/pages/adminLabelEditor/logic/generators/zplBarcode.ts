// client/src/pages/adminLabelEditor/logic/generators/zplBarcode.ts
import { LabelElement, LabelData, pxToDots } from "../label-compiler";

export function generateZplBarcode(
  el: LabelElement,
  data: LabelData,
  dpi: 203 | 300 = 203
): string {
  const x = pxToDots(el.x, dpi);
  const y = pxToDots(el.y, dpi);
  const h = pxToDots(el.height, dpi);

  const barcodeValue = (data.orderId || "0000")
    .replace(/\^/g, "")
    .replace(/~/g, "");

  // ^FO  — posição
  // ^BY2 — largura da barra (2 dots)
  // ^BCN — Code-128, sentido Normal, altura, imprimir HRI embaixo (Y)
  // ^FD  — dados
  // ^FS  — fim do field
  return `^FO${x},${y}^BY2^BCN,${h},Y,N,N^FD${barcodeValue}^FS`;
}