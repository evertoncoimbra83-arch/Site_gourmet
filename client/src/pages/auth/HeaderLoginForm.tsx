// client/src/.../HeaderAuthForm.tsx

import React, { useState, useRef, useEffect } from "react";
import { trpc } from "@/_core/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox"; // ✅ Importar o Checkbox
import { Loader2, User, Lock, Mail, Phone, Fingerprint, Leaf, LogIn, Globe } from "lucide-react";
import { appToast as toast } from "@/lib/app-toast";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { getGuestId, rotateGuestId } from "@/lib/guest";
import { getCleanErrorMessage, validateCPF, masks, checkDocumentUI } from "./logic/auth.logic";

type AuthMode = "login" | "register";

interface HeaderAuthFormProps {
  onSuccess?: () => void;
  initialEmail?: string;
  initialMode?: AuthMode;
}

interface AuthResponse {
  status?: string;
  email?: string;
  user?: {
    id: string;
    role?: string;
    name?: string;
  };
}

export function HeaderAuthForm({ onSuccess, initialEmail, initialMode }: HeaderAuthFormProps) {
  const utils = trpc.useUtils();
  const navigate = useNavigate();
  const location = useLocation();

  const [mode, setMode] = useState<AuthMode>(initialMode || "login");
  const [identifier, setIdentifier] = useState(initialEmail || "");
  const [rememberMe, setRememberMe] = useState(false); // ✅ ESTADO NOVO: Controle do "Lembrar"

  const firstInputRef = useRef<HTMLInputElement>(null);
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [cpf, setCpf] = useState("");
  const [cpfError, setCpfError] = useState<string | null>(null);

  const syncAuthAndCart = async () => {
    await utils.auth.me.invalidate();
    await utils.auth.me.fetch();
    await utils.store.cart.getSummary.invalidate();
    await utils.store.cart.getSummary.fetch();
  };

  useEffect(() => {
    if (initialEmail && mode === "login") {
      const timer = setTimeout(() => {
        const pwdInput = document.querySelector('input[type="password"]') as HTMLInputElement;
        pwdInput?.focus();
      }, 150);
      return () => clearTimeout(timer);
    } else {
      firstInputRef.current?.focus();
    }
  }, [mode, initialEmail]);

  const handleAuthSuccess = async (data: AuthResponse, isLogin: boolean) => {
    if (isLogin && data?.status === "MIGRATION_REQUIRED") {
      toast("Bem-vindo de volta! 🏠", {
        description: "Sua conta foi migrada com segurança. Defina uma nova senha.",
        icon: <Leaf className="text-emerald-500" size={18} />
      });
      navigate(`/primeiro-acesso?email=${encodeURIComponent(data.email || identifier)}`);
      return;
    }

    await syncAuthAndCart();
    rotateGuestId();
    if (onSuccess) onSuccess();

    const isAtConvite = location.pathname.includes('convite');
    if (!isAtConvite) {
      toast.success(isLogin ? "Que bom ter você de volta! 🍏" : "Conta criada com sucesso! ✨");
    }

    setTimeout(() => {
      if (isAtConvite) return;
      const userRole = data?.user?.role?.toLowerCase();
      if (userRole === "admin") {
        window.location.href = "/admin/dashboard";
      } else {
        const target =
          location.pathname === "/finalizar-pedido"
            ? "/finalizar-pedido"
            : location.pathname || "/";
        navigate(target);
      }
    }, 400);
  };

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: (data) => handleAuthSuccess(data as AuthResponse, true),
    onError: (err) => {
      toast.error("Dados não conferem 🍎", { description: getCleanErrorMessage(err) });
    }
  });

  const registerMutation = trpc.auth.register.useMutation({
    onSuccess: (data) => handleAuthSuccess(data as AuthResponse, false),
    onError: (err) => {
      const msg = getCleanErrorMessage(err);
      toast.error("Erro no cadastro", { description: msg });
      if (msg.toLowerCase().includes("já existe") || msg.toLowerCase().includes("cadastrado")) {
        setMode("login");
      }
    }
  });

  const oauthGoogleStartMutation = trpc.auth.oauthGoogleStart.useMutation({
    onSuccess: (data) => {
      sessionStorage.setItem("oauth_state", data.state);
      sessionStorage.setItem("oauth_nonce", data.nonce);
      sessionStorage.setItem("oauth_code_verifier", data.codeVerifier);
      sessionStorage.setItem("oauth_flow_type", "login");
      window.location.href = data.url;
    },
    onError: (err) => {
      toast.error("Erro ao iniciar Google Login", { description: err.message });
    }
  });

  const handleGoogleLogin = () => {
    oauthGoogleStartMutation.mutate({ provider: "google" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.includes("@")) return toast.error("E-mail inválido");
    if (!password) return toast.error("Senha e obrigatoria");
    if (mode === "register" && password.trim().length < 8) {
      return toast.error("Senha deve ter no minimo 8 caracteres");
    }

    if (mode === "login") {
      // ✅ ENVIANDO: rememberMe para o tRPC
      loginMutation.mutate({
        identifier: identifier.trim(),
        password,
        rememberMe,
        guestSessionId: getGuestId(),
      });
    } else {
      if (!name.trim()) return toast.error("Nome completo é obrigatório");
      if (!validateCPF(cpf)) return setCpfError("CPF inválido");

      registerMutation.mutate({
        name: name.trim(),
        email: identifier.trim(),
        password,
        whatsapp: phone.replace(/\D/g, ""),
        cpf: cpf.replace(/\D/g, ""),
        guestSessionId: getGuestId(),
      });
    }
  };

  const isLoading = loginMutation.isPending || registerMutation.isPending;

  return (
    <div className="w-full space-y-6 text-left">
      <header className="flex flex-col items-center mb-2">
        <div className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full flex items-center gap-2 mb-4 border border-emerald-100 shadow-sm">
          <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
          <span className="text-[9px] font-black uppercase tracking-widest">
            {mode === "login" ? "Ambiente Seguro" : "Novo Cliente"}
          </span>
        </div>

        <h2 className="text-2xl font-black uppercase italic tracking-tighter text-slate-900 leading-none flex flex-col items-center text-center">
          <span className="text-[10px] not-italic font-medium text-slate-400 tracking-[0.2em] mb-1">
            {mode === "login" ? "BEM-VINDO DE VOLTA" : "FAÇA PARTE DO CLUBE"}
          </span>
          <div className="flex items-center gap-1">
            {mode === "login" ? "Acesse sua " : "Crie sua "}
            <span className="text-emerald-600 relative">
              Conta
              <svg className="absolute -bottom-1 left-0 w-full" viewBox="0 0 100 10" preserveAspectRatio="none">
                <path d="M0,5 Q50,10 100,5" stroke="currentColor" strokeWidth="2" fill="none" className="text-emerald-200" />
              </svg>
            </span>
          </div>
        </h2>
      </header>

      <form onSubmit={handleSubmit} className="space-y-4">
        {mode === "register" && (
          <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="space-y-1">
              <Label className="text-[9px] font-black uppercase text-slate-500 ml-1">Nome Completo</Label>
              <div className="relative">
                <Input
                  ref={firstInputRef}
                  placeholder="Seu nome"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="pl-11 h-12 bg-slate-50/50 border-slate-100 focus:bg-white transition-all rounded-xl font-bold"
                  disabled={isLoading}
                />
                <User className="absolute left-4 top-3.5 text-slate-400" size={18} />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className={cn("text-[9px] font-black uppercase ml-1", cpfError ? "text-red-600" : "text-slate-500")}>CPF</Label>
                <div className="relative">
                  <Input
                    value={cpf}
                    onChange={(e) => { setCpf(masks.cpf(e.target.value)); setCpfError(null); }}
                    onBlur={() => setCpfError(checkDocumentUI(cpf))}
                    placeholder="000.000.000-00"
                    className={cn("pl-11 h-12 bg-slate-50/50 border-slate-100 focus:bg-white transition-all rounded-xl font-bold", cpfError && "border-red-500")}
                    disabled={isLoading}
                  />
                  <Fingerprint className="absolute left-4 top-3.5 text-slate-400" size={18} />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-[9px] font-black uppercase ml-1 text-slate-500">WhatsApp</Label>
                <div className="relative">
                  <Input
                    value={phone}
                    onChange={(e) => setPhone(masks.phone(e.target.value))}
                    placeholder="(00) 00000-0000"
                    className="pl-11 h-12 bg-slate-50/50 border-slate-100 focus:bg-white transition-all rounded-xl font-bold"
                    disabled={isLoading}
                  />
                  <Phone className="absolute left-4 top-3.5 text-slate-400" size={18} />
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-1">
          <Label className="text-[9px] font-black uppercase text-slate-500 ml-1">E-mail de Acesso</Label>
          <div className="relative">
            <Input
              type="email"
              ref={mode === "login" ? firstInputRef : undefined}
              placeholder="seu@email.com"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className="pl-11 h-12 bg-slate-50/50 border-slate-100 focus:bg-white transition-all rounded-xl font-bold"
              disabled={isLoading}
            />
            <Mail className="absolute left-4 top-3.5 text-slate-400" size={18} />
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex justify-between items-center ml-1">
            <Label className="text-[9px] font-black uppercase text-slate-500">Sua Senha</Label>
            {mode === "login" && (
              <Link to="/lembrar-senha" onClick={onSuccess} className="text-[9px] font-bold text-emerald-600 hover:text-emerald-700">
                Esqueci a senha
              </Link>
            )}
          </div>
          <div className="relative">
            <Input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-11 h-12 bg-slate-50/50 border-slate-100 focus:bg-white transition-all rounded-xl font-bold"
              disabled={isLoading}
            />
            <Lock className="absolute left-4 top-3.5 text-slate-400" size={18} />
          </div>
        </div>

        {/* ✅ NOVO: Caixa de "Lembrar de mim" */}
        {mode === "login" && (
          <div className="flex items-center space-x-2 ml-1 animate-in fade-in duration-500">
            <Checkbox
              id="remember"
              checked={rememberMe}
              onCheckedChange={(checked) => setRememberMe(checked as boolean)}
              className="border-slate-300 data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
            />
            <label
              htmlFor="remember"
              className="text-[10px] font-bold text-slate-500 uppercase tracking-wider cursor-pointer select-none"
            >
              Lembrar de mim
            </label>
          </div>
        )}

        <Button
          type="submit"
          disabled={isLoading}
          className="w-full bg-slate-900 hover:bg-emerald-600 text-white h-14 rounded-xl shadow-lg transition-all duration-300 group"
        >
          {isLoading ? (
            <Loader2 className="animate-spin" size={20} />
          ) : (
            <div className="flex items-center gap-2 font-black uppercase italic tracking-tight">
              <span>{mode === "login" ? "Entrar na Conta" : "Concluir Cadastro"}</span>
              <LogIn size={16} className="group-hover:translate-x-1 transition-transform" />
            </div>
          )}
        </Button>

        {/* Divisor para Login Social */}
        <div className="relative my-4 flex items-center justify-center">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-slate-100" />
          </div>
          <span className="relative bg-white px-4 text-[9px] font-black uppercase tracking-widest text-slate-400">
            Ou continuar com
          </span>
        </div>

        {/* Botão Google Login */}
        <Button
          type="button"
          variant="outline"
          disabled={isLoading || oauthGoogleStartMutation.isPending}
          onClick={handleGoogleLogin}
          className="w-full h-14 rounded-xl border-slate-100 hover:bg-slate-50 font-bold text-slate-700 flex items-center justify-center gap-3 transition-all duration-200"
        >
          <Globe className="h-4 w-4 text-red-500" />
          <span className="uppercase text-[10px] font-black tracking-widest">
            Entrar com o Google
          </span>
        </Button>
      </form>

      <footer className="text-center pt-2">
        <button
          type="button"
          onClick={() => setMode(mode === "login" ? "register" : "login")}
          className="group flex flex-col items-center gap-1 mx-auto outline-none"
        >
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            {mode === "login" ? "Ainda não tem acesso?" : "Já é de casa?"}
          </span>
          <span className="text-[11px] font-black uppercase text-emerald-600 group-hover:text-emerald-700 transition-colors border-b-2 border-emerald-100 group-hover:border-emerald-600 pb-0.5">
            {mode === "login" ? "Criar conta agora" : "Fazer Login"}
          </span>
        </button>
      </footer>
    </div>
  );
}

