/**
 * server/finance/nfceQr.ts
 *
 * Helpers puros para processamento, extração e validação de QR Codes e URLs de NFC-e.
 */

/**
 * Extrai a chave de acesso de 44 dígitos a partir de um texto puro, link ou URL de QR Code de NFC-e.
 */
export function extractNfceAccessKey(text: string): string {
  if (!text) return "";
  const cleanText = text.trim();

  // 1. Caso a string já seja exatamente a chave de 44 dígitos
  if (/^\d{44}$/.test(cleanText)) {
    return cleanText;
  }

  // 2. Tentar buscar pelo parâmetro clássico 'chNFe' (SP, RJ, etc.)
  const chNfeMatch = cleanText.match(/[?&]chNFe=(\d{44})/i);
  if (chNfeMatch) {
    return chNfeMatch[1];
  }

  // 3. Tentar buscar pelo parâmetro 'p' (RS, PR, etc. onde a chave costuma ser o primeiro valor separado por '|')
  const pMatch = cleanText.match(/[?&]p=([^&|]+)/i);
  if (pMatch) {
    const pVal = pMatch[1];
    const digitsMatch = pVal.match(/^(\d{44})/);
    if (digitsMatch) {
      return digitsMatch[1];
    }
  }

  // 4. Fallback: procurar por qualquer sequência consecutiva de 44 dígitos no texto
  const any44Digits = cleanText.match(/\b(\d{44})\b/);
  if (any44Digits) {
    return any44Digits[1];
  }

  const anyContiguous = cleanText.match(/\d{44}/);
  if (anyContiguous) {
    return anyContiguous[0];
  }

  return "";
}

/**
 * Valida matematicamente a chave de acesso de 44 dígitos da NF-e/NFC-e usando o algoritmo Módulo 11.
 */
export function validateNfceAccessKey(key: string): boolean {
  if (!key || !/^\d{44}$/.test(key)) {
    return false;
  }

  // O 44º dígito é o dígito verificador (DV)
  const dvInformado = parseInt(key[43], 10);

  let soma = 0;
  let peso = 2;

  // Percorre os primeiros 43 dígitos da direita para a esquerda
  for (let i = 42; i >= 0; i--) {
    soma += parseInt(key[i], 10) * peso;
    peso++;
    if (peso > 9) {
      peso = 2;
    }
  }

  const resto = soma % 11;
  const dvCalculado = resto === 0 || resto === 1 ? 0 : 11 - resto;

  return dvCalculado === dvInformado;
}

/**
 * Mascara a chave de acesso para exibição amigável e segura em tela.
 * Exemplo: "3526 0612 ... 0123"
 */
export function maskNfceAccessKey(key: string): string {
  if (!key || key.length !== 44) return key;
  const start = key.substring(0, 8);
  const end = key.substring(36);
  return `${start.substring(0, 4)} ${start.substring(4, 8)} ... ${end.substring(0, 4)} ${end.substring(4)}`;
}

/**
 * Identifica o Estado (UF) de emissão com base no domínio governamental da URL do QR Code.
 */
export function detectNfceStateFromUrl(url: string): string {
  if (!url) return "Desconhecido";
  const ufMatch = url.match(/(?:\.|\/)(ac|al|ap|am|ba|ce|df|es|go|ma|mt|ms|mg|pa|pb|pr|pe|pi|rj|rn|rs|ro|rr|sc|sp|se|to)\.gov\.br/i);
  if (ufMatch) {
    return ufMatch[1].toUpperCase();
  }
  return "Desconhecido";
}
