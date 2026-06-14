import React, { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { trpc } from "@/_core/trpc";
import { appToast as toast } from "@/lib/app-toast";
import { Loader2 } from "lucide-react";

export default function OAuthCallbackPage() {
  const navigate = useNavigate();
  const utils = trpc.useUtils();
  const oauthCompleteMutation = trpc.auth.oauthGoogleComplete.useMutation();
  const hasTriggered = useRef(false);

  useEffect(() => {
    if (hasTriggered.current) return;
    hasTriggered.current = true;

    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const state = params.get("state");

    const expectedState = sessionStorage.getItem("oauth_state");
    const expectedNonce = sessionStorage.getItem("oauth_nonce");
    const codeVerifier = sessionStorage.getItem("oauth_code_verifier");
    const flowType = sessionStorage.getItem("oauth_flow_type");

    // Limpa sessionStorage
    const clearSessionStorage = () => {
      sessionStorage.removeItem("oauth_state");
      sessionStorage.removeItem("oauth_nonce");
      sessionStorage.removeItem("oauth_code_verifier");
      sessionStorage.removeItem("oauth_flow_type");
    };

    if (!code || !state || !expectedState || !expectedNonce || !codeVerifier) {
      clearSessionStorage();
      toast.error("Parâmetros OAuth inválidos ou fluxo expirado.");
      navigate("/", { replace: true });
      return;
    }

    oauthCompleteMutation.mutate(
      {
        provider: "google",
        code,
        state,
        expectedState,
        expectedNonce,
        codeVerifier,
      },
      {
        onSuccess: async (data) => {
          clearSessionStorage();
          if (data.status === "REQUIRES_CONFIRMATION") {
            // Fluxo de vinculação (usuário já estava logado)
            navigate(
              `/perfil/seguranca?linkingToken=${data.linkingToken}&email=${encodeURIComponent(
                data.email || ""
              )}`,
              { replace: true }
            );
          } else if (data.status === "SUCCESS") {
            // Login ou Cadastro com sucesso
            await utils.auth.me.invalidate();
            await utils.store.cart.getSummary.invalidate();

            toast.success("Autenticação Google realizada com sucesso! 🍏");

            // Redireciona para o painel
            navigate("/perfil", { replace: true });
          }
        },
        onError: (err) => {
          clearSessionStorage();
          toast.error("Erro na autenticação social", { description: err.message });
          navigate("/", { replace: true });
        },
      }
    );
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-slate-500">
      <Loader2 className="h-10 w-10 animate-spin text-emerald-600" />
      <h2 className="text-sm font-black uppercase tracking-widest text-slate-800">
        Verificando credenciais do Google...
      </h2>
      <p className="text-xs text-slate-400 font-semibold">
        Por favor, não feche ou recarregue esta janela.
      </p>
    </div>
  );
}
