// client/src/pages/Checkout.tsx
// Fix mobile: h-screen → min-h-dvh (dynamic viewport height)
// Evita que a barra de endereço do browser mobile corte o conteúdo

import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom"; 
import { Loader2, ArrowLeft, ShieldCheck, LockKeyhole, UserPlus } from "lucide-react";

import CheckoutPayment from "./checkout/components/CheckoutPayment";
import CheckoutShipping from "./checkout/components/CheckoutShipping";
import CheckoutSummary from "./checkout/components/CheckoutSummary";
import { CheckoutCustomer } from "./checkout/components/CheckoutCustomer";

import { CheckoutProvider, useCheckout } from "./checkout/context/CheckoutContext";
import { useAuth } from "@/_core/hooks/useAuth";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { Button } from "@/components/ui/button";

function CheckoutContent() {
  const navigate = useNavigate();
  const { summary, isLoading, isSubmitting } = useCheckout();

  useEffect(() => {
    if (!isLoading && summary.items.length === 0 && !isSubmitting) {
      navigate("/carrinho", { replace: true });
    }
  }, [summary.items.length, isLoading, isSubmitting, navigate]);

  if (isLoading) {
    return (
      // ✅ min-h-dvh: usa a viewport real do mobile (descontando a barra do browser)
      <div className="min-h-dvh flex flex-col items-center justify-center bg-[#FBFBFC] gap-4">
        <Loader2 className="animate-spin text-emerald-500" size={40} />
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Verificando seu pedido...</p>
      </div>
    );
  }

  return (
    // ✅ min-h-dvh no container principal também
    <div className="min-h-dvh bg-[#FBFBFC] flex flex-col font-sans text-left pb-10">
      <header className="bg-white border-b p-4 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto w-full flex justify-between items-center">
          <button onClick={() => navigate("/carrinho")} className="p-1 text-slate-400 hover:text-slate-900 flex items-center gap-2 transition-colors">
            <ArrowLeft size={18} strokeWidth={3} />
            <span className="text-[10px] font-black uppercase tracking-widest">Voltar ao Carrinho</span>
          </button>

          <h1 className="font-black text-xs md:text-sm uppercase italic tracking-tighter text-slate-900 leading-none">
            <span className="text-emerald-600">Checkout</span>
          </h1>

          <div className="flex items-center gap-2 text-emerald-600">
            <ShieldCheck size={20} />
            <span className="hidden md:inline text-[9px] font-black uppercase">Seguro</span>
          </div>
        </div>
      </header>

      <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full mt-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          <div className="lg:col-span-7 space-y-12">
            <section className="space-y-6">
              <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight italic flex items-center gap-3">
                <span className="h-6 w-1 bg-emerald-500 rounded-full" />
                Dados do Pedido
              </h2>
              <ErrorBoundary fallbackMessage="Erro na identificação.">
                <CheckoutCustomer />
              </ErrorBoundary>
              
              <ErrorBoundary fallbackMessage="Erro na entrega.">
                <CheckoutShipping />
              </ErrorBoundary>
            </section>
            
            <section className="space-y-6">
              <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight italic flex items-center gap-3">
                <span className="h-6 w-1 bg-emerald-500 rounded-full" />
                Forma de Pagamento
              </h2>
              <ErrorBoundary fallbackMessage="Erro no pagamento.">
                <CheckoutPayment />
              </ErrorBoundary>
            </section>
          </div>

          <aside className="lg:col-span-5">
            <div className="sticky top-24">
              <ErrorBoundary fallbackMessage="Erro ao calcular resumo.">
                <CheckoutSummary />
              </ErrorBoundary>
            </div>
          </aside>

        </div>
      </main>
    </div>
  );
}

export default function CheckoutPage() {
  const { isAuthenticated, openAuthModal } = useAuth();

  if (!isAuthenticated) {
    return (
      // ✅ min-h-dvh aqui também
      <div className="min-h-dvh bg-[#FBFBFC] flex flex-col">
        <main className="flex-1 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-[3rem] p-10 border-2 border-slate-100 shadow-2xl text-center space-y-8 animate-in fade-in zoom-in duration-500">
            <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto">
              <LockKeyhole size={40} strokeWidth={1.5} />
            </div>
            
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-slate-900 leading-tight italic">Quase lá!</h2>
              <p className="text-slate-500 text-sm font-medium">Para garantir seus pontos de fidelidade e segurança, faça login ou cadastre-se rapidinho.</p>
            </div>

            <div className="grid gap-3">
              <Button 
                onClick={() => openAuthModal("login")}
                className="h-16 bg-slate-900 hover:bg-slate-800 text-white rounded-3xl font-black uppercase text-xs tracking-widest transition-all shadow-xl"
              >
                Já tenho conta / Entrar
              </Button>
              <Button 
                onClick={() => openAuthModal("register")}
                variant="outline"
                className="h-16 border-2 border-emerald-100 text-emerald-600 hover:bg-emerald-50 rounded-3xl font-black uppercase text-xs tracking-widest flex gap-2 items-center justify-center"
              >
                <UserPlus size={18} />
                Criar conta grátis
              </Button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <CheckoutProvider>
      <CheckoutContent />
    </CheckoutProvider>
  );
}