import { useState } from "react";
import { trpc } from "../../../_core/trpc";
import { useNavigate } from "react-router-dom";
import { TRPCClientError } from "@trpc/client";
import { getSavedReferral, getGuestId } from "@/lib/guest"; // ✅ Importado

interface LoginFormData {
  identifier: string;
  password?: string | null;
  guestSessionId?: string | null;
  referralCode?: string | null; // ✅ Adicionado ao tipo
}

export const useLogin = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const loginMutation = trpc.auth.login.useMutation({
    onMutate: () => {
      setLoading(true);
      setError(null);
    },
    onSuccess: (data) => {
      if (data.status === "SUCCESS") {
        // ✅ Se logou com sucesso, podemos limpar o referral local
        // ou deixar para o servidor confirmar o vínculo.
        localStorage.removeItem('gourmet_referral_code');
        navigate("/dashboard");
      }
      if (data.status === "MIGRATION_REQUIRED") {
        navigate(`/primeiro-acesso?email=${data.email}`);
      }
    },
    onError: (err) => {
      setError(err.message || "Ocorreu um erro inesperado.");
    },
    onSettled: () => {
      setLoading(false);
    }
  });

  const handleLogin = async (data: LoginFormData) => { 
    try {
      // ✅ Capturamos os dados de indicação e sessão de convidado antes de enviar
      const payload: LoginFormData = {
        ...data,
        guestSessionId: data.guestSessionId || getGuestId(),
        referralCode: getSavedReferral(), // 👈 O REFERRAL ENTRA AQUI
      };

      await loginMutation.mutateAsync(payload);
    } catch (err: unknown) {
      if (err instanceof TRPCClientError) {
        console.error("Erro no login:", err.message);
      } else if (err instanceof Error) {
        console.error("Erro inesperado:", err.message);
      }
    }
  };

  return {
    handleLogin,
    loading,
    error,
    loginMutation
  };
};