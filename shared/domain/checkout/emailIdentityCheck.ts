export const EMAIL_IDENTITY_CHECK_DEBOUNCE_MS = 700;
export const EMAIL_IDENTITY_RATE_LIMIT_PAUSE_MS = 60_000;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeCheckoutEmail(email: string | null | undefined) {
  return (email || "").trim().toLowerCase();
}

export function isValidCheckoutEmail(email: string) {
  return EMAIL_PATTERN.test(email);
}

interface CanCheckUserExistsInput {
  authLoading: boolean;
  isAuthenticated: boolean;
  normalizedEmail: string;
  cleanCpf?: string;
  lastCheckedEmail: string | null;
  lastCheckedCpf?: string | null;
  isPending: boolean;
  now: number;
  rateLimitedUntil: number;
}

export function canCheckUserExists({
  authLoading,
  isAuthenticated,
  normalizedEmail,
  cleanCpf = "",
  lastCheckedEmail,
  lastCheckedCpf = null,
  isPending,
  now,
  rateLimitedUntil,
}: CanCheckUserExistsInput) {
  if (authLoading) return false;
  if (isAuthenticated) return false;
  if (!isValidCheckoutEmail(normalizedEmail)) return false;
  if (cleanCpf.length > 0 && cleanCpf.length < 11) return false;
  if (
    lastCheckedEmail === normalizedEmail &&
    (lastCheckedCpf || "") === (cleanCpf.length === 11 ? cleanCpf : "")
  ) {
    return false;
  }
  if (isPending) return false;
  if (now < rateLimitedUntil) return false;

  return true;
}
