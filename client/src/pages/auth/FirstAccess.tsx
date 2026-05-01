// e:/IA/projects/Site_React/client/src/pages/auth/FirstAccess.tsx

import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom"; 
import { trpc } from "@/_core/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ShieldCheck, Mail, Lock, CheckCircle2, Loader2, AlertTriangle } from "lucide-react";
import { appToast as toast } from "@/lib/app-toast";

// ✅ FIX ESLint 8: Interface para evitar o uso de 'any' nos erros
interface AuthError {
  message: string;
}

export default function FirstAccess() {
  const navigate = useNavigate();
  const { search } = useLocation();
  
  const utils = trpc.useUtils();

  const query = useMemo(() => new URLSearchParams(search), [search]);
  const emailParam = query.get("email");
  const tokenParam = query.get("token");
  
  const [step, setStep] = useState<1 | 2>(tokenParam ? 2 : 1);
  
  const [formData, setFormData] = useState({
    token: tokenParam || "",
    password: "",
    confirmPassword: ""
  });

  useEffect(() => {
    if (!emailParam && !tokenParam) {
      toast.error("Link inválido. Faça login novamente.");
      navigate("/login", { replace: true });
    }
  }, [emailParam, tokenParam, navigate]);

  // --- MUTAÇÕES ---
  
  const sendCodeMutation = trpc.auth.requestPasswordReset.useMutation({
    onSuccess: () => {
      toast.success("Código enviado!", { 
        description: `Verifique a caixa de entrada de ${emailParam}` 
      });
      setStep(2); 
    },
    // ✅ FIX ESLint 8: Tipagem manual do erro
    onError: (error: AuthError) => toast.error("Erro ao enviar código", { description: error.message })
  });

  const resetMutation = trpc.auth.resetPassword.useMutation({
    onSuccess: async () => {
      toast.success("Conta ativada com sucesso! 🎉", {
        description: "Bem-vindo! Você foi conectado automaticamente."
      });

      await utils.auth.me.invalidate();
      navigate("/", { replace: true });
    },
    // ✅ FIX ESLint 8: Tipagem manual do erro
    onError: (error: AuthError) => toast.error("Erro ao definir senha", { description: error.message })
  });

  // --- AÇÕES ---

  const handleSendCode = () => {
    if (emailParam) {
      sendCodeMutation.mutate({ email: emailParam });
    } else {
      toast.error("E-mail não identificado.");
    }
  };

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password.length < 6) {
      return toast.warning("A senha deve ter no mínimo 6 caracteres.");
    }
    if (formData.password !== formData.confirmPassword) {
      return toast.warning("As senhas não coincidem.");
    }
    if (!formData.token) {
      return toast.warning("O código é obrigatório.");
    }

    resetMutation.mutate({
      token: formData.token.trim(),
      password: formData.password
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 font-sans animate-in fade-in duration-500">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100">
        
        <div className="bg-slate-900 p-8 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-emerald-600/10"></div>
          <div className="relative z-10 flex flex-col items-center gap-3">
            <div className="bg-white/10 p-3 rounded-2xl backdrop-blur-sm border border-white/10">
              <ShieldCheck size={32} className="text-emerald-400" />
            </div>
            <div>
              <h1 className="text-xl font-black uppercase italic tracking-tighter text-white">Primeiro Acesso</h1>
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">Validação de Segurança</p>
            </div>
          </div>
        </div>

        <div className="p-8">
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100 flex gap-3 items-start text-left">
                <AlertTriangle className="text-emerald-600 shrink-0 mt-0.5" size={18} />
                <div className="space-y-1">
                  <h3 className="text-sm font-black uppercase text-emerald-900">Atualização de Conta</h3>
                  <p className="text-xs text-emerald-800 leading-relaxed font-medium">
                    Identificamos que sua conta foi migrada. Para sua segurança, enviaremos um código de validação para seu e-mail.
                  </p>
                </div>
              </div>

              <div className="text-center space-y-1">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">E-mail Cadastrado</p>
                <div className="flex items-center justify-center gap-2 bg-slate-100 py-3 px-4 rounded-xl border border-slate-200">
                  <Mail size={16} className="text-slate-400" />
                  <p className="text-sm font-black text-slate-800 truncate">
                    {emailParam || "---"}
                  </p>
                </div>
              </div>

              <Button 
                onClick={handleSendCode} 
                disabled={sendCodeMutation.isPending} 
                className="w-full h-14 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black uppercase text-xs tracking-widest transition-all shadow-lg active:scale-95"
              >
                {sendCodeMutation.isPending ? (
                  <Loader2 className="animate-spin mr-2" size={18} />
                ) : (
                  <CheckCircle2 className="mr-2" size={18} />
                )}
                Enviar Código de Acesso
              </Button>

              <div className="text-center">
                <Link to="/login" className="text-[10px] font-black uppercase text-slate-400 hover:text-slate-900 transition-colors">
                  Voltar para o Login
                </Link>
              </div>
            </div>
          )}

          {step === 2 && (
            <form onSubmit={handleResetPassword} className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="text-center space-y-2 mb-4">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 mb-2">
                  <Mail size={20} />
                </div>
                <h3 className="text-lg font-black uppercase italic tracking-tighter text-slate-900">Verifique seu E-mail</h3>
                <p className="text-xs font-bold text-slate-400 max-w-xs mx-auto uppercase leading-tight">
                  Insira o código enviado para <strong>{emailParam}</strong> ou clique no link recebido.
                </p>
              </div>

              <div className="space-y-4 text-left">
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-slate-400 ml-1 tracking-widest">Código (Token)</label>
                  <Input 
                    placeholder="Cole o código aqui..." 
                    className="h-12 bg-slate-50 border-slate-200 text-center tracking-widest font-mono text-lg font-bold uppercase rounded-xl"
                    value={formData.token}
                    onChange={e => setFormData({...formData, token: e.target.value})}
                    readOnly={!!tokenParam}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-slate-400 ml-1 tracking-widest">Nova Senha</label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-3.5 text-slate-400" size={18} />
                    <Input 
                      type="password"
                      placeholder="Mínimo 6 caracteres" 
                      className="h-12 pl-11 bg-slate-50 border-none rounded-xl font-bold focus:bg-white transition-all"
                      value={formData.password}
                      onChange={e => setFormData({...formData, password: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-slate-400 ml-1 tracking-widest">Confirmar Senha</label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-3.5 text-slate-400" size={18} />
                    <Input 
                      type="password"
                      placeholder="Repita a senha" 
                      className="h-12 pl-11 bg-slate-50 border-none rounded-xl font-bold focus:bg-white transition-all"
                      value={formData.confirmPassword}
                      onChange={e => setFormData({...formData, confirmPassword: e.target.value})}
                    />
                  </div>
                </div>
              </div>

              <Button 
                type="submit"
                disabled={resetMutation.isPending} 
                className="w-full h-14 bg-slate-900 hover:bg-black text-white rounded-2xl font-black uppercase text-xs tracking-widest mt-2 shadow-xl active:scale-95"
              >
                {resetMutation.isPending ? (
                  <Loader2 className="animate-spin mr-2" size={18} />
                ) : (
                  <CheckCircle2 className="mr-2" size={18} />
                )}
                Definir Senha e Entrar
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}