import { useState } from "react";
import { trpc } from "@/_core/trpc"; 
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { ShieldCheck, Loader2, Lock, ChevronRight } from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "@/components/ui/use-toast";

export default function AdminLogin() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // ✅ Mutation e Utils para controle de cache
  const loginMutation = trpc.auth.login.useMutation();
  const utils = trpc.useUtils();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error("Preencha todos os campos de credenciais.");
      return;
    }

    try {
      // ✅ AJUSTE: Enviando 'identifier' em vez de 'email' para bater com o Schema
      await loginMutation.mutateAsync({ 
        identifier: email, 
        password: password 
      });
      
      // ✅ Invalida o cache para o sistema reconhecer o novo usuário imediatamente
      await utils.auth.me.invalidate();
      
      toast.success("Acesso autorizado. Bem-vindo ao painel.");
      
      // Pequeno delay para o estado global ser processado antes do redirecionamento
      setTimeout(() => {
        setLocation("/admin");
      }, 150);

    } catch (error: any) {
      const errorMsg = error.shape?.message || error.message || "Credenciais administrativas inválidas.";
      toast.error(errorMsg);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 relative overflow-hidden">
      {/* 🌌 Efeitos Visuais de Fundo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] bg-emerald-500/10 blur-[120px] rounded-full" />
        <div className="absolute -bottom-[10%] -right-[10%] w-[50%] h-[50%] bg-blue-500/10 blur-[120px] rounded-full" />
      </div>

      <Card className="w-full max-w-md bg-slate-900/50 border-slate-800 backdrop-blur-xl shadow-2xl relative z-10 rounded-[2.5rem] overflow-hidden border">
        <CardContent className="p-10 space-y-8">
          
          {/* Cabeçalho de Segurança */}
          <div className="text-center space-y-3">
            <div className="inline-flex p-4 bg-emerald-500/10 text-emerald-500 rounded-3xl mb-2 border border-emerald-500/20">
              <ShieldCheck size={40} className="animate-pulse" />
            </div>
            <h1 className="text-2xl font-black uppercase italic tracking-tighter text-white">
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
            {/* Campo Identificador (E-mail) */}
            <div className="space-y-2">
              <Label className="text-slate-400 text-[10px] font-black uppercase ml-1 tracking-widest">
                E-mail Administrativo
              </Label>
              <div className="relative group">
                <Input 
                  type="email" 
                  value={email} 
                  onChange={e => setEmail(e.target.value)}
                  className="bg-slate-950/50 border-slate-800 h-14 rounded-2xl text-white font-bold focus:ring-2 focus:ring-emerald-500 transition-all pl-12"
                  placeholder="admin@gourmet.com"
                />
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-emerald-500 transition-colors" size={18} />
              </div>
            </div>

            {/* Campo Senha */}
            <div className="space-y-2">
              <Label className="text-slate-400 text-[10px] font-black uppercase ml-1 tracking-widest">
                Chave de Segurança
              </Label>
              <div className="relative group">
                <Input 
                  type="password" 
                  value={password} 
                  onChange={e => setPassword(e.target.value)}
                  className="bg-slate-950/50 border-slate-800 h-14 rounded-2xl text-white font-bold focus:ring-2 focus:ring-emerald-500 transition-all pl-12"
                  placeholder="••••••••"
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
              IP de acesso registrado • Protocolo AES-256 ativo
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Marca d'água estilizada */}
      <div className="absolute bottom-10 opacity-5 select-none pointer-events-none">
          <h2 className="text-[120px] font-black italic text-white leading-none uppercase tracking-tighter">
              Admin
          </h2>
      </div>
    </div>
  );
}