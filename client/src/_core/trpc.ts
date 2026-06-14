/* eslint-disable @typescript-eslint/ban-ts-comment */
import { createTRPCReact } from '@trpc/react-query';
import { httpBatchLink, loggerLink } from '@trpc/client';
import {
  MutationCache,
  QueryCache,
  QueryClient,
} from '@tanstack/react-query';
import superjson from 'superjson';
import { getGuestId } from '../lib/guest';
import type { AppRouter } from '../../../server/routers/index';

export const trpc = createTRPCReact<AppRouter>();

function notifyTrpcError(err: unknown) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("trpc-error"));
  }

  if (import.meta.env.DEV) {
    console.debug("tRPC request failed:", err);
  }
}

// QueryClient unico usado pelo Provider, com monitor global de erros.
export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: notifyTrpcError,
  }),
  mutationCache: new MutationCache({
    onError: notifyTrpcError,
  }),
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000,
      throwOnError: false,
    },
    mutations: {
      throwOnError: false,
    },
  },
});
const getBaseUrl = () => {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  return ''; 
};

const CSRF_COOKIE_NAME = "gourmet_csrf_token";

function readCookie(name: string) {
  if (typeof document === "undefined") return "";
  const prefix = `${name}=`;
  return (
    document.cookie
      .split(";")
      .map((part) => part.trim())
      .find((part) => part.startsWith(prefix))
      ?.slice(prefix.length) || ""
  );
}

async function getCsrfToken() {
  const existing = readCookie(CSRF_COOKIE_NAME);
  if (existing) return decodeURIComponent(existing);

  const response = await fetch(`${getBaseUrl()}/api/csrf-token`, {
    credentials: "include",
    cache: "no-store",
  });

  if (!response.ok) return "";
  const payload = (await response.json().catch(() => null)) as {
    csrfToken?: string;
  } | null;
  return payload?.csrfToken || readCookie(CSRF_COOKIE_NAME);
}

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

        const csrfToken = await getCsrfToken();

        return {
          'x-csrf-token': csrfToken,
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
