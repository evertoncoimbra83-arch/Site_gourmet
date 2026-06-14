// client/src/pages/adminOrders/view/AdminOrderCreate.tsx

import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAdminOrderWizard } from "../logic/useAdminOrderWizard.ts";
import { getManualSaleStartupState } from "../logic/manualSaleState";
import { trpc } from "@/_core/trpc";

// Componentes de Passo
import StepCustomer from "./steps/StepCustomer";
import { StepDeliveryPDV as StepDelivery } from "./steps/StepDelivery";
import StepItems from "./steps/StepItems";

// Novos Componentes Refatorados
import { OrderHeader } from "./steps/orderCreate/OrderHeader";
import { OrderPaymentSection } from "./steps/OrderPaymentSection";
import { OrderTotalsSidebar } from "./steps/orderCreate/OrderTotalsSidebar";

// Componente do Rascunho
import { RecoverCartSheet } from "../view/RecoverCartSheet";

// Ícones e UI
import { Loader2, ShoppingCart, History, AlertCircle, StickyNote } from "lucide-react";
import { appToast as toast } from "@/lib/app-toast";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

// --- INTERFACES DE DADOS ---

interface LoyaltyResult {
  discountAmount: number;
  pointsUsed: number;
}

interface CouponResult {
  coupon: {
    code: string;
    type: "fixed" | "percentage";
    value: number;
  };
}

interface CustomerData {
  id: string;
  name: string;
  availablePoints?: number;
  email?: string;
  phone?: string;
}

interface AddressData {
  shipping_address: string;
  shipping_address_number: string;
  shipping_neighborhood: string;
  shipping_city: string;
  shipping_state: string;
  zipCode: string;
  shipping_address_complement?: string;
}

interface OrderDataState {
  customer?: CustomerData | null;
  paymentMethod?: string | number;
  paymentStatus?: string;
  notes?: string;
  couponCode?: string | null;
  couponValue: number;
  loyaltyValue: number;
  loyaltyPointsUsed: number;
  discountValue: number;
  deliveryFee: number;
  deliveryMode: "delivery" | "pickup" | "walk_in"; // ✅ Adicionado walk_in para compatibilidade
  metadataJson: string;
  address?: AddressData | null;
  editingOrderId?: string | null;
  orderDate?: string;
}

interface PaymentMethodData {
  id: string | number;
  name: string;
  icon?: string | null;
  brandLogoUrl?: string | null;
  discountPercentage?: string | null;
  discount_percentage?: string | null;
}

// ✅ Tipagem do Roteador Atualizada sem 'any'
interface OrdersAdminApi {
  init: { useMutation: (opts: Record<string, unknown>) => { mutate: () => void, isPending: boolean, isError: boolean, error: unknown } };
  recoverDraft: { useMutation: (opts: Record<string, unknown>) => { mutate: (data: Record<string, unknown>) => void } };
  applyLoyalty: { useMutation: (opts: Record<string, unknown>) => { mutate: (data: Record<string, unknown>) => void, isPending: boolean } };
  removeLoyalty: { useMutation: (opts: Record<string, unknown>) => { mutate: (data: Record<string, unknown>) => void } };
  applyCoupon: { useMutation: (opts: Record<string, unknown>) => { mutate: (data: Record<string, unknown>) => void, isPending: boolean } };
  placeOrder: { useMutation: (opts: Record<string, unknown>) => { mutate: (data: Record<string, unknown>) => void, isPending: boolean } };
  cancelSession: { useMutation: (opts: Record<string, unknown>) => { mutate: (data: Record<string, unknown>) => void, isPending: boolean } };
  getDraft: { invalidate: () => void };
  list: { invalidate: () => void };
  invalidate: () => void;
}

export default function AdminOrderCreate() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const draftId = searchParams.get("draftId");

  const [isRecoverOpen, setIsRecoverOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<"cancel" | "saveEdit" | null>(null);
  const hasRequestedInitialDraft = useRef(false);

  const wizard = useAdminOrderWizard(draftId);

  const orderData = wizard.orderData as unknown as OrderDataState;
  const updateData = wizard.updateData as (data: Partial<OrderDataState>) => void;
  const totals = wizard.totals as { subtotal: number; total: number; itemCount: number };
  const wizardLoading = wizard.isLoading;

  const {
    data: rawPaymentMethods = [],
    isError: paymentMethodsError,
  } = trpc.public.paymentMethods.list.useQuery(undefined, {
    staleTime: 1000 * 60 * 5,
    retry: 1,
  });

  const paymentMethods = rawPaymentMethods as unknown as PaymentMethodData[];

  const ordersAdmin = (trpc.admin.ordersAdmin as unknown as OrdersAdminApi);

  // --- MUTATIONS ---
  const initManualSaleMutation = ordersAdmin.init.useMutation({
    onSuccess: (data: unknown) => {
      const typedData = data as { draftId?: string; id?: string };
      const nextDraftId = typedData.draftId || typedData.id;
      if (!nextDraftId) {
        toast.error("Não foi possível iniciar a Venda Manual.");
        return;
      }

      navigate(`/admin/orders/create?draftId=${nextDraftId}`, { replace: true });
    },
    onError: (err: unknown) => {
      toast.error("Erro ao iniciar Venda Manual: " + ((err as { message?: string }).message || "tente novamente."));
    },
  });

  useEffect(() => {
    if (!draftId && !hasRequestedInitialDraft.current) {
      hasRequestedInitialDraft.current = true;
      initManualSaleMutation.mutate();
    }
  }, [draftId, initManualSaleMutation]);

  const recoverDraftMutation = ordersAdmin.recoverDraft.useMutation({
    onSuccess: (data: unknown, variables: unknown) => {
      const typedData = data as { newDraftId?: string };
      const typedVariables = variables as { draftId: string };
      toast.dismiss();
      toast.success("Carrinho transferido!");
      const finalDraftId = typedData?.newDraftId || typedVariables.draftId;
      navigate(`/admin/orders/create?draftId=${finalDraftId}`, { replace: true });
      ordersAdmin.invalidate();
    },
    onError: (err: unknown) => {
      const error = err as { message: string };
      toast.dismiss();
      toast.error("Erro ao recuperar carrinho: " + error.message);
      setIsRecoverOpen(false);
    }
  });

  const applyLoyaltyMutation = ordersAdmin.applyLoyalty.useMutation({
    onSuccess: (data: unknown) => {
      const typedData = data as LoyaltyResult;
      updateData({ loyaltyValue: typedData.discountAmount, loyaltyPointsUsed: typedData.pointsUsed });
      ordersAdmin.getDraft.invalidate();
      toast.success("Fidelidade aplicada!");
    },
    onError: (err: unknown) => toast.error((err as { message: string }).message),
  });

  const removeLoyaltyMutation = ordersAdmin.removeLoyalty.useMutation({
    onSuccess: () => {
      updateData({ loyaltyValue: 0, loyaltyPointsUsed: 0 });
      ordersAdmin.getDraft.invalidate();
      toast.success("Fidelidade removida.");
    },
    onError: (err: unknown) => toast.error((err as { message: string }).message),
  });

  const applyCouponMutation = ordersAdmin.applyCoupon.useMutation({
    onSuccess: (data: unknown) => {
      const typedData = data as CouponResult;
      const calculatedDiscount = typedData.coupon.type === 'percentage'
        ? (totals.subtotal * typedData.coupon.value) / 100
        : typedData.coupon.value;
      updateData({ couponCode: typedData.coupon.code, couponValue: calculatedDiscount });
      ordersAdmin.getDraft.invalidate();
      toast.success("Cupom aplicado!");
    },
    onError: (err: unknown) => toast.error((err as { message: string }).message),
  });

  const placeOrderMutation = ordersAdmin.placeOrder.useMutation({
    onSuccess: (res: unknown) => {
      const typedRes = res as { orderId: string };
      ordersAdmin.list.invalidate();

      if (orderData.editingOrderId) {
        toast.success("Pedido atualizado com sucesso!");
        navigate("/admin/orders", { replace: true });
      } else {
        toast.success("Venda Finalizada!");
        navigate(`/admin/orders/success?orderId=${typedRes.orderId}`, { replace: true });
      }
    },
    onError: (err: unknown) => toast.error((err as { message: string }).message),
  });

  const cancelSessionMutation = ordersAdmin.cancelSession.useMutation({
    onSuccess: () => {
      toast.success("Sessão Cancelada.");
      navigate("/admin/orders");
    },
    onError: (err: unknown) => toast.error((err as { message: string }).message),
  });

  const startupState = getManualSaleStartupState({
    draftId,
    wizardLoading,
    initPending: initManualSaleMutation.isPending,
    initError: initManualSaleMutation.isError,
    wizardError: Boolean((wizard as { isError?: boolean }).isError),
  });

  if (startupState === "error") {
    const error = initManualSaleMutation.error || (wizard as { error?: unknown }).error;
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-slate-50 p-6 text-center">
        <AlertCircle className="text-red-500" size={40} />
        <div className="max-w-md space-y-2">
          <p className="font-black uppercase text-sm text-slate-900">Venda Manual indisponível</p>
          <p className="text-xs font-bold text-slate-500">
            {(error as { message?: string })?.message || "Não foi possível carregar a sessão. Tente novamente."}
          </p>
        </div>
        <Button
          onClick={() => {
            if (draftId) {
              window.location.reload();
              return;
            }
            initManualSaleMutation.mutate();
          }}
          className="rounded-2xl bg-slate-900 px-6 font-black uppercase text-[10px]"
        >
          Tentar novamente
        </Button>
      </div>
    );
  }

  if (startupState !== "ready") {
    return (
      <div className="h-screen flex flex-col items-center justify-center gap-4 bg-slate-50">
        <Loader2 className="animate-spin text-emerald-600" size={40} />
        <p className="font-black uppercase text-[10px] tracking-widest text-slate-400">Abrindo Venda Manual...</p>
      </div>
    );
  }

  const paymentDiscountOnly = Math.max(0, orderData.discountValue - (orderData.couponCode ? orderData.couponValue : 0) - (orderData.loyaltyValue || 0));
  const activeDraftId = draftId;
  if (!activeDraftId) return null;

  return (
    <div className="max-w-400 mx-auto p-4 lg:p-8 animate-in fade-in duration-500 font-sans text-left">
      <ConfirmDialog
        open={confirmAction === "cancel"}
        title="Cancelar venda manual?"
        description="O rascunho atual sera descartado e nao podera ser recuperado."
        confirmLabel="Cancelar venda"
        cancelLabel="Continuar editando"
        destructive
        loading={cancelSessionMutation.isPending}
        onCancel={() => setConfirmAction(null)}
        onConfirm={() => cancelSessionMutation.mutate({ draftId: activeDraftId })}
      />

      <ConfirmDialog
        open={confirmAction === "saveEdit"}
        title="Salvar alteracoes no pedido?"
        description="As alteracoes serao aplicadas ao pedido original."
        confirmLabel="Salvar alteracoes"
        cancelLabel="Revisar antes"
        loading={placeOrderMutation.isPending}
        onCancel={() => setConfirmAction(null)}
        onConfirm={() => placeOrderMutation.mutate({ draftId: activeDraftId })}
      />


      {orderData.editingOrderId && (
        <div className="mb-6 bg-amber-50 border-2 border-amber-200 p-4 rounded-3xl flex items-center gap-4 shadow-sm">
          <div className="bg-amber-500 text-white p-2 rounded-xl">
            <AlertCircle size={20} />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase text-amber-600 tracking-widest">Atenção: Modo de Edição Ativo</p>
            <p className="text-xs font-bold text-amber-700">Alterando pedido #{orderData.editingOrderId.slice(-8).toUpperCase()}</p>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <OrderHeader
          orderDate={orderData.orderDate || new Date().toISOString().split('T')[0]}
          onDateChange={(e: React.ChangeEvent<HTMLInputElement>) => updateData({ orderDate: e.target.value })}
          total={totals.total}
          isCancelling={cancelSessionMutation.isPending}
          onCancel={() => setConfirmAction("cancel")}
          isEditing={!!orderData.editingOrderId}
        />

        <Button
          variant="outline"
          onClick={() => setIsRecoverOpen(true)}
          className="rounded-2xl border-slate-200 bg-white hover:bg-emerald-50 hover:text-emerald-600 text-slate-500 font-black text-[10px] uppercase tracking-[0.2em] h-12 px-6 transition-all shadow-sm flex gap-2"
        >
          <History size={16} />
          Carrinhos em Aberto
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-8 space-y-6 pb-20">
          <section className="bg-white rounded-4xl border border-slate-100 shadow-sm p-2">
            {/* ✅ CORREÇÃO: Usando unknown casted de forma segura */}
            <StepCustomer
              selected={(orderData.customer as unknown) as never}
              onSelect={(selection) => updateData({ customer: (selection as unknown) as CustomerData })}
              isSinglePageView
            />
          </section>

          <section className="bg-white rounded-4xl border border-slate-100 shadow-sm p-2">
            <div className="bg-slate-50/50 px-6 py-3 rounded-t-[2rem] flex items-center gap-2">
              <ShoppingCart size={14} className="text-slate-400" />
              <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Carrinho</h3>
            </div>
            <StepItems draftId={activeDraftId} />
          </section>

          <section className="bg-white rounded-4xl border border-slate-100 shadow-sm p-2">
            <StepDelivery
              data={({
                deliveryMode: orderData.deliveryMode,
                address: orderData.address || null,
                deliveryFee: orderData.deliveryFee
              } as unknown) as never}
              onUpdate={(payload) => updateData((payload as unknown) as Partial<OrderDataState>)}
            />
          </section>
        </div>

        <aside className="lg:col-span-4 space-y-6 lg:sticky lg:top-8">
          <OrderPaymentSection
            orderData={(orderData as unknown) as never}
            paymentMethods={((paymentMethodsError ? [] : paymentMethods) as unknown) as never}
            maxDiscountPossible={0}
            calculatePointsForValue={(v: number) => v}
            onUpdate={(payload) => updateData((payload as unknown) as Partial<OrderDataState>)}
            onApplyCoupon={(code: string) => applyCouponMutation.mutate({ draftId: activeDraftId, code })}
            onApplyLoyalty={(pts: string) => applyLoyaltyMutation.mutate({ draftId: activeDraftId, pointsInput: pts })}
            onRemoveLoyalty={() => removeLoyaltyMutation.mutate({ draftId: activeDraftId })}
            isCouponPending={applyCouponMutation.isPending}
            isLoyaltyPending={applyLoyaltyMutation.isPending}
          />

          <section className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <StickyNote size={14} className="text-slate-400" />
              <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Observações Internas</h4>
            </div>
            <textarea
              value={orderData.notes || ""}
              onChange={(e) => updateData({ notes: e.target.value })}
              placeholder="Ex: Retirar cebola..."
              className="w-full min-h-30 p-4 rounded-2xl bg-slate-50 border-none text-xs font-bold text-slate-700 placeholder:text-slate-300 focus:ring-2 focus:ring-emerald-500/20 transition-all resize-none"
            />
          </section>

          <OrderTotalsSidebar
            totals={totals}
            orderData={(orderData as unknown) as never}
            paymentDiscountOnly={paymentDiscountOnly}
            onFinalize={() => {
              if(orderData.editingOrderId) {
                setConfirmAction("saveEdit");
              } else {
                placeOrderMutation.mutate({ draftId: activeDraftId });
              }
            }}
            isPending={placeOrderMutation.isPending}
          />
        </aside>
      </div>

      <RecoverCartSheet
        isOpen={isRecoverOpen}
        onClose={() => setIsRecoverOpen(false)}
        onSelect={(id) => {
          setIsRecoverOpen(false);
          toast.loading("Transferindo carrinho...");
          recoverDraftMutation.mutate({ draftId: id, adminId: "admin_default" });
        }}
      />
    </div>
  );
}
