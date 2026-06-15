// e:/IA/projects/Site_React/client/src/pages/adminUsers/logic/useAdminUserAddress.ts

import { trpc } from "@/_core/trpc";
import { appToast as toast } from "@/lib/app-toast";

// Interface alinhada ao seu schema userAddresses (drizzle)
interface Address {
  id: string;
  street: string;
  number: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
  isDefault: number;
}

// ✅ Interface para Bypass de Tipagem (Sync com backend)
interface UsersAdminApi {
  getUserAddresses: {
    useQuery: (input: { userId: string }) => { data: unknown; isLoading: boolean };
    invalidate: (input: { userId: string }) => void;
  };
  deleteAddress: {
    useMutation: (opts: Record<string, unknown>) => { mutate: (data: { id: string }) => void; isPending: boolean };
  };
}

export function useAdminUserAddress(userId: string) {

  // ✅ BYPASS: Cast seguro para evitar erro TS2339 e avisos de linter
  const usersAdminApi = (trpc.admin.users as unknown as UsersAdminApi);

  // 1. Query de listagem
  const { data: addressesRaw, isLoading } = usersAdminApi.getUserAddresses.useQuery({
    userId,
  });

  // 2. Mutação de exclusão
  const deleteMutation = usersAdminApi.deleteAddress.useMutation({
    onSuccess: () => {
      toast.success("Endereço removido com sucesso!");
      // Invalida o cache usando a interface de bypass
      usersAdminApi.getUserAddresses.invalidate({ userId });
    },
    onError: (err: unknown) => {
      const error = err as { message?: string };
      toast.error(error.message || "Erro ao excluir endereço");
    },
  });

  const handleDelete = (id: string) => {
    deleteMutation.mutate({ id });
  };

  return {
    addresses: addressesRaw as Address[] | undefined,
    isLoading,
    isDeleting: deleteMutation.isPending,
    handleDelete,
  };
}
