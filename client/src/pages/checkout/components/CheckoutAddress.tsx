import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Truck, 
  Store, 
  MapPin, 
  Plus, 
  CheckCircle2, 
  AlertTriangle,
  Loader2,
  Info,
  AlertCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { CheckoutVM } from "../logic/useCheckoutLogic";
import { CheckoutAddressForm } from "./CheckoutAddressForm";

export default function CheckoutAddress(vm: CheckoutVM) {
  const [showForm, setShowForm] = useState(false);

  const {
    addressesList = [],
    selectedAddressId,
    handleAddressSelect,
    selectedShippingType,
    handleShippingTypeChange,
    isValidatingZip,
    isZipOutOfArea,
    isBelowMin,
    shippingCost,
    minOrderAmount,
    minOrderMessage,
    subtotal,
    pickupEnabled,
    pickupLabel,
    pickupInstruction,
    storeAddress // ✅ Recebido dinamicamente do Logic
  } = vm;

  // 🧮 Cálculo de quanto falta para liberar o delivery
  const missingValue = Math.max(0, minOrderAmount - subtotal);
  const formatBRL = (val: number) => val.toFixed(2).replace('.', ',');

  return (
    <div className="space-y-6">
      {/* --- TÍTULO --- */}
      <div className="flex items-center gap-3 ml-2">
        <div className="h-8 w-8 rounded-full bg-slate-950 flex items-center justify-center text-white shadow-lg">
          <MapPin size={14} strokeWidth={3} />
        </div>
        <h2 className="text-xl font-black uppercase italic tracking-tighter text-slate-900">
          Entrega ou Retirada
        </h2>
      </div>

      {/* --- SELETOR DE MODO --- */}
      <div className={cn("grid gap-4", pickupEnabled ? "grid-cols-2" : "grid-cols-1")}>
        <button
          type="button"
          onClick={() => handleShippingTypeChange("delivery")}
          className={cn(
            "p-6 rounded-[2rem] border-2 transition-all flex flex-col items-center gap-2 group relative overflow-hidden",
            selectedShippingType === "delivery"
              ? "border-emerald-500 bg-emerald-50/30 ring-4 ring-emerald-500/5"
              : "border-slate-100 bg-white hover:border-slate-200"
          )}
        >
          <Truck className={cn("transition-colors", selectedShippingType === "delivery" ? "text-emerald-600" : "text-slate-300")} />
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-700">Entrega</span>
          
          {/* Indicador de erro no botão de delivery */}
          {selectedShippingType === "delivery" && (isBelowMin || (selectedAddressId && isZipOutOfArea)) && (
            <div className="absolute top-3 right-3 text-amber-500 animate-pulse">
              <AlertCircle size={14} />
            </div>
          )}
        </button>

        {pickupEnabled && (
          <button
            type="button"
            onClick={() => handleShippingTypeChange("pickup")}
            className={cn(
              "p-6 rounded-[2rem] border-2 transition-all flex flex-col items-center gap-2 group relative overflow-hidden",
              selectedShippingType === "pickup"
                ? "border-emerald-500 bg-emerald-50/30 ring-4 ring-emerald-500/5"
                : "border-slate-100 bg-white hover:border-slate-200"
            )}
          >
            <Store className={cn("transition-colors", selectedShippingType === "pickup" ? "text-emerald-600" : "text-slate-300")} />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-700">
              {pickupLabel || "Retirada"}
            </span>
          </button>
        )}
      </div>

      <Card className="border-none shadow-xl shadow-slate-200/40 rounded-[2.5rem] bg-white overflow-hidden">
        <CardContent className="p-8">
          
          {selectedShippingType === "pickup" ? (
            /* --- MODO RETIRADA --- */
            <div className="space-y-6 animate-in fade-in slide-in-from-top-2">
              <div className="flex flex-col items-center text-center space-y-3">
                <div className="h-16 w-16 rounded-3xl bg-emerald-50 flex items-center justify-center text-emerald-600 shadow-sm border border-emerald-100">
                  <Store size={32} strokeWidth={1.5} />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 uppercase italic tracking-tight text-lg">{pickupLabel}</h3>
                  <p className="text-sm font-medium text-slate-500 mt-1">{storeAddress}</p>
                  <Badge className="mt-4 bg-emerald-100 text-emerald-700 border-none uppercase text-[9px] font-black px-3 py-1">
                    Taxa: Grátis
                  </Badge>
                </div>
              </div>

              {pickupInstruction && (
                <div className="p-5 bg-slate-50 rounded-[1.5rem] border border-slate-100 flex gap-4 items-start shadow-inner">
                  <div className="bg-white p-2 rounded-full shadow-sm text-emerald-500 shrink-0">
                    <Info size={16} />
                  </div>
                  <div className="space-y-1 text-left">
                    <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Informações Importantes</p>
                    <p className="text-[11px] text-slate-600 font-medium leading-relaxed">{pickupInstruction}</p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            
            /* --- MODO ENTREGA --- */
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
              
              {/* ALERTAS DE BLOQUEIO */}
              <div className="space-y-3">
                {isBelowMin && (
                  <div className="flex items-start gap-3 p-4 bg-amber-50 text-amber-800 rounded-2xl border border-amber-200/60 shadow-sm animate-in zoom-in-95">
                    <AlertTriangle size={20} className="shrink-0 text-amber-500 mt-0.5" />
                    <div className="space-y-1">
                      <p className="text-[10px] font-black uppercase tracking-tight">Pedido Mínimo não atingido</p>
                      <p className="text-xs font-medium">
                        Compre mais <span className="font-black underline text-amber-900">R$ {formatBRL(missingValue)}</span> para liberar a entrega.
                      </p>
                      <p className="text-[9px] opacity-70">O valor mínimo de produtos é R$ {formatBRL(minOrderAmount)}</p>
                    </div>
                  </div>
                )}

                {selectedAddressId && isZipOutOfArea && (
                  <div className="flex items-start gap-3 p-4 bg-red-50 text-red-700 rounded-2xl border border-red-100 animate-in zoom-in-95 shadow-sm">
                    <AlertCircle size={20} className="shrink-0 mt-0.5" />
                    <div className="space-y-1 text-left">
                      <p className="text-[10px] font-black uppercase tracking-tight">Região Indisponível</p>
                      <p className="text-[11px] leading-tight font-medium">
                        Sentimos muito, mas este endereço está fora da nossa área de cobertura. Escolha outro local ou use a opção de "Retirada".
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-between items-center border-b border-slate-50 pb-4">
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Seus Endereços</p>
                {!showForm && (
                  <Button variant="ghost" size="sm" onClick={() => setShowForm(true)} className="text-emerald-600 font-black text-[9px] uppercase rounded-xl">
                    <Plus size={14} className="mr-1" /> Novo Endereço
                  </Button>
                )}
              </div>

              {showForm ? (
                <CheckoutAddressForm 
                  createAddressMutation={vm.createAddressMutation} // Passando a mutação correta agora
                  onSuccess={() => setShowForm(false)}
                  onCancel={() => setShowForm(false)}
                />
              ) : (
                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                  {addressesList.length === 0 ? (
                    <div className="text-center py-8 bg-slate-50/50 rounded-2xl border border-dashed border-slate-100">
                       <p className="text-xs text-slate-400 font-medium">Você ainda não possui endereços salvos.</p>
                       <Button variant="link" onClick={() => setShowForm(true)} className="text-emerald-600 font-bold text-xs mt-1 underline">Cadastrar Primeiro Endereço</Button>
                    </div>
                  ) : (
                    addressesList.map((addr: any) => {
                      const isActive = selectedAddressId === String(addr.id);
                      const hasError = isActive && isZipOutOfArea;
                      return (
                        <button
                          key={addr.id}
                          type="button"
                          onClick={() => handleAddressSelect(String(addr.id))}
                          className={cn(
                            "w-full p-5 rounded-[1.5rem] border-2 text-left transition-all relative group",
                            isActive
                              ? (hasError ? "border-red-200 bg-red-50/30 ring-1 ring-red-200" : "border-emerald-500 bg-emerald-50/20 shadow-sm")
                              : "border-slate-50 bg-slate-50/30 hover:border-slate-200 hover:bg-white"
                          )}
                        >
                          <div className="flex justify-between items-start">
                            <div className="space-y-1 pr-8">
                              <p className={cn("text-[10px] font-black uppercase tracking-tighter", hasError ? "text-red-400" : "text-slate-400")}>
                                {addr.label || "Casa"}
                              </p>
                              <p className="text-xs font-bold text-slate-900 leading-tight">
                                {addr.street}, {addr.number}
                              </p>
                              <p className="text-[10px] text-slate-500 font-medium">
                                {addr.neighborhood} - {addr.city}/{addr.state}
                              </p>
                            </div>
                            {isActive && (
                              <div className={cn("p-1 rounded-full shadow-sm", hasError ? "bg-red-500 text-white" : "bg-emerald-500 text-white")}>
                                {hasError ? <AlertTriangle size={14} strokeWidth={3} /> : <CheckCircle2 size={14} strokeWidth={3} />}
                              </div>
                            )}
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              )}

              {/* RODAPÉ DO FRETE */}
              {selectedAddressId && !showForm && !isZipOutOfArea && (
                <div className="pt-4 border-t border-slate-100 animate-in zoom-in-95">
                  {isValidatingZip ? (
                    <div className="flex items-center justify-center py-4 text-slate-400 gap-2 bg-slate-50 rounded-xl">
                      <Loader2 size={16} className="animate-spin text-emerald-600" />
                      <span className="text-[10px] font-black uppercase">Calculando Frete...</span>
                    </div>
                  ) : (
                    <div className="flex justify-between items-center bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100/50 shadow-inner">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-emerald-500 text-white border-none uppercase text-[8px] font-black px-2.5">
                          Taxa de Entrega
                        </Badge>
                        <span className="font-black text-slate-900 text-sm">
                          {shippingCost === 0 ? "GRÁTIS" : `R$ ${formatBRL(shippingCost)}`}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}