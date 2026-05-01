// e:/IA/projects/Site_React/client/src/pages/adminPaymentMethods/logic/useAdminPaymentMethods.ts

import { useState } from "react";
import { trpc } from "@/_core/trpc";

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
    }
  });

  const updateMutation = trpc.admin.paymentMethods.update.useMutation({
    onSuccess: async () => {
      await utils.admin.paymentMethods.listAll.invalidate();
      setIsOpen(false);
      setEditingMethod(null);
    }
  });

  const deleteMutation = trpc.admin.paymentMethods.delete.useMutation({
    onSuccess: () => {
      utils.admin.paymentMethods.listAll.invalidate();
    }
  });

  // 3. ACTIONS
  const handleEdit = (method: PaymentMethod) => {
    setEditingMethod(method);
    setIsOpen(true);
  };

  const handleToggleActive = (id: string | number, currentStatus: boolean) => {
    // ✅ FIX: Convertendo para Number para satisfazer o contrato do backend
    updateMutation.mutate({ 
      id: Number(id), 
      isActive: !currentStatus 
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

    if (editingMethod) {
      // ✅ FIX: Convertendo para Number para satisfazer o contrato do backend
      updateMutation.mutate({ 
        ...payload, 
        id: Number(editingMethod.id) 
      });
    } else {
      createMutation.mutate({ 
        ...payload, 
        isActive: true 
      });
    }
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
      handleSave 
    },
    data: { methods: (methods as unknown as PaymentMethod[]) || [] },
    mutations: { createMutation, updateMutation, deleteMutation }
  };
}