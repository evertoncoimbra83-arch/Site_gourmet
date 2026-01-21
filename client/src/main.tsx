import React from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from "./App";
import "./index.css"; // Garante que o Tailwind carrega

// ✅ 1. IMPORTAÇÃO CENTRALIZADA
import { trpc, trpcClient } from "./_core/trpc"; 

// 2. CONFIGURAÇÃO DO QUERY CLIENT
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      // Sugestão: retry: 1 ajuda se a internet do usuário oscilar
      retry: 1, 
    },
  },
});

// 3. RENDERIZAÇÃO SEGURA
const container = document.getElementById("root");

if (!container) {
  // Isso avisa no console se alguém mexeu no index.html e quebrou o ID
  throw new Error("ERRO CRÍTICO: Elemento 'root' não encontrado no HTML.");
}

const root = createRoot(container);

root.render(
  <React.StrictMode>
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </trpc.Provider>
  </React.StrictMode>
);