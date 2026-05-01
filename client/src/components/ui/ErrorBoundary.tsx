import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertCircle, RefreshCcw, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
  fallbackMessage?: string;
}

interface State {
  hasError: boolean;
  errorType: "network" | "render" | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    errorType: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    // 🔍 Detecta se o erro foi falha ao carregar arquivos (comum quando a internet cai ou o servidor reinicia)
    const isNetworkError = 
      error.message.includes("Fetching process") || 
      error.message.includes("Loading chunk") || 
      error.message.includes("Failed to fetch") ||
      !navigator.onLine;

    return { 
      hasError: true, 
      errorType: isNetworkError ? "network" : "render" 
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Aqui você enviaria para um Sentry ou LogRocket
    console.error("🚨 [ErrorBoundary]:", error, errorInfo);
  }

  private handleReset = () => {
    // Força um reload completo para limpar o cache de erros do navegador
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      const isNetwork = this.state.errorType === "network";

      return (
        <div className="min-h-[60vh] w-full flex flex-col items-center justify-center p-8 text-center animate-in fade-in zoom-in duration-300">
          <div className="bg-white border border-slate-100 p-10 md:p-14 rounded-[3rem] shadow-2xl shadow-slate-200/50 max-w-lg w-full space-y-8">
            
            {/* ÍCONE GRANDE ESTILIZADO */}
            <div className={`mx-auto h-20 w-20 rounded-[2rem] flex items-center justify-center shadow-inner ${
              isNetwork ? "bg-amber-50 text-amber-500" : "bg-rose-50 text-rose-500"
            }`}>
              {isNetwork ? <WifiOff size={40} /> : <AlertCircle size={40} />}
            </div>

            <div className="space-y-3">
              <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">
                {isNetwork ? "Conexão Perdida" : "Algo não deu certo"}
              </h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] leading-relaxed max-w-xs mx-auto">
                {isNetwork 
                  ? "Não conseguimos carregar os dados. Verifique sua conexão com a internet."
                  : this.props.fallbackMessage || "Houve um erro inesperado na interface. Nossa equipe foi notificada."}
              </p>
            </div>

            <Button 
              onClick={this.handleReset} 
              className={`w-full h-14 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] transition-all flex items-center justify-center gap-3 shadow-lg active:scale-95 ${
                isNetwork 
                ? "bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/20" 
                : "bg-slate-900 hover:bg-slate-800 text-white shadow-slate-900/20"
              }`}
            >
              <RefreshCcw size={16} className={isNetwork ? "animate-pulse" : ""} />
              Tentar Novamente
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