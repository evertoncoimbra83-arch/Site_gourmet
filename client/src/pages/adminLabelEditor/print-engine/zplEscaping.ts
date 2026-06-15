/**
 * client/src/pages/adminLabelEditor/print-engine/zplEscaping.ts
 *
 * Módulo consolidado para sanitização e escaping de dados ZPL.
 * Mantém compatibilidade com a limpeza de acentuação e inclui limites e proteções.
 */

/**
 * Corrige codificação corrompida comum obtida da integração de dados de banco/web.
 */
export function cleanText(val: unknown): string {
  if (val == null) return "";
  const str = String(val).trim();
  if (str.toLowerCase() === "null" || str.toLowerCase() === "undefined") {
    return "";
  }
  return str
    .replace(/Ã§/g, "ç")
    .replace(/Ã£/g, "ã")
    .replace(/Ã©/g, "é")
    .replace(/Â/g, "")
    .replace(/adddim$/i, "")
    .trim();
}

/**
 * Escapa os caracteres sintáticos reservados do ZPL (^, ~, \), quebras de linha e
 * substitui caracteres de controle invisíveis por espaço.
 */
export function escapeZplChars(text: string): string {
  // Normaliza quebras de linha
  const normalized = text
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    // Substitui caracteres de controle ASCII invisíveis por espaço
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, " ");

  // Escapa caracteres sintáticos
  const safeLines = normalized.split("\n").map((line) =>
    line
      .replace(/\\/g, "_5C")
      .replace(/\^/g, "_5E")
      .replace(/~/g, "_7E")
  );

  // ZPL usa \& ou \\& para quebra de linha em blocos ^FB
  return safeLines.join("\\&");
}

/**
 * Sanitiza e escapa um valor para uso seguro em ZPL, com limite de tamanho para evitar overflow.
 * @param value Valor bruto a ser sanitizado
 * @param maxLength Limite de truncamento (padrão 1000)
 */
export function sanitizeZplText(value: unknown, maxLength = 1000): string {
  if (value == null) return "";

  // Converte para string e executa limpeza de acentos
  let text = cleanText(value)
    .replace(/\{\{[^}]+\}\}/g, "")
    .replace(/\b(?:undefined|null)\b/gi, "")
    .trim();

  // Proteção contra overflow de texto
  if (text.length > maxLength) {
    text = text.substring(0, maxLength) + "...";
  }

  // Executa escaping do ZPL
  return escapeZplChars(text);
}

export interface SanitizedBarcodeValue {
  value: string;
  isValid: boolean;
  reason?: string;
}

const BARCODE_MAX_LENGTH = 32;

function hasSensitiveBarcodePattern(value: string): boolean {
  const compactDigits = value.replace(/\D/g, "");
  return (
    /https?:\/\//i.test(value) ||
    /www\./i.test(value) ||
    /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(value) ||
    /\b[A-Z0-9.-]+\.[A-Z]{2,}\b/i.test(value) ||
    compactDigits.length === 11 ||
    (/^\+?\d[\d\s().-]{8,}\d$/.test(value) && compactDigits.length >= 10) ||
    /^[A-Za-z0-9_-]{24,}$/.test(value)
  );
}

export function sanitizeCode128BarcodeValue(value: unknown): SanitizedBarcodeValue {
  const raw = cleanText(value);

  if (!raw || /\{\{[^}]+\}\}/.test(raw)) {
    return { value: "", isValid: false, reason: "empty-or-placeholder" };
  }

  if (hasSensitiveBarcodePattern(raw)) {
    return { value: "", isValid: false, reason: "sensitive-pattern" };
  }

  const cleaned = raw
    .replace(/[\r\n]/g, "")
    .replace(/[\u0000-\u001F\u007F]/g, "")
    .replace(/[\^~\\]/g, "")
    .replace(/[^A-Za-z0-9._#-]/g, "")
    .trim();

  const meaningfulLength = cleaned.replace(/[^A-Za-z0-9]/g, "").length;

  if (!cleaned || meaningfulLength < 2) {
    return { value: "", isValid: false, reason: "empty-after-cleaning" };
  }

  if (cleaned.length > BARCODE_MAX_LENGTH || hasSensitiveBarcodePattern(cleaned)) {
    return { value: "", isValid: false, reason: "unsafe-length-or-pattern" };
  }

  return { value: cleaned, isValid: true };
}
