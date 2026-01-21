import { useState } from "react";
import { trpc } from "@/_core/trpc";
import { toast } from "@/components/ui/use-toast";
import { useAuth } from "@/_core/hooks/useAuth";

export function useLogin() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const utils = trpc.useUtils();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [cpf, setCpf] = useState(""); 
  const [whatsapp, setWhatsapp] = useState("");
  const [isLogin, setIsLogin] = useState(true);

  /**
   * Gerencia o sucesso da autenticação, atualiza o cache global 
   * e redireciona o usuário conforme seu nível de acesso.
   */
  const handleAuthSuccess = async (message: string) => {
    toast.success(message);
    
    // Limpa ID de visitante para que o carrinho seja vinculado definitivamente
    localStorage.removeItem("gourmet_guest_uuid");

    try {
      // Sincroniza o estado do usuário e do carrinho
      await Promise.all([
        utils.auth.me.invalidate(),
        utils.cart.getSummary.invalidate()
      ]);

      const freshUser = await utils.auth.me.fetch();

      if (!freshUser) {
        window.location.href = "/";
        return;
      }

      // Redirecionamento forçado para garantir limpeza de estados antigos do React
      window.location.href = freshUser.role === "admin" ? "/admin" : "/";
    } catch (error) {
      window.location.href = "/";
    }
  };

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: (data) => {
      if (data.success) handleAuthSuccess("Bem-vindo de volta!");
    },
    onError: (err) => {
      toast.error(err.message || "E-mail ou senha incorretos");
    },
  });

  const registerMutation = trpc.auth.register.useMutation({
    onSuccess: (data) => {
      if (data.success) handleAuthSuccess("Conta criada com sucesso!");
    },
    onError: (err) => {
      toast.error(err.message || "Erro ao criar conta");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!email || !password) {
      return toast.error("Preencha e-mail e senha");
    }

    const sessionId = localStorage.getItem("gourmet_guest_uuid");

    if (isLogin) {
      loginMutation.mutate({ 
        identifier: email, 
        password,
        guestSessionId: sessionId || undefined 
      });
    } else {
      if (!name || !cpf) return toast.error("Nome e CPF obrigatórios");
      
      registerMutation.mutate({ 
        name, 
        email, 
        password, 
        cpf: cpf.replace(/\D/g, ""), 
        whatsapp: whatsapp.replace(/\D/g, "") || undefined,
        guestSessionId: sessionId || undefined
      });
    }
  };

  return {
    state: { 
      email, 
      password, 
      name, 
      cpf, 
      whatsapp, 
      isLogin, 
      isLoading: loginMutation.isPending || registerMutation.isPending, 
      isAuthenticated, 
      authLoading 
    },
    actions: { 
      setEmail, 
      setPassword, 
      setName, 
      setCpf, 
      setWhatsapp, 
      setIsLogin, 
      handleSubmit 
    }
  };
}