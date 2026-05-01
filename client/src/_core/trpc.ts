/* eslint-disable @typescript-eslint/ban-ts-comment */
import { createTRPCReact } from '@trpc/react-query';
import { httpBatchLink, loggerLink } from '@trpc/client';
import { QueryClient } from '@tanstack/react-query';
import superjson from 'superjson';
import { getGuestId } from '../lib/guest';
import type { AppRouter } from '../../../server/routers/index';

export const trpc = createTRPCReact<AppRouter>();

// ✅ CONFIGURAÇÃO DO QUERY CLIENT COM MONITOR DE ERROS
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false, 
      retry: false, 
      staleTime: 5 * 60 * 1000,
      // @ts-ignore - Captura erros globais para disparar o floater de ajuda
      onError: (err: unknown) => {
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("trpc-error"));
        }
        console.error("🔍 tRPC Query Error:", err);
      }
    },
    mutations: {
      // @ts-ignore
      onError: (err: unknown) => {
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("trpc-error"));
        }
        console.error("🚀 tRPC Mutation Error:", err);
      }
    }
  },
});

const getBaseUrl = () => {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  return ''; 
};

export const trpcClient = trpc.createClient({
  links: [
    // 🛡️ Log de Atividades tRPC (REVISADO PARA LIMPEZA)
    loggerLink({
      enabled: (opts) =>
        // ✅ Só loga se for erro (direction down + result Error)
        // Isso remove o "spam" de queries de sucesso no console
        (opts.direction === 'down' && opts.result instanceof Error),
    }),

    httpBatchLink({
      transformer: superjson,
      url: `${getBaseUrl()}/trpc`,

      async headers() {
        if (typeof window === "undefined") return {};

        let guestId = localStorage.getItem('gourmet_guest_uuid');
        let savedReferral = localStorage.getItem('gourmet_referral_code');

        if (!guestId || guestId === "undefined" || guestId === "null") {
          guestId = getGuestId(); 
          if (guestId) localStorage.setItem('gourmet_guest_uuid', guestId);
        }

        const params = new URLSearchParams(window.location.search);
        const refFromUrl = params.get("ref");
        if (refFromUrl) {
          savedReferral = refFromUrl;
          localStorage.setItem('gourmet_referral_code', refFromUrl);
        }

        return {
          'x-guest-id': guestId || '',
          'x-referral-code': savedReferral || '',
        };
      },

      fetch(url: RequestInfo | URL, options?: RequestInit) {
        return fetch(url, {
          ...options,
          credentials: 'include',
          cache: 'no-store', 
        });
      },
    }),
  ],
});