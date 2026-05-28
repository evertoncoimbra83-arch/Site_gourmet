// e:/IA/projects/Site_React/client/src/pages/adminPaymentMethods/logic/useAdminPaymentMethods.ts

import { useState } from "react";
import { trpc } from "@/_core/trpc";
import { appToast as toast } from "@/lib/app-toast";
import { getAdminMutationErrorMessage } from "@/lib/admin-mutation-error";
import { requestStrongConfirmation } from "@/lib/strong-confirmation";

// --- INTERFACES ---

export interface PaymentMethod {
  id: string | number;
  name: string;
  description?: string | null;
  icon?: string | null;
  brand_name?: string | null;
  brandName?: string | null;
  brand_logo_url?: string | null;
  brandLogoUrl?: string | null;
  discount_percentage?: number | string | null;
  discountPercentage?: number | string | null;
  isActive: boolean;
}

interface PaymentSavePayload {
  name: string;
  description?: string;
  icon?: string;
  brand_name?: string;
  brandName?: string;
  brand_logo_url?: string;
  discount_percentage?: number | string;
  discountPercentage?: number | string;
}

export function useAdminPaymentMethods() {
  const utils = trpc.useUtils();
  const [isOpen, setIsOpen] = useState(false);
  const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(null);

  // 1. QUERIES
  const { data: methods, isLoading } = trpc.admin.paymentMethods.listAll.useQuery();

  // 2. MUTATIONS
  const createMutation = trpc.admin.paymentMethods.create.useMutation({
    onSuccess: () => {
      utils.admin.paymentMethods.listAll.invalidate();
      setIsOpen(false);
      toast.success("Metodo de pagamento criado.");
    },
    onError: (err) => {
      toast.error(getAdminMutationErrorMessage(err, "Erro ao criar metodo de pagamento."));
    },
  });

  const updateMutation = trpc.admin.paymentMethods.update.useMutation({
    onSuccess: async () => {
      await utils.admin.paymentMethods.listAll.invalidate();
      setIsOpen(false);
      setEditingMethod(null);
      toast.success("Metodo de pagamento atualizado.");
    },
    onError: (err) => {
      toast.error(getAdminMutationErrorMessage(err, "Erro ao atualizar metodo de pagamento."));
    },
  });

  const deleteMutation = trpc.admin.paymentMethods.delete.useMutation({
    onSuccess: () => {
      utils.admin.paymentMethods.listAll.invalidate();
      toast.success("Metodo de pagamento removido.");
    },
    onError: (err) => {
      toast.error(getAdminMutationErrorMessage(err, "Erro ao remover metodo de pagamento."));
    },
  });

  // 3. ACTIONS
  const handleEdit = (method: PaymentMethod) => {
    setEditingMethod(method);
    setIsOpen(true);
  };

  const handleToggleActive = (id: string | number, currentStatus: boolean) => {
    const confirmation = requestStrongConfirmation(
      "Digite CONFIRMAR para ativar ou pausar metodo de pagamento.",
      "Informe uma justificativa para alterar a disponibilidade no checkout:",
    );
    if (!confirmation) return toast.warning("Confirmacao forte cancelada.");
    // ✅ FIX: Convertendo para Number para satisfazer o contrato do backend
    updateMutation.mutate({ 
      id: Number(id), 
      isActive: !currentStatus,
      ...confirmation,
    });
  };

  /**
   * ✅ HANDLER DE SALVAMENTO REVISADO
   */
  const handleSave = (data: PaymentSavePayload) => {
    const cleanLogoUrl = data.brand_logo_url?.split('/').pop() || "";

    const payload = {
      name: data.name,
      description: data.description || "",
      icon: data.icon || "",
      brand_name: data.brand_name || data.brandName || "",
      brand_logo_url: cleanLogoUrl, 
      discount_percentage: Number(data.discount_percentage || data.discountPercentage || 0),
    };

    const needsConfirmation = payload.discount_percentage > 10;
    const confirmation = needsConfirmation
      ? requestStrongConfirmation(
          "Digite CONFIRMAR para salvar desconto critico no metodo de pagamento.",
          "Informe uma justificativa para esta alteracao financeira:",
        )
      : null;
    if (needsConfirmation && !confirmation) {
      return toast.warning("Confirmacao forte cancelada.");
    }

    if (editingMethod) {
      // ✅ FIX: Convertendo para Number para satisfazer o contrato do backend
      updateMutation.mutate({ 
        ...payload, 
        id: Number(editingMethod.id),
        ...confirmation,
      });
    } else {
      createMutation.mutate({ 
        ...payload, 
        isActive: true,
        ...confirmation,
      });
    }
  };

  const handleDelete = (id: string | number) => {
    const confirmation = requestStrongConfirmation(
      "Digite CONFIRMAR para remover canal de recebimento permanentemente.",
      "Informe uma justificativa para excluir este metodo de pagamento:",
    );
    if (!confirmation) return toast.warning("Confirmacao forte cancelada.");
    deleteMutation.mutate({ id: Number(id), ...confirmation });
  };

  return {
    state: { 
      isOpen, 
      editingMethod, 
      isLoading,
      isSaving: createMutation.isPending || updateMutation.isPending 
    },
    actions: { 
      setIsOpen, 
      setEditingMethod, 
      handleEdit, 
      handleToggleActive,
      handleSave,
      handleDelete,
    },
    data: { methods: (methods as unknown as PaymentMethod[]) || [] },
    mutations: { createMutation, updateMutation, deleteMutation }
  };
}
