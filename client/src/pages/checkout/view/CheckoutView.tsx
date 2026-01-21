import React from "react";
import { Loader2, ArrowLeft, ShieldCheck, Lock } from "lucide-react";
import type { CheckoutVM } from "../logic/useCheckoutLogic";
import CheckoutShipping from "../components/CheckoutShipping";
import CheckoutPayment from "../components/CheckoutPayment";
import CheckoutSummary from "../components/CheckoutSummary";
import { CheckoutCustomer } from "../components/CheckoutCustomer";

export function CheckoutView({ vm }: { vm: CheckoutVM }) {
  if (!vm) return null;

  const { authLoading, cart } = vm;

  const goBackToCart =
    (vm as any).goBackToCart ?? (() => window.history.back());

  if (authLoading || cart?.isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#FBFBFC] gap-4">
        <Loader2 className="animate-spin text-emerald-600 h-10 w-10" />
        <p className="text-slate-400 font-bold text-xs tracking-widest">
          CARREGANDO CHECKOUT...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FBFBFC] pb-32">
      {/* Header */}
      <div className="bg-white border-b border-slate-100 py-3 sticky top-0 z-50 shadow-sm">
        <div className="container max-w-6xl mx-auto px-4 flex justify-between items-center">
          <div className="flex items-center gap-2 text-emerald-600">
            <ShieldCheck size={16} />
            <span className="text-[10px] font-bold uppercase tracking-widest">
              Ambiente Seguro
            </span>
          </div>
          <button
            onClick={goBackToCart}
            className="text-[10px] font-bold text-slate-400 hover:text-slate-900 uppercase tracking-widest flex items-center gap-2"
          >
            <ArrowLeft size={14} /> Voltar
          </button>
        </div>
      </div>

      <div className="container max-w-6xl mx-auto px-4 py-10">
        <div className="mb-10">
          <h1 className="text-4xl font-black text-slate-900 uppercase italic tracking-tighter">
            Finalizar <span className="text-emerald-600">Pedido</span>
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          <div className="lg:col-span-7 xl:col-span-8 space-y-8">
            {/* ✅ Sempre renderiza; o componente decide se mostra login ou dados pessoais */}
            <CheckoutCustomer state={vm.state} actions={vm.actions} />

            <CheckoutShipping {...vm} />
            <CheckoutPayment {...vm} />

            <div className="flex justify-center gap-2 text-slate-300 mt-8">
              <Lock size={12} />
              <span className="text-[10px] font-bold uppercase tracking-widest">
                Dados Criptografados
              </span>
            </div>
          </div>

          <aside className="lg:col-span-5 xl:col-span-4 lg:sticky lg:top-24">
            <CheckoutSummary {...vm} />
          </aside>
        </div>
      </div>
    </div>
  );
}
