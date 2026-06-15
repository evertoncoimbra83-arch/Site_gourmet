import {
  normalizeImageUrlForStorage,
  resolveImageUrl,
} from "./image-url";

export function resolvePaymentLogoUrl(
  logoUrl: string | null | undefined,
  apiBase = "",
): string | null {
  if (!logoUrl?.trim()) return null;
  return resolveImageUrl(logoUrl, "payment", { legacyBaseUrl: apiBase });
}

export function normalizePaymentLogoInput(
  logoUrl: string | null | undefined,
): string {
  return normalizeImageUrlForStorage(logoUrl);
}
