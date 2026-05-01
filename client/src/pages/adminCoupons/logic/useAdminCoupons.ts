import { useState } from "react";
import { trpc } from "@/_core/trpc";
import { appToast as toast } from "@/lib/app-toast"; 

// ✅ Interface exportada para uso na View
export interface Coupon {
  id: string | number;
  code: string;
  description?: string | null;
  discountType: "fixed" | "percentage";
  discountValue: number;
  minOrderValue?: number | null;
  maxDiscount?: number | null;
  usageLimit?: number | null;
  validFrom?: string | Date | null;
  validUntil?: string | Date | null;
  bannerColor?: string | null;
  logoUrl?: string | null;
  isActive: boolean | number;
  timesUsed?: number;
}

// Interface para o estado interno do formulário
interface CouponFormState {
  id: string | null;
  code: string;
  description: string;
  discountType: "fixed" | "percentage";
  discountValue: string;
  minOrderValue: string;
  maxDiscount: string;
  usageLimit: string;
  validFrom: string;
  validUntil: string;
  bannerColor: string;
  logoUrl: string;
  isActive: boolean;
}

export function useAdminCoupons() {
  const utils = trpc.useUtils();
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);

  const initialFormState: CouponFormState = {
    id: null,
    code: "",
    description: "",
    discountType: "percentage",
    discountValue: "",
    minOrderValue: "",
    maxDiscount: "",
    usageLimit: "",
    validFrom: "",
    validUntil: "",
    bannerColor: "#10b981",
    logoUrl: "", 
    isActive: true,
  };

  const [formState, setFormState] = useState<CouponFormState>(initialFormState);

  /* --- 1. QUERIES --- */
  const { data: coupons, isLoading } = trpc.admin.coupons.list.useQuery();

  /* --- 2. MUTATIONS --- */
  const createMutation = trpc.admin.coupons.create.useMutation({
    onSuccess: () => {
      utils.admin.coupons.list.invalidate();
      resetForm();
      toast.success("Cupom criado com sucesso!");
    }
  });

  const updateMutation = trpc.admin.coupons.update.useMutation({
    onSuccess: () => {
      utils.admin.coupons.list.invalidate();
      resetForm();
      toast.success("Cupom atualizado!");
    }
  });

  const deleteMutation = trpc.admin.coupons.delete.useMutation({
    onSuccess: () => {
      utils.admin.coupons.list.invalidate();
      toast.info("Cupom excluído.");
    }
  });

  /* --- 3. ACTIONS --- */
  const resetForm = () => {
    setFormState(initialFormState);
    setIsMediaModalOpen(false);
  };

  const handleSubmit = async () => {
    if (!formState.code || !formState.discountValue) {
      toast.warning("Código e Valor são obrigatórios.");
      return;
    }

    const payload = {
      code: formState.code.trim().toUpperCase(),
      description: formState.description || null,
      discountType: formState.discountType,
      discountValue: parseFloat(String(formState.discountValue)) || 0,
      minOrderValue: formState.minOrderValue ? parseFloat(String(formState.minOrderValue)) : 0,
      maxDiscount: formState.maxDiscount ? parseFloat(String(formState.maxDiscount)) : null,
      usageLimit: formState.usageLimit ? parseInt(String(formState.usageLimit)) : null,
      validFrom: formState.validFrom ? new Date(formState.validFrom).toISOString() : null,
      validUntil: formState.validUntil ? new Date(formState.validUntil).toISOString() : null,
      bannerColor: formState.bannerColor,
      logoUrl: formState.logoUrl.trim() !== "" ? formState.logoUrl : null,
      isActive: formState.isActive,
    };

    if (formState.id) {
      updateMutation.mutate({ 
        id: formState.id, 
        ...payload 
      } as unknown as Parameters<typeof updateMutation.mutate>[0]);
    } else {
      createMutation.mutate(payload as unknown as Parameters<typeof createMutation.mutate>[0]);
    }
  };

  const actions = {
    setFormState,
    handleSubmit,
    resetForm,
    setMediaModalOpen: setIsMediaModalOpen,
    handleSelectMedia: (url: string) => {
      setFormState(prev => ({ ...prev, logoUrl: url }));
      setIsMediaModalOpen(false);
    },
    handleEdit: (coupon: Coupon) => {
      const fmtDate = (d: unknown) => d ? new Date(d as string).toISOString().slice(0, 16) : "";

      setFormState({
        id: String(coupon.id),
        code: coupon.code,
        description: coupon.description || "",
        discountType: coupon.discountType,
        discountValue: String(coupon.discountValue),
        minOrderValue: String(coupon.minOrderValue || ""),
        maxDiscount: String(coupon.maxDiscount || ""),
        usageLimit: String(coupon.usageLimit || ""),
        validFrom: fmtDate(coupon.validFrom),
        validUntil: fmtDate(coupon.validUntil),
        bannerColor: coupon.bannerColor || "#10b981",
        logoUrl: coupon.logoUrl || "", 
        isActive: Boolean(coupon.isActive),
      });
    },
    handleDelete: (id: string | number) => {
      if (confirm("Deseja realmente excluir este cupom?")) {
        deleteMutation.mutate({ id: String(id) });
      }
    },
    handleToggle: (coupon: Coupon) => {
      updateMutation.mutate({
        id: String(coupon.id),
        isActive: !coupon.isActive,
      } as unknown as Parameters<typeof updateMutation.mutate>[0]);
    },
  };

  return {
    state: { formState, isLoading, isMediaModalOpen },
    actions, 
    data: { coupons: (coupons as unknown as Coupon[]) || [] },
    mutations: { 
      createCoupon: createMutation,
      updateCoupon: updateMutation,
      deleteCoupon: deleteMutation,
      isPending: createMutation.isPending || updateMutation.isPending
    }
  };
}