import { useMemo, useState } from "react";
import { appToast as toast } from "@/lib/app-toast";
import { trpc } from "@/_core/trpc";

interface AdminApiRouter {
  generateToken: {
    useMutation: () => {
      mutateAsync: () => Promise<{
        token: string;
        generatedAt: string;
        message: string;
      }>;
      isPending: boolean;
    };
  };
}

export function useIntegrationAdmin() {
  const [generatedToken, setGeneratedToken] = useState("");
  const [generatedAt, setGeneratedAt] = useState("");

  const adminApi = (trpc.admin as unknown as { api: AdminApiRouter }).api;
  const generateTokenMutation = adminApi.generateToken.useMutation();

  const handleGenerateToken = async () => {
    try {
      const response = await generateTokenMutation.mutateAsync();
      setGeneratedToken(response.token);
      setGeneratedAt(response.generatedAt);
      toast.success("Chave do GourmetIA Bridge atualizada.", {
        description: response.message,
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Nao foi possivel gerar a chave de integracao.";

      toast.error("Falha ao gerar a chave.", {
        description: message,
      });
    }
  };

  const maskedToken = useMemo(() => {
    if (!generatedToken) return "";
    if (generatedToken.length <= 10) return generatedToken;

    return `${generatedToken.slice(0, 8)}...${generatedToken.slice(-6)}`;
  }, [generatedToken]);

  return {
    state: {
      generatedToken,
      generatedAt,
      maskedToken,
      isGenerating: generateTokenMutation.isPending,
      hasToken: generatedToken.length > 0,
    },
    actions: {
      handleGenerateToken,
      clearToken: () => {
        setGeneratedToken("");
        setGeneratedAt("");
      },
    },
  };
}
