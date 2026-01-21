import { createTRPCReact } from '@trpc/react-query';
import { httpBatchLink } from '@trpc/client';
import superjson from 'superjson';

// ✅ Importação da lógica centralizada de Guest
import { getGuestId } from '../lib/guest';

// ⚠️ Ajuste este caminho para onde o seu AppRouter é exportado no Server
import type { AppRouter } from '../../../server/routers/index';

export const trpc = createTRPCReact<AppRouter>();

export const trpcClient = trpc.createClient({
  // ❌ REMOVIDO DAQUI: transformer: superjson, 
  
  links: [
    httpBatchLink({
      // ✅ ADICIONADO AQUI: O transformer agora vive dentro do link
      transformer: superjson,

      // Define a URL da API
      url: import.meta.env?.VITE_API_URL 
        ? `${import.meta.env.VITE_API_URL}/trpc` 
        : 'http://localhost:3001/trpc',

      /**
       * 🏷️ HEADERS
       * Injeta apenas o ID do visitante. 
       */
      async headers() {
        return {
          'x-guest-id': getGuestId(),
        };
      },

      /**
       * 🔍 INTERCEPTOR DE REQUISIÇÕES (Fetch)
       */
      async fetch(url, options) {
        const response = await fetch(url, {
          ...options,
          // 🚨 CRÍTICO: Permite cookies HttpOnly
          credentials: 'include', 
        });

        if (!response.ok) {
           if (response.status !== 401) {
             console.error(`❌ [tRPC Error] ${response.status} ao acessar ${url}`);
           }
        }

        return response;
      },
    }),
  ],
});