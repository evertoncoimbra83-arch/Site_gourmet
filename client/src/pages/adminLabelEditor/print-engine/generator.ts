import type { PrintLabelElement } from "./templates";

export type ZebraDPI = 203 | 300;

const DPI_CONFIG: Record<ZebraDPI, { dotsPerMm: number; pxToDots: number }> = {
  203: { dotsPerMm: 8, pxToDots: 8 / 3.779 },
  300: { dotsPerMm: 12, pxToDots: 12 / 3.779 },
};

export interface ZebraPhysicalConfig {
  dpi?: ZebraDPI;
  darkness?: number;
  printSpeed?: number;
  mediaType?: "T" | "D";
}

export function generateZPLForBatch(
  layoutElements: PrintLabelElement[],
  labelWidthMm: number,
  labelHeightMm: number,
  flatLabels: unknown[],
  parseContent: (content: string, index: number) => string,
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
      let content = parseContent(element.content, index);
      content = content.replace(/\n/g, "\\&");

      const x = Math.round((element.x || 0) * pxToDots);
      const y = Math.round((element.y || 0) * pxToDots);
      const w = Math.round((element.width || 0) * pxToDots);
      const h = Math.round((element.height || 0) * pxToDots);
      const fontSize = Math.round((element.fontSize || 12) * pxToDots);

      zplBatch += `^FO${x},${y}\n`;

      if (element.type === "box") {
        zplBatch += `^GB${w},${h},3^FS\n`;
        return;
      }

      if (element.type === "image") {
        zplBatch += `^GB${w},${h},1^FS\n`;
        return;
      }

      const align =
        element.textAlign === "center"
          ? "C"
          : element.textAlign === "right"
            ? "R"
            : "L";

      const maxLines = Math.max(1, Math.floor(h / (fontSize || 1)));

      zplBatch += `^A0N,${fontSize},${Math.round(fontSize * 0.9)}\n`;
      zplBatch += `^FB${w},${maxLines},0,${align},0\n`;
      zplBatch += `^FD${content}^FS\n`;
    });

    zplBatch += "^XZ\n\n";
  });

  return zplBatch;
}

