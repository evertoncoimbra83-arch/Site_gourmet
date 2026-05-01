/**
 * Chaves centralizadas para o LocalStorage.
 */
export const GUEST_KEY = 'gourmet_guest_uuid';
export const REFERRAL_KEY = 'gourmet_referral_code';

export function getGuestId(): string {
  if (typeof window === "undefined") return ""; 

  let guestId = localStorage.getItem(GUEST_KEY);

  if (!guestId || guestId === "undefined" || guestId === "null") {
    guestId = createGuestId();
    localStorage.setItem(GUEST_KEY, guestId);
  }

  return guestId;
}

export function createGuestId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

export function rotateGuestId(): string {
  if (typeof window === "undefined") return "";
  const guestId = createGuestId();
  localStorage.setItem(GUEST_KEY, guestId);
  return guestId;
}

/**
 * ✅ NOVA FUNÇÃO: Captura o código 'ref' da URL e persiste.
 * Deve ser chamada no componente principal (App.tsx ou Layout.tsx).
 */
export function captureReferralCode(): string | null {
  if (typeof window === "undefined") return null;

  const params = new URLSearchParams(window.location.search);
  const ref = params.get("ref");

  if (ref) {
    const cleanRef = ref.trim();
    localStorage.setItem(REFERRAL_KEY, cleanRef);
    return cleanRef;
  }
  return null;
}
/**
 * Retorna o código de indicação salvo, se houver.
 */
export function getSavedReferral(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(REFERRAL_KEY);
}
