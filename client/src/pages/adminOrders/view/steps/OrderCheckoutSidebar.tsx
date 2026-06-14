import { useAdminOrderWizard } from "../../logic/useAdminOrderWizard";
import { trpc } from "@/_core/trpc";
import { useNavigate, useSearchParams } from "react-router-dom";
import React, { ComponentProps, useState } from "react";

import StepCustomer from "./StepCustomer";
import StepDelivery from "./StepDelivery";
import StepItems from "./StepItems";

import {
  Loader2, ShoppingCart, Zap, Ticket, ArrowRight,
  Star, CreditCard, Banknote, Landmark,
  CircleDollarSign, QrCode, Check, X, Calendar, Trash2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { appToast as toast } from "@/lib/app-toast";
import { safeNumber } from "@/lib/safe-parse";
import { normalizeImageUrl } from "@shared/utils/assets";
import { cn } from "@/lib/utils";

// --- HELPERS DE TIPO ---
type Id = string | number;

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

function asString(v: unknown, fallback = ""): string {
  return typeof v === "string" ? v : fallback;
}

// --- INTERFACES LOCAIS ---
interface TRPCMutation<TInput = unknown, TOutput = unknown> {
  useMutation: (opts?: {
    onSuccess?: (data: TOutput) => void;
    onError?: (err: { message: string }) => void;
  }) => {
    mutate: (vars: TInput) => void;
    isPending: boolean;
  };
}

interface TRPCQuery<TInput = unknown, TOutput = unknown> {
  useQuery: (
    input: TInput,
    opts?: { enabled?: boolean; staleTime?: number }
  ) => {
    data: TOutput | undefined;
    isLoading: boolean;
  };
}

// Interface para o retorno do cupom (Evita erro de 'any')
interface CouponResponse {
  success: boolean;
  coupon: {
    code: string;
    type: "fixed" | "percentage";
    value: number;
  };
}

interface AdminRouter {
  getDraft: TRPCQuery<{ adminId: string }>;
  list: TRPCQuery<unknown>;
  applyLoyalty: TRPCMutation<{ draftId: string; pointsInput: string }>;
  removeLoyalty: TRPCMutation<{ draftId: string }>;
  applyCoupon: TRPCMutation<{ draftId: string; code: string }, CouponResponse>;
  placeOrder: TRPCMutation<{ draftId: string }, { orderId: string }>;
  cancelSession: TRPCMutation<{ draftId: string }>;
  updateSession: TRPCMutation<unknown>;
  listPackages: TRPCQuery<unknown>;
  addItem: TRPCMutation<unknown>;
  removeItem: TRPCMutation<unknown>;
}

interface AdminUtils {
  ordersAdmin: {
    getDraft: { invalidate: () => void };
    list: { invalidate: () => void };
  };
  usersAdmin: {
    getDetails: { fetch: (input: { id: Id }) => Promise<CustomerFull | null> };
  };
}

interface CustomerFull {
  id: Id;
  name?: string;
  availablePoints?: number;
  address?: unknown;
  [key: string]: unknown;
}

interface OrderDataShape {
  customer: CustomerFull | null;
  paymentMethod: string;
  discountValue: number;
  couponCode: string | null;
  couponValue: number;
  loyaltyValue: number;
  loyaltyPointsUsed: number;
  deliveryFee: number;
  metadataJson: string;
  deliveryMode?: string;
  [key: string]: unknown;
}

interface WizardReturn {
  orderData: OrderDataShape;
  updateData: (data: Partial<OrderDataShape>) => void;
  totals: {
    subtotal: number;
    total: number;
    itemCount: number;
  };
  isLoading: boolean;
}

interface PaymentMethod {
  id: string;
  name: string;
  icon?: string | null;
  brandLogoUrl?: string | null;
  brand_logo_url?: string | null;
  discountPercentage?: string | null;
  discount_percentage?: string | null;
}

const IconMap: Record<string, React.ElementType> = {
  "credit-card": CreditCard,
  pix: QrCode,
  cash: Banknote,
  bank: Landmark,
  meal: Ticket,
  default: CircleDollarSign,
};

export default function AdminOrderCreate() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const draftId = searchParams.get("draftId");
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);

  const utils = trpc.useUtils();

  const { orderData, updateData, totals, isLoading: loadingWizard } = useAdminOrderWizard(draftId) as unknown as WizardReturn;

  const ordersApi = (trpc.admin as unknown as { ordersAdmin: AdminRouter }).ordersAdmin;
  const ordersUtils = (utils.admin as unknown as AdminUtils).ordersAdmin;
  const usersUtils = (utils.admin as unknown as AdminUtils).usersAdmin;

  const { data: paymentMethods = [] } = trpc.public.paymentMethods.list.useQuery(
    undefined, { staleTime: 1000 * 60 * 5 }
  ) as { data: PaymentMethod[] };

  // --- MUTATIONS ---

  const applyLoyaltyMutation = ordersApi.applyLoyalty.useMutation({
    onSuccess: () => {
      ordersUtils.getDraft.invalidate();
      toast.success("Pontos utilizados.");
    },
    onError: (err) => {
      toast.error("Nao foi possivel aplicar fidelidade.", { description: err.message });
    }
  });

  const removeLoyaltyMutation = ordersApi.removeLoyalty.useMutation({
    onSuccess: () => {
      ordersUtils.getDraft.invalidate();
      toast.info("Fidelidade removida.");
    }
  });

  // ✅ REVISADO: Agora calcula o valor do desconto e atualiza o total
  const applyCouponMutation = ordersApi.applyCoupon.useMutation({
    onSuccess: (data) => {
      const subtotal = totals.subtotal;
      let calculatedDiscount = 0;

      if (data.coupon.type === 'percentage') {
        calculatedDiscount = (subtotal * data.coupon.value) / 100;
      } else {
        calculatedDiscount = data.coupon.value;
      }

      updateData({
        couponCode: data.coupon.code,
        couponValue: calculatedDiscount,
        discountSource: 'coupon'
      });

      ordersUtils.getDraft.invalidate();
      toast.success("Cupom aplicado.", { description: `R$ ${calculatedDiscount.toFixed(2)} de desconto concedido.` });
    },
    onError: (err) => toast.error("Nao foi possivel aplicar o cupom.", { description: err.message })
  });

  const placeOrderMutation = ordersApi.placeOrder.useMutation({
    onSuccess: (res) => {
      toast.success("Venda finalizada.", { description: "Pedido registrado no sistema." });
      ordersUtils.list.invalidate();
      navigate(`/admin/orders/success?orderId=${res.orderId}`);
    },
    onError: (err) => toast.error("Nao foi possivel finalizar a venda.", { description: err.message })
  });

  const cancelSessionMutation = ordersApi.cancelSession.useMutation({
    onSuccess: () => {
      toast.info("Sessao cancelada.", { description: "Venda removida com sucesso." });
      navigate("/admin/orders");
    },
    onError: (err) => toast.error("Nao foi possivel cancelar a venda.", { description: err.message })
  });

  // --- HANDLERS ---

  const handleApplyLoyalty = () => {
    const customerId = orderData.customer?.id;
    if (!draftId) return;
    if (!customerId) {
        toast.warning("Selecione um cliente primeiro.");
        return;
    }

    applyLoyaltyMutation.mutate({
      draftId: String(draftId),
      pointsInput: String(customerId)
    });
  };

  const handleFinalize = () => {
    if (!orderData.customer) {
        toast.warning("Selecione um cliente.");
        return;
    }
    if (!orderData.paymentMethod) {
        toast.warning("Selecione o pagamento.");
        return;
    }
    if (totals.itemCount === 0) {
        toast.warning("Carrinho vazio.", { description: "Adicione itens." });
        return;
    }
    placeOrderMutation.mutate({ draftId: String(draftId) });
  };

  const handleCancel = () => {
    setIsCancelDialogOpen(true);
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let meta: Record<string, unknown> = {};
    try {
      const parsed = JSON.parse(asString(orderData.metadataJson, "{}"));
      if (isRecord(parsed)) meta = parsed;
    } catch { /* ignore */ }
    updateData({ metadataJson: JSON.stringify({ ...meta, orderDate: e.target.value }) });
  };

  const handleCustomerSelect = async (selection: unknown) => {
    if (!selection) {
      await updateData({ customer: null, address: null });
      return;
    }

    const basicSelection = isRecord(selection) ? selection : {};
    const basicCustomer = (isRecord(basicSelection.customer) ? basicSelection.customer : basicSelection) as unknown as CustomerFull;

    if (!basicCustomer || !basicCustomer.id) {
        await updateData({ customer: null, address: null });
        return;
    }

    try {
      const fullCustomer = await usersUtils.getDetails.fetch({ id: basicCustomer.id });
      await updateData({
        customer: fullCustomer ?? basicCustomer,
        address: fullCustomer?.address ?? basicSelection.address ?? null
      });
    } catch (err) {
      console.error(err);
    }
  };

  if (!draftId || draftId === "undefined" || draftId === "null" || loadingWizard) {
    return (
      <div className="h-screen flex flex-col items-center justify-center gap-4 bg-slate-50">
        <Loader2 className="animate-spin text-emerald-600" size={40} />
        <p className="font-black uppercase text-[10px] tracking-widest text-slate-400">Processando Sessão...</p>
      </div>
    );
  }

  const paymentDiscountOnly = Math.max(0, orderData.discountValue - (orderData.couponCode ? orderData.couponValue : 0) - (orderData.loyaltyValue || 0));

  let currentMeta: Record<string, unknown> = {};
  try {
    const parsed = JSON.parse(asString(orderData.metadataJson, "{}"));
    if (isRecord(parsed)) currentMeta = parsed;
  } catch { /* ignore */ }

  const orderDate = asString(currentMeta.orderDate) || new Date().toISOString().split('T')[0];

  return (
    <div className="max-w-[1600px] mx-auto p-4 lg:p-8 animate-in fade-in duration-500 font-sans">
      <ConfirmDialog
        open={isCancelDialogOpen}
        title="Cancelar venda manual?"
        description="O rascunho atual sera descartado e nao podera ser recuperado."
        confirmLabel="Cancelar venda"
        cancelLabel="Continuar editando"
        destructive
        loading={cancelSessionMutation.isPending}
        onCancel={() => setIsCancelDialogOpen(false)}
        onConfirm={() => cancelSessionMutation.mutate({ draftId: String(draftId) })}
      />


      <header className="mb-8 flex flex-col md:flex-row justify-between items-center bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm gap-4">
        <div className="flex items-center gap-4">
          <div className="bg-emerald-500 p-3 rounded-2xl text-white shadow-lg shadow-emerald-200">
            <Zap size={24} fill="currentColor" />
          </div>
          <div>
            <h1 className="text-2xl font-black uppercase italic tracking-tighter text-slate-900 leading-none">
              Venda <span className="text-emerald-500">Manual</span>
            </h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Venda Direta Admin</p>
          </div>
        </div>

        <div className="flex items-center gap-6">
           <div className="flex flex-col items-end gap-1">
              <label className="text-[9px] font-black uppercase text-slate-400 flex items-center gap-1">
                <Calendar size={10} /> Data da Venda
              </label>
              <input
                type="date"
                value={orderDate}
                onChange={handleDateChange}
                className="bg-slate-50 border-none rounded-xl px-3 py-2 text-xs font-black uppercase text-slate-600 outline-none cursor-pointer focus:ring-2 ring-emerald-500 transition-all"
              />
           </div>
           <div className="h-12 w-px bg-slate-100 hidden md:block" />
           <div className="text-right font-black">
              <p className="text-[9px] uppercase text-emerald-500 mb-1 italic">Total Líquido</p>
              <p className="text-slate-900 italic text-3xl tracking-tighter leading-none">
                R$ {Number(totals?.total ?? 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </p>
           </div>
           <Button
            variant="ghost"
            size="icon"
            onClick={handleCancel}
            disabled={cancelSessionMutation.isPending}
            className="h-12 w-12 rounded-2xl bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-sm"
           >
              {cancelSessionMutation.isPending ? <Loader2 className="animate-spin" size={20} /> : <Trash2 size={20} />}
           </Button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-8 space-y-6 pb-20">
          <section className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden p-2">
            <StepCustomer
              selected={orderData.customer as unknown as ComponentProps<typeof StepCustomer>['selected']}
              onSelect={handleCustomerSelect}
              isSinglePageView
            />
          </section>

          <section className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden p-2">
             <div className="bg-slate-50/50 px-6 py-3 rounded-t-[2rem] flex items-center gap-2">
                <ShoppingCart size={14} className="text-slate-400" />
                <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Carrinho</h3>
             </div>
             <StepItems draftId={draftId} />
          </section>

          <section className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden p-2">
             <StepDelivery
               data={orderData as unknown as ComponentProps<typeof StepDelivery>['data']}
               onUpdate={updateData as unknown as ComponentProps<typeof StepDelivery>['onUpdate']}
             />
          </section>
        </div>

        <aside className="lg:col-span-4 space-y-6 lg:sticky lg:top-8">
          <section className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
            <div className="bg-slate-50 px-8 py-4 border-b border-slate-100">
              <h3 className="text-[11px] font-black uppercase text-slate-500 tracking-widest">Pagamento</h3>
            </div>
            <div className="p-4 flex flex-col gap-2">
              {paymentMethods.map((m: PaymentMethod) => {
                const isSelected = String(orderData.paymentMethod) === String(m.id);
                const IconComp = IconMap[m.icon || ""] || IconMap.default;
                const brandLogo = normalizeImageUrl(m.brand_logo_url || m.brandLogoUrl) || "";
                const discount = safeNumber(String(m.discountPercentage || m.discount_percentage || "0").replace(',', '.'));

                return (
                  <button
                    key={m.id}
                    onClick={() => updateData({ paymentMethod: String(m.id) })}
                    className={cn(
                      "flex items-center p-3 rounded-2xl border-2 transition-all w-full text-left",
                      isSelected ? "border-emerald-500 bg-emerald-50/50 shadow-sm" : "border-slate-50 bg-white hover:border-slate-200"
                    )}
                  >
                    <div className={cn("h-10 w-10 shrink-0 rounded-xl flex items-center justify-center overflow-hidden", isSelected ? "bg-emerald-500 text-white" : "bg-slate-50 text-slate-400")}>
                      {brandLogo ? (
                        <img src={brandLogo} className={cn("h-7 w-7 object-contain", isSelected ? "" : "grayscale opacity-40")} alt={m.name} />
                      ) : (
                        <IconComp size={20} />
                      )}
                    </div>
                    <div className="ml-3 flex flex-col items-start flex-1 min-w-0">
                      <span className={cn("text-[10px] font-black uppercase tracking-tight truncate w-full", isSelected ? "text-slate-900" : "text-slate-500")}>{m.name}</span>
                      {discount > 0 && <span className="text-[8px] font-black text-emerald-600 uppercase">-{discount}% OFF</span>}
                    </div>
                    {isSelected && <Check size={16} className="text-emerald-500" strokeWidth={4} />}
                  </button>
                );
              })}
            </div>
          </section>

          <section className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-6 space-y-4">
             <div className="flex items-center gap-2">
                <Ticket size={16} className="text-slate-400" />
                <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Descontos Extras</h3>
             </div>

             <div className="flex gap-2 relative">
                <Input
                  id="couponInput"
                  placeholder={orderData.couponCode ? `CUPOM: ${orderData.couponCode}` : "CUPOM"}
                  disabled={!!orderData.couponCode}
                  className={cn("rounded-xl uppercase font-black text-xs h-12 pr-10", orderData.couponCode && "bg-emerald-50 text-emerald-700 border-emerald-200")}
                />
                {orderData.couponCode ? (
                  <button onClick={() => updateData({ couponCode: null, couponValue: 0 })} className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-emerald-600 hover:text-red-500 transition-colors">
                    <X size={16} strokeWidth={3} />
                  </button>
                ) : (
                  <Button
                    onClick={() => {
                      const el = document.getElementById("couponInput") as HTMLInputElement;
                      const code = el?.value;
                      if (code) {
                        applyCouponMutation.mutate({ draftId: String(draftId), code });
                        el.value = ""; // Limpa após aplicar
                      }
                    }}
                    disabled={applyCouponMutation.isPending}
                    variant="outline" className="h-12 rounded-xl border-dashed"
                  >
                    {applyCouponMutation.isPending ? <Loader2 className="animate-spin" size={14} /> : "Aplicar"}
                  </Button>
                )}
             </div>

             {orderData.customer?.id && (
                <div className="space-y-2">
                  <div className="relative">
                    <Button
                      onClick={handleApplyLoyalty}
                      disabled={applyLoyaltyMutation.isPending || removeLoyaltyMutation.isPending || (orderData.customer.availablePoints || 0) <= 0 || orderData.loyaltyValue > 0}
                      variant="ghost"
                      className={cn(
                        "w-full h-12 rounded-xl gap-2 font-black uppercase text-[10px] transition-all shadow-sm",
                        orderData.loyaltyValue > 0 ? "bg-amber-500 text-white hover:bg-amber-600" : "bg-amber-50 text-amber-600 border border-amber-100"
                      )}
                    >
                      {applyLoyaltyMutation.isPending || removeLoyaltyMutation.isPending ? <Loader2 className="animate-spin" size={14} /> : (
                        <>
                          <Star size={14} fill="currentColor" />
                          {orderData.loyaltyValue > 0 ? `USANDO ${orderData.loyaltyPointsUsed} PONTOS` : "Usar Fidelidade"}
                        </>
                      )}
                    </Button>
                    {orderData.loyaltyValue > 0 && (
                      <button onClick={() => removeLoyaltyMutation.mutate({ draftId: String(draftId) })} className="absolute -top-2 -right-2 bg-white border-2 border-amber-500 text-amber-500 rounded-full p-1 hover:bg-red-50 hover:text-red-500 hover:border-red-500 transition-all shadow-md z-10">
                        <X size={12} strokeWidth={4} />
                      </button>
                    )}
                  </div>
                  <p className="text-center text-[9px] font-black uppercase text-slate-400">
                    Disponível: <span className="text-amber-600">{orderData.customer.availablePoints || 0} pontos</span>
                  </p>
                </div>
             )}
          </section>

          <section className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl">
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
                  <span>Fidelidade Resgatada</span>
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
              onClick={handleFinalize}
              disabled={!orderData.customer || !orderData.paymentMethod || totals.itemCount === 0 || placeOrderMutation.isPending}
              className="w-full h-20 rounded-3xl bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-black uppercase tracking-widest text-lg shadow-xl group transition-all"
            >
              {placeOrderMutation.isPending ? <Loader2 className="animate-spin" /> : (
                <div className="flex items-center gap-3">
                  Finalizar Venda
                  <ArrowRight className="group-hover:translate-x-2 transition-transform" />
                </div>
              )}
            </Button>
          </section>
        </aside>
      </div>
    </div>
  );
}
