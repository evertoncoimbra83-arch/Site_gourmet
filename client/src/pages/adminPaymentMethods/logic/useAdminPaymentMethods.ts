import { useState } from "react";
import { trpc } from "@/_core/trpc";
import { toast } from "@/components/ui/use-toast";

export function useAdminPaymentMethods() {
  const utils = trpc.useUtils();
  const [isOpen, setIsOpen] = useState(false);
  const [editingMethod, setEditingMethod] = useState<any>(null);

  // 1. QUERIES
  const { data: methods, isLoading } = trpc.admin.paymentMethods.listAll.useQuery();

  // 2. MUTATIONS
  const createMutation = trpc.admin.paymentMethods.create.useMutation({
    onSuccess: () => {
      toast.success("Novo método cadastrado!");
      utils.admin.paymentMethods.listAll.invalidate();
      setIsOpen(false);
    },
    onError: (err: any) => toast.error("Erro ao criar: " + err.message)
  });

  const updateMutation = trpc.admin.paymentMethods.update.useMutation({
    onSuccess: async () => {
      toast.success("Configurações atualizadas!");
      await utils.admin.paymentMethods.listAll.invalidate();
      setIsOpen(false);
      setEditingMethod(null);
    },
    onError: (err: any) => toast.error("Erro ao atualizar: " + err.message)
  });

  const deleteMutation = trpc.admin.paymentMethods.delete.useMutation({
    onSuccess: () => {
      toast.success("Método removido.");
      utils.admin.paymentMethods.listAll.invalidate();
    },
    onError: (err: any) => toast.error("Erro ao remover: " + err.message)
  });

  // 3. ACTIONS
  const handleEdit = (method: any) => {
    setEditingMethod(method);
    setIsOpen(true);
  };

  const handleToggleActive = (id: string | number, currentStatus: boolean) => {
    updateMutation.mutate({ 
      id: String(id), 
      isActive: !currentStatus 
    });
  };

  /**
   * ✅ HANDLER DE SALVAMENTO REVISADO
   */
  const handleSave = (data: any) => {
    // 1. Extraímos apenas o nome do arquivo da URL (evita salvar /uploads//uploads/...)
    // Se data.brand_logo_url for "/uploads/pix.png", vira "pix.png"
    const cleanLogoUrl = data.brand_logo_url?.split('/').pop() || "";

    const payload = {
      name: data.name,
      description: data.description,
      icon: data.icon,
      // Garante que enviamos exatamente o que o Zod espera no backend
      brand_name: data.brand_name || data.brandName || "",
      brand_logo_url: cleanLogoUrl, 
      discount_percentage: Number(data.discount_percentage || data.discountPercentage || 0),
    };

    if (editingMethod) {
      updateMutation.mutate({ 
        ...payload, 
        id: String(editingMethod.id) 
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
    data: { methods: methods || [] },
    mutations: { createMutation, updateMutation, deleteMutation }
  };
}