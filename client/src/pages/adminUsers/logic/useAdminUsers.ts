// e:/IA/projects/Site_React/client/src/pages/adminUsers/logic/useAdminUsers.ts

import { useState, useEffect, useMemo } from "react";
import { trpc } from "@/_core/trpc";
import { appToast as toast } from "@/lib/app-toast";
import { keepPreviousData } from "@tanstack/react-query";

// ✅ FIX ESLint 8: Interfaces locais para evitar 'any' no map
interface RawAddress {
  isDefault?: boolean | number;
  [key: string]: unknown;
}

interface RawUser {
  addresses?: RawAddress[];
  address?: RawAddress;
  phone?: string;
  [key: string]: unknown;
}

export function useAdminUsers() {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const utils = trpc.useUtils();

  // ✅ Debounce para a busca
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1); 
    }, 400);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // 📡 Query Principal (Listagem)
  const usersQuery = trpc.admin.users.list.useQuery(
    { search: debouncedSearch, page, limit: 20 },
    { placeholderData: keepPreviousData }
  );

  // 📡 Query de Detalhes
  const detailsQuery = trpc.admin.users.getDetails.useQuery(
    { id: selectedUserId as string },
    { 
      enabled: !!selectedUserId,
      // ✅ Isso impede que dados de um usuário antigo apareçam enquanto o novo carrega
      placeholderData: undefined 
    }
  );

  // ⚡ Mutações
  const createUser = trpc.admin.users.create.useMutation({
    onSuccess: () => {
      utils.admin.users.list.invalidate();
      setIsCreateDialogOpen(false);
      toast.success("Cliente criado com sucesso!");
    },
    onError: (err) => toast.error(`Erro ao criar: ${err.message}`)
  });

  const updateUser = trpc.admin.users.update.useMutation({
    onSuccess: () => {
      utils.admin.users.list.invalidate();
      if (selectedUserId) {
        utils.admin.users.getDetails.invalidate({ id: selectedUserId });
      }
      toast.success("Perfil atualizado!");
    },
    onError: (err) => toast.error(`Erro ao atualizar: ${err.message}`)
  });

  const deleteUser = trpc.admin.users.delete.useMutation({
    onSuccess: () => {
      utils.admin.users.list.invalidate();
      setSelectedUserId(null);
      toast.info("Cliente removido.");
    },
    onError: (err) => toast.error(`Erro ao remover: ${err.message}`)
  });

  // ✅ FIX ESLint 8: Removido o 'as any' e substituído por ts-expect-error na propriedade opcional
  // @ts-expect-error - Rota 'reindex' pode não estar disponível na tipagem atual do tRPC
  const reindexDatabase = trpc.admin.users.reindex?.useMutation({
    onSuccess: () => {
      utils.admin.users.list.invalidate();
      toast.success("Banco de dados sincronizado!");
    },
    onError: (err: Error) => toast.error(`Erro na sincronização: ${err.message}`)
  }) ?? { isPending: false, mutate: () => {} };

  // ✅ Memoização da lista para performance
  const users = useMemo(() => {
    // ✅ FIX ESLint 8: Usando a interface local RawUser e RawAddress em vez de any
    return (usersQuery.data?.items as unknown as RawUser[])?.map((user) => {
      const defaultAddress = user.addresses?.find((a) => a.isDefault) || user.addresses?.[0];
      return {
        ...user,
        address: user.address || defaultAddress || null,
        phone: user.phone || "" 
      };
    }) || [];
  }, [usersQuery.data?.items]);

  return {
    state: {
      searchTerm,
      page,
      selectedUserId,
      isCreateDialogOpen,
      isLoading: usersQuery.isLoading,
      isRefetching: usersQuery.isRefetching,
      isLoadingDetails: detailsQuery.isFetching // ✅ Use isFetching para mostrar loader no Drawer ao trocar de usuário
    },
    actions: {
      setSearchTerm,
      setPage,
      setSelectedUserId,
      setIsCreateDialogOpen,
      clearSelection: () => setSelectedUserId(null)
    },
    data: {
      users, 
      totalCount: usersQuery.data?.total || 0,
      limit: usersQuery.data?.limit || 20,
      userDetails: detailsQuery.data
    },
    mutations: {
      createUser,
      updateUser,
      deleteUser,
      reindexDatabase
    }
  };
}