import { useMemo, useState, useEffect } from "react";
import { trpc } from "@/_core/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { appToast as toast } from "@/lib/app-toast";

// --- INTERFACES ---

interface ProfileData {
  document?: string;
  customerDocument?: string;
  cpf?: string; 
  birthDate?: string;
  birth_date?: string;
  phone?: string;
  whatsapp?: string;
  name?: string;
  email?: string;
}

interface AuthUser {
  id: string | number;
  email?: string | null;
  name?: string | null;
  customerDocument?: string | null;
  document?: string | null;
  cpf?: string | null;
  phone?: string | null;
}

interface AddressInput {
  label: string;
  zipCode: string;
  street: string;
  number: string;
  neighborhood: string;
  city: string;
  state: string;
  complement?: string;
}

// ✅ Interface para mapear o router de endereços opcionalmente
interface AddressRouter {
  update?: {
    useMutation: typeof trpc.addresses.create.useMutation;
  };
}

export function useProfileLogic(subroute?: string) {
  const auth = useAuth();
  const authUser = auth.user as unknown as AuthUser | null;
  const authLoading = auth.loading;
  
  const utils = trpc.useUtils();

  const validTabs = ["home", "dados", "pedidos", "enderecos", "fidelidade", "seguranca"];
  
  const initialTab = useMemo(() => {
    if (!subroute) return "home";
    const primaryPart = subroute.split('/')[0];
    return validTabs.includes(primaryPart) ? primaryPart : "home";
  }, [subroute]);

  const [activeTab, setActiveTab] = useState(initialTab);

  useEffect(() => {
    const primaryPart = subroute?.split('/')[0] || "home";
    if (validTabs.includes(primaryPart)) {
      setActiveTab(primaryPart);
    }
  }, [subroute]);

  // --- QUERIES ---
  
  const profileQuery = trpc.profile.get.useQuery(undefined, { 
    enabled: !!authUser,
    staleTime: 1000 * 60 * 5 
  });

  const addressesQuery = trpc.addresses.list.useQuery(undefined, { 
    enabled: !!authUser && activeTab === "enderecos"
  });

  const loyaltyQuery = trpc.loyalty.getCustomerSummary.useQuery(undefined, { 
    enabled: !!authUser && (activeTab === "fidelidade" || activeTab === "home"),
    refetchOnWindowFocus: true
  });

  const loyaltyHistoryQuery = trpc.loyalty.getHistory.useQuery(undefined, { 
    enabled: !!authUser && (activeTab === "fidelidade" || activeTab === "home")
  });   

  const loyaltySettingsQuery = trpc.loyalty.getSettings.useQuery(undefined, {
    enabled: !!authUser && (activeTab === "fidelidade" || activeTab === "home")
  });
  
  const ordersQuery = trpc.orders.list.useQuery(undefined, { 
    enabled: !!authUser && (activeTab === "pedidos" || activeTab === "home")
  });

  const dietQuery = trpc.nutri.getDashboard.useQuery(undefined, {
    enabled: !!authUser && activeTab === "home",
    staleTime: 1000 * 60 * 10, // 10 minutos
    refetchOnWindowFocus: false
  });

  const sessionsQuery = trpc.auth.listSessions.useQuery(undefined, {
    enabled: !!authUser && activeTab === "seguranca",
  });

  const recentAuthQuery = trpc.auth.recentAuthActivity.useQuery(undefined, {
    enabled: !!authUser && activeTab === "seguranca",
  });

  // --- MUTATIONS DE SEGURANÇA ---

  const logoutOtherSessionsMutation = trpc.auth.logoutOtherSessions.useMutation({
    onSuccess: (count) => {
      utils.auth.listSessions.invalidate();
      utils.auth.recentAuthActivity.invalidate();
      toast.success(`Desconectado de ${count} outros dispositivos com sucesso! 🔒`);
    },
    onError: (err) => toast.error("Erro ao desconectar outros dispositivos", { description: err.message })
  });

  const logoutAllSessionsMutation = trpc.auth.logoutAllSessions.useMutation({
    onSuccess: () => {
      toast.success("Desconectado de todos os dispositivos. Redirecionando... 🔒");
      auth.logout();
    },
    onError: (err) => toast.error("Erro ao desconectar todos os dispositivos", { description: err.message })
  });

  const logoutSessionMutation = trpc.auth.logoutSession.useMutation({
    onSuccess: () => {
      utils.auth.listSessions.invalidate();
      utils.auth.recentAuthActivity.invalidate();
      toast.success("Dispositivo desconectado com sucesso! 🗑️");
    },
    onError: (err) => toast.error("Erro ao desconectar dispositivo", { description: err.message })
  });


  // --- LOGICA DE DADOS DO USUÁRIO ---

  const mergedUser = useMemo(() => {
    if (!authUser) return null;
    const dbData = (profileQuery.data || {}) as ProfileData;

    const dbDoc = dbData.document || dbData.customerDocument || dbData.cpf || "";
    const sessionDoc = authUser.customerDocument || authUser.cpf || authUser.document || "";

    const isMock = (val: string) => {
      const clean = String(val || "").replace(/\D/g, "");
      return clean.startsWith("123456789") || clean === "12234567890";
    };

    let finalDocument = dbDoc;
    if (!finalDocument && !isMock(sessionDoc)) {
      finalDocument = sessionDoc;
    }

    return {
      ...authUser,
      ...dbData,
      document: finalDocument,
      birthDate: dbData.birthDate || dbData.birth_date || "",
      phone: dbData.phone || dbData.whatsapp || authUser.phone || "",
    };
  }, [authUser, profileQuery.data]);

  // --- MUTATIONS ---

  const addAddressMutation = trpc.addresses.create.useMutation({ 
    onSuccess: () => {
      utils.addresses.list.invalidate();
      toast.success("Endereço salvo! 🏡");
    },
    onError: (err) => toast.error("Erro ao salvar", { description: err.message })
  });
  
  const deleteAddressMutation = trpc.addresses.delete.useMutation({ 
    onSuccess: () => {
      utils.addresses.list.invalidate();
      toast.success("Endereço removido. 🗑️");
    },
    onError: (err) => toast.error("Não foi possível remover", { description: err.message })
  });
  
  // ✅ Cast via interface em vez de 'any' para o router dinâmico
  const addressRouter = trpc.addresses as unknown as AddressRouter;
  const updateAddressMutation = addressRouter.update?.useMutation({
    onSuccess: () => {
      utils.addresses.list.invalidate();
      toast.success("Endereço atualizado! ✅");
    },
    onError: (err: { message: string }) => toast.error("Erro ao atualizar", { description: err.message })
  });

  // --- ESTADOS DE CARREGAMENTO ---

  const isReady = !authLoading && !!authUser && !profileQuery.isLoading;
  const isLoading = authLoading || profileQuery.isLoading;

  return useMemo(
    () => ({
      isReady,
      isLoading,
      activeTab,
      setActiveTab,
      subroute, 
      user: mergedUser,
      profile: profileQuery.data,
      addresses: addressesQuery.data || [],
      isLoadingAddresses: addressesQuery.isLoading,
      isAddingAddress: addAddressMutation.isPending,
      isDeletingAddress: deleteAddressMutation.isPending,
      isSettingDefault: updateAddressMutation?.isPending || false,
      orders: ordersQuery.data || [],
      isLoadingOrders: ordersQuery.isLoading,
      loyalty: loyaltyQuery.data,
      loyaltyHistory: loyaltyHistoryQuery.data || [],
      loyaltySettings: loyaltySettingsQuery.data || null,
      isLoadingLoyalty: loyaltyQuery.isLoading || loyaltyHistoryQuery.isLoading || loyaltySettingsQuery.isLoading,
      diet: dietQuery.data || [],
      isLoadingDiet: dietQuery.isLoading,

      sessions: sessionsQuery.data || [],
      isLoadingSessions: sessionsQuery.isLoading,
      recentAuthActivity: recentAuthQuery.data || [],
      isLoadingRecentAuth: recentAuthQuery.isLoading,
      isLoggingOutOther: logoutOtherSessionsMutation.isPending,
      isLoggingOutAll: logoutAllSessionsMutation.isPending,
      isRevokingSession: logoutSessionMutation.isPending,

      addAddress: async (data: AddressInput) => addAddressMutation.mutateAsync(data),
      deleteAddress: async (id: string) => deleteAddressMutation.mutateAsync({ id }),
      setDefaultAddress: async (id: string) => {
        if (updateAddressMutation) {
          // ✅ Detecta automaticamente o tipo dos parâmetros da mutação para o cast seguro
          type MutationParams = Parameters<typeof updateAddressMutation.mutateAsync>[0];
          return updateAddressMutation.mutateAsync({ 
            id, 
            isDefault: true 
          } as unknown as MutationParams);
        }
      },
      logoutOtherSessions: async () => logoutOtherSessionsMutation.mutateAsync(),
      logoutAllSessions: async () => logoutAllSessionsMutation.mutateAsync(),
      logoutSession: async (sessionId: string) => logoutSessionMutation.mutateAsync({ sessionId }),
      refreshAll: () => {
        utils.profile.get.invalidate();
        utils.loyalty.getCustomerSummary.invalidate();
        utils.loyalty.getHistory.invalidate();
        utils.loyalty.getSettings.invalidate();
        utils.orders.list.invalidate();
        utils.addresses.list.invalidate();
        utils.nutri.getDashboard.invalidate();
        utils.auth.listSessions.invalidate();
        utils.auth.recentAuthActivity.invalidate();
      }
    }),
    [
      isReady, isLoading, activeTab, subroute, mergedUser,
      profileQuery.data, addressesQuery.data, ordersQuery.data,
      loyaltyQuery.data, loyaltyHistoryQuery.data, loyaltySettingsQuery.data,
      dietQuery.data, addressesQuery.isLoading, ordersQuery.isLoading,
      loyaltyQuery.isLoading, loyaltyHistoryQuery.isLoading, loyaltySettingsQuery.isLoading,
      dietQuery.isLoading, addAddressMutation, deleteAddressMutation, 
      updateAddressMutation, sessionsQuery.data, sessionsQuery.isLoading,
      recentAuthQuery.data, recentAuthQuery.isLoading, logoutOtherSessionsMutation.isPending,
      logoutAllSessionsMutation.isPending, logoutSessionMutation.isPending,
      logoutOtherSessionsMutation, logoutAllSessionsMutation, logoutSessionMutation, utils
    ]
  );
}

export type ProfileVM = ReturnType<typeof useProfileLogic>;