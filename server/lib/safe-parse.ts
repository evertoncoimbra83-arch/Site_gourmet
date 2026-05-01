export function safeJsonParse<T>(value: unknown, fallback: T): T {
  if (value === null || value === undefined) return fallback;

  if (typeof value === "object") {
    return value as T;
  }

  if (typeof value !== "string") return fallback;

  const trimmed = value.trim();
  if (!trimmed) return fallback;

  try {
    return JSON.parse(trimmed) as T;
  } catch {
    return fallback;
  }
}

export function safeNumber(value: unknown, fallback = 0): number {
  if (value === null || value === undefined || value === "") return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function safeInteger(value: unknown, fallback = 0): number {
  const parsed = safeNumber(value, Number.NaN);
  return Number.isInteger(parsed) ? parsed : fallback;
}

export function safeString(value: unknown, fallback = "", maxLength?: number): string {
  if (value === null || value === undefined) return fallback;
  const normalized = String(value).trim();
  if (!normalized) return fallback;
  return typeof maxLength === "number" && maxLength > 0
    ? normalized.slice(0, maxLength)
    : normalized;
}

export function safeBoolean(value: unknown, fallback = false): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (normalized === "true") return true;
    if (normalized === "false") return false;
  }
  return fallback;
}
