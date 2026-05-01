import React from "react";
import { ArrowDownCircle, Banknote, Gift, Star, Tag } from "lucide-react";
import { formatCurrency, getOrderDiscounts } from "../../utils/orderHelpers";
import { Order } from "../../types/orderTypes";

export function OrdersTabLoyalty({ order }: { order: Order }) {
  const {
    subtotal,
    shippingCost,
    couponDiscount,
    autoDiscount,
    loyaltyDiscount,
    paymentDiscount,
    totalDiscount,
    total,
    pointsEarned,
    pointsUsed,
    couponCode,
    autoDiscountName,
    paymentMethodName,
  } = getOrderDiscounts(order);

  const hasFinancialDetails = totalDiscount > 0 || shippingCost > 0;
  const hasLoyalty = pointsEarned > 0 || pointsUsed > 0;

  if (!hasFinancialDetails && !hasLoyalty) return null;

  return (
    <div className="space-y-6 mt-4 pt-4 border-t border-slate-50">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-slate-50 rounded-[2rem] p-6 space-y-3 border border-slate-100 shadow-inner text-left">
          <div className="text-[10px] font-black uppercase text-slate-400 mb-4 tracking-widest italic flex items-center gap-2">
            Extrato Financeiro
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs font-bold text-slate-600">
              <span>Subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>

            <div className="flex justify-between text-xs font-bold text-slate-600">
              <span>Frete</span>
              <span>{shippingCost > 0 ? formatCurrency(shippingCost) : "Grátis"}</span>
            </div>

            {totalDiscount > 0 && (
              <div className="pt-2 mt-2 border-t border-slate-200 border-dashed space-y-2">
                {couponDiscount > 0 && (
                  <div className="flex justify-between text-[10px] font-black text-emerald-600 uppercase italic">
                    <div className="flex items-center gap-1.5">
                      <Gift size={12} />
                      <span>Cupom {couponCode ? `(${couponCode})` : ""}</span>
                    </div>
                    <span>- {formatCurrency(couponDiscount)}</span>
                  </div>
                )}

                {autoDiscount > 0 && (
                  <div className="flex justify-between text-[10px] font-black text-emerald-600 uppercase italic">
                    <div className="flex items-center gap-1.5">
                      <Tag size={12} />
                      <span>{autoDiscountName || "Desconto Automático"}</span>
                    </div>
                    <span>- {formatCurrency(autoDiscount)}</span>
                  </div>
                )}

                {paymentDiscount > 0 && (
                  <div className="flex justify-between text-[10px] font-black text-emerald-600 uppercase italic">
                    <div className="flex items-center gap-1.5">
                      <Banknote size={12} />
                      <span>Desconto {paymentMethodName || "Pagamento"}</span>
                    </div>
                    <span>- {formatCurrency(paymentDiscount)}</span>
                  </div>
                )}

                {loyaltyDiscount > 0 && (
                  <div className="flex justify-between text-[10px] font-black text-orange-600 uppercase italic">
                    <div className="flex items-center gap-1.5">
                      <ArrowDownCircle size={12} />
                      <span>Resgate de Pontos</span>
                    </div>
                    <span>- {formatCurrency(loyaltyDiscount)}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex justify-between text-lg font-black text-slate-900 uppercase tracking-tighter pt-3 mt-1 border-t border-slate-200">
            <span>Total Pago</span>
            <span>{formatCurrency(total)}</span>
          </div>
        </div>

        <div className="bg-emerald-50/30 rounded-[2rem] p-6 border border-emerald-100 flex flex-col justify-center">
          <div className="flex items-center gap-2 mb-4 text-left">
            <div className="h-6 w-6 rounded-lg bg-emerald-600 flex items-center justify-center text-white">
              <Star size={12} fill="currentColor" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700 italic">
              Programa de Fidelidade
            </span>
          </div>

          <div className="space-y-2 text-left">
            {pointsEarned > 0 && (
              <div className="flex justify-between items-center p-3 bg-white rounded-2xl border border-emerald-100 shadow-sm transition-all hover:shadow-md">
                <span className="text-[10px] font-bold text-slate-500 uppercase">
                  Ganhos no pedido
                </span>
                <span className="text-sm font-black text-emerald-600">
                  +{pointsEarned} pts
                </span>
              </div>
            )}

            {pointsUsed > 0 && (
              <div className="flex justify-between items-center p-3 bg-white rounded-2xl border border-orange-100 shadow-sm transition-all hover:shadow-md">
                <span className="text-[10px] font-bold text-slate-500 uppercase">
                  Resgatados
                </span>
                <span className="text-sm font-black text-orange-500">
                  -{pointsUsed} pts
                </span>
              </div>
            )}

            {!pointsEarned && !pointsUsed && (
              <div className="py-6 text-center bg-white/50 rounded-2xl border border-emerald-50 border-dashed">
                <p className="text-[10px] text-slate-400 italic font-medium uppercase tracking-wider">
                  Nenhuma movimentação neste pedido
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
