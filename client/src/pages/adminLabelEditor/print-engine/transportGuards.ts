const LOCAL_PRINT_HOSTS = new Set(["localhost", "127.0.0.1"]);

export function isLocalPrintTransportAllowed(input: {
  hostname: string;
  isDev: boolean;
}): boolean {
  return input.isDev && LOCAL_PRINT_HOSTS.has(input.hostname.trim().toLowerCase());
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
