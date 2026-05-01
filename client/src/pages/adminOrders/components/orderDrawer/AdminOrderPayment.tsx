import React from "react";
import { Printer, Save, Loader2, Tag, Gift, CreditCard, ShoppingBag, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  formatReceiptMoney,
  getOrderReceiptTotals,
} from "./print/logic/receiptTotals";

interface PaymentOrderData {
  id: string | number;
  subtotal?: number | string;
  total?: number | string;
  paymentMethodName?: string;
  payment_method?: string;
  discountsSnapshot?: string | Record<string, unknown>;
  [key: string]: unknown;
}

interface AdminOrderPaymentProps {
  order: PaymentOrderData;
  isEditing: boolean;
  isUpdating: boolean;
  onSave: () => void;
  onPrint: () => void;
}

export function AdminOrderPayment({
  order,
  isEditing,
  isUpdating,
  onSave,
  onPrint,
}: AdminOrderPaymentProps) {
  const totals = React.useMemo(() => getOrderReceiptTotals(order), [order]);
  const displayPaymentMethod = totals.paymentMethodName || "Pagamento";
  const hasDiscounts = totals.discountLines.length > 0;

  return (
    <section
      className={cn(
        "p-6 rounded-4xl shadow-2xl transition-all text-left mt-4",
        isEditing ? "bg-emerald-600" : "bg-slate-900",
      )}
    >
      <div className="space-y-4 text-white">
        {!isEditing && (
          <div className="space-y-3 border-b border-white/10 pb-4 mb-4">
            <div className="flex justify-between items-center opacity-60">
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest">
                <ShoppingBag size={12} /> Itens
              </div>
              <span className="text-xs font-bold">{formatReceiptMoney(totals.subtotal)}</span>
            </div>

            <div className="flex justify-between items-center opacity-60">
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest">
                <Truck size={12} /> Entrega
              </div>
              <span className="text-xs font-bold">
                {totals.shippingCost > 0 ? formatReceiptMoney(totals.shippingCost) : "GRATIS"}
              </span>
            </div>

            {hasDiscounts && (
              <div className="pt-2 space-y-2 border-t border-white/5">
                {totals.autoDiscount > 0 && (
                  <div className="flex justify-between items-center text-[10px] font-black text-blue-300 uppercase italic">
                    <span>
                      Combo / Quantidade {totals.autoDiscountName && `(${totals.autoDiscountName})`}
                    </span>
                    <span>- {formatReceiptMoney(totals.autoDiscount)}</span>
                  </div>
                )}

                {totals.couponDiscount > 0 && (
                  <div className="flex justify-between items-center text-[10px] font-black text-rose-300 uppercase italic">
                    <span className="flex items-center gap-1">
                      <Tag size={10} /> Cupom ({totals.couponCode || totals.couponDescription || "Aplicado"})
                    </span>
                    <span>- {formatReceiptMoney(totals.couponDiscount)}</span>
                  </div>
                )}

                {totals.loyaltyDiscount > 0 && (
                  <div className="flex justify-between items-center text-[10px] font-black text-amber-300 uppercase italic">
                    <span className="flex items-center gap-1">
                      <Gift size={10} /> Saldo Fidelidade
                    </span>
                    <span>- {formatReceiptMoney(totals.loyaltyDiscount)}</span>
                  </div>
                )}

                {totals.paymentDiscount > 0 && (
                  <div className="flex justify-between items-center text-[10px] font-black text-teal-300 uppercase italic">
                    <span className="flex items-center gap-1">
                      <CreditCard size={10} /> Desc. {displayPaymentMethod}
                    </span>
                    <span>- {formatReceiptMoney(totals.paymentDiscount)}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <div className="flex justify-between items-end">
          <div className="space-y-1">
            <span className="text-[10px] font-black opacity-40 uppercase italic block tracking-tighter">
              Total Liquido do Pedido
            </span>
            <span className="text-4xl font-black italic leading-none tracking-tighter text-emerald-400">
              {formatReceiptMoney(totals.total)}
            </span>
          </div>

          {!isEditing && (
            <Button
              onClick={onPrint}
              size="sm"
              className="bg-white/10 hover:bg-white/20 text-white rounded-xl font-black uppercase text-[10px] h-10 px-4"
            >
              <Printer size={14} className="mr-2" /> Imprimir
            </Button>
          )}
        </div>

        {isEditing && (
          <Button
            onClick={onSave}
            disabled={isUpdating}
            className="w-full mt-4 bg-white text-emerald-600 font-black h-16 rounded-[1.5rem] uppercase text-xs shadow-lg hover:bg-slate-50 transition-all active:scale-95"
          >
            {isUpdating ? <Loader2 className="animate-spin mr-2" /> : <Save className="mr-2" size={18} />}
            Atualizar Financeiro
          </Button>
        )}
      </div>
    </section>
  );
}
