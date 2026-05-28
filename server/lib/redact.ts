const FULL_REDACT = "[redacted]";

const CPF_KEYS = new Set(["cpf", "document", "documento", "doc", "rg", "customerdocument"]);
const PHONE_KEYS = new Set(["phone", "telefone", "celular", "mobile", "customerphone"]);
const ZIP_KEYS = new Set(["cep", "zip", "zipcode"]);
const SECRET_KEYS = new Set([
  "password",
  "senha",
  "token",
  "secret",
  "apikey",
  "api_key",
  "authorization",
  "cookie",
  "currentpassword",
  "newpassword",
]);
const ADDRESS_KEYS = new Set([
  "address",
  "endereco",
  "shippingaddress",
  "street",
  "rua",
  "number",
  "numero",
  "complement",
  "neighborhood",
  "receivername",
]);
const PAYMENT_KEYS = new Set(["card", "cartao", "cvv", "pixkey", "chavepix", "chave_pix"]);
const REDACTED_KEYS = new Set([
  ...CPF_KEYS,
  ...PHONE_KEYS,
  ...ZIP_KEYS,
  ...SECRET_KEYS,
  ...ADDRESS_KEYS,
  ...PAYMENT_KEYS,
  "email",
]);

function normalizeKey(key: string): string {
  return key
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

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

  const normalizedKey = normalizeKey(key);

  if (CPF_KEYS.has(normalizedKey)) {
    return maskCpf(value);
  }

  if (PHONE_KEYS.has(normalizedKey)) {
    return maskPhone(value);
  }

  if (ZIP_KEYS.has(normalizedKey)) {
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
      output[key] = REDACTED_KEYS.has(normalizeKey(key))
        ? redactByKey(key, fieldValue)
        : redactSensitiveData(fieldValue);
    }

    return output;
  }

  return value;
}
