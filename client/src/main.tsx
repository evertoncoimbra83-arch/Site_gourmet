import React from "react";
import { createRoot } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import * as Sentry from "@sentry/react";
import App from "./App";
import "./index.css";

import { queryClient, trpc, trpcClient } from "./_core/trpc";

// O bootstrap do GA4 é feito de forma dinâmica em useAnalytics.ts,
// usando o Measurement ID salvo nas configurações públicas.

function shouldIgnoreSentryNoise(message: string) {
  const normalized = message.toLowerCase();

  return [
    "401",
    "unauthorized",
    "sdk init",
    "domain",
    "resizeobserver",
    "network request cancelled",
    "request cancelled",
    "aborterror",
    "service worker",
    "sw update",
    "cache",
    "429",
    "too many requests",
  ].some((pattern) => normalized.includes(pattern));
}

if (import.meta.env.PROD) {
  Sentry.init({
    dsn: "https://de2221e4f45dfc50570b53664783180d@o4510881046921216.ingest.de.sentry.io/4510881050853456",
    enableLogs: true,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration(),
    ],
    tracesSampleRate: 1.0,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    ignoreErrors: [
      "top.GLOBALS",
      "LanguageClosure",
      "extension",
      "__v__",
      "ResizeObserver",
      "Network request cancelled",
      "AbortError",
    ],
    // Filtros de ruido esperado: visitante 401, SDK em dominio nao permitido,
    // ResizeObserver, requests cancelados, Service Worker/cache e 429 local/dev.
    beforeSend(event, hint) {
      const exceptionMessages =
        event.exception?.values
          ?.map((value) => value.value || value.type || "")
          .join(" ") || "";
      const originalException =
        hint.originalException instanceof Error
          ? hint.originalException.message
          : String(hint.originalException || "");
      const message = [event.message, exceptionMessages, originalException]
        .filter(Boolean)
        .join(" ");

      return shouldIgnoreSentryNoise(message) ? null : event;
    },
  });
}

const container = document.getElementById("root");
if (!container) {
  throw new Error("ERRO CRÍTICO: elemento 'root' não encontrado no HTML.");
}

createRoot(container).render(
  <React.StrictMode>
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <Sentry.ErrorBoundary
        fallback={
          <div className="h-screen flex flex-col items-center justify-center bg-slate-50 text-center px-4">
            <h1 className="font-black uppercase italic text-slate-400 text-2xl mb-2">
              Sistema em Manutenção Visual
            </h1>
            <p className="text-slate-500">Ocorreu um erro inesperado.</p>
            <button
              onClick={() => {
                window.location.href = "/";
              }}
              className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-lg font-bold"
            >
              Voltar ao Início
            </button>
          </div>
        }
      >
        <trpc.Provider client={trpcClient} queryClient={queryClient}>
          <QueryClientProvider client={queryClient}>
            <App />
          </QueryClientProvider>
        </trpc.Provider>
      </Sentry.ErrorBoundary>
    </BrowserRouter>
  </React.StrictMode>,
);

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: (...args: unknown[]) => void;
  }
}
