export type ImageFallbackType =
  | "product"
  | "package"
  | "payment"
  | "logo"
  | "avatar"
  | "generic";

const CLOUDINARY_HOST_PATTERN = /(^|\.)cloudinary\.com$/i;
const LEGACY_UPLOAD_PATTERN = /(^|\/)uploads\//i;
const SAFE_PROTOCOL_PATTERN = /^(https?:|blob:|data:)/i;
const FILE_EXTENSION_PATTERN =
  /\.(avif|gif|jpe?g|png|svg|webp)(\?.*)?$/i;

const fallbackLabels: Record<ImageFallbackType, string> = {
  product: "Produto",
  package: "Pacote",
  payment: "Pagamento",
  logo: "Logo",
  avatar: "Perfil",
  generic: "Imagem",
};

function buildFallback(label: string) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600"><rect width="800" height="600" fill="#f1f5f9"/><circle cx="400" cy="260" r="72" fill="#d1fae5"/><path d="M317 370h166l-51-66-39 48-24-30z" fill="#10b981"/><text x="400" y="458" text-anchor="middle" font-family="Arial,sans-serif" font-size="42" font-weight="700" fill="#64748b">${label}</text></svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

const fallbacks: Record<ImageFallbackType, string> = {
  product: buildFallback(fallbackLabels.product),
  package: buildFallback(fallbackLabels.package),
  payment: buildFallback(fallbackLabels.payment),
  logo: buildFallback(fallbackLabels.logo),
  avatar: buildFallback(fallbackLabels.avatar),
  generic: buildFallback(fallbackLabels.generic),
};

export function getImageFallback(type: ImageFallbackType = "generic") {
  return fallbacks[type];
}

export function isCloudinaryUrl(value: string | null | undefined): boolean {
  const trimmed = value?.trim();
  if (!trimmed || !/^https?:\/\//i.test(trimmed)) return false;

  try {
    const host = new URL(trimmed).hostname;
    return CLOUDINARY_HOST_PATTERN.test(host);
  } catch {
    return false;
  }
}

export function isLocalUploadUrl(value: string | null | undefined): boolean {
  const trimmed = value?.trim();
  if (!trimmed) return false;

  if (LEGACY_UPLOAD_PATTERN.test(trimmed)) return true;

  try {
    return LEGACY_UPLOAD_PATTERN.test(new URL(trimmed).pathname);
  } catch {
    return false;
  }
}

export function isLegacyFilename(value: string | null | undefined): boolean {
  const trimmed = value?.trim();
  if (!trimmed) return false;
  if (SAFE_PROTOCOL_PATTERN.test(trimmed)) return false;
  if (trimmed.startsWith("/")) return false;
  if (trimmed.includes("/")) return false;
  return FILE_EXTENSION_PATTERN.test(trimmed);
}

export function isLegacyImageReference(value: string | null | undefined): boolean {
  return isLocalUploadUrl(value) || isLegacyFilename(value);
}

function isSafeDataUrl(url: string): boolean {
  if (!/^data:image\/(png|jpeg|jpg|webp|gif|svg\+xml)/i.test(url)) {
    return false;
  }
  if (/image\/svg\+xml/i.test(url)) {
    const decoded = decodeURIComponent(url);
    if (
      /<script/i.test(decoded) ||
      /on\w+\s*=/i.test(decoded) ||
      /<iframe/i.test(decoded) ||
      /<object/i.test(decoded) ||
      /javascript:/i.test(decoded)
    ) {
      return false;
    }
  }
  return true;
}

function isValidHttpUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function hasPathTraversal(val: string): boolean {
  const lower = val.toLowerCase();
  return (
    lower.includes("..") ||
    lower.includes("\\") ||
    lower.includes("%2e%2e") ||
    lower.includes("%2f") ||
    lower.includes("%5c")
  );
}

function getLegacyBaseUrl(explicitBaseUrl?: string) {
  if (explicitBaseUrl !== undefined) return explicitBaseUrl.replace(/\/$/, "");

  if (typeof window !== "undefined") {
    return window.location.origin.replace(/\/$/, "");
  }

  return "";
}

export function resolveImageUrl(
  value: string | null | undefined,
  fallbackType: ImageFallbackType = "generic",
  options: { legacyBaseUrl?: string; allowLegacyUploads?: boolean } = {},
): string {
  const trimmed = value?.trim();
  if (!trimmed) return getImageFallback(fallbackType);

  if (hasPathTraversal(trimmed)) {
    return getImageFallback(fallbackType);
  }

  const lowerUrl = trimmed.toLowerCase();
  if (lowerUrl.startsWith("javascript:") || lowerUrl.startsWith("file:")) {
    return getImageFallback(fallbackType);
  }

  const hasProtocol = /^[a-z0-9.+-]+:/i.test(trimmed);
  if (hasProtocol) {
    if (lowerUrl.startsWith("data:")) {
      if (isSafeDataUrl(trimmed)) {
        return trimmed;
      }
      return getImageFallback(fallbackType);
    }
    if (lowerUrl.startsWith("blob:")) {
      return trimmed;
    }
    if (/^https?:\/\//i.test(trimmed)) {
      if (isValidHttpUrl(trimmed)) {
        return trimmed;
      }
      return getImageFallback(fallbackType);
    }
    return getImageFallback(fallbackType);
  }

  const cleanPath = trimmed.replace(/^\/+/, "").replace(/^public\//, "");
  const allowLegacyUploads = options.allowLegacyUploads ?? true;

  if (allowLegacyUploads && cleanPath.startsWith("uploads/")) {
    const baseUrl = getLegacyBaseUrl(options.legacyBaseUrl);
    return baseUrl ? `${baseUrl}/${cleanPath}` : `/${cleanPath}`;
  }

  return getImageFallback(fallbackType);
}

export function normalizeImageUrlForStorage(
  value: string | null | undefined,
): string {
  const trimmed = value?.trim();
  if (!trimmed) return "";
  if (isLegacyImageReference(trimmed)) return "";
  if (isCloudinaryUrl(trimmed)) return trimmed;
  return "";
}

export function assertCloudinaryStorageUrl(
  value: string | null | undefined,
  fieldLabel = "Imagem",
): string | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;

  if (!isCloudinaryUrl(trimmed)) {
    throw new Error(
      `${fieldLabel} deve ser uma URL absoluta do Cloudinary selecionada na biblioteca de midia.`,
    );
  }

  return trimmed;
}
