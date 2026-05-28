export function safeJsonParse<T>(value: unknown, fallback: T): T {
  if (value == null) {
    return fallback;
  }

  // Se já for objeto/array, retorna direto
  if (typeof value === "object") {
    return value as T;
  }

  if (typeof value !== "string") {
    return fallback;
  }

  const trimmed = value.trim();

  // Evita parse desnecessário em strings vazias
  if (!trimmed) {
    return fallback;
  }

  try {
    const parsed = JSON.parse(trimmed) as T;

    // Segurança extra: evita retornar undefined/null inesperado
    if (parsed == null) {
      return fallback;
    }

    return parsed;
  } catch {
    return fallback;
  }
}

export function safeNumber(value: unknown, fallback = 0): number {
  if (value === null || value === undefined || value === "") {
    return fallback;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function safeInteger(value: unknown, fallback = 0): number {
  const parsed = safeNumber(value, Number.NaN);
  return Number.isInteger(parsed) ? parsed : fallback;
}
