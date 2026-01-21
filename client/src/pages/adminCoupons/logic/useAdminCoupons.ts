import { useState } from "react"; // ✅ Adicionado import que faltava
import { trpc } from "@/_core/trpc"; 
import { toast } from "@/components/ui/use-toast";

export function useAdminCoupons() {
  const utils = trpc.useUtils();
  
  const [formState, setFormState] = useState({
    code: "",
    description: "",
    discountType: "percentage" as "fixed" | "percentage",
    discount_value: "",
    minOrderValue: "",
    maxDiscount: "",
    usageLimit: "",
    validFrom: "",
    validUntil: "",
  });

  // 1. Queries (Listagem)
  const { data: coupons, isLoading } = trpc.admin.coupons.list.useQuery();

  // 2. Mutations
  const createMutation = trpc.admin.coupons.create.useMutation({
    onSuccess: () => {
      toast.success("Cupom ativado com sucesso!");
      utils.admin.coupons.list.invalidate();
      resetForm();
    },
    onError: (err) => toast.error(err.message)
  });

  const deleteMutation = trpc.admin.coupons.delete.useMutation({
    onSuccess: () => {
      toast.success("Cupom removido.");
      utils.admin.coupons.list.invalidate();
    },
    onError: (err) => toast.error("Erro ao remover: " + err.message)
  });

  const updateMutation = trpc.admin.coupons.update.useMutation({
    onSuccess: () => {
      toast.success("Status atualizado!");
      utils.admin.coupons.list.invalidate();
    },
    onError: (err) => toast.error("Erro ao atualizar: " + err.message)
  });

  const resetForm = () => {
    setFormState({
      code: "",
      description: "",
      discountType: "percentage",
      discount_value: "",
      minOrderValue: "",
      maxDiscount: "",
      usageLimit: "",
      validFrom: "",
      validUntil: "",
    });
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validação básica antes de enviar
    if (!formState.code || !formState.discount_value) {
      return toast.error("Código e Valor são obrigatórios.");
    }

    // ✅ Conversão Segura: Garante que strings vazias virem null e números sejam válidos
    createMutation.mutate({
      code: formState.code.trim().toUpperCase(),
      description: formState.description || null,
      discountType: formState.discountType,
      discount_value: Number(formState.discount_value) || 0,
      minOrderValue: formState.minOrderValue ? Number(formState.minOrderValue) : null,
      maxDiscount: formState.maxDiscount ? Number(formState.maxDiscount) : null,
      usageLimit: formState.usageLimit ? Number(formState.usageLimit) : null,
      validFrom: formState.validFrom || null,
      validUntil: formState.validUntil || null,
      isActive: true,
    });
  };

  return {
    state: { formState, isLoading },
    actions: { 
      setFormState, 
      handleCreate, 
      handleDelete: (id: number) => {
        if(confirm("Deseja realmente excluir este cupom?")) {
          deleteMutation.mutate({ id });
        }
      },
      handleToggle: (coupon: any) => 
        updateMutation.mutate({ 
          id: coupon.id, // ✅ Garante que o ID está sendo enviado
          isActive: !coupon.isActive 
        })
    },
    data: { coupons: coupons || [] },
    mutations: { 
      isPending: createMutation.isPending || updateMutation.isPending || deleteMutation.isPending 
    }
  };
}