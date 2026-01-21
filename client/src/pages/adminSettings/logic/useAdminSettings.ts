import { useState, useEffect } from "react";
import { trpc } from "@/_core/trpc";
import { toast } from "@/components/ui/use-toast";

export function useAdminSettings() {
  const utils = trpc.useUtils();
  const [formData, setFormData] = useState<any>({
    generalMinOrderAmount: "0.00",
    minOrderMessage: ""
  });

  // Query
  const { data: settings, isLoading } = trpc.admin.storeSettings.get.useQuery();

  // Mutation
  const updateMutation = trpc.admin.storeSettings.update.useMutation({
    onSuccess: () => {
      toast.success("Definições globais atualizadas!");
      utils.admin.storeSettings.get.invalidate();
    },
    onError: (err) => toast.error("Erro ao salvar: " + err.message)
  });

  // Sincronização
  useEffect(() => {
    if (settings) {
      setFormData(settings);
    }
  }, [settings]);

  const handleSave = async () => {
    updateMutation.mutate({
      ...formData,
      generalMinOrderAmount: String(formData.generalMinOrderAmount)
    });
  };

  return {
    state: { formData, isLoading, isPending: updateMutation.isPending },
    actions: { setFormData, handleSave }
  };
}