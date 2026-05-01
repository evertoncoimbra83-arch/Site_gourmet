import React, { useState } from "react";
import { Ticket, Star, X, Check, Loader2, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

// Tipagem correta
interface PaymentMethod {
  id: string | number;
  name: string;
  icon?: string | null;
  brandLogoUrl?: string | null;
  discountPercentage?: string | null;
}

interface OrderData {
  paymentMethod?: string | number;
  paymentStatus?: string;
  couponCode?: string | null;
  loyaltyValue: number;
  loyaltyPointsUsed: number;
  customer?: {
    id: string;
    availablePoints?: number;
  } | null;
}

interface Props {
  orderData: OrderData;
  paymentMethods: PaymentMethod[];
  maxDiscountPossible: number;
  calculatePointsForValue: (val: number) => number;
  onUpdate: (data: Partial<OrderData>) => void;
  onApplyCoupon: (code: string) => void;
  onApplyLoyalty: (points: string) => void;
  onRemoveLoyalty: () => void;
  isCouponPending: boolean;
  isLoyaltyPending: boolean;
  getImageUrl?: (url: string | null | undefined) => string; // Opcional
}

export const OrderPaymentSection = ({ 
  orderData, 
  paymentMethods, 
  maxDiscountPossible,
  calculatePointsForValue,
  onUpdate, 
  onApplyCoupon, 
  onApplyLoyalty, 
  onRemoveLoyalty, 
  isCouponPending, 
  isLoyaltyPending,
  getImageUrl
}: Props) => {
  const [loyaltyInput, setLoyaltyInput] = useState("");

  const handleApplyLoyaltyManual = () => {
    const valueCash = parseFloat(loyaltyInput.replace(',', '.'));
    if (isNaN(valueCash) || valueCash <= 0) return;

    const pointsToUse = calculatePointsForValue(valueCash);
    onApplyLoyalty(String(pointsToUse));
    setLoyaltyInput("");
  };

  const getStatusStyle = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'paid':
      case 'pago': return "bg-emerald-500 text-white";
      case 'pending':
      case 'pendente': return "bg-amber-500 text-white";
      case 'refunded':
      case 'estornado': return "bg-slate-500 text-white";
      default: return "bg-slate-100 text-slate-500";
    }
  };

  return (
    <div className="space-y-6">
      {/* SEÇÃO DE PAGAMENTO */}
      <section className="bg-white rounded-4xl border border-slate-100 shadow-sm overflow-hidden text-left">
        <div className="bg-slate-50 px-8 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CreditCard size={14} className="text-slate-400" />
            <h3 className="text-[11px] font-black uppercase text-slate-500 tracking-widest">Pagamento</h3>
          </div>
          
          {orderData.paymentStatus && (
            <div className={cn("px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest", getStatusStyle(orderData.paymentStatus))}>
              {orderData.paymentStatus}
            </div>
          )}
        </div>

        <div className="p-4 flex flex-col gap-2">
          {paymentMethods.map((m) => {
            // ✅ Double Check: Compara tanto por ID quanto por Nome (Essencial para edição/carregamento)
            const rawPayment = String(orderData.paymentMethod || "").toLowerCase().trim();
            const isSelected = 
              rawPayment === String(m.id).toLowerCase() || 
              rawPayment === String(m.name).toLowerCase().trim();

            return (
              <button
                key={m.id}
                type="button"
                onClick={() => onUpdate({ paymentMethod: String(m.id) })}
                className={cn(
                  "flex items-center p-3 rounded-2xl border-2 transition-all w-full text-left group",
                  isSelected ? "border-emerald-500 bg-emerald-50/50 shadow-sm" : "border-slate-50 bg-white hover:border-slate-200"
                )}
              >
                <div className={cn("h-10 w-10 shrink-0 rounded-xl flex items-center justify-center overflow-hidden", isSelected ? "bg-emerald-500 text-white" : "bg-slate-50 text-slate-400")}>
                  {m.brandLogoUrl && getImageUrl ? (
                    <img src={getImageUrl(m.brandLogoUrl)} className="h-7 w-7 object-contain" alt={m.name} />
                  ) : (
                    <Check size={20} className={cn(!isSelected && "opacity-0")} />
                  )}
                </div>
                <div className="ml-3 flex-1">
                  <span className={cn("text-[10px] font-black uppercase block", isSelected ? "text-slate-900" : "text-slate-500")}>{m.name}</span>
                </div>
                {isSelected && <Check size={16} className="text-emerald-500" strokeWidth={4} />}
              </button>
            );
          })}
        </div>
      </section>

      {/* SEÇÃO DE DESCONTOS */}
      <section className="bg-white rounded-4xl border border-slate-100 shadow-sm p-6 space-y-4 text-left">
        <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
          <Ticket size={14} /> Descontos PDV
        </h3>
        
        <div className="flex gap-2 relative">
          <Input 
            id="couponInputPDV" 
            placeholder={orderData.couponCode ? `CUPOM: ${orderData.couponCode}` : "CUPOM"}
            className={cn("rounded-xl uppercase font-black text-xs h-12", orderData.couponCode && "bg-emerald-50 border-emerald-200")} 
          />
          {orderData.couponCode ? (
            <button 
              type="button"
              onClick={() => onUpdate({ couponCode: null })} 
              className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500 hover:text-red-700 transition-colors"
            >
              <X size={16} strokeWidth={3} />
            </button>
          ) : (
            <Button 
              onClick={() => {
                const el = document.getElementById("couponInputPDV") as HTMLInputElement;
                if (el?.value) onApplyCoupon(el.value);
              }} 
              disabled={isCouponPending} 
              variant="outline" 
              className="h-12 rounded-xl border-dashed"
            >
              {isCouponPending ? <Loader2 className="animate-spin" size={14} /> : "Aplicar"}
            </Button>
          )}
        </div>

        {orderData.customer?.id && (
          <div className="pt-4 border-t border-slate-50 space-y-2">
            <div className="flex gap-2 relative">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400">R$</span>
                <Input 
                  placeholder="VALOR EM PONTOS"
                  value={loyaltyInput}
                  onChange={(e) => setLoyaltyInput(e.target.value)}
                  disabled={orderData.loyaltyValue > 0}
                  className="rounded-xl pl-8 h-12 font-black text-xs"
                />
              </div>
              
              {orderData.loyaltyValue > 0 ? (
                <Button 
                  onClick={onRemoveLoyalty}
                  className="h-12 bg-red-50 text-red-500 hover:bg-red-500 hover:text-white rounded-xl px-4 transition-all"
                >
                  <X size={16} strokeWidth={3} />
                </Button>
              ) : (
                <Button 
                  onClick={handleApplyLoyaltyManual}
                  disabled={isLoyaltyPending || !loyaltyInput}
                  className="h-12 bg-amber-500 hover:bg-amber-600 text-white rounded-xl px-4 font-black text-[10px] uppercase gap-2"
                >
                  {isLoyaltyPending ? <Loader2 className="animate-spin" size={14} /> : <><Star size={14} fill="currentColor" /> Resgatar</>}
                </Button>
              )}
            </div>
            <p className="text-[9px] font-black uppercase text-slate-400 px-1 flex justify-between">
              <span>Saldo: <span className="text-amber-600">{orderData.customer.availablePoints || 0} pts</span></span>
              <span>Máximo: <span className="text-slate-600">R$ {maxDiscountPossible.toFixed(2)}</span></span>
            </p>
          </div>
        )}
      </section>
    </div>
  );
};