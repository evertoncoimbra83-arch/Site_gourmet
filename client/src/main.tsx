import React from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import * as Sentry from "@sentry/react";
import App from "./App";
import "./index.css";

import { trpc, trpcClient } from "./_core/trpc";

// O bootstrap do GA4 é feito de forma dinâmica em useAnalytics.ts,
// usando o Measurement ID salvo nas configurações públicas.

if (import.meta.env.PROD) {
  Sentry.init({
    dsn: "https://de2221e4f45dfc50570b53664783180d@o4510881046921216.ingest.de.sentry.io/4510881050853456",
    enableLogs: true,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration(),
      Sentry.consoleLoggingIntegration({ levels: ["error", "warn"] }),
    ],
    tracesSampleRate: 1.0,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    ignoreErrors: ["top.GLOBALS", "LanguageClosure", "extension", "__v__"],
  });
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 1000 * 60 * 5,
      throwOnError: false,
    },
  },
});

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
