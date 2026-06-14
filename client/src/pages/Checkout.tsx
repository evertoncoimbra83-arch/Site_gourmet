// client/src/pages/Checkout.tsx
// Fix mobile: h-screen → min-h-dvh (dynamic viewport height)
// Evita que a barra de endereço do browser mobile corte o conteúdo

import React, { useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, ArrowLeft, ShieldCheck, ArrowRight } from "lucide-react";

import { SEO } from "@/components/SEO";

import CheckoutPayment from "./checkout/components/CheckoutPayment";
import CheckoutShipping from "./checkout/components/CheckoutShipping";
import CheckoutSummary from "./checkout/components/CheckoutSummary";
import { CheckoutCustomer } from "./checkout/components/CheckoutCustomer";

import { CheckoutProvider, useCheckout } from "./checkout/context/CheckoutContext";
import { useAuth } from "@/_core/hooks/useAuth";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { Button } from "@/components/ui/button";

const formatBRL = (value: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
};

function CheckoutContent() {
  const navigate = useNavigate();
  const {
    summary,
    isLoading,
    isSubmitting,
    logistics,
    firstIssue,
    handleFinalizeClick,
    machineState,
  } = useCheckout();

  useEffect(() => {
    if (!isLoading && summary.items.length === 0 && !isSubmitting) {
      navigate("/carrinho", { replace: true });
    }
  }, [summary.items.length, isLoading, isSubmitting, navigate]);

  const totalItems = useMemo(() => {
    return (summary?.items || []).reduce((sum, item) => sum + item.quantity, 0);
  }, [summary?.items]);

  const totalDiscount = useMemo(() => {
    const diff = (summary?.subtotal || 0) + (logistics?.shippingCost || 0) - (summary?.total || 0);
    return diff > 0 ? diff : 0;
  }, [summary?.subtotal, logistics?.shippingCost, summary?.total]);

  const buttonText = useMemo(() => {
    if (machineState === "shipping_validating") {
      return "Validando frete...";
    }
    if (!firstIssue) {
      return `Finalizar pedido • ${summary?.totalFormatted || ""}`;
    }
    return firstIssue.message;
  }, [firstIssue, summary?.totalFormatted, machineState]);

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
    // ✅ pb-36 no mobile para evitar que o rodapé sticky cubra os inputs
    <div className="min-h-dvh overflow-x-hidden bg-[#FBFBFC] flex flex-col font-sans text-left pb-36 lg:pb-10">
      <header className="bg-white border-b p-4 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto w-full flex justify-between items-center">
          <button onClick={() => navigate("/carrinho")} className="p-1 text-slate-400 hover:text-slate-900 flex items-center gap-2 transition-colors">
            <ArrowLeft size={18} strokeWidth={3} />
            <span className="hidden sm:inline text-[10px] font-black uppercase tracking-widest">Voltar ao Carrinho</span>
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
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10">

          <div className="lg:col-span-7 space-y-8 lg:space-y-12">
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

      {/* ✅ Sticky CTA rodapé mobile (exibido apenas no mobile e se tiver itens no carrinho) */}
      {summary.items.length > 0 && (
        <div
          className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-100 shadow-[0_-10px_30px_rgba(0,0,0,0.06)] z-40 p-4 flex flex-col gap-3"
          style={{ paddingBottom: "calc(16px + env(safe-area-inset-bottom, 0px))" }}
        >
          {/* Resumo compacto */}
          <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-wider text-slate-500 px-1">
            <span>{totalItems} {totalItems === 1 ? "item" : "itens"}</span>
            <div className="flex items-center gap-3">
              <span>Subtotal: {summary.subtotalFormatted}</span>
              {totalDiscount > 0 && (
                <span className="text-emerald-600">Desc: -{formatBRL(totalDiscount)}</span>
              )}
              <span>
                {logistics.type === "pickup" ? "Retirada: Grátis" : `Entrega: ${logistics.shippingCostFormatted}`}
              </span>
            </div>
          </div>

          {firstIssue && (
            <p className="text-[8px] font-black text-rose-500 uppercase tracking-widest text-center animate-pulse">
              ⚠️ {firstIssue.message}
            </p>
          )}

          {/* Botão de Finalizar */}
          <Button
            data-testid="btn-finalize-order-mobile"
            onClick={handleFinalizeClick}
            disabled={isSubmitting || isLoading}
            className={`w-full h-14 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl transition-all flex items-center justify-center gap-2 ${
              !firstIssue
                ? "bg-slate-900 hover:bg-emerald-600 text-white"
                : "bg-slate-100 text-slate-400 cursor-not-allowed"
            }`}
          >
            {isSubmitting ? (
              <Loader2 className="animate-spin text-white" size={16} />
            ) : (
              <>
                <span>{buttonText}</span>
                {!firstIssue && <ArrowRight size={14} />}
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <CheckoutProvider>
      <SEO title="Finalizar Pedido" noindex />
      <CheckoutContent />
    </CheckoutProvider>
  );
}
