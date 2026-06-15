import React, { Component, ErrorInfo, ReactNode } from "react";
import * as Sentry from "@sentry/react";
import { AlertCircle, RefreshCcw, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
  fallbackMessage?: string;
}

interface State {
  hasError: boolean;
  errorType: "network" | "render" | "chunk" | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    errorType: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    const isChunkError =
      error.message.includes("Failed to fetch dynamically imported module") ||
      error.message.includes("Loading chunk") ||
      error.name === "ChunkLoadError" ||
      error.message.includes("ChunkLoadError");

    const isNetworkError =
      !isChunkError && (
        error.message.includes("Fetching process") ||
        error.message.includes("Failed to fetch") ||
        (typeof navigator !== "undefined" && navigator.onLine === false)
      );

    return {
      hasError: true,
      errorType: isChunkError ? "chunk" : isNetworkError ? "network" : "render",
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const isChunkError =
      error.message.includes("Failed to fetch dynamically imported module") ||
      error.message.includes("Loading chunk") ||
      error.name === "ChunkLoadError" ||
      error.message.includes("ChunkLoadError");

    if (isChunkError) {
      const isProd = import.meta.env.PROD;
      if (isProd) {
        const reloadKey = "chunk_error_reloaded";
        const lastReload = typeof sessionStorage !== "undefined" ? sessionStorage.getItem(reloadKey) : null;
        const now = Date.now();

        if (!lastReload || now - parseInt(lastReload, 10) > 15000) {
          if (typeof sessionStorage !== "undefined") {
            sessionStorage.setItem(reloadKey, now.toString());
            sessionStorage.removeItem("checkout_version_warned");
          }
          if (typeof window !== "undefined") {
            window.location.reload();
            return;
          }
        }
      } else {
        console.warn("[ErrorBoundary] ChunkLoadError detectado em desenvolvimento. Recarregamento automático evitado.");
      }
    }

    Sentry.captureException(error, {
      extra: { componentStack: errorInfo.componentStack },
    });
    if (import.meta.env.DEV) {
      console.error("🚨 [ErrorBoundary]:", error, errorInfo);
    }
  }

  private handleReset = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      const isNetwork = this.state.errorType === "network";
      const isChunk = this.state.errorType === "chunk";

      return (
        <div className="min-h-[60vh] w-full flex flex-col items-center justify-center p-8 text-center animate-in fade-in zoom-in duration-300">
          <div className="bg-white border border-slate-100 p-10 md:p-14 rounded-[3rem] shadow-2xl shadow-slate-200/50 max-w-lg w-full space-y-8">
            <div
              className={`mx-auto h-20 w-20 rounded-[2rem] flex items-center justify-center shadow-inner ${
                isChunk
                  ? "bg-emerald-50 text-emerald-500"
                  : isNetwork
                    ? "bg-amber-50 text-amber-500"
                    : "bg-rose-50 text-rose-500"
              }`}
            >
              {isChunk ? (
                <RefreshCcw size={40} className="animate-spin duration-1000" />
              ) : isNetwork ? (
                <WifiOff size={40} />
              ) : (
                <AlertCircle size={40} />
              )}
            </div>

            <div className="space-y-3">
              <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">
                {isChunk
                  ? "Nova Versão Disponível"
                  : isNetwork
                    ? "Conexão Perdida"
                    : "Algo não deu certo"}
              </h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] leading-relaxed max-w-xs mx-auto">
                {isChunk
                  ? "Uma nova versão do sistema está disponível com atualizações críticas. Por favor, clique abaixo para atualizar."
                  : isNetwork
                    ? "Não conseguimos carregar os dados. Verifique sua conexão com a internet."
                    : this.props.fallbackMessage ||
                      "Houve um erro inesperado na interface. Nossa equipe foi notificada."}
              </p>
            </div>

            <Button
              onClick={this.handleReset}
              className={`w-full h-14 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] transition-all flex items-center justify-center gap-3 shadow-lg active:scale-95 ${
                isChunk
                  ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20"
                  : isNetwork
                    ? "bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/20"
                    : "bg-slate-900 hover:bg-slate-800 text-white shadow-slate-900/20"
              }`}
            >
              <RefreshCcw
                size={16}
                className={isNetwork || isChunk ? "animate-pulse" : ""}
              />
              {isChunk ? "Atualizar Agora" : "Tentar Novamente"}
            </Button>

            <div className="pt-4">
              <p className="text-[8px] font-black text-slate-300 uppercase tracking-[0.4em]">
                Gourmet Saudável • Sistema de Proteção
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
export default ErrorBoundary;