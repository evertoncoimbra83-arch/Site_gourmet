// client/src/pages/profile/logic/ProfileLogic.ts

import { useMemo, useState } from "react";
import { trpc } from "@/_core/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

interface ProfileData {
  document?: string;
  customerDocument?: string;
  birthDate?: string;
  birth_date?: string;
  phone?: string;
  whatsapp?: string;
  name?: string;
  email?: string;
  birthYear?: number;
}

export function useProfileLogic() {
  const { user: authUser, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState("dados");
  const utils = trpc.useUtils();

  const profileQuery = trpc.profile.get.useQuery(undefined, { enabled: !!authUser });
  const addressesQuery = trpc.addresses.list.useQuery(undefined, { enabled: !!authUser });
  const loyaltyQuery = trpc.loyalty.getCustomerSummary.useQuery(undefined, { enabled: !!authUser });
  const loyaltyHistoryQuery = trpc.loyalty.getCustomerHistory.useQuery(undefined, { enabled: !!authUser });
  
  // ✅ ADICIONADO: Query de pedidos que estava faltando
  const ordersQuery = trpc.orders.list.useQuery(undefined, { 
    enabled: !!authUser && activeTab === "pedidos" 
  });

  const mergedUser = useMemo(() => {
    if (!authUser) return null;
    const dbData = (profileQuery.data || {}) as ProfileData;
    return {
      ...authUser,
      ...dbData,
      document: dbData.document || dbData.customerDocument || "",
      birthDate: dbData.birthDate || dbData.birth_date || "",
      phone: dbData.phone || dbData.whatsapp || "",
    };
  }, [authUser, profileQuery.data]);

  // Mutations
  const addAddressMutation = trpc.addresses.create.useMutation({ onSuccess: () => utils.addresses.list.invalidate() });
  const deleteAddressMutation = trpc.addresses.delete.useMutation({ onSuccess: () => utils.addresses.list.invalidate() });
  
  // ✅ ADICIONADO: Mutation para setar padrão
  const updateAddressMutation = (trpc.addresses as any).update?.useMutation({
    onSuccess: () => utils.addresses.list.invalidate(),
  });

  const isReady = !authLoading && !!authUser && !profileQuery.isLoading;
  const isLoading = authLoading || profileQuery.isLoading || addressesQuery.isLoading || loyaltyQuery.isLoading;

  return useMemo(
    () => ({
      isReady,
      isLoading,
      activeTab,
      setActiveTab,
      user: mergedUser,
      profile: profileQuery.data,
      
      // Endereços
      addresses: addressesQuery.data || [],
      isLoadingAddresses: addressesQuery.isLoading,
      isAddingAddress: addAddressMutation.isPending,
      isDeletingAddress: deleteAddressMutation.isPending,
      isSettingDefault: updateAddressMutation?.isPending || false,
      
      // Pedidos
      orders: ordersQuery.data || [],
      isLoadingOrders: ordersQuery.isLoading,

      // Fidelidade
      loyalty: loyaltyQuery.data,
      loyaltyHistory: loyaltyHistoryQuery.data || [],
      isLoadingLoyalty: loyaltyQuery.isLoading,

      // Ações
      addAddress: async (data: any) => addAddressMutation.mutateAsync(data),
      deleteAddress: async (id: string) => deleteAddressMutation.mutateAsync({ id }),
      setDefaultAddress: async (id: string) => {
        if (updateAddressMutation) {
          return updateAddressMutation.mutateAsync({ id, isDefault: true });
        }
      }
    }),
    [mergedUser, isReady, isLoading, activeTab, profileQuery.data, addressesQuery.data, ordersQuery.data, loyaltyQuery.data, loyaltyHistoryQuery.data, addAddressMutation, deleteAddressMutation, updateAddressMutation]
  );
}

export type ProfileVM = ReturnType<typeof useProfileLogic>;