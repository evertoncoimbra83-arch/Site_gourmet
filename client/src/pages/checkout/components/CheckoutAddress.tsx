// client/src/pages/checkout/components/CheckoutAddress.tsx

import React, { useState } from "react";
import { useCheckout } from "../context/CheckoutContext"; 
import { CheckoutAddressForm } from "./CheckoutAddressForm"; 
import { MapPin, Plus, CheckCircle2, AlertTriangle, Loader2, Store } from "lucide-react";
import { trpc } from "@/_core/trpc";
import { cn } from "@/lib/utils";

export function CheckoutAddress() {
  const { 
    logistics, 
    actions, 
    isLoading,
    machineState // ✅ Pegamos o estado da máquina para controle de UI
  } = useCheckout();

  const [showForm, setShowForm] = useState(false);
  const utils = trpc.useUtils();

  const { 
    addresses, 
    selectedAddressId, 
    type: selectedShippingType, 
    errorMessage,
    canDeliver
  } = logistics;

  // ✅ Estados derivados da Máquina para simplificar a renderização
  const isValidating = machineState === 'shipping_validating';
  const isLocked = machineState === 'submitting' || machineState === 'success';

  // Se o modo for retirada, mostramos o estado de "Mudo"
  if (selectedShippingType === "pickup") {
    return (
      <div className="p-8 border-2 border-dashed border-slate-200 rounded-4xl bg-slate-50/50 text-center space-y-3 animate-in fade-in">
        <div className="h-12 w-12 bg-white text-emerald-600 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
          <Store size={24} />
        </div>
        <div className="space-y-1">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Retirada Selecionada</p>
          <p className="text-xs text-slate-500 font-medium">Seu pedido será preparado para retirada em nossa loja.</p>
        </div>
        
        {canDeliver && !isLocked ? (
          <button 
            onClick={() => actions.setShippingType("delivery")}
            className="text-[9px] font-black uppercase text-emerald-600 underline hover:text-emerald-700 transition-colors"
          >
            Mudar para Entrega
          </button>
        ) : !canDeliver && (
          <p className="text-[9px] font-black uppercase text-amber-600 italic">
            Adicione mais itens para liberar entrega
          </p>
        )}
      </div>
    );
  }

  return (
    <div className={cn(
      "space-y-6 animate-in fade-in duration-500 relative transition-opacity",
      isLocked && "opacity-60 pointer-events-none" // Trava o componente se estiver finalizando
    )}>
      <div className="flex items-center justify-between px-1">
        <div className="text-left">
          <h3 className="text-xl font-black text-slate-900 tracking-tight">Onde entregamos?</h3>
          <p className="text-xs text-slate-500 font-medium">
            Selecione um endereço para sua entrega
          </p>
        </div>
        
        {!showForm && !isLocked && (
          <button 
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-4 py-2 rounded-full hover:bg-emerald-100 transition-colors shadow-sm"
          >
            <Plus size={14} /> Novo Endereço
          </button>
        )}
      </div>

      {showForm ? (
        <CheckoutAddressForm 
          onSuccess={() => {
            setShowForm(false);
            utils.store.addresses.list.invalidate();
          }}
          onCancel={() => setShowForm(false)}
        />
      ) : (
        <div className="grid gap-4">
          {addresses.length > 0 ? (
            addresses.map((addr) => {
              const isSelected = String(selectedAddressId) === String(addr.id);
              return (
                <button
                  key={addr.id}
                  disabled={isLocked || isValidating}
                  onClick={() => actions.setAddress(String(addr.id))}
                  className={cn(
                    "relative flex items-center gap-4 p-5 rounded-4xl border-2 transition-all text-left",
                    isSelected 
                      ? "border-emerald-500 bg-emerald-50/20 shadow-xl shadow-emerald-900/5" 
                      : "border-slate-50 hover:border-slate-200 bg-white",
                    isValidating && isSelected && "animate-pulse border-emerald-300"
                  )}
                >
                  <div className={cn(
                    "p-3 rounded-2xl transition-colors",
                    isSelected ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-400"
                  )}>
                    <MapPin size={20} />
                  </div>

                  <div className="flex-1 pr-8">
                    <p className="font-black text-slate-800 text-sm leading-tight">
                      {addr.street}, {addr.number}
                    </p>
                    <p className="text-[11px] text-slate-400 font-bold uppercase tracking-tighter mt-1">
                      {addr.neighborhood} • {addr.city}
                    </p>
                  </div>

                  {isSelected && (
                    <div className="absolute right-6 text-emerald-500 animate-in zoom-in duration-300">
                      {isValidating ? (
                        <Loader2 size={24} className="animate-spin text-emerald-500" />
                      ) : (
                        <CheckCircle2 size={24} className="text-white fill-emerald-500" />
                      )}
                    </div>
                  )}
                </button>
              );
            })
          ) : (
            <div className="py-12 text-center border-2 border-dashed border-slate-100 rounded-4xl">
               <MapPin size={32} className="mx-auto text-slate-200 mb-2" />
               <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Nenhum endereço cadastrado</p>
            </div>
          )}

          <div className="space-y-2 px-1 text-left">
            {errorMessage && !isValidating && (
              <div className="flex items-center gap-3 p-4 rounded-3xl bg-red-50 border border-red-100 text-red-600 animate-in slide-in-from-top-2">
                <AlertTriangle size={18} className="shrink-0" />
                <p className="text-[11px] font-black uppercase tracking-tight">
                  {errorMessage}
                </p>
              </div>
            )}

            {(isLoading || isValidating) && (
              <div className="flex items-center justify-center gap-2 py-2 text-slate-400">
                <Loader2 size={14} className="animate-spin" />
                <span className="text-[10px] font-black uppercase tracking-widest italic">
                  {isValidating ? "Validando frete..." : "Carregando..."}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}