import React from "react";
import { ArrowRight, Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// --- INTERFACES ---
interface OrderCustomer {
  id: string | number;
  name?: string;
  [key: string]: unknown;
}

interface OrderTotals {
  subtotal: number;
  total: number;
  itemCount: number;
}

interface OrderData {
  customer?: OrderCustomer | null;
  paymentMethod?: string | number;
  couponCode?: string | null;
  couponValue?: number;
  loyaltyValue?: number;
  deliveryFee?: number;
  editingOrderId?: string | null;
  [key: string]: any;
}

interface Props {
  totals: OrderTotals;
  orderData: OrderData;
  paymentDiscountOnly: number;
  onFinalize: () => void;
  isPending: boolean;
}

export const OrderTotalsSidebar = ({ 
  totals, 
  orderData, 
  paymentDiscountOnly, 
  onFinalize, 
  isPending 
}: Props) => {

  const safeNum = (val: unknown): number => {
    const res = Number(val);
    return isNaN(res) ? 0 : res;
  };

  const subtotal = safeNum(totals?.subtotal);
  const totalLiquido = safeNum(totals?.total);
  const itemCount = safeNum(totals?.itemCount);

  const couponValue = safeNum(orderData?.couponValue);
  const loyaltyValue = safeNum(orderData?.loyaltyValue);
  const deliveryFee = safeNum(orderData?.deliveryFee);
  const paymentDiscount = safeNum(paymentDiscountOnly);
  
  const isEditing = !!orderData?.editingOrderId;

  // ✅ VALIDAÇÃO INTELIGENTE:
  // Se estiver editando, somos mais flexíveis com o paymentMethod para evitar travas por strings/IDs
  const canFinalize = isEditing 
    ? (itemCount > 0 && !isPending) // Na edição, se tem item, pode salvar
    : (!!orderData?.customer && !!orderData?.paymentMethod && itemCount > 0 && !isPending);

  return (
    <section className="bg-slate-900 rounded-4xl p-8 text-white shadow-2xl text-left sticky top-8">
      <div className="space-y-3 mb-8">
        <div className="flex justify-between text-[10px] font-bold uppercase opacity-40">
          <span>Subtotal Itens</span>
          <span>R$ {subtotal.toFixed(2)}</span>
        </div>

        {couponValue > 0 && (
          <div className="flex justify-between text-[10px] font-bold uppercase text-emerald-400">
            <span>Cupom ({orderData?.couponCode || '---'})</span>
            <span>- R$ {couponValue.toFixed(2)}</span>
          </div>
        )}

        {loyaltyValue > 0 && (
          <div className="flex justify-between text-[10px] font-bold uppercase text-amber-400">
            <span>Fidelidade</span>
            <span>- R$ {loyaltyValue.toFixed(2)}</span>
          </div>
        )}

        {paymentDiscount > 0 && (
          <div className="flex justify-between text-[10px] font-bold uppercase text-teal-400">
            <span>Desconto Pagamento</span>
            <span>- R$ {paymentDiscount.toFixed(2)}</span>
          </div>
        )}

        <div className="flex justify-between text-[10px] font-bold uppercase opacity-40 border-b border-white/10 pb-3">
          <span>Taxa de Entrega</span>
          <span>R$ {deliveryFee.toFixed(2)}</span>
        </div>

        <div className="flex justify-between items-end pt-4">
          <span className="text-xs font-black uppercase italic tracking-tighter text-white">Total Líquido</span>
          <span className="text-4xl font-black italic tracking-tighter text-emerald-400 leading-none">
            R$ {totalLiquido.toFixed(2)}
          </span>
        </div>
      </div>

      <Button
        onClick={onFinalize}
        // ✅ AQUI ESTAVA O PROBLEMA: Usando a nova regra canFinalize
        disabled={!canFinalize}
        className={cn(
          "w-full h-20 rounded-3xl font-black uppercase tracking-widest text-lg shadow-xl group transition-all",
          isEditing 
            ? "bg-amber-500 hover:bg-amber-400 text-slate-900"
            : "bg-emerald-500 hover:bg-emerald-400 text-slate-900"
        )}
      >
        {isPending ? (
          <Loader2 className="animate-spin" />
        ) : (
          <div className="flex items-center gap-3">
            {isEditing ? (
              <>
                <Save size={24} />
                Salvar Alterações
              </>
            ) : (
              <>
                Finalizar Venda 
                <ArrowRight className="group-hover:translate-x-2 transition-transform" />
              </>
            )}
          </div>
        )}
      </Button>
    </section>
  );
};