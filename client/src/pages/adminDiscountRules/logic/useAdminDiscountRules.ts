import { useState } from "react";
import { trpc } from "@/_core/trpc";
import { appToast as toast } from "@/lib/app-toast"; 

// ✅ Interface robusta para a regra vindo da API (Suporta string/number para evitar conflitos)
interface DiscountRule {
  id: number | string;
  name: string;
  description?: string | null;
  minQuantity?: number | null;
  min_quantity?: number | null; 
  maxQuantity?: number | null;
  max_quantity?: number | null;
  type: "percentage" | "fixed";
  discountType?: "percentage" | "fixed";
  value: number | string; // ✅ Aceita ambos para evitar erro de conversão do DB
  discount_value?: number | string;
  discountValue?: number | string;
  priority: number | string | null;
  isActive: boolean | number;
}

export function useAdminDiscountRules() {
  const utils = trpc.useUtils();
  
  const [editingId, setEditingId] = useState<number | string | null>(null);
  
  const [formState, setFormState] = useState({
    name: "",
    description: "",
    minQuantity: "" as string | number,
    maxQuantity: "" as string | number,
    type: "percentage" as "percentage" | "fixed",
    value: "" as string | number,
    priority: "" as string | number,
  });

  // --- QUERIES ---
  const { data: rules, isLoading } = trpc.admin.discountRules.list.useQuery();

  // --- MUTATIONS ---
  const createMutation = trpc.admin.discountRules.create.useMutation({
    onSuccess: () => {
      utils.admin.discountRules.list.invalidate();
      resetForm();
      toast.success("Regra de desconto criada!");
    }
  });

  const updateMutation = trpc.admin.discountRules.update.useMutation({
    onSuccess: () => {
      utils.admin.discountRules.list.invalidate();
      resetForm();
      toast.success("Regra atualizada com sucesso!");
    }
  });

  const deleteMutation = trpc.admin.discountRules.delete.useMutation({
    onSuccess: () => {
      utils.admin.discountRules.list.invalidate();
      toast.info("Regra removida.");
    }
  });

  // --- ACTIONS ---
  const resetForm = () => {
    setEditingId(null);
    setFormState({
      name: "",
      description: "",
      minQuantity: "",
      maxQuantity: "",
      type: "percentage",
      value: "",
      priority: "",
    });
  };

  // ✅ CORREÇÃO: Trocado 'any' pela interface 'DiscountRule'
  const handleEdit = (rule: DiscountRule) => {
    setEditingId(rule.id);
    setFormState({
      name: rule.name,
      description: rule.description || "",
      minQuantity: rule.minQuantity ?? rule.min_quantity ?? "",
      maxQuantity: rule.maxQuantity ?? rule.max_quantity ?? "",
      type: rule.type ?? rule.discountType ?? "percentage",
      value: String(rule.value ?? rule.discount_value ?? rule.discountValue ?? ""),
      priority: String(rule.priority || ""),
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const numValue = parseFloat(String(formState.value || 0));
    const numMin = parseInt(String(formState.minQuantity || 1));
    const numMax = formState.maxQuantity ? parseInt(String(formState.maxQuantity)) : null;
    const numPriority = parseInt(String(formState.priority || 0));

    if (isNaN(numValue)) {
      return toast.error("O valor do desconto deve ser um número.");
    }

    const payload = {
      name: formState.name,
      description: formState.description || null,
      minQuantity: numMin,
      maxQuantity: numMax,
      type: formState.type, 
      value: numValue,
      priority: numPriority,
      isActive: true,
    };

    if (editingId) {
      updateMutation.mutate({ id: Number(editingId), ...payload });
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
      deleteRule: (id: string | number) => deleteMutation.mutate({ id: Number(id) }) 
    },
    // ✅ CORREÇÃO TS2352: Bridge segura via unknown para evitar conflito de tipos da API
    data: { rules: (rules as unknown as DiscountRule[]) || [] }, 
    mutations: { 
      isPending: createMutation.isPending || updateMutation.isPending,
      isDeleting: deleteMutation.isPending 
    }
  };
}