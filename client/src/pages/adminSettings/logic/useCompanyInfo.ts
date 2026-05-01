import { useState, useEffect } from "react";
import { trpc } from "@/_core/trpc";
import { appToast as toast } from "@/lib/app-toast";

// --- INTERFACES ---
export interface CompanySocialInfo {
  phone: string;
  whatsapp: string;
  email: string;
  address: string;
  instagram: string;
  facebook: string;
}

export interface CompanyFormData {
  logoUrl: string;
  companyInfo: CompanySocialInfo;
  [key: string]: unknown;
}

interface SettingsResponse {
  logoUrl?: string | null;
  logo_url?: string | null;
  companyInfo?: string | CompanySocialInfo | null;
  company_social_info?: string | CompanySocialInfo | null;
}

export function useCompanyInfo() {
  const utils = trpc.useUtils();
  
  const [formData, setFormData] = useState<CompanyFormData>({
    logoUrl: "",
    companyInfo: {
      phone: "", whatsapp: "", email: "", address: "", instagram: "", facebook: ""
    }
  });

  const { data: settings, isLoading } = trpc.public.getPublicSettings.useQuery(undefined, {
    staleTime: 5 * 60 * 1000, 
    retry: false
  });

  // Mutação original (Salva a Logo)
  const saveMutation = trpc.admin.storeSettings.saveCompanyInfo.useMutation({
    onError: (err: { message: string }) => {
      toast.error(`Erro ao salvar logo: ${err.message || "Tente novamente."}`);
    }
  });

  // ✅ NOVA MUTAÇÃO: Força a gravação das redes sociais direto no app_configs
  const saveConfigMutation = trpc.admin.storeSettings.saveConfig.useMutation({
    onError: (err: { message: string }) => {
      toast.error(`Erro ao salvar redes sociais: ${err.message || "Tente novamente."}`);
    }
  });

  useEffect(() => {
    if (settings) {
      const s = settings as SettingsResponse;
      let socialData: CompanySocialInfo = { 
        phone: "", whatsapp: "", email: "", address: "", instagram: "", facebook: "" 
      };
      
      try {
        const rawSocial = s.company_social_info || s.companyInfo;
        
        if (rawSocial) {
          if (typeof rawSocial === 'string') {
            if (rawSocial.trim().startsWith('{')) {
              socialData = { ...socialData, ...JSON.parse(rawSocial) };
            }
          } else {
            socialData = { ...socialData, ...rawSocial };
          }
        }
      } catch (err) {
        console.error("❌ Erro no Parse do JSON:", err);
      }

      setFormData({
        logoUrl: s.logo_url || s.logoUrl || "",
        companyInfo: socialData
      });
    }
  }, [settings]);

  const maskPhone = (value: string) => {
    const n = value.replace(/\D/g, "");
    if (n.length <= 10) return n.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3").substring(0, 14);
    return n.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3").substring(0, 15);
  };

  return {
    state: { 
      formData, 
      isLoading, 
      isPending: saveMutation.isPending || saveConfigMutation.isPending 
    },
    actions: { 
      updateSocial: (field: keyof CompanySocialInfo, value: string) => {
        const finalValue = (field === "whatsapp" || field === "phone") ? maskPhone(value) : value;
        setFormData(prev => ({
          ...prev,
          companyInfo: { ...prev.companyInfo, [field]: finalValue }
        }));
      },
      updateLogo: (url: string) => setFormData(prev => ({ ...prev, logoUrl: url })),
      
      // ✅ CORREÇÃO CRÍTICA AQUI: Usando async/await e mutateAsync
      handleSave: async () => {
        try {
          // 1. Envia a Logo pro Backend normal
          await saveMutation.mutateAsync(formData as Record<string, unknown>);

          // 2. Transforma as redes sociais em texto e FORÇA a gravação no banco
          await saveConfigMutation.mutateAsync({
            key: 'company_social_info',
            value: JSON.stringify(formData.companyInfo)
          });

          // 3. Limpa o cache para a tela atualizar
          utils.public.getPublicSettings.invalidate();
          toast.success("Configurações salvas com sucesso!");
        } catch (err) {
          console.error("Erro na gravação:", err);
        }
      }
    }
  };
}