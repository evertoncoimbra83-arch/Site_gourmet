// client/src/lib/guest.ts

/**
 * Chave centralizada para identificar o carrinho do visitante no LocalStorage.
 * Exportamos como constante para garantir que todos os hooks (Login, Checkout, Cart)
 * usem exatamente a mesma "gaveta" no navegador.
 */
export const GUEST_KEY = 'gourmet_guest_uuid';

export function getGuestId(): string {
  // 1. Proteção para evitar erros durante o Build ou SSR (Server Side Rendering)
  if (typeof window === "undefined") return ""; 

  // 2. Tenta recuperar o ID salvo no navegador
  let guestId = localStorage.getItem(GUEST_KEY);

  // 3. Se não existir, ou se por algum erro estiver salvo como "undefined"/"null" (string)
  if (!guestId || guestId === "undefined" || guestId === "null") {
    
    // Usa a API nativa moderna do navegador (segura e sem dependências externas)
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      guestId = crypto.randomUUID();
    } else {
      // Fallback para navegadores muito antigos
      guestId = Date.now().toString(36) + Math.random().toString(36).substring(2);
    }
    
    localStorage.setItem(GUEST_KEY, guestId);
  }

  return guestId;
}