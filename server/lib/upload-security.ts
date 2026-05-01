import crypto from "crypto";
import { TRPCError } from "@trpc/server";

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const DANGEROUS_EXTENSIONS = new Set([
  "svg",
  "html",
  "htm",
  "js",
  "mjs",
  "cjs",
  "exe",
  "bat",
  "cmd",
  "ps1",
  "php",
  "sh",
]);

function detectMimeFromBuffer(buffer: Buffer): string | null {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "image/jpeg";
  }

  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return "image/png";
  }

  if (
    buffer.length >= 12 &&
    buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
    buffer.subarray(8, 12).toString("ascii") === "WEBP"
  ) {
    return "image/webp";
  }

  if (buffer.length >= 6) {
    const header = buffer.subarray(0, 6).toString("ascii");
    if (header === "GIF87a" || header === "GIF89a") {
      return "image/gif";
    }
  }

  return null;
}

export function sanitizeMediaFolder(folder: string | undefined): string {
  const normalized = (folder || "geral")
    .toLowerCase()
    .replace(/[^a-z0-9-_]/g, "")
    .slice(0, 40);

  return normalized || "geral";
}

export function validateAndDecodeImageUpload(input: {
  base64Data: string;
  mimeType: string;
  filename: string;
}) {
  const extension = input.filename.split(".").pop()?.toLowerCase() || "";
  if (DANGEROUS_EXTENSIONS.has(extension)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Tipo de arquivo não permitido.",
    });
  }

  if (!ALLOWED_MIME_TYPES.has(input.mimeType)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Formato de mídia não permitido.",
    });
  }

  const buffer = Buffer.from(input.base64Data, "base64");
  if (!buffer.length) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Arquivo inválido ou vazio.",
    });
  }

  if (buffer.length > MAX_UPLOAD_BYTES) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Arquivo excede o limite de 5MB.",
    });
  }

  const detectedMime = detectMimeFromBuffer(buffer);
  if (!detectedMime || detectedMime !== input.mimeType) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Conteúdo do arquivo não confere com o MIME informado.",
    });
  }

  return {
    buffer,
    mimeType: detectedMime,
    size: buffer.length,
  };
}

export function buildSafeMediaFilename(mimeType: string): string {
  const extension =
    mimeType === "image/jpeg"
      ? "jpg"
      : mimeType === "image/png"
        ? "png"
        : mimeType === "image/webp"
          ? "webp"
          : "gif";

  return `${Date.now()}-${crypto.randomBytes(8).toString("hex")}.${extension}`;
}
