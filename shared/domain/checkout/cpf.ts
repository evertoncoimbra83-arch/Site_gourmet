export function normalizeCpf(value: string | null | undefined): string {
  return (value ?? "").replace(/\D/g, "");
}

export function isValidCpf(value: string | null | undefined): boolean {
  const clean = normalizeCpf(value);
  if (clean.length !== 11 || /^(\d)\1{10}$/.test(clean)) return false;

  const digits = clean.split("").map(Number);

  const calculateCheckDigit = (count: number) => {
    const sum = digits
      .slice(0, count - 1)
      .reduce((acc, digit, idx) => acc + digit * (count - idx), 0);
    const remainder = (sum * 10) % 11;
    return remainder === 10 ? 0 : remainder;
  };

  return (
    calculateCheckDigit(10) === digits[9] &&
    calculateCheckDigit(11) === digits[10]
  );
}

export function formatCpf(value: string | null | undefined): string {
  const clean = normalizeCpf(value).slice(0, 11);
  return clean
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

export function maskCpfForDisplay(value: string | null | undefined): string {
  const clean = normalizeCpf(value);
  if (clean.length !== 11) return value ?? "";
  return clean.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.***.***-$4");
}
