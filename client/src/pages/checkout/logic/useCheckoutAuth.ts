import { useEffect, useMemo, useState } from "react";
import { trpc } from "@/_core/trpc";
import { toast } from "@/components/ui/use-toast";
// Importamos a chave centralizada para evitar erros de digitação
import { GUEST_KEY } from "@/lib/guest"; 

export function useCheckoutAuth(user: any, utils: any): any {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerCpf, setCustomerCpf] = useState("");
  const [shippingPhone, setShippingPhone] = useState("");

  const isCPFValid = useMemo(
    () => (customerCpf || "").replace(/\D/g, "").length === 11,
    [customerCpf]
  );

  /**
   * Processa o sucesso da autenticação limpando caches e forçando
   * a atualização dos dados do usuário.
   */
  const handleAuthSuccess = async (message: string) => {
    toast.success(message);
    
    // ✅ CORREÇÃO: Remove a chave correta do visitante após o login/cadastro
    localStorage.removeItem(GUEST_KEY);

    try {
      // Invalida caches para atualizar Header, Carrinho e Perfil
      await Promise.all([
        utils.auth.me.invalidate(),
        utils.cart.get?.invalidate(),
        utils.cart.getSummary?.invalidate()
      ]);

      // Força o fetch para garantir que o objeto 'user' no componente pai seja populado
      await utils.auth.me.fetch();
    } catch (err) {
      // Falha silenciosa na atualização pós-login
    } finally {
      setPassword("");
    }
  };

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: (data) => {
      if (data.success) handleAuthSuccess("Bem-vindo!");
    },
    onError: (err) => {
      toast.error(err.message || "E-mail ou senha incorretos");
    },
  });

  const registerMutation = trpc.auth.register.useMutation({
    onSuccess: (data) => {
      if (data.success) handleAuthSuccess("Cadastro realizado com sucesso!");
    },
    onError: (err) => {
      toast.error(err.message || "Erro ao realizar cadastro");
    },
  });

  /**
   * Sincroniza os campos do formulário sempre que os dados 
   * do usuário autenticado mudarem.
   */
  useEffect(() => {
    if (!user) return;
    setIsLogin(false);
    setCustomerName(user.name || "");
    setCustomerCpf(user.customerDocument || user.cpf || "");
    setShippingPhone(user.phone || user.whatsapp || "");
    setEmail(user.email || "");
  }, [user]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (user) return;

    // ✅ CORREÇÃO: Busca o ID usando a constante correta
    const guestSessionId = localStorage.getItem(GUEST_KEY) || undefined;

    if (isLogin) {
      if (!email || !password) {
        return toast.error("Preencha e-mail e senha para continuar.");
      }
      loginMutation.mutate({ 
        identifier: email, 
        password,
        guestSessionId 
      });
    } else {
      if (!customerName || !email || !password || !customerCpf) {
        return toast.error("Preencha todos os campos obrigatórios.");
      }

      if (!isCPFValid) {
        return toast.error("Por favor, informe um CPF válido.");
      }

      registerMutation.mutate({
        name: customerName,
        email,
        password,
        cpf: customerCpf.replace(/\D/g, ""),
        whatsapp: shippingPhone.replace(/\D/g, ""),
        guestSessionId
      });
    }
  };

  return {
    authState: {
      isLogin,
      email,
      password,
      name: customerName,
      cpf: customerCpf,
      whatsapp: shippingPhone,
      isLoggedIn: !!user,
      isLoading: loginMutation.isPending || registerMutation.isPending,
      isCPFValid,
    },
    authActions: {
      setIsLogin,
      setEmail,
      setPassword,
      setName: setCustomerName,
      setCpf: setCustomerCpf,
      setWhatsapp: setShippingPhone,
      handleSubmit,
    },
    customerName,
    setCustomerName,
    customerCpf,
    setCustomerCpf,
    shippingPhone,
    setShippingPhone,
  };
}