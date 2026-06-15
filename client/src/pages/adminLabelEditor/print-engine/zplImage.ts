/**
 * client/src/pages/adminLabelEditor/print-engine/zplImage.ts
 *
 * Módulo para validação, pré-carregamento e conversão de imagens Base64
 * para o comando gráfico ZPL ^GF inline, com limites de tamanho e fallback seguro.
 */

// Cache de bitmaps ZPL convertidos em memória
const zplImageCache = new Map<string, string>();

const DPI_FACTORS: Record<203 | 300, number> = {
  203: 8 / 3.7795,
  300: 12 / 3.7795,
};

// Limite máximo de Base64 (1.5 milhão de caracteres ~ 1.1MB de arquivo)
const MAX_BASE64_LENGTH = 1.5 * 1024 * 1024;

/**
 * Valida se uma string é um Data URL de imagem permitido (PNG, JPG, JPEG).
 */
export function validateImageDataUrl(base64: string): { isValid: boolean; error?: string } {
  if (!base64) {
    return { isValid: false, error: "Imagem vazia." };
  }

  if (base64.length > MAX_BASE64_LENGTH) {
    return { isValid: false, error: "A imagem excede o limite máximo permitido (1MB)." };
  }

  // Permite apenas PNG e JPG/JPEG
  const allowedMimeRegex = /^data:image\/(png|jpeg|jpg);base64,/i;
  if (!allowedMimeRegex.test(base64)) {
    if (base64.startsWith("data:image/svg") || base64.startsWith("data:image/webp")) {
      return { isValid: false, error: "Formato de imagem não suportado. Use PNG ou JPG." };
    }
    if (base64.startsWith("http://") || base64.startsWith("https://")) {
      return { isValid: false, error: "URLs de imagens remotas não são permitidas." };
    }
    return { isValid: false, error: "Origem de imagem inválida. Use um arquivo PNG ou JPG local." };
  }

  return { isValid: true };
}

/**
 * Gera um bitmap mockado preenchido (sólido) para testes no Node.js (Vitest)
 */
function generateMockZplHex(widthPx: number, heightPx: number, dpi: 203 | 300): string {
  const factor = DPI_FACTORS[dpi];
  const targetW = Math.min(200, Math.round(widthPx * factor));
  const targetH = Math.min(200, Math.round(heightPx * factor));
  const bytesPerRow = Math.ceil(targetW / 8);
  const totalBytes = bytesPerRow * targetH;

  // Gera bytes "FF" (preto) repetidos
  const data = "FF".repeat(totalBytes);
  return `^GFB,${totalBytes},${totalBytes},${bytesPerRow},${data}`;
}

/**
 * Pré-carrega e converte de forma assíncrona uma imagem Base64 para cache local
 */
export function preloadZplImage(
  base64: string,
  widthPx: number,
  heightPx: number,
  dpi: 203 | 300
): Promise<string> {
  const validation = validateImageDataUrl(base64);
  if (!validation.isValid) {
    return Promise.resolve("");
  }

  const cacheKey = `${base64}_${widthPx}_${heightPx}_${dpi}`;
  if (zplImageCache.has(cacheKey)) {
    return Promise.resolve(zplImageCache.get(cacheKey)!);
  }

  if (typeof document === "undefined") {
    // Modo de teste Node.js (Vitest)
    const mock = generateMockZplHex(widthPx, heightPx, dpi);
    zplImageCache.set(cacheKey, mock);
    return Promise.resolve(mock);
  }

  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      try {
        const factor = DPI_FACTORS[dpi];
        const targetW = Math.round(widthPx * factor);
        const targetH = Math.round(heightPx * factor);

        // Limite máximo rígido de 200x200 dots para payload seguro
        const limitW = Math.min(200, targetW);
        const limitH = Math.min(200, targetH);

        if (limitW <= 0 || limitH <= 0) {
          resolve("");
          return;
        }

        const canvas = document.createElement("canvas");
        canvas.width = limitW;
        canvas.height = limitH;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve("");
          return;
        }

        // Desenha a imagem redimensionada
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, limitW, limitH);
        ctx.drawImage(img, 0, 0, limitW, limitH);

        const imgData = ctx.getImageData(0, 0, limitW, limitH);
        const data = imgData.data;

        const bytesPerRow = Math.ceil(limitW / 8);
        const totalBytes = bytesPerRow * limitH;
        let hexString = "";

        for (let y = 0; y < limitH; y++) {
          let currentByte = 0;
          let bitsUsed = 0;
          for (let x = 0; x < limitW; x++) {
            const idx = (y * limitW + x) * 4;
            const r = data[idx];
            const g = data[idx + 1];
            const b = data[idx + 2];
            const a = data[idx + 3];

            // Threshold simples P/B. Se muito claro ou transparente -> branco (0), senão preto (1)
            const isWhite = a < 50 || (r + g + b) / 3 > 127;
            const bit = isWhite ? 0 : 1;

            currentByte = (currentByte << 1) | bit;
            bitsUsed++;

            if (bitsUsed === 8) {
              hexString += currentByte.toString(16).padStart(2, "0").toUpperCase();
              currentByte = 0;
              bitsUsed = 0;
            }
          }

          if (bitsUsed > 0) {
            currentByte = currentByte << (8 - bitsUsed);
            hexString += currentByte.toString(16).padStart(2, "0").toUpperCase();
          }
        }

        const zplGF = `^GFB,${totalBytes},${totalBytes},${bytesPerRow},${hexString}`;
        zplImageCache.set(cacheKey, zplGF);
        resolve(zplGF);
      } catch (err) {
        console.error("Erro ao converter imagem no Canvas:", err);
        resolve("");
      }
    };
    img.onerror = () => {
      resolve("");
    };
    img.src = base64;
  });
}

/**
 * Obtém a imagem ZPL do cache de forma síncrona.
 * Se não estiver pronta, inicia o preloading em background e retorna string vazia.
 */
export function getZplImageOrTriggerPreload(
  base64: string,
  widthPx: number,
  heightPx: number,
  dpi: 203 | 300
): string {
  const cacheKey = `${base64}_${widthPx}_${heightPx}_${dpi}`;
  const cached = zplImageCache.get(cacheKey);
  if (cached) return cached;

  // Dispara pre-loading em background
  preloadZplImage(base64, widthPx, heightPx, dpi);
  return "";
}

/**
 * Pré-carrega de forma massiva as imagens do template
 */
export function preloadTemplateImages(elements: any[], dpi: 203 | 300) {
  if (!Array.isArray(elements)) return;
  elements.forEach((el) => {
    if (el.type === "image" && el.content) {
      preloadZplImage(el.content, el.width, el.height, dpi);
    }
  });
}
