import React, { useState } from "react"; // ✅ Adicionado React scope
import { trpc } from "@/_core/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { ShieldCheck, Loader2, Lock, ChevronRight, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { appToast as toast } from "@/lib/app-toast";

export default function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const loginMutation = trpc.auth.login.useMutation();
  const utils = trpc.useUtils();

  // ✅ Helper para toast sem 'any'
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast.warning("Campos obrigatorios.", {
        description: "Preencha todos os campos de credenciais."
      });
      return;
    }

    try {
      await loginMutation.mutateAsync({
        identifier: email.trim(),
        password: password
      });

      await utils.auth.me.invalidate();

      toast.success("Acesso autorizado.", {
        description: "Bem-vindo ao terminal de controle."
      });

      setTimeout(() => {
        navigate("/admin", { replace: true });
      }, 150);

    } catch (error: unknown) {
      // ✅ Captura de erro segura sem 'any'
      const errorMsg = error instanceof Error ? error.message : "Credenciais administrativas inválidas.";

      toast.error("Erro de autenticacao.", {
        description: errorMsg
      });
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 relative overflow-hidden font-sans">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] bg-emerald-500/10 blur-[120px] rounded-full" />
        <div className="absolute -bottom-[10%] -right-[10%] w-[50%] h-[50%] bg-blue-500/10 blur-[120px] rounded-full" />
      </div>

      <Card className="w-full max-w-md bg-slate-900/50 border-slate-800 backdrop-blur-xl shadow-2xl relative z-10 rounded-[2.5rem] overflow-hidden border">
        <CardContent className="p-10 space-y-8">

          <div className="text-center space-y-3">
            <div className="inline-flex p-4 bg-emerald-500/10 text-emerald-500 rounded-3xl mb-2 border border-emerald-500/20">
              <ShieldCheck size={40} className="animate-pulse" />
            </div>
            <h1 className="text-2xl font-black uppercase italic tracking-tighter text-white leading-none">
              Terminal <span className="text-emerald-500">Admin</span>
            </h1>
            <div className="flex items-center justify-center gap-2">
                <span className="h-[1px] w-8 bg-slate-800" />
                <p className="text-slate-500 text-[9px] font-black uppercase tracking-[0.3em]">
                    Acesso Restrito
                </p>
                <span className="h-[1px] w-8 bg-slate-800" />
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <Label className="text-slate-400 text-[10px] font-black uppercase ml-1 tracking-widest">
                E-mail Administrativo
              </Label>
              <div className="relative group text-left">
                <Input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="bg-slate-950/50 border-slate-800 h-14 rounded-2xl text-white font-bold focus:ring-2 focus:ring-emerald-500 transition-all pl-12 placeholder:text-slate-700"
                  placeholder="admin@gourmetsaudavel.com"
                  autoComplete="email"
                />
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-emerald-500 transition-colors" size={18} />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-400 text-[10px] font-black uppercase ml-1 tracking-widest">
                Chave de Segurança
              </Label>
              <div className="relative group text-left">
                <Input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="bg-slate-950/50 border-slate-800 h-14 rounded-2xl text-white font-bold focus:ring-2 focus:ring-emerald-500 transition-all pl-12 placeholder:text-slate-700"
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-emerald-500 transition-colors" size={18} />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loginMutation.isPending}
              className="w-full h-14 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black uppercase text-[11px] tracking-[0.2em] transition-all shadow-lg shadow-emerald-900/20 group"
            >
              {loginMutation.isPending ? (
                <Loader2 className="animate-spin" />
              ) : (
                <span className="flex items-center gap-2">
                    Desbloquear Sistema <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </span>
              )}
            </Button>
          </form>

          <div className="pt-4 text-center">
            <p className="text-[9px] font-bold text-slate-600 uppercase tracking-tight">
              IP de acesso registrado • Protocolo de segurança ativo
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="absolute bottom-10 opacity-5 select-none pointer-events-none text-center w-full">
          <h2 className="text-[120px] font-black italic text-white leading-none uppercase tracking-tighter">
              Admin
          </h2>
      </div>
    </div>
  );
}
