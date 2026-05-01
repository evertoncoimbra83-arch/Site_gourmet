import React, { useState, useEffect } from "react";
import { useLogin } from "./login/logic/useLogin";
import { useAuth } from "@/_core/hooks/useAuth"; 
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Loader2, ShieldAlert, KeyRound } from "lucide-react";
import { APP_LOGO, APP_TITLE } from "@/const";
import { PasswordInput } from '@/components/PasswordInput';
import { SEO } from "@/components/SEO";
import { cn } from "@/lib/utils";

export default function LoginPage() {
  const { handleLogin, loading: isLoginLoading, error: loginError } = useLogin();
  const { isAuthenticated, loading: authLoading } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  // 🚨 Estados para o Modo de Contingência (Padrão Ouro)
  const [isEmergencyMode, setIsEmergencyMode] = useState(false);
  const [emergencySecret, setEmergencySecret] = useState("");
  const [totpCode, setTotpCode] = useState("");

  // O e-mail "fantasma" que dispara o bypass do banco (.10)
  const EMERGENCY_EMAIL = "admingourmet@gourmetsaudavel.com";

  useEffect(() => {
    if (email.toLowerCase() === EMERGENCY_EMAIL.toLowerCase()) {
      setIsEmergencyMode(true);
    } else {
      setIsEmergencyMode(false);
    }
  }, [email]);

  const isLoading = isLoginLoading || authLoading;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // No login administrativo, focamos apenas na entrada
    await handleLogin({ 
      identifier: email, 
      password,
      ...(isEmergencyMode && { emergencySecret, totpCode })
    });
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (isAuthenticated) return null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-slate-50 to-slate-100 p-4">
      <SEO title="Acesso ao Sistema" />
      
      <Card className={cn(
        "w-full max-w-md p-8 shadow-2xl rounded-[3rem] border-none text-left transition-all duration-500",
        isEmergencyMode ? "ring-4 ring-rose-500/20 bg-slate-900" : "bg-white"
      )}>
        <div className="text-center mb-8">
          {APP_LOGO && !isEmergencyMode && (
            <img 
              src={APP_LOGO} 
              alt={APP_TITLE} 
              className="h-20 w-20 mx-auto mb-4 rounded-3xl shadow-sm object-cover" 
            />
          )}
          
          {isEmergencyMode && (
            <div className="h-20 w-20 mx-auto mb-4 bg-rose-500 rounded-3xl flex items-center justify-center text-white shadow-lg shadow-rose-500/20 animate-pulse">
              <ShieldAlert size={40} />
            </div>
          )}

          <h1 className={cn(
            "text-2xl font-black uppercase tracking-tighter italic",
            isEmergencyMode ? "text-white" : "text-gray-900"
          )}>
            {isEmergencyMode ? "MODO RESILIÊNCIA" : APP_TITLE}
          </h1>
          <p className={cn(
            "text-[10px] font-black uppercase tracking-widest mt-2",
            isEmergencyMode ? "text-rose-400" : "text-gray-400"
          )}>
            {isEmergencyMode ? "QUEBRANDO O VIDRO DE EMERGÊNCIA" : "ACESSO AO TERMINAL BI"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {loginError && (
            <div className="p-4 bg-rose-500 text-white text-[10px] font-black rounded-2xl text-center uppercase tracking-widest">
              {loginError}
            </div>
          )}

          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-gray-400 ml-1">E-mail Administrativo</label>
            <Input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              placeholder="seu@email.com" 
              disabled={isLoading}
              className={cn(
                "h-12 rounded-2xl border-none focus-visible:ring-2",
                isEmergencyMode ? "bg-slate-800 text-white focus-visible:ring-rose-500/50" : "bg-gray-50 focus-visible:ring-emerald-500/20"
              )}
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-gray-400 ml-1">Senha</label>
            <PasswordInput 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              disabled={isLoading}
              className={cn(
                "h-12 rounded-2xl border-none focus-visible:ring-2",
                isEmergencyMode ? "bg-slate-800 text-white focus-visible:ring-rose-500/50" : "bg-gray-50 focus-visible:ring-emerald-500/20"
              )}
            />
          </div>

          {isEmergencyMode && (
            <div className="pt-4 space-y-4 animate-in slide-in-from-top-4 duration-500">
              <div className="h-px bg-slate-800 w-full mb-4" />
              
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-rose-400 ml-1">Segredo Master (Base32)</label>
                <div className="relative">
                  <Input 
                    type="password"
                    value={emergencySecret} 
                    onChange={(e) => setEmergencySecret(e.target.value)} 
                    placeholder="Cole seu segredo master"
                    className="h-12 rounded-2xl border-none bg-slate-800 text-white focus-visible:ring-rose-500 pl-10"
                  />
                  <KeyRound className="absolute left-3 top-3.5 text-slate-500" size={18} />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-rose-400 ml-1 text-center block">Código TOTP</label>
                <Input 
                  value={totpCode} 
                  onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, '').slice(0, 6))} 
                  placeholder="000000"
                  className="h-16 rounded-2xl border-none bg-slate-800 text-white text-center text-3xl font-black tracking-[0.5em] focus-visible:ring-rose-500"
                />
              </div>
            </div>
          )}

          <Button 
            type="submit" 
            className={cn(
              "w-full h-14 rounded-2xl font-black uppercase tracking-widest transition-all shadow-lg mt-4",
              isEmergencyMode 
                ? "bg-rose-600 hover:bg-rose-500 text-white" 
                : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200"
            )}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin mx-auto" />
            ) : (
              isEmergencyMode ? "EXECUTAR BYPASS" : "ENTRAR NO SISTEMA"
            )}
          </Button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">
            {isEmergencyMode ? "PROTOCOLO DE SEGURANÇA ATIVO" : "GOURMET SAUDÁVEL BI SYSTEM"}
          </p>
        </div>
      </Card>
    </div>
  );
}