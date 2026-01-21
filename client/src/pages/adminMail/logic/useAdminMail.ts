import { useState, useEffect } from "react";
import { trpc } from "@/_core/trpc"; 
import { toast } from "@/components/ui/use-toast"; 

export function useAdminMail() {
  const utils = trpc.useUtils(); 
  
  const [formData, setFormData] = useState<Record<string, string>>({
    smtp_host: "",
    smtp_port: "465",
    smtp_user: "",
    smtp_pass: "",
    email_order_subject: "",
    email_order_body: "",
    email_reset_subject: "",
    email_reset_body: "",
  });

  const { data: configs, isLoading } = trpc.admin.mail.getConfigs.useQuery();

  const saveMutation = trpc.admin.mail.saveConfigs.useMutation({
    onSuccess: () => {
      toast.success("Configurações de e-mail atualizadas!");
      utils.admin.mail.getConfigs.invalidate();
    },
    onError: (err: any) => {
      toast.error("Erro ao salvar: " + err.message);
    }
  });

  useEffect(() => {
    if (configs) {
      const newFormData = { ...formData };
      configs.forEach((c) => {
        if (Object.prototype.hasOwnProperty.call(formData, c.configKey)) {
          newFormData[c.configKey] = c.configValue || "";
        }
      });
      setFormData(newFormData);
    }
  }, [configs]);

  const saveAll = async () => {
    const settingsArray = Object.entries(formData).map(([key, value]) => ({
      configKey: key,
      configValue: String(value),
    }));

    await saveMutation.mutateAsync(settingsArray);
  };

  return {
    state: {
      formData,
      isLoading, // Este vem do useQuery e continua existindo
      // ✅ CORREÇÃO: trocado isLoading por isPending para a mutation
      isSaving: saveMutation.isPending, 
    },
    actions: {
      setFormData,
      saveAll,
    },
  };
}