const LOCAL_PRINT_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]", "::1"]);

export function isLocalPrintTransportAllowed(input: {
  hostname: string;
  isDev: boolean;
  protocol?: string;
}): boolean {
  const normalizedHost = input.hostname.trim().toLowerCase();
  const normalizedProto = (input.protocol ?? "").trim().toLowerCase();

  const isLocalHost = LOCAL_PRINT_HOSTS.has(normalizedHost);

  // Bloquear protocolo inseguro se não for localhost loopback
  if (normalizedProto === "http:" && !isLocalHost) {
    return false;
  }

  // Permitir em modo dev
  if (input.isDev) {
    return true;
  }

  // Em produção, apenas se for host loopback
  return isLocalHost;
}

export function validateZplPayload(zpl: string | null | undefined): {
  isValid: boolean;
  error?: string;
} {
  if (!zpl || zpl.trim() === "") {
    return { isValid: false, error: "O código da etiqueta (ZPL) está vazio." };
  }

  // Limite de 500KB para evitar travamento da impressora/transporte
  if (zpl.length > 500 * 1024) {
    return {
      isValid: false,
      error: "O tamanho da etiqueta excede o limite seguro permitido (500KB)."
    };
  }

  return { isValid: true };
}
