import { useState } from "react";
import { trpc } from "@/_core/trpc";
import { toast } from "@/components/ui/use-toast";

export function useAdminDiscountRules() {
  const utils = trpc.useUtils();
  
  // ✅ Ajustado para number | string para ser flexível com o MySQL INT
  const [editingId, setEditingId] = useState<number | string | null>(null);
  
  const [formState, setFormState] = useState({
    name: "",
    description: "",
    minQuantity: "" as string | number,
    maxQuantity: "" as string | number,
    discountType: "percentage" as "percentage" | "fixed",
    discount_value: "" as string | number,
    priority: "" as string | number,
  });

  // --- QUERIES ---
  const { data: rules, isLoading } = trpc.admin.discountRules.list.useQuery();

  // --- MUTATIONS ---
  const createMutation = trpc.admin.discountRules.create.useMutation({
    onSuccess: () => {
      utils.admin.discountRules.list.invalidate();
      resetForm();
      toast.success("Nova regra ativada!");
    },
    onError: (err) => toast.error("Erro ao criar: " + err.message)
  });

  const updateMutation = trpc.admin.discountRules.update.useMutation({
    onSuccess: () => {
      utils.admin.discountRules.list.invalidate();
      resetForm();
      toast.success("Regra atualizada!");
    },
    onError: (err) => toast.error("Erro ao atualizar: " + err.message)
  });

  const deleteMutation = trpc.admin.discountRules.delete.useMutation({
    onSuccess: () => {
      utils.admin.discountRules.list.invalidate();
      toast.success("Regra removida.");
    },
    onError: (err) => toast.error("Erro ao remover: " + err.message)
  });

  // --- ACTIONS ---
  const resetForm = () => {
    setEditingId(null);
    setFormState({
      name: "",
      description: "",
      minQuantity: "",
      maxQuantity: "",
      discountType: "percentage",
      discount_value: "",
      priority: "",
    });
  };

  const handleEdit = (rule: any) => {
    // Carregamos o ID (seja número ou string vindo do banco)
    setEditingId(rule.id);
    setFormState({
      name: rule.name,
      description: rule.description || "",
      minQuantity: rule.minQuantity,
      maxQuantity: rule.maxQuantity || "",
      discountType: rule.discountType,
      discount_value: rule.discount_value,
      priority: rule.priority || "",
    });
    // Scroll suave para o formulário no topo
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // ✅ Validação e Sanitização do Payload
    const payload = {
      name: formState.name,
      description: formState.description || null,
      minQuantity: Number(formState.minQuantity),
      maxQuantity: formState.maxQuantity ? Number(formState.maxQuantity) : null,
      discountType: formState.discountType,
      discount_value: Number(formState.discount_value),
      priority: Number(formState.priority || 0),
      isActive: true,
    };

    if (editingId) {
      // O tRPC fará o z.coerce.number() ou string conforme o router revisado
      updateMutation.mutate({ id: editingId as any, ...payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  return {
    state: { editingId, formState, isLoading },
    actions: { 
      setFormState, 
      resetForm, 
      handleEdit, 
      handleSubmit, 
      deleteRule: (id: string | number) => deleteMutation.mutate({ id: id as any }) 
    },
    data: { rules: rules || [] },
    mutations: { 
      isPending: createMutation.isPending || updateMutation.isPending,
      isDeleting: deleteMutation.isPending 
    }
  };
}