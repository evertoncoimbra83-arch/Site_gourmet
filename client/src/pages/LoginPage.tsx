import React, { useState } from "react"; // ✅ Adicionado React para o escopo JSX
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { appToast as toast } from "@/lib/app-toast"; 
import { trpc } from "@/_core/trpc";
import { getGuestId, rotateGuestId } from "@/lib/guest";
import { Loader2, Mail, Lock, User, FileText, Phone } from "lucide-react";
import { APP_LOGO, APP_TITLE } from "@/const";

// ✅ Interface para tipar o retorno do login e evitar 'any'
interface LoginResponse {
  success: boolean;
  status?: string;
  email?: string;
}

export default function LoginPage() {
  const navigate = useNavigate();
  const utils = trpc.useUtils();

  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [cpf, setCpf] = useState("");
  const [whatsapp, setWhatsapp] = useState("");

  const syncAuthAndCart = async () => {
    await utils.auth.me.invalidate();
    await utils.auth.me.fetch();
    await utils.store.cart.getSummary.invalidate();
    await utils.store.cart.getSummary.fetch();
  };

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: async (data: LoginResponse) => {

      if (data.status === "MIGRATION_REQUIRED") {
        toast.info("Identificamos seu primeiro acesso. Vamos validar sua conta!");
        
        const params = new URLSearchParams();
        params.set("email", data.email || email);
        navigate(`/auth/primeiro-acesso?${params.toString()}`);
        return;
      }

      if (data.success) {
        toast.success("Bem-vindo de volta!");
        await syncAuthAndCart();
        rotateGuestId();
        navigate("/", { replace: true });
      }
    },
    onError: (error) => {
      
      if (error.message === "RESET_REQUIRED" || error.data?.code === "PRECONDITION_FAILED") {
        navigate(`/auth/primeiro-acesso?email=${encodeURIComponent(email)}`);
        return;
      }

      toast.error(error.message || "Erro ao fazer login");
    },
  });

  const registerMutation = trpc.auth.register.useMutation({
    onSuccess: async (data) => {
      if (data.success) {
        toast.success("Conta criada com sucesso!");
        await syncAuthAndCart();
        rotateGuestId();
        navigate("/", { replace: true });
      }
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao cadastrar");
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      return toast.warning("E-mail e senha são obrigatórios");
    }

    const sessionId = getGuestId();

    if (isLogin) {
      loginMutation.mutate({ 
        identifier: email, 
        password,
        guestSessionId: sessionId || undefined
      });
    } else {
      if (!name || !cpf) {
        return toast.warning("Nome e CPF são obrigatórios para cadastro");
      }
      
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

  const isLoading = loginMutation.isPending || registerMutation.isPending;

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-md p-8 shadow-2xl rounded-4xl border-none">
        <div className="text-center mb-8">
          <img src={APP_LOGO} alt={APP_TITLE} className="h-16 w-16 mx-auto mb-4 rounded-2xl shadow-sm" />
          <h1 className="text-2xl font-black text-slate-800 uppercase tracking-tight italic">
            {isLogin ? "Acesse sua conta" : "Crie sua conta"}
          </h1>
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">
            {isLogin ? "Bem-vindo de volta" : "Preencha seus dados"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Nome Completo</label>
              <div className="relative">
                <User className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                <Input
                  className="pl-10 h-12 rounded-2xl bg-slate-50 border-slate-100 font-bold"
                  placeholder="Seu nome"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isLoading}
                />
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-slate-400 ml-1">
              {isLogin ? "E-mail ou CPF" : "E-mail"}
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
              <Input
                type="text"
                className="pl-10 h-12 rounded-2xl bg-slate-50 border-slate-100 font-bold"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
              />
            </div>
          </div>

          {!isLogin && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-1">CPF</label>
                <div className="relative">
                  <FileText className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                  <Input
                    className="pl-10 h-12 rounded-2xl bg-slate-50 border-slate-100 font-bold"
                    placeholder="000.000.000-00"
                    value={cpf}
                    onChange={(e) => setCpf(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-1">WhatsApp</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                  <Input
                    className="pl-10 h-12 rounded-2xl bg-slate-50 border-slate-100 font-bold"
                    placeholder="(11) 99999-9999"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Senha</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
              <Input
                type="password"
                className="pl-10 h-12 rounded-2xl bg-slate-50 border-slate-100 font-bold"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
              />
            </div>
          </div>

          <Button
            type="submit"
            className="w-full h-14 bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase tracking-[0.2em] text-xs rounded-2xl shadow-lg transition-all active:scale-95 mt-2"
            disabled={isLoading}
          >
            {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : (isLogin ? "ACESSAR CONTA" : "CRIAR CONTA")}
          </Button>
        </form>

        <div className="mt-8 text-center">
          <button
            type="button"
            onClick={() => {
              setIsLogin(!isLogin);
              setEmail("");
              setPassword("");
            }}
            className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-emerald-600 transition-colors"
          >
            {isLogin ? (
              <>Ainda não tem conta? <span className="text-emerald-600">Cadastre-se</span></>
            ) : (
              <>Já possui cadastro? <span className="text-emerald-600">Fazer Login</span></>
            )}
          </button>
        </div>
      </Card>
    </div>
  );
}
