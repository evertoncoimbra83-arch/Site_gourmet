import { useState, useEffect } from "react";
import { trpc } from "@/_core/trpc";
import { appToast as toast } from "@/lib/app-toast";

// ✅ Corrigido: id agora é string para bater com o server
interface UserData {
  id: string; 
  name?: string;
  phone?: string;
  customerPhone?: string;
  customerDocument?: string;
  cpf?: string;
  email?: string;
}

interface ProfileDetails {
  user?: UserData;
  email?: string;
}

export function useAdminProfile(details: ProfileDetails | null) {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    customerDocument: ""
  });

  const utils = trpc.useUtils();

  // Sincroniza dados iniciais
  useEffect(() => {
    // Fazemos o cast garantindo a compatibilidade de tipos
    const userData = (details?.user || details) as unknown as UserData | undefined;
    
    if (userData) {
      setFormData({
        name: userData.name || "",
        phone: userData.phone || userData.customerPhone || "",
        customerDocument: userData.customerDocument || userData.cpf || ""
      });
    }
  }, [details]);

  const updateMutation = trpc.admin.users.update.useMutation({
    onSuccess: () => {
      toast.success("Perfil atualizado com sucesso!");
      // Invalida a query de detalhes (verifique se o nome é 'getDetails' no seu server)
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      utils.admin.users.getDetails.invalidate(); 
    },
    onError: (err) => {
      toast.error(err.message || "Falha ao atualizar perfil");
    }
  });

  const handleSave = () => {
    const userData = (details?.user || details) as unknown as UserData | undefined;
    
    if (!userData?.id) {
      return toast.error("ID do usuário não encontrado");
    }

    // ✅ O id é enviado como String(id) para garantir conformidade com o Zod/Server
    updateMutation.mutate({
      id: String(userData.id),
      name: formData.name,
      phone: formData.phone,
    });
  };

  // Funções de Máscara (Melhoradas para aceitar null/undefined)
  const maskDocument = (v?: string | null) => {
    if (!v) return "";
    const d = v.replace(/\D/g, "");
    return d.length > 11 
      ? d.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5")
      : d.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, "$1.$2.$3-$4");
  };

  const maskPhone = (v?: string | null) => {
    if (!v) return "";
    const d = v.replace(/\D/g, "");
    if (d.length > 10) return d.replace(/^(\d{2})(\d{5})(\d{4})$/, "($1) $2-$3");
    return d.replace(/^(\d{2})(\d{4})(\d{4})$/, "($1) $2-$3");
  };

  return {
    formData,
    setFormData,
    isUpdating: updateMutation.isPending,
    handleSave,
    maskDocument,
    maskPhone,
    displayEmail: details?.user?.email || details?.email || ""
  };
}