import React from "react";
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
  Info
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { CheckoutVM } from "../logic/useCheckoutLogic";
import { CheckoutAddressForm } from "./CheckoutAddressForm";

export default function CheckoutShipping(vm: CheckoutVM) {
  const [showForm, setShowForm] = React.useState(false);

  const {
    addressesList = [],
    selectedAddressId,
    handleAddressSelect,
    selectedShippingType,
    handleShippingTypeChange,
    isValidatingZip,
    isZipOutOfArea,
    shippingCost,
    minOrderAmount,
    subtotal,
    // ✅ Novos campos vindos da tabela shipping_settings
    pickupEnabled,
    pickupLabel,
    pickupInstruction
  } = vm;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 ml-2">
        <div className="h-8 w-8 rounded-full bg-slate-950 flex items-center justify-center text-white shadow-lg">
          <MapPin size={14} strokeWidth={3} />
        </div>
        <h2 className="text-xl font-black uppercase italic tracking-tighter text-slate-900">
          Como quer receber?
        </h2>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={() => handleShippingTypeChange("delivery")}
          className={cn(
            "p-6 rounded-[2rem] border-2 transition-all flex flex-col items-center gap-2",
            selectedShippingType === "delivery"
              ? "border-emerald-500 bg-emerald-50/30 ring-4 ring-emerald-500/5"
              : "border-slate-100 bg-white hover:border-slate-200"
          )}
        >
          <Truck className={cn(selectedShippingType === "delivery" ? "text-emerald-600" : "text-slate-300")} />
          <span className="text-[10px] font-black uppercase tracking-widest">Entrega</span>
        </button>

        {/* ✅ Botão de Retirada condicional à tabela */}
        {pickupEnabled && (
          <button
            onClick={() => handleShippingTypeChange("pickup")}
            className={cn(
              "p-6 rounded-[2rem] border-2 transition-all flex flex-col items-center gap-2",
              selectedShippingType === "pickup"
                ? "border-emerald-500 bg-emerald-50/30 ring-4 ring-emerald-500/5"
                : "border-slate-100 bg-white hover:border-slate-200"
            )}
          >
            <Store className={cn(selectedShippingType === "pickup" ? "text-emerald-600" : "text-slate-300")} />
            <span className="text-[10px] font-black uppercase tracking-widest">{pickupLabel}</span>
          </button>
        )}
      </div>

      <Card className="border-none shadow-xl shadow-slate-200/40 rounded-[2.5rem] bg-white overflow-hidden">
        <CardContent className="p-8">
          {selectedShippingType === "pickup" ? (
            <div className="space-y-6 animate-in fade-in slide-in-from-top-2">
              <div className="flex flex-col items-center text-center space-y-3">
                <div className="h-14 w-14 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                  <Store size={28} />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 uppercase italic tracking-tight">{pickupLabel}</h3>
                  <Badge variant="outline" className="mt-2 border-emerald-200 text-emerald-600 bg-emerald-50 rounded-full px-4">
                    Custo: R$ 0,00
                  </Badge>
                </div>
              </div>

              {pickupInstruction && (
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex gap-3 items-start">
                  <Info size={16} className="text-slate-400 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Instruções</p>
                    <p className="text-[11px] text-slate-600 font-medium leading-relaxed">{pickupInstruction}</p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* ... (Mantém a lógica de entrega com endereços igual ao anterior) ... */
            <div className="space-y-6">
               {/* Listagem de endereços e formulário de novo endereço */}
               <div className="flex justify-between items-center">
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Seus Endereços</p>
                {!showForm && (
                  <Button variant="ghost" size="sm" onClick={() => setShowForm(true)} className="text-emerald-600 font-black text-[9px] uppercase hover:bg-emerald-50">
                    <Plus size={14} className="mr-1" /> Novo
                  </Button>
                )}
              </div>

              {showForm ? (
                <CheckoutAddressForm 
                  createAddressMutation={(vm as any).createAddressMutation} 
                  onSuccess={() => setShowForm(false)}
                  onCancel={() => setShowForm(false)}
                />
              ) : (
                <div className="space-y-3">
                  {addressesList.map((addr: any) => (
                    <button
                      key={addr.id}
                      onClick={() => handleAddressSelect(String(addr.id))}
                      className={cn(
                        "w-full p-5 rounded-2xl border-2 text-left transition-all relative",
                        selectedAddressId === String(addr.id) ? "border-emerald-500 bg-emerald-50/20" : "border-slate-50 bg-slate-50/50 hover:border-slate-200"
                      )}
                    >
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <p className="text-[10px] font-black uppercase text-slate-400 tracking-tighter">{addr.label || "Endereço"}</p>
                          <p className="text-xs font-bold text-slate-900">{addr.street}, {addr.number}</p>
                        </div>
                        {selectedAddressId === String(addr.id) && <CheckCircle2 size={18} className="text-emerald-500" />}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}