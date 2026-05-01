import { useState, useEffect } from "react";
import { trpc } from "@/_core/trpc"; 

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

  /**
   * 💾 SALVAR CONFIGURAÇÕES
   */
  const saveMutation = trpc.admin.mail.saveConfigs.useMutation({
    onSuccess: () => {
      utils.admin.mail.getConfigs.invalidate();
    }
  });

  /**
   * 🧪 TESTAR CONEXÃO SMTP
   * Essa mutação chama o procedimento de teste que você criou no router.
   */
  const testMutation = trpc.admin.mail.testConnection.useMutation();

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

  // ✅ Função para disparar o teste através do botão
  const testConnection = async (to: string) => {
    await testMutation.mutateAsync({ to });
  };

  return {
    state: {
      formData,
      isLoading,
      isSaving: saveMutation.isPending,
      isTesting: testMutation.isPending, // ✅ Exporta o estado de carregamento do teste
    },
    actions: {
      setFormData,
      saveAll,
      testConnection, // ✅ Exporta a ação de teste
    },
  };
}