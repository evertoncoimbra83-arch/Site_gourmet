const GTM_ID_PATTERN = /^GTM-[A-Z0-9]+$/i;

export function normalizeGtmId(value: unknown): string {
  return typeof value === "string" ? value.trim().toUpperCase() : "";
}

export function isValidGtmId(value: unknown): boolean {
  const id = normalizeGtmId(value);
  return GTM_ID_PATTERN.test(id);
}

export function getInjectableGtmId(value: unknown): string | null {
  const id = normalizeGtmId(value);
  return isValidGtmId(id) ? id : null;
}
