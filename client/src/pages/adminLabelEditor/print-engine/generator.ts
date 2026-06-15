import type { PrintLabelElement } from "./templates";
import {
  formatNutritionTableText,
  type NutritionData,
} from "./logic";
import {
  generateZplTextBlock,
  getZplTextMaxLines,
  PX_PER_MM,
} from "./zplTextBlock";
import { sanitizeCode128BarcodeValue } from "./zplEscaping";
import { getZplImageOrTriggerPreload } from "./zplImage";


export type ZebraDPI = 203 | 300;

type Code128BarcodeElement = Omit<PrintLabelElement, "type"> & {
  type: "barcode";
};

type ZplLabelElement = PrintLabelElement | Code128BarcodeElement;

const DPI_CONFIG: Record<ZebraDPI, { dotsPerMm: number; pxToDots: number }> = {
  203: { dotsPerMm: 8, pxToDots: 8 / PX_PER_MM },
  300: { dotsPerMm: 12, pxToDots: 12 / PX_PER_MM },
};

export interface ZebraPhysicalConfig {
  dpi?: ZebraDPI;
  darkness?: number;
  printSpeed?: number;
  mediaType?: "T" | "D";
}

function isNutritionData(value: unknown): value is NutritionData {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;

  const record = value as Record<string, unknown>;
  return (
    record.energyKcal !== undefined ||
    record.energyKj !== undefined ||
    record.carbs !== undefined ||
    record.proteins !== undefined ||
    record.fatTotal !== undefined ||
    record.yieldWeight !== undefined
  );
}

function normalizeZplContent(value: unknown, options: { compactNutrition?: boolean } = {}): string {
  if (value == null) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (isNutritionData(value)) {
    return formatNutritionTableText(value, { compact: options.compactNutrition });
  }
  return String(value);
}

function generateCode128BarcodeZpl({
  x,
  y,
  width,
  height,
  fontSize,
  value,
}: {
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: number;
  value: unknown;
}): string {
  const barcode = sanitizeCode128BarcodeValue(value);

  if (!barcode.isValid) {
    return generateZplTextBlock({
      x,
      y,
      width,
      fontSize: Math.max(12, fontSize),
      fontWidth: Math.max(11, Math.round(fontSize * 0.9)),
      text: "CODIGO DE BARRAS INVALIDO",
      maxLines: 2,
      alignment: "center",
    });
  }

  const safeHeight = Math.max(40, Math.min(240, height || 80));

  return [
    `^FO${x},${y}`,
    "^BY2",
    `^BCN,${safeHeight},Y,N,N`,
    `^FD${barcode.value}^FS`,
  ].join("\n");
}

export function generateZPLForBatch(
  layoutElements: ZplLabelElement[],
  labelWidthMm: number,
  labelHeightMm: number,
  flatLabels: unknown[],
  parseContent: (
    content: string,
    index: number,
    element?: ZplLabelElement,
  ) => unknown,
  physical: ZebraPhysicalConfig = {},
): string {
  const dpi = physical.dpi ?? 203;
  const { dotsPerMm, pxToDots } = DPI_CONFIG[dpi];

  const pw = Math.round(labelWidthMm * dotsPerMm);
  const ll = Math.round(labelHeightMm * dotsPerMm);

  let zplBatch = "";

  flatLabels.forEach((_, index) => {
    zplBatch += "^XA\n";

    if (physical.mediaType) zplBatch += `^MT${physical.mediaType}\n`;
    if (physical.darkness !== undefined) {
      zplBatch += `~SD${Math.min(30, Math.max(0, physical.darkness))}\n`;
    }
    if (physical.printSpeed !== undefined) {
      const speed = Math.min(14, Math.max(1, physical.printSpeed));
      zplBatch += `^PR${speed},${speed}\n`;
    }

    zplBatch += `^PW${pw}\n`;
    zplBatch += `^LL${ll}\n`;
    zplBatch += "^LH0,0\n";
    zplBatch += "^CI28\n";

    layoutElements.forEach((element) => {
      const x = Math.round((element.x || 0) * pxToDots);
      const y = Math.round((element.y || 0) * pxToDots);
      const w = Math.round((element.width || 0) * pxToDots);
      const h = Math.round((element.height || 0) * pxToDots);
      const fontSize = Math.round((element.fontSize || 12) * pxToDots);
      const rawContent = parseContent(element.content, index, element);
      const isNutritionContent = isNutritionData(rawContent);
      const content = normalizeZplContent(rawContent, {
        compactNutrition: isNutritionContent && h < 150,
      });

      if (element.type === "box") {
        zplBatch += `^FO${x},${y}\n`;
        zplBatch += `^GB${w},${h},3^FS\n`;
        return;
      }

      if (element.type === "image") {
        const zplGF = getZplImageOrTriggerPreload(element.content, element.width || 0, element.height || 0, dpi);
        if (zplGF) {
          zplBatch += `^FO${x},${y}\n${zplGF}^FS\n`;
        } else {
          // Fallback seguro: moldura com a palavra LOGO
          zplBatch += `^FO${x},${y}\n^GB${w},${h},1^FS\n`;
          const textFontSize = Math.max(10, Math.min(18, Math.round(h * 0.3)));
          const textY = Math.round(y + (h - textFontSize) / 2);
          zplBatch += `^FO${x},${textY}^A0N,${textFontSize},${Math.round(textFontSize * 0.9)}^FB${w},1,0,C,0^FDLOGO^FS\n`;
        }
        return;
      }

      if ((element.type as string) === "barcode") {
        zplBatch += `${generateCode128BarcodeZpl({
          x,
          y,
          width: w,
          height: h,
          fontSize,
          value: rawContent,
        })}\n`;
        return;
      }

      const align =
        element.textAlign === "center"
          ? "C"
          : element.textAlign === "right"
            ? "R"
            : "L";

      zplBatch += `${generateZplTextBlock({
        x,
        y,
        width: w,
        fontSize,
        fontWidth: Math.round(fontSize * 0.9),
        text: content,
        maxLines: isNutritionContent
          ? h < 150
            ? 8
            : 16
          : getZplTextMaxLines(h, fontSize),
        alignment: align,
      })}\n`;
    });

    zplBatch += "^XZ\n\n";
  });

  return zplBatch;
}
