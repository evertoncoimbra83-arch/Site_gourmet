import { useEffect } from "react";
import { trpc } from "../trpc";
import { toast } from "@/components/ui/use-toast";
import posthog from 'posthog-js';

export function useAuth() {
  const utils = trpc.useUtils();

  // 1. BUSCA DADOS DO USUÁRIO
  const { data: user, isLoading, isError, isFetching } = trpc.auth.me.useQuery(undefined, {
    retry: false,
    staleTime: 1000 * 60 * 1, 
    refetchOnWindowFocus: true,
  });

  // 2. SINCRONIZAÇÃO COM ANALYTICS (PostHog)
  useEffect(() => {
    const identifyId = user?.id;
    
    if (identifyId) {
      posthog.identify(identifyId.toString(), {
        email: user?.email,
        name: user?.name,
        role: user?.role,
        source: 'webapp'
      });
    }
  }, [user]);

  // 3. MUTAÇÃO DE LOGOUT
  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      posthog.reset();
      // Limpa todo o cache do tRPC para evitar vazamento de dados entre sessões
      utils.invalidate(); 
      utils.auth.me.setData(undefined, null);
      
      toast.success("Sessão encerrada!");
      
      // ✅ REDIRECIONAMENTO PARA A PÁGINA PRINCIPAL (/)
      setTimeout(() => {
        window.location.href = "/";
      }, 500);
    },
    onError: (err) => {
      if (err.data?.code === 'UNAUTHORIZED') {
          // ✅ REDIRECIONAMENTO PARA A PÁGINA PRINCIPAL (/) EM CASO DE SESSÃO JÁ INVÁLIDA
          window.location.href = "/";
      } else {
          toast.error(err.message || "Erro ao sair");
      }
    }
  });

  return { 
    user: user ?? null, 
    loading: isLoading || (isFetching && !user), 
    isAuthenticated: !!user && !isError,
    // Verificação de Role segura
    isAdmin: user?.role?.toLowerCase() === 'admin',
    logout: () => {
      if (!logoutMutation.isPending) {
        logoutMutation.mutate();
      }
    }
  };
}