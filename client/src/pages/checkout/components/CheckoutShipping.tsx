// client/src/pages/checkout/components/CheckoutShipping.tsx

import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Truck,
  Store,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Edit2,
  Plus,
  ChevronRight,
  MapPin,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { CheckoutAddressForm } from "./CheckoutAddressForm";
import { useCheckout } from "../context/CheckoutContext"; // ✅ Agora consome do Contexto Centralizado
import { appToast as toast } from "@/lib/app-toast";

// ==================== SUB-COMPONENTES ====================

const PickupToggle = ({
  isPickup,
  onToggle,
  disabled = false,
  pickupInfo,
}: {
  isPickup: boolean;
  onToggle: () => void;
  disabled?: boolean;
  pickupInfo?: { address: string; hours?: string };
}) => (
  <div
    onClick={() => !disabled && onToggle()}
    className={cn(
      "w-full p-5 rounded-4xl border-2 transition-all duration-300 relative",
      disabled ? "cursor-not-allowed opacity-80 bg-slate-50 border-slate-100" : "cursor-pointer",
      !disabled && isPickup ? "bg-emerald-500/5 border-emerald-500/20" : "bg-white border-slate-100 hover:border-slate-200"
    )}
  >
    <div className="flex items-center justify-between relative z-10">
      <div className="flex items-center gap-4">
        <div
          className={cn(
            "h-10 w-10 rounded-2xl flex items-center justify-center transition-colors",
            isPickup ? "bg-emerald-50 text-emerald-600 shadow-lg shadow-emerald-500/20" : "bg-slate-100 text-slate-400"
          )}
        >
          <Store size={18} />
        </div>
        <div className="text-left">
          <p className={cn("text-xs font-black uppercase tracking-tight flex items-center gap-2", isPickup ? "text-emerald-900" : "text-slate-700")}>
            Retirar no Local
            <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 border border-emerald-100/30 px-1.5 py-0.5 rounded-md">
              Grátis
            </span>
          </p>
          {disabled && (
            <p className="text-[9px] font-bold text-slate-400 uppercase leading-none mt-1">
              Única opção disponível
            </p>
          )}
        </div>
      </div>

      <div
        className={cn(
          "w-12 h-7 rounded-full flex items-center px-1 transition-colors duration-300",
          isPickup ? "bg-emerald-500" : "bg-slate-200"
        )}
      >
        <motion.div
          className="w-5 h-5 rounded-full bg-white shadow-sm"
          animate={{ x: isPickup ? 20 : 0 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        />
      </div>
    </div>

    <AnimatePresence>
      {isPickup && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="mt-4 border-t border-emerald-500/10 pt-4 text-left space-y-3"
        >
          <div className="bg-white/60 p-4 rounded-2xl border border-emerald-500/10 space-y-3">
            <div className="flex gap-3">
              <MapPin size={14} className="text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-[10px] font-black text-emerald-900 uppercase tracking-tighter">Onde Retirar</p>
                <p className="text-[11px] font-bold text-emerald-800/70 leading-tight mt-0.5">
                  {pickupInfo?.address || "Avenida Samuel Martins, 881 - Vila Progresso, Jundiaí - SP"}
                </p>
              </div>
            </div>

            <div className="flex gap-3 pt-2 border-t border-emerald-500/5">
              <Clock size={14} className="text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-[10px] font-black text-emerald-900 uppercase tracking-tighter">Horários</p>
                <p className="text-[11px] font-bold text-emerald-800/70 leading-tight mt-0.5">
                  {pickupInfo?.hours || "Segunda a Sexta: 10h às 18h"}
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  </div>
);

const ShippingValidationAlert = ({ errorMessage, type = "warning" }: { errorMessage?: string, type?: "warning" | "error" }) => {
  if (!errorMessage) return null;

  return (
    <div className={cn(
      "p-4 border rounded-2xl flex items-start gap-3 text-left animate-in fade-in slide-in-from-top-1",
      type === "error" ? "border-orange-200 bg-orange-50" : "border-amber-100 bg-amber-50"
    )}>
      <AlertTriangle className={cn("shrink-0", type === "error" ? "text-orange-600" : "text-amber-600")} size={18} />
      <div>
        <p className={cn("text-[11px] font-black uppercase leading-none mb-1", type === "error" ? "text-orange-700" : "text-amber-700")}>
          Atenção
        </p>
        <p className={cn("text-[10px] font-medium leading-relaxed", type === "error" ? "text-orange-600" : "text-amber-600")}>
          {errorMessage}
        </p>
      </div>
    </div>
  );
};

// ==================== COMPONENTE PRINCIPAL ====================

export default function CheckoutShipping() {
  const { logistics, actions, isLoading, machineState, summary, session } = useCheckout();
  const [addressMode, setAddressMode] = useState<"view" | "select" | "form">("view");

  const {
    addresses,
    selectedAddressId,
    type: selectedShippingType,
    errorMessage,
  } = logistics;

  // ✅ Estados derivados da Máquina
  const isBusy = machineState === 'shipping_validating' || machineState === 'submitting';
  const isLocked = machineState === 'submitting' || machineState === 'success';

  const subtotal = summary?.subtotal ?? 0;
  const minValueForDelivery = logistics.minOrderValue || 50;
  const MIN_VALUE_FOR_DELIVERY = minValueForDelivery;
  const isBelowMinForDelivery = logistics.isBelowMinForDelivery;

  const isPickup = selectedShippingType === "pickup";
  const selectedAddress = addresses.find((a) => String(a.id) === String(selectedAddressId));
  const needsGuestSessionForDelivery = !isPickup && !session.isReady;

  const pickupInfo = summary?.storeInfo || {
    address: "Avenida Samuel Martins, 881 - Vila Progresso, Jundiaí - SP",
    hours: "Segunda a Sexta: 10h às 18h"
  };

  useEffect(() => {
    if (isLocked) return;

    if (isBelowMinForDelivery && !isPickup) {
      actions.setShippingType("pickup", { manual: false });
      return;
    }

    if (
      !isBelowMinForDelivery &&
      isPickup &&
      !logistics.shippingTypeManuallySelected
    ) {
      actions.setShippingType("delivery", { manual: false });
    }
  }, [
    isBelowMinForDelivery,
    isPickup,
    isLocked,
    logistics.shippingTypeManuallySelected,
    actions,
  ]);

  const toggleShippingMode = () => {
    if (isBelowMinForDelivery || isLocked) return;
    const newType = isPickup ? "delivery" : "pickup";
    actions.setShippingType(newType);
    if (newType === "delivery" && !selectedAddressId && addresses.length > 0) {
      setAddressMode("select");
    }
  };

  const requestGuestIdentification = () => {
    toast.warning(
      "Para cadastrar o endereço, finalize primeiro sua identificação como visitante.",
      {
        description: "Você não precisa criar senha.",
      },
    );
    window.dispatchEvent(
      new CustomEvent("checkout-focus-error", {
        detail: { field: "customerName", section: "customer" },
      }),
    );
  };

  const openAddressForm = () => {
    if (needsGuestSessionForDelivery) {
      requestGuestIdentification();
      return;
    }
    setAddressMode("form");
  };

  useEffect(() => {
    if (needsGuestSessionForDelivery && addressMode === "form") {
      setAddressMode("view");
    }
  }, [addressMode, needsGuestSessionForDelivery]);

  if (isLoading && machineState === 'loading') {
    return (
      <div className="p-10 flex flex-col items-center gap-2">
        <Loader2 className="animate-spin text-emerald-500" />
        <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Sincronizando...</span>
      </div>
    );
  }

  return (
    <div className={cn(
      "space-y-4 animate-in fade-in duration-500",
      isLocked && "opacity-70 pointer-events-none"
    )}>

      {isBelowMinForDelivery && (
        <ShippingValidationAlert
          type="error"
          errorMessage={`Pedidos abaixo de R$ ${MIN_VALUE_FOR_DELIVERY.toFixed(2).replace('.', ',')} estão disponíveis apenas para RETIRADA.`}
        />
      )}

      <PickupToggle
        isPickup={isPickup}
        onToggle={toggleShippingMode}
        disabled={isBelowMinForDelivery || isLocked}
        pickupInfo={pickupInfo}
      />

      <AnimatePresence mode="wait">
        {!isPickup && (
          <motion.div
            key="delivery-content"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
          >
            <Card className={cn(
              "border-2 shadow-2xl shadow-slate-200/40 rounded-4xl bg-white overflow-hidden transition-colors",
              isBusy ? "border-emerald-100" : "border-slate-50"
            )}>
              <CardContent className="p-6 text-left">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2">
                    <div className="bg-slate-100 p-2 rounded-xl text-slate-500"><Truck size={14} /></div>
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Dados da Entrega</h3>
                  </div>
                  {isBusy && <Loader2 size={14} className="animate-spin text-emerald-500" />}
                </div>

                <div className="space-y-4">
                  {addressMode === "form" ? (
                    <CheckoutAddressForm
                      onSuccess={() => setAddressMode("view")}
                      onCancel={() => setAddressMode("view")}
                    />
                  ) : addresses.length === 0 ? (
                    <div className="p-10 text-center border-2 border-dashed border-slate-100 rounded-3xl bg-slate-50 flex flex-col items-center">
                      <MapPin size={32} className="text-slate-200 mb-3" />
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-5">Nenhum endereço salvo</p>
                      {needsGuestSessionForDelivery && (
                        <p className="text-[10px] font-bold text-amber-600 leading-relaxed mb-4 max-w-sm">
                          Para cadastrar o endereço, finalize primeiro sua identificação como visitante. Você não precisa criar senha.
                        </p>
                      )}
                      <Button
                        disabled={isLocked}
                        onClick={openAddressForm}
                        className="bg-slate-900 hover:bg-emerald-600 rounded-2xl font-black uppercase text-[10px] px-8 h-12 transition-all text-white"
                      >
                        Cadastrar Agora
                      </Button>
                    </div>
                  ) : addressMode === "select" ? (
                    <div className="space-y-3">
                      <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                        {addresses.map((addr) => {
                          const isSelected = String(selectedAddressId) === String(addr.id);
                          return (
                            <button
                              key={addr.id}
                              type="button"
                              disabled={isLocked}
                              onClick={() => {
                                actions.setAddress(String(addr.id));
                                setAddressMode("view");
                              }}
                              className={cn(
                                "w-full p-4 rounded-2xl border-2 text-left transition-all flex items-center justify-between",
                                isSelected ? "border-emerald-500 bg-emerald-50/30" : "border-slate-50 bg-slate-50/50 hover:border-slate-200",
                                isLocked && "cursor-not-allowed"
                              )}
                            >
                              <div className="min-w-0">
                                <p className={cn("text-[11px] font-bold", isSelected ? "text-emerald-900" : "text-slate-800")}>
                                  {addr.street}, {addr.number}
                                </p>
                                <p className="text-[9px] text-slate-400 truncate">{addr.neighborhood}</p>
                              </div>
                              {isSelected ? <CheckCircle2 size={16} className="text-emerald-500" /> : <ChevronRight size={16} className="text-slate-300" />}
                            </button>
                          );
                        })}
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t">
                        <button onClick={() => setAddressMode("view")} className="text-[10px] font-black uppercase text-slate-400 hover:text-slate-600">Voltar</button>
                        <Button
                          onClick={openAddressForm}
                          variant="ghost"
                          disabled={isLocked}
                          className="h-8 text-[10px] font-black uppercase gap-1 text-emerald-600"
                        >
                          <Plus size={14} /> Novo Endereço
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className={cn(
                      "p-4 rounded-3xl border-2 flex items-center justify-between transition-all",
                      isBusy ? "border-emerald-300 bg-emerald-50/30" : "border-emerald-500/20 bg-emerald-50/50"
                    )}>
                      <div className="flex items-center gap-3">
                        {isBusy ? <Loader2 size={18} className="animate-spin text-emerald-600" /> : <MapPin size={18} className="text-emerald-600" />}
                        <div className="min-w-0">
                          <p className="text-[11px] font-black text-slate-800 leading-tight truncate">{selectedAddress?.street}, {selectedAddress?.number}</p>
                          <p className="text-[10px] font-medium text-slate-500">
                            {selectedAddress?.neighborhood}
                            {selectedAddress?.zipCode ? ` • CEP: ${selectedAddress.zipCode.replace(/\D/g, "").replace(/^(\d{5})(\d)/, "$1-$2")}` : ""}
                          </p>
                          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200/20">
                              Frete: {logistics.shippingCost > 0 ? logistics.shippingCostFormatted : "Grátis"}
                            </span>
                            {!logistics.errorMessage && (
                              <span className="text-[9px] font-bold text-slate-400">
                                • Entrega hoje
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => setAddressMode("select")}
                        disabled={isLocked}
                        className="bg-white border p-2 rounded-xl text-emerald-700 hover:bg-emerald-50 shadow-sm transition-all disabled:opacity-50"
                      >
                        <Edit2 size={14} />
                      </button>
                    </div>
                  )}

                  {addressMode === "view" && selectedAddressId && (
                    <ShippingValidationAlert errorMessage={errorMessage} />
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
