import type { CookieOptions, Request } from "express";

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "192.168.24.2", "192.168.24.8", "192.168.24.7", "192.168.24.11", "192.168.24.12", "192.168.24.10", "192.168.24.5", "::1"]);

/**
 * Verifica se a requisição é segura (HTTPS) ou se vem de um proxy seguro.
 */
function isSecureRequest(req: Request) {
  // Se for localhost, NUNCA deve ser considerado secure (para permitir cookies via HTTP)
  if (LOCAL_HOSTS.has(req.hostname)) return false;

  if (req.protocol === "https") return true;

  const forwardedProto = req.headers["x-forwarded-proto"];
  if (!forwardedProto) return false;

  const protoList = Array.isArray(forwardedProto)
    ? forwardedProto
    : forwardedProto.split(",");

  return protoList.some(proto => proto.trim().toLowerCase() === "https");
}

export function getSessionCookieOptions(
  req: Request
): Pick<CookieOptions, "domain" | "httpOnly" | "path" | "sameSite" | "secure"> {

  const isLocal = LOCAL_HOSTS.has(req.hostname);
  const secure = isSecureRequest(req);

  /**
   * ✅ LÓGICA DE SAMESITE:
   * 1. Em produção (VPS/HTTPS): Usamos "none" para permitir cross-site se necessário, 
   * mas "lax" é mais seguro se o front e back estiverem no mesmo domínio.
   * 2. Em Localhost (HTTP): "lax" é obrigatório, pois "none" exige HTTPS.
   */
  const sameSite = isLocal ? "lax" : (secure ? "none" : "lax");

  return {
    httpOnly: true,
    path: "/",
    sameSite: sameSite,
    // No localhost, secure SERÁ false, permitindo que o navegador grave o cookie.
    secure: secure,
  };
}
