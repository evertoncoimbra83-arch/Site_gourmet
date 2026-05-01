const FULL_REDACT = "[redacted]";

const REDACTED_KEYS = new Set([
  "password",
  "token",
  "secret",
  "currentPassword",
  "newPassword",
  "customerDocument",
  "document",
  "cpf",
  "customerPhone",
  "phone",
  "mobile",
  "receiverName",
  "shippingAddress",
  "address",
  "street",
  "number",
  "complement",
  "neighborhood",
  "zipCode",
  "zip",
  "cep",
]);

function maskDigits(
  value: string,
  visibleStart = 0,
  visibleEnd = 0,
): string {
  const digits = value.replace(/\D/g, "");
  if (!digits) return "";

  if (digits.length <= visibleStart + visibleEnd) {
    return `${"*".repeat(Math.max(0, digits.length - visibleEnd))}${digits.slice(
      -visibleEnd,
    )}`;
  }

  return `${digits.slice(0, visibleStart)}${"*".repeat(
    digits.length - visibleStart - visibleEnd,
  )}${digits.slice(-visibleEnd)}`;
}

export function maskCpf(value: unknown): string {
  const digits = String(value ?? "").replace(/\D/g, "");
  if (!digits) return "";
  return maskDigits(digits, 3, 2);
}

export function maskPhone(value: unknown): string {
  const digits = String(value ?? "").replace(/\D/g, "");
  if (!digits) return "";
  return maskDigits(digits, 2, 2);
}

export function maskZipCode(value: unknown): string {
  const digits = String(value ?? "").replace(/\D/g, "");
  if (!digits) return "";
  return maskDigits(digits, 2, 2);
}

function redactByKey(key: string, value: unknown): unknown {
  if (value == null) return value;

  if (key === "customerDocument" || key === "document" || key === "cpf") {
    return maskCpf(value);
  }

  if (key === "customerPhone" || key === "phone" || key === "mobile") {
    return maskPhone(value);
  }

  if (key === "zipCode" || key === "zip" || key === "cep") {
    return maskZipCode(value);
  }

  return FULL_REDACT;
}

export function redactSensitiveData(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(redactSensitiveData);
  }

  if (value && typeof value === "object") {
    const input = value as Record<string, unknown>;
    const output: Record<string, unknown> = {};

    for (const [key, fieldValue] of Object.entries(input)) {
      output[key] = REDACTED_KEYS.has(key)
        ? redactByKey(key, fieldValue)
        : redactSensitiveData(fieldValue);
    }

    return output;
  }

  return value;
}
