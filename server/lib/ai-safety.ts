import { TRPCError } from "@trpc/server";

export const MAX_AI_TEXT_LENGTH = 12000;
export const MAX_AI_FILE_BASE64_LENGTH = 8 * 1024 * 1024;
export const MAX_AI_PROMPT_LENGTH = 8000;

const BUSINESS_GUARDRAILS = [
  "preço",
  "price",
  "discount",
  "desconto",
  "cupom",
  "coupon",
  "pedido",
  "order",
  "catalog",
  "catálogo",
];

export function sanitizeTextForStorage(value: string, maxLength = MAX_AI_TEXT_LENGTH) {
  return value
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

export function validateAiTextInput(value: string) {
  const sanitized = sanitizeTextForStorage(value, MAX_AI_TEXT_LENGTH);
  if (!sanitized) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Texto de entrada é obrigatório.",
    });
  }

  return sanitized;
}

export function validateAiFileBase64(value: string | undefined) {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  if (trimmed.length > MAX_AI_FILE_BASE64_LENGTH) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Arquivo enviado para IA excede o limite permitido.",
    });
  }
  return trimmed;
}

export function assertBusinessGuardrails(text: string) {
  const lower = text.toLowerCase();
  const hits = BUSINESS_GUARDRAILS.filter((term) => lower.includes(term));
  if (hits.length >= 3) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Entrada de IA contém instruções incompatíveis com este fluxo.",
    });
  }
}

export function isJsonObjectLike(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

export function ensureSafeAiResult(value: unknown) {
  if (value == null) return [];
  if (!Array.isArray(value) && !isJsonObjectLike(value)) {
    throw new Error("Resultado de IA inválido para persistência.");
  }
  return value;
}
