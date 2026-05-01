import { createHmac } from "crypto";

// Use uma chave secreta do seu .env para que ninguém consiga 
// descobrir os nomes reais a partir do hash (Pepper)
const SEARCH_SECRET = process.env.ENCRYPTION_KEY || "fallback-secret";

export function generateBlindIndex(value: string): string {
  if (!value) return "";
  
  return createHmac("sha256", SEARCH_SECRET)
    .update(value.toLowerCase().trim()) // Sempre minúsculo para a busca não ser sensível a Caps Lock
    .digest("hex");
}