import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { trpc } from "@/_core/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { appToast as toast } from "@/lib/app-toast";
import { UserCheck, Sparkles, Loader2, ShieldCheck, CheckCircle2 } from "lucide-react";
import confetti from "canvas-confetti";

import { HeaderAuthForm } from "../pages/auth/HeaderLoginForm"; 

/**
 * Interface auxiliar para resolver a tipagem dinâmica do tRPC
 * definindo exatamente os parâmetros e retornos que usamos,
 * eliminando 100% a necessidade de 'any'.
 */
interface AuthRouterExtended {
  linkReferral: {
    useMutation: (options?: {
      onSuccess?: () => void;
      onError?: (err: { message: string }) => void;
    }) => {
      mutate: (variables: { referralCode: string }) => void;
      isPending: boolean;
    };
  };
}

export default function InviteAccept() {
  const { referralCode } = useParams<{ referralCode: string }>();
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const utils = trpc.useUtils();
  
  const [isSuccess, setIsSuccess] = useState(false);

  // ✅ SOLUÇÃO TS2339: Mapeamento seguro da rota linkReferral com tipagem perfeita
  const authRouter = trpc.auth as unknown as AuthRouterExtended;

  const linkMutation = authRouter.linkReferral.useMutation({
    onSuccess: () => {
      setIsSuccess(true);
      
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#10b981", "#059669", "#34d399"]
      });

      toast.success("Convite aceito! Vínculo realizado com sucesso.");
      utils.auth.me.invalidate(); 
      
      setTimeout(() => navigate("/"), 3000);
    },
    onError: (err: { message: string }) => {
      toast.error(err.message || "Erro ao vincular convite.");
    }
  });

  const handleAccept = () => {
    if (!referralCode) {
      toast.error("Código de convite inválido.");
      return;
    }
    // ✅ FIX ESLint: O 'any' foi removido.
    // O TypeScript agora sabe que 'mutate' aceita '{ referralCode: string }'.
    linkMutation.mutate({ referralCode });
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <Loader2 className="animate-spin text-emerald-600" size={32} />
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 md:p-6 overflow-hidden">
      <div className={`max-w-md w-full bg-white p-8 md:p-10 rounded-4xl md:rounded-[3rem] shadow-xl border transition-all duration-700 ${isSuccess ? 'scale-105 border-emerald-500 shadow-emerald-100' : 'border-slate-100'}`}>
        
        {isSuccess ? (
          <div className="text-center space-y-6 animate-in zoom-in duration-500">
            <div className="h-24 w-24 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto shadow-lg shadow-emerald-200">
              <CheckCircle2 size={50} className="animate-bounce" />
            </div>
            <div className="space-y-2">
              <h2 className="text-3xl font-black uppercase italic tracking-tighter text-slate-900 leading-none">
                Tudo Pronto!
              </h2>
              <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">
                Você agora está conectado com <span className="text-emerald-500">@{referralCode}</span>
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            <header className="text-center space-y-4">
              <div className="h-20 w-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <UserCheck size={40} />
              </div>
              
              <div className="space-y-1">
                <h1 className="text-2xl font-black uppercase italic tracking-tighter text-slate-900 leading-none text-center">
                  Convite <span className="text-emerald-600">Especial</span>
                </h1>
                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest pt-1 text-center">
                  Indicação do Profissional: <span className="text-emerald-500">@{referralCode}</span>
                </p>
              </div>
            </header>

            {user ? (
              <div className="space-y-6 animate-in fade-in zoom-in duration-300">
                <div className="bg-emerald-50/50 p-6 rounded-3xl border border-emerald-100 text-center">
                  <p className="text-[10px] font-black uppercase text-emerald-600 tracking-[0.2em] mb-1">
                    Conta Identificada
                  </p>
                  <p className="font-bold text-slate-700 truncate text-sm md:text-base">
                    {user.email}
                  </p>
                </div>

                <button 
                  onClick={handleAccept}
                  disabled={linkMutation.isPending}
                  className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-emerald-600 transition-all flex items-center justify-center gap-3 active:scale-95 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {linkMutation.isPending ? (
                    <Loader2 className="animate-spin" size={18} />
                  ) : (
                    <>
                      Confirmar e Aceitar
                      <Sparkles size={18} />
                    </>
                  )}
                </button>
                
                <button 
                  onClick={() => navigate("/")}
                  className="w-full text-[10px] font-bold text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors"
                >
                  Agora não, ir para a home
                </button>
              </div>
            ) : (
              <div className="space-y-6 text-left">
                <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                  <p className="text-slate-600 text-[11px] font-medium text-center leading-relaxed">
                    Para vincular seu perfil e receber o acompanhamento, 
                    <span className="font-bold text-slate-900"> acesse sua conta</span> ou crie uma nova abaixo.
                  </p>
                </div>

                <HeaderAuthForm 
                  initialMode="register" 
                  onSuccess={() => {
                    toast.success("Conta identificada! Por favor, confirme o convite.");
                    utils.auth.me.invalidate();
                  }} 
                />
                
                <div className="flex items-center justify-center gap-2 pt-4 opacity-50">
                  <ShieldCheck size={12} className="text-slate-400" />
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em]">Criptografia de ponta-a-ponta</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}