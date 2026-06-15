const PRODUCTION_HOSTS = new Set([
  "gourmetsaudavel.com",
  "www.gourmetsaudavel.com",
  "gourmetsaudavel.com.br",
  "www.gourmetsaudavel.com.br",
]);

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1"]);

export function isAllowedSdkHost(hostname: string): boolean {
  const normalized = hostname.trim().toLowerCase();
  return PRODUCTION_HOSTS.has(normalized) || LOCAL_HOSTS.has(normalized);
}

export function shouldInitializeClientSdk(input: {
  hostname: string;
  pathname: string;
}): boolean {
  if (input.pathname.startsWith("/admin")) return false;
  return isAllowedSdkHost(input.hostname);
}

export function getInjectableGtmId(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const id = value.trim().toUpperCase();
  return /^GTM-[A-Z0-9]+$/i.test(id) ? id : null;
}
