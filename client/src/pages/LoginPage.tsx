import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";
import { trpc } from "@/_core/trpc";
import { Loader2, Mail, Lock, User, FileText, Phone } from "lucide-react";
import { APP_LOGO, APP_TITLE } from "@/const";

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();

  // --- ESTADOS DO FORMULÁRIO ---
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [cpf, setCpf] = useState("");
  const [whatsapp, setWhatsapp] = useState("");

  // --- MUTAÇÕES (TRPC) ---
  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: async (data) => {
      if (data.success) {
        toast.success("Bem-vindo de volta!");
        await utils.auth.me.invalidate();
        await utils.cart.getActive.invalidate();
        window.location.href = "/"; // Força o recarregamento do contexto de autenticação
      }
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao fazer login");
    },
  });

  const registerMutation = trpc.auth.register.useMutation({
    onSuccess: async (data) => {
      if (data.success) {
        toast.success("Conta criada com sucesso!");
        await utils.auth.me.invalidate();
        window.location.href = "/";
      }
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao cadastrar");
    },
  });

  // --- LÓGICA DE SUBMISSÃO ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      return toast.error("E-mail e senha são obrigatórios");
    }

    if (isLogin) {
      // ✅ LOGIN: Envia 'identifier' (Email ou CPF) para o backend
      loginMutation.mutate({ 
        identifier: email, 
        password 
      });
    } else {
      // ✅ CADASTRO: Valida os novos campos obrigatórios
      if (!name || !cpf) {
        return toast.error("Nome e CPF são obrigatórios para cadastro");
      }
      
      registerMutation.mutate({ 
        name,
        email, 
        password, 
        cpf: cpf.replace(/\D/g, ""), // Limpa pontos e traços
        whatsapp: whatsapp.replace(/\D/g, "") || undefined
      });
    }
  };

  const isLoading = loginMutation.isPending || registerMutation.isPending;

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-md p-8 shadow-2xl rounded-3xl border-none">
        {/* CABEÇALHO */}
        <div className="text-center mb-8">
          <img src={APP_LOGO} alt={APP_TITLE} className="h-16 w-16 mx-auto mb-4 rounded-2xl shadow-sm" />
          <h1 className="text-2xl font-black text-slate-800 uppercase tracking-tight">
            {isLogin ? "Acesse sua conta" : "Crie sua conta"}
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            {isLogin ? "Bem-vindo de volta à Gourmet Saudável" : "Preencha seus dados para começar"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* NOME (Apenas no Cadastro) */}
          {!isLogin && (
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Nome Completo</label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input
                  className="pl-10 h-11 rounded-xl bg-slate-50 border-slate-200"
                  placeholder="Seu nome"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isLoading}
                />
              </div>
            </div>
          )}

          {/* E-MAIL / IDENTIFIER */}
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-slate-400 ml-1">
              {isLogin ? "E-mail ou CPF" : "E-mail"}
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input
                type="text"
                className="pl-10 h-11 rounded-xl bg-slate-50 border-slate-200"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
              />
            </div>
          </div>

          {/* CPF E WHATSAPP (Apenas no Cadastro) */}
          {!isLogin && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-1">CPF (Obrigatório)</label>
                <div className="relative">
                  <FileText className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input
                    className="pl-10 h-11 rounded-xl bg-slate-50 border-slate-200"
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
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input
                    className="pl-10 h-11 rounded-xl bg-slate-50 border-slate-200"
                    placeholder="(11) 99999-9999"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
              </div>
            </div>
          )}

          {/* SENHA */}
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Senha</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input
                type="password"
                className="pl-10 h-11 rounded-xl bg-slate-50 border-slate-200"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
              />
            </div>
          </div>

          {/* BOTÃO DE SUBMISSÃO */}
          <Button
            type="submit"
            className="w-full h-12 bg-green-600 hover:bg-green-700 text-white font-bold rounded-2xl shadow-lg transition-all active:scale-95 mt-2"
            disabled={isLoading}
          >
            {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : (isLogin ? "ENTRAR" : "CRIAR CONTA AGORA")}
          </Button>
        </form>

        {/* ALTERNAR ENTRE LOGIN E CADASTRO */}
        <div className="mt-8 text-center">
          <button
            type="button"
            onClick={() => {
              setIsLogin(!isLogin);
              setEmail("");
              setPassword("");
              setName("");
              setCpf("");
              setWhatsapp("");
            }}
            className="text-sm text-slate-500 hover:text-green-600 font-medium transition-colors"
          >
            {isLogin ? (
              <>Ainda não tem conta? <span className="font-bold text-green-600">Cadastre-se</span></>
            ) : (
              <>Já possui cadastro? <span className="font-bold text-green-600">Fazer Login</span></>
            )}
          </button>
        </div>
      </Card>
    </div>
  );
}