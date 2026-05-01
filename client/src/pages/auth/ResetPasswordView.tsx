import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom"; 
import { trpc } from "@/_core/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ShieldCheck, Mail, Lock, CheckCircle2, Loader2, AlertTriangle } from "lucide-react";
import { appToast as toast } from "@/lib/app-toast";
import { rotateGuestId } from "@/lib/guest";

export default function FirstAccess() {
  const navigate = useNavigate();
  const { search } = useLocation();
  
  // ✅ Hook para manipular o cache do tRPC
  const utils = trpc.useUtils(); 

  const syncAuthAndCart = async () => {
    await utils.auth.me.invalidate();
    await utils.auth.me.fetch();
    await utils.store.cart.getSummary.invalidate();
    await utils.store.cart.getSummary.fetch();
  };

  // Memoização segura dos parâmetros da URL
  const { emailParam, tokenParam } = useMemo(() => {
    const query = new URLSearchParams(search);
    return {
      emailParam: query.get("email"),
      tokenParam: query.get("token")
    };
  }, [search]);

  // Define o passo inicial: 2 se já tiver token na URL, 1 caso contrário
  const [step, setStep] = useState<1 | 2>(tokenParam ? 2 : 1);
  
  const [formData, setFormData] = useState({
    token: tokenParam || "",
    password: "",
    confirmPassword: ""
  });

  // Proteção: Redireciona se a URL estiver vazia (prevenção de acesso direto)
  useEffect(() => {
    if (!emailParam && !tokenParam) {
      navigate("/login", { replace: true });
    }
  }, [emailParam, tokenParam, navigate]);

  // --- MUTAÇÕES ---
  
  // 1. Solicita o envio do e-mail com o token de reset
  const sendCodeMutation = trpc.auth.requestPasswordReset.useMutation({
    onSuccess: () => {
      toast.success("Link enviado!", { 
        description: "Verifique sua caixa de entrada e spam." 
      });
      setStep(2); 
    },
    onError: (error) => {
      toast.error("Erro ao enviar e-mail", { description: error.message });
    }
  });

  // 2. Define a nova senha
  const resetMutation = trpc.auth.resetPassword.useMutation({
    onSuccess: async () => {
      toast.success("Senha definida com sucesso!", { 
        description: "Sua conta foi ativada. Bem-vindo(a)!" 
      });

      // ✅ PASSO CRÍTICO: Invalida a query 'me' para que o App perceba que estamos logados
      // Isso força o tRPC a buscar os dados do usuário usando o novo cookie de sessão.
      await syncAuthAndCart();
      rotateGuestId();

      // ✅ REDIRECIONAMENTO: Enviamos para a Home em vez do login para aproveitar o Auto-Login
      navigate("/", { replace: true });
    },
    onError: (error) => {
      toast.error("Falha ao salvar senha", { description: error.message });
    }
  });

  // --- AÇÕES ---

  const handleSendCode = () => {
    if (emailParam && emailParam.includes("@")) {
      sendCodeMutation.mutate({ email: emailParam.trim() });
    } else {
      toast.error("E-mail inválido ou não identificado.");
    }
  };

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    
    const { password, confirmPassword, token } = formData;

    if (!token.trim()) {
      return toast.warning("O código de verificação é obrigatório.");
    }
    if (password.length < 6) {
      return toast.warning("Sua senha deve ter pelo menos 6 caracteres.");
    }
    if (password !== confirmPassword) {
      return toast.warning("As senhas digitadas não são iguais.");
    }

    resetMutation.mutate({
      token: token.trim(),
      password: password
    });
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-6 animate-in fade-in zoom-in-95 duration-500 px-4">
      
      {/* HEADER VISUAL */}
      <div className="text-center space-y-2">
        <div className="mx-auto w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center mb-2 rotate-3 shadow-sm">
          <ShieldCheck className="text-emerald-600" size={28} />
        </div>
        <div>
          <h1 className="text-2xl font-black uppercase italic tracking-tighter text-slate-900 leading-none">
            Primeiro Acesso
          </h1>
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em] mt-1">
            Segurança & Verificação
          </p>
        </div>
      </div>

      <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl shadow-slate-200/50 border border-slate-100">
        
        {/* STEP 1: Solicitação de Link */}
        {step === 1 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="bg-emerald-50/50 p-5 rounded-2xl border border-emerald-100/50 flex gap-4 items-start">
              <AlertTriangle className="text-emerald-600 shrink-0 mt-1" size={20} />
              <div className="space-y-1">
                <h3 className="text-xs font-black uppercase text-emerald-900">Conta Migrada</h3>
                <p className="text-[11px] text-emerald-800/80 leading-relaxed font-semibold">
                  Sua conta foi migrada para nossa nova plataforma. Para garantir sua segurança, precisamos validar seu acesso via e-mail.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Confirmar e-mail de destino</span>
              <div className="text-sm font-bold text-slate-700 bg-slate-50 py-4 px-5 rounded-2xl truncate border border-slate-100 flex items-center gap-3">
                <Mail size={16} className="text-slate-400" />
                {emailParam || "E-mail não encontrado"}
              </div>
            </div>

            <Button 
              onClick={handleSendCode} 
              disabled={sendCodeMutation.isPending} 
              className="w-full h-14 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black uppercase text-xs tracking-widest transition-all shadow-lg shadow-emerald-200 active:scale-[0.98]"
            >
              {sendCodeMutation.isPending ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <>
                  <Mail className="mr-2" size={18} />
                  Enviar Link de Acesso
                </>
              )}
            </Button>

            <div className="text-center">
              <Link to="/login" className="text-[10px] font-black uppercase text-slate-400 hover:text-slate-900 transition-colors">
                Voltar para o Login
              </Link>
            </div>
          </div>
        )}

        {/* STEP 2: Definição de Senha */}
        {step === 2 && (
          <form onSubmit={handleResetPassword} className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="text-center space-y-2 mb-2">
              <p className="text-xs font-bold text-slate-500 px-4 leading-snug">
                Crie uma senha forte para finalizar a ativação da sua conta.
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase text-slate-400 ml-1 tracking-widest">Código de Verificação</label>
                <Input 
                  placeholder="Código recebido" 
                  className="h-12 bg-slate-50 border-slate-100 text-center tracking-widest font-mono text-lg font-bold uppercase rounded-xl focus:ring-emerald-500"
                  value={formData.token}
                  onChange={e => setFormData({...formData, token: e.target.value})}
                  readOnly={!!tokenParam}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase text-slate-400 ml-1 tracking-widest">Nova Senha</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                  <Input 
                    type="password"
                    placeholder="Mínimo 6 dígitos" 
                    className="h-12 pl-11 bg-slate-50 border-slate-100 rounded-xl font-bold focus:bg-white transition-all focus:ring-emerald-500"
                    value={formData.password}
                    onChange={e => setFormData({...formData, password: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase text-slate-400 ml-1 tracking-widest">Confirmar Senha</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                  <Input 
                    type="password"
                    placeholder="Repita sua senha" 
                    className="h-12 pl-11 bg-slate-50 border-slate-100 rounded-xl font-bold focus:bg-white transition-all focus:ring-emerald-500"
                    value={formData.confirmPassword}
                    onChange={e => setFormData({...formData, confirmPassword: e.target.value})}
                  />
                </div>
              </div>
            </div>

            <Button 
              type="submit"
              disabled={resetMutation.isPending} 
              className="w-full h-14 bg-slate-900 hover:bg-black text-white rounded-2xl font-black uppercase text-xs tracking-widest mt-2 shadow-xl shadow-slate-200 active:scale-[0.98]"
            >
              {resetMutation.isPending ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <>
                  <CheckCircle2 className="mr-2" size={18} />
                  Ativar Minha Conta
                </>
              )}
            </Button>
          </form>
        )}

      </div>
    </div>
  );
}
