import React from "react";
import {
  CreditCard,
  Gift,
  Loader2,
  PencilRuler,
  Printer,
  Save,
  ShoppingBag,
  Tag,
  Truck,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  formatReceiptMoney,
  getOrderReceiptTotals,
  safeMoney,
} from "./print/logic/receiptTotals";

interface PaymentMethodOption {
  id?: string | number;
  name?: string | null;
  brandName?: string | null;
}

export interface PaymentOrderData {
  id: string;
  subtotal?: number | string;
  total?: number | string;
  shippingCost?: number | string;
  discountAmount?: number | string;
  paymentMethodName?: string;
  paymentMethod?: string;
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
  onOrderChange?: (patch: Partial<PaymentOrderData>) => void;
  paymentMethods?: PaymentMethodOption[];
}

export function AdminOrderPayment({
  order,
  isEditing,
  isUpdating,
  onSave,
  onPrint,
  onOrderChange,
  paymentMethods = [],
}: AdminOrderPaymentProps) {
  const totals = React.useMemo(() => getOrderReceiptTotals(order), [order]);
  const displayPaymentMethod =
    totals.paymentMethodName ||
    (typeof order.paymentMethodName === "string" ? order.paymentMethodName : "") ||
    "Não informado";
  const hasDiscounts = totals.discountLines.length > 0;
  const manualDiscount = safeMoney(order.discountAmount) ?? 0;

  return (
    <section
      className={cn(
        "mt-4 rounded-[2rem] border p-5 text-left shadow-sm transition-all",
        isEditing
          ? "border-emerald-200 bg-emerald-50/60"
          : "border-slate-200 bg-white",
      )}
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <span className="block text-[10px] font-black uppercase tracking-widest text-slate-500">
              Fechamento financeiro
            </span>
            <p className="mt-1 text-sm font-black uppercase italic text-slate-900">
              Total calculado do pedido
            </p>
          </div>

          {!isEditing && (
            <Button
              onClick={onPrint}
              size="sm"
              variant="outline"
              className="h-10 rounded-xl border-slate-200 bg-slate-50 text-[10px] font-black uppercase text-slate-900 hover:bg-slate-100"
            >
              <Printer size={14} className="mr-2 text-slate-700" />
              Imprimir
            </Button>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700">
              <span className="flex items-center gap-2 uppercase">
                <ShoppingBag size={12} className="text-slate-600" />
                Itens
              </span>
              <span className="text-slate-900">{formatReceiptMoney(totals.subtotal)}</span>
            </div>

            <div className="flex items-center justify-between text-xs font-bold text-slate-700">
              <span className="flex items-center gap-2 uppercase">
                <Truck size={12} className="text-slate-600" />
                Frete
              </span>
              {isEditing ? (
                <Input
                  type="number"
                  value={Number(order.shippingCost || 0)}
                  onChange={(event) =>
                    onOrderChange?.({ shippingCost: Number(event.target.value || 0) })
                  }
                  className="h-9 w-28 rounded-xl border-slate-200 bg-white text-right text-xs font-black text-slate-900"
                />
              ) : (
                <span className="text-slate-900">
                  {totals.shippingCost > 0
                    ? formatReceiptMoney(totals.shippingCost)
                    : "GRÁTIS"}
                </span>
              )}
            </div>

            <div className="flex items-center justify-between text-xs font-bold text-slate-700">
              <span className="flex items-center gap-2 uppercase">
                <PencilRuler size={12} className="text-slate-600" />
                Desconto administrativo
              </span>
              {isEditing ? (
                <Input
                  type="number"
                  value={Number(order.discountAmount || 0)}
                  onChange={(event) =>
                    onOrderChange?.({ discountAmount: Number(event.target.value || 0) })
                  }
                  className="h-9 w-28 rounded-xl border-slate-200 bg-white text-right text-xs font-black text-slate-900"
                />
              ) : (
                <span className="text-red-600">
                  - {formatReceiptMoney(manualDiscount)}
                </span>
              )}
            </div>

            {paymentMethods.length > 0 && (
              <div className="flex items-center justify-between gap-3 text-xs font-bold text-slate-700">
                <span className="flex items-center gap-2 uppercase">
                  <CreditCard size={12} className="text-slate-600" />
                  Método
                </span>
                {isEditing ? (
                  <Select
                    value={
                      String(
                        order.paymentMethodName ||
                          order.paymentMethod ||
                          order.payment_method ||
                          "",
                      ) || undefined
                    }
                    onValueChange={(value) =>
                      onOrderChange?.({
                        paymentMethodName: value,
                        paymentMethod: value,
                        payment_method: value,
                      })
                    }
                  >
                    <SelectTrigger className="h-9 w-48 rounded-xl border-slate-200 bg-white text-xs font-black text-slate-900">
                      <SelectValue placeholder="Selecione o método" />
                    </SelectTrigger>
                    <SelectContent className="border-slate-200 bg-white text-slate-900">
                      {paymentMethods.map((method) => {
                        const value = String(method.name || method.brandName || method.id || "");
                        return (
                          <SelectItem
                            key={String(method.id || value)}
                            value={value}
                            className="text-xs font-bold text-slate-900 focus:bg-slate-100 focus:text-slate-900"
                          >
                            {method.name || method.brandName || "Método"}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                ) : (
                  <span className="text-slate-900">{displayPaymentMethod}</span>
                )}
              </div>
            )}
          </div>

          {hasDiscounts && !isEditing && (
            <div className="mt-4 space-y-2 border-t border-slate-200 pt-4">
              {totals.autoDiscount > 0 && (
                <div className="flex items-center justify-between text-[10px] font-black uppercase italic text-blue-700">
                  <span>{totals.autoDiscountName || "Desconto automático"}</span>
                  <span>- {formatReceiptMoney(totals.autoDiscount)}</span>
                </div>
              )}

              {totals.couponDiscount > 0 && (
                <div className="flex items-center justify-between text-[10px] font-black uppercase italic text-rose-700">
                  <span className="flex items-center gap-1">
                    <Tag size={10} className="text-rose-600" />
                    {totals.couponCode || totals.couponDescription || "Cupom"}
                  </span>
                  <span>- {formatReceiptMoney(totals.couponDiscount)}</span>
                </div>
              )}

              {totals.loyaltyDiscount > 0 && (
                <div className="flex items-center justify-between text-[10px] font-black uppercase italic text-amber-700">
                  <span className="flex items-center gap-1">
                    <Gift size={10} className="text-amber-600" />
                    Fidelidade
                  </span>
                  <span>- {formatReceiptMoney(totals.loyaltyDiscount)}</span>
                </div>
              )}

              {totals.paymentDiscount > 0 && (
                <div className="flex items-center justify-between text-[10px] font-black uppercase italic text-teal-700">
                  <span className="flex items-center gap-1">
                    <CreditCard size={10} className="text-teal-600" />
                    Desconto {displayPaymentMethod}
                  </span>
                  <span>- {formatReceiptMoney(totals.paymentDiscount)}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {manualDiscount > 0 && (
          <div className="flex items-start gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 p-3">
            <Tag size={14} className="mt-0.5 shrink-0 text-emerald-700" />
            <div>
              <p className="text-[10px] font-black uppercase tracking-wide text-emerald-800">
                Nota do Desconto Administrativo
              </p>
              <p className="mt-1 text-[11px] font-bold leading-relaxed text-emerald-900">
                Este desconto administrativo foi aplicado de forma manual e constará
                na via descritiva do cliente.
              </p>
            </div>
          </div>
        )}

        <div className="flex items-end justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4">
          <div>
            <span className="block text-[10px] font-black uppercase tracking-widest text-slate-500">
              Total calculado
            </span>
            <span className="mt-1 block text-3xl font-black italic leading-none tracking-tighter text-slate-900">
              {formatReceiptMoney(totals.total)}
            </span>
          </div>

          {isEditing && (
            <Button
              onClick={onSave}
              disabled={isUpdating}
              className="h-12 rounded-2xl bg-emerald-600 px-5 text-[10px] font-black uppercase text-white hover:bg-emerald-500"
            >
              {isUpdating ? (
                <Loader2 className="mr-2 animate-spin" size={16} />
              ) : (
                <Save className="mr-2" size={16} />
              )}
              Salvar financeiro
            </Button>
          )}
        </div>
      </div>
    </section>
  );
}
