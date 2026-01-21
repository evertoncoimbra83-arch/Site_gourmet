import React from "react";
import { useCheckoutLogic } from "./checkout/logic/useCheckoutLogic";
import CheckoutPayment from "./checkout/components/CheckoutPayment";
import CheckoutAddress from "./checkout/components/CheckoutAddress";
import { CheckoutCustomer } from "./checkout/components/CheckoutCustomer"; // Nota: Named Export
import CheckoutSummary from "./checkout/components/CheckoutSummary";
import { Loader2 } from "lucide-react";

export default function CheckoutPage() {
  // Inicializa a lógica (Hook mestre)
  const vm = useCheckoutLogic();

  if (vm.authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin text-emerald-600" size={48} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      {/* Header Mobile Simples */}
      <div className="bg-white p-4 sticky top-0 z-20 shadow-sm md:hidden text-center">
        <h1 className="font-black text-lg text-slate-900 uppercase tracking-tighter">Finalizar Pedido</h1>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          
          {/* COLUNA DA ESQUERDA (Formulários) */}
          <div className="lg:col-span-7 space-y-10">
            
            {/* 1. Identificação */}
            <div className="animate-in fade-in slide-in-from-left-4 duration-500">
              <CheckoutCustomer state={vm.state} actions={vm.actions} />
            </div>

            {/* 2. Entrega (Só aparece se logado) */}
            {vm.user && (
              <div className="animate-in fade-in slide-in-from-left-4 duration-500 delay-100">
                <CheckoutAddress {...vm} />
              </div>
            )}

            {/* 3. Pagamento (Só aparece se logado) */}
            {vm.user && (
              <div className="animate-in fade-in slide-in-from-left-4 duration-500 delay-200">
                <CheckoutPayment {...vm} />
              </div>
            )}
          </div>

          {/* COLUNA DA DIREITA (Resumo Sticky) */}
          <div className="lg:col-span-5 relative">
            <div className="sticky top-24 animate-in fade-in slide-in-from-right-4 duration-700">
              <CheckoutSummary {...vm} />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}