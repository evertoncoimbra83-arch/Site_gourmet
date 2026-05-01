import React from "react";
import { ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

// --- INTERFACES DE TIPO ESTREITO ---
interface OrderTotals {
  subtotal: number;
  total: number;
  itemCount: number;
}

interface OrderSummaryData {
  couponValue: number;
  couponCode?: string | null;
  loyaltyValue: number;
  deliveryFee: number;
  customer?: { id: string | number } | null;
  paymentMethod?: string | number | null;
}

interface Props {
  totals: OrderTotals;
  orderData: OrderSummaryData;
  paymentDiscountOnly: number;
  isPending: boolean;
  onFinalize: () => void;
}

export const OrderSummarySidebar = ({ 
  totals, 
  orderData, 
  paymentDiscountOnly, 
  isPending, 
  onFinalize 
}: Props) => {
  return (
    <section className="bg-slate-900 rounded-4xl p-8 text-white shadow-2xl sticky top-8 text-left">
      <div className="space-y-3 mb-8">
        <div className="flex justify-between text-[10px] font-bold uppercase opacity-40">
          <span>Subtotal Itens</span>
          <span>R$ {totals.subtotal.toFixed(2)}</span>
        </div>

        {orderData.couponValue > 0 && (
          <div className="flex justify-between text-[10px] font-bold uppercase text-emerald-400">
            <span>Cupom ({orderData.couponCode})</span>
            <span>- R$ {Number(orderData.couponValue).toFixed(2)}</span>
          </div>
        )}

        {orderData.loyaltyValue > 0 && (
          <div className="flex justify-between text-[10px] font-bold uppercase text-amber-400">
            <span>Fidelidade</span>
            <span>- R$ {Number(orderData.loyaltyValue).toFixed(2)}</span>
          </div>
        )}

        {paymentDiscountOnly > 0 && (
          <div className="flex justify-between text-[10px] font-bold uppercase text-teal-400">
            <span>Desconto Pagamento</span>
            <span>- R$ {paymentDiscountOnly.toFixed(2)}</span>
          </div>
        )}

        <div className="flex justify-between text-[10px] font-bold uppercase opacity-40 border-b border-white/10 pb-3">
          <span>Taxa de Entrega</span>
          <span>R$ {orderData.deliveryFee.toFixed(2)}</span>
        </div>

        <div className="flex justify-between items-end pt-4">
          <span className="text-xs font-black uppercase italic tracking-tighter text-white">Total Líquido</span>
          <span className="text-4xl font-black italic tracking-tighter text-emerald-400">
            R$ {totals.total.toFixed(2)}
          </span>
        </div>
      </div>

      <Button 
        onClick={onFinalize}
        disabled={!orderData.customer || !orderData.paymentMethod || totals.itemCount === 0 || isPending}
        className="w-full h-20 rounded-3xl bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-black uppercase tracking-widest text-lg shadow-xl group transition-all"
      >
        {isPending ? (
          <Loader2 className="animate-spin" />
        ) : (
          <div className="flex items-center gap-3">
            Finalizar Venda
            <ArrowRight className="group-hover:translate-x-2 transition-transform" />
          </div>
        )}
      </Button>
    </section>
  );
};