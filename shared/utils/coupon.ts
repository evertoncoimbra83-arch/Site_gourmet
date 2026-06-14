/**
 * Utilidades para tratamento e gerenciamento de links promocionais com cupons.
 */

export interface PendingCoupon {
  code: string;
  capturedAt: string;
  source: string;
}

/**
 * Normaliza e sanitiza um código de cupom.
 * Apenas letras, números, hífen (-) e underline (_) são permitidos.
 * Limite seguro de 64 caracteres.
 */
export function sanitizeCouponCode(code: string | null | undefined): string | null {
  if (!code) return null;
  const clean = code.trim().toUpperCase();
  if (clean.length === 0 || clean.length > 64) return null;
  if (!/^[A-Z0-9_-]+$/.test(clean)) return null;
  return clean;
}

/**
 * Extrai o código de cupom da URL com base nos query parameters priorizados.
 * Prioridade: cupom > coupon > discount
 */
export function parseCouponFromUrl(urlSearch: string): string | null {
  const params = new URLSearchParams(urlSearch);
  const cupom = params.get("cupom");
  const coupon = params.get("coupon");
  const discount = params.get("discount");
  const rawCode = cupom || coupon || discount;
  return sanitizeCouponCode(rawCode);
}

/**
 * Remove parâmetros de cupom da URL de forma segura, preservando UTMs e outros dados.
 */
export function removeQueryParams(urlSearch: string, keysToRemove: string[]): string {
  const params = new URLSearchParams(urlSearch);
  let changed = false;
  for (const key of keysToRemove) {
    if (params.has(key)) {
      params.delete(key);
      changed = true;
    }
  }
  return changed ? params.toString() : urlSearch.replace(/^\?/, "");
}

/**
 * Cria a URL do link promocional para um determinado cupom.
 */
export function buildCouponLink(code: string, baseUrl: string): string {
  const cleanBase = baseUrl.replace(/\/$/, "");
  return `${cleanBase}/?cupom=${encodeURIComponent(code)}`;
}

/**
 * Lê e valida um cupom pendente do local storage.
 * Retorna null se estiver expirado (tempo de expiração de 7 dias).
 */
export function readPendingCoupon(
  getItem: (key: string) => string | null
): PendingCoupon | null {
  const data = getItem("gourmet.pendingCouponCode");
  if (!data) return null;

  try {
    const parsed = JSON.parse(data) as PendingCoupon;
    if (!parsed || typeof parsed !== "object") return null;

    const { code, capturedAt, source } = parsed;
    const cleanCode = sanitizeCouponCode(code);
    if (!cleanCode) return null;

    const capturedTime = new Date(capturedAt).getTime();
    if (isNaN(capturedTime)) return null;

    const now = Date.now();
    // 7 dias de validade (7 * 24 * 60 * 60 * 1000 = 604800000 ms)
    if (now - capturedTime > 604800000) {
      return null;
    }

    return { code: cleanCode, capturedAt, source };
  } catch {
    return null;
  }
}

/**
 * Escreve um cupom pendente no local storage.
 */
export function writePendingCoupon(
  setItem: (key: string, value: string) => void,
  code: string,
  source: string = "url"
): PendingCoupon | null {
  const cleanCode = sanitizeCouponCode(code);
  if (!cleanCode) return null;

  const payload: PendingCoupon = {
    code: cleanCode,
    capturedAt: new Date().toISOString(),
    source,
  };

  setItem("gourmet.pendingCouponCode", JSON.stringify(payload));
  return payload;
}

/**
 * Limpa o cupom pendente do local storage.
 */
export function clearPendingCoupon(removeItem: (key: string) => void): void {
  removeItem("gourmet.pendingCouponCode");
}
