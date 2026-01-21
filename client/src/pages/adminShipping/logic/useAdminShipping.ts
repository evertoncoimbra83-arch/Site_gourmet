import { useState } from "react";
import { trpc } from "@/_core/trpc";
import { toast } from "@/components/ui/use-toast";

export function useAdminShipping() {
  const utils = trpc.useUtils();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // ✅ Estado para controlar qual regra está sendo editada
  const [editingRule, setEditingRule] = useState<any | null>(null);

  const [newRule, setNewRule] = useState({
    name: "",
    cepStart: "",
    cepEnd: "",
    price: "",
  });

  // --- QUERIES ---
  const { data: settings, isLoading: loadingSettings } = trpc.admin.shipping.getSettings.useQuery();
  const { data: rules, isLoading: loadingRules } = trpc.admin.shipping.getRules.useQuery();

  // --- MUTATIONS ---
  const updateSettings = trpc.admin.shipping.updateSettings.useMutation({
    onSuccess: () => {
      toast.success("Configurações atualizadas!");
      utils.admin.shipping.getSettings.invalidate();
    }
  });

  const createRuleMutation = trpc.admin.shipping.createRule.useMutation({
    onSuccess: () => {
      toast.success("Regra criada com sucesso!");
      resetForm();
      utils.admin.shipping.getRules.invalidate();
    }
  });

  const updateRuleMutation = trpc.admin.shipping.updateRule.useMutation({
    onSuccess: () => {
      toast.success("Regra atualizada!");
      resetForm();
      utils.admin.shipping.getRules.invalidate();
    }
  });

  const deleteRule = trpc.admin.shipping.deleteRule.useMutation({
    onSuccess: () => {
      toast.success("Regra removida.");
      utils.admin.shipping.getRules.invalidate();
    }
  });

  // --- HELPERS ---
  const resetForm = () => {
    setIsDialogOpen(false);
    setEditingRule(null);
    setNewRule({ name: "", cepStart: "", cepEnd: "", price: "" });
  };

  return {
    state: { 
      isDialogOpen, 
      newRule, 
      editingRule, // ✅ Exportado para a View
      isLoading: loadingSettings || loadingRules 
    },
    actions: { 
      setIsDialogOpen, 
      setNewRule, 
      setEditingRule, // ✅ Exportado para a View
      
      // ✅ Prepara os campos para edição
      prepareEdit: (rule: any) => {
        setEditingRule(rule);
        setNewRule({
          name: rule.name,
          cepStart: rule.cepStart || "",
          cepEnd: rule.cepEnd || "",
          price: String(rule.price)
        });
        // Rola a tela para o formulário (opcional)
        window.scrollTo({ top: 0, behavior: 'smooth' });
      },

      // ✅ Salva (Decide entre Criar ou Editar)
      saveRule: (data?: any) => {
        const payload = data || {
          name: newRule.name,
          cepStart: newRule.cepStart,
          cepEnd: newRule.cepEnd,
          price: parseFloat(newRule.price || "0"),
          type: editingRule?.type || 'zipcode',
          active: true
        };

        if (editingRule) {
          updateRuleMutation.mutate({ id: editingRule.id, ...payload });
        } else {
          createRuleMutation.mutate(payload);
        }
      },

      createRule: (data: any) => createRuleMutation.mutate(data),
      deleteRule: (id: number) => deleteRule.mutate({ id }),
      handleTogglePickup: (checked: boolean) => {
        updateSettings.mutate({
          pickupEnabled: checked,
          pickupLabel: settings?.pickupLabel || "Retirada",
          pickupInstruction: settings?.pickupInstruction || ""
        });
      },
      handleSaveSettings: (d: any) => updateSettings.mutate(d),
    },
    data: { settings, rules: rules || [] },
    mutations: { updateSettings, createRule: createRuleMutation, updateRule: updateRuleMutation }
  };
}