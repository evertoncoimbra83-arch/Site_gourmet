import { useState } from "react";
import { trpc } from "@/_core/trpc";
import { Button } from "@/components/ui/button";
import { Mail, ArrowLeft, CheckCircle2, Loader2 } from "lucide-react";
import { Link } from "wouter";
import { toast } from "@/components/ui/use-toast";

export function ForgotPasswordView() {
  const [email, setEmail] = useState("");
  const [isSent, setIsSent] = useState(false);

  // ✅ CORREÇÃO CRÍTICA:
  // Agora apontamos para 'requestPasswordReset', alinhado com o backend (auth.ts).
  const mutation = trpc.auth.requestPasswordReset.useMutation({
    onSuccess: () => {
      setIsSent(true);
      toast.success("E-mail de recuperação enviado!");
    },
    onError: (err: any) => {
      toast.error(err.message || "Erro ao solicitar recuperação.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return toast.error("Por favor, insira o seu e-mail.");
    
    // Validação básica de formato
    if (!email.includes("@")) return toast.error("Insira um e-mail válido.");
    
    mutation.mutate({ email });
  };

  if (isSent) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white p-10 rounded-[40px] shadow-2xl shadow-slate-200 text-center animate-in zoom-in duration-500">
          <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 size={40} />
          </div>
          <h2 className="text-2xl font-black text-slate-900 mb-4 uppercase italic tracking-tighter">
            Verifique o seu e-mail
          </h2>
          <p className="text-slate-500 mb-8 font-medium text-sm leading-relaxed">
            Se o e-mail <strong className="text-slate-900">{email}</strong> estiver cadastrado, enviámos um link mágico para redefinir a sua senha.
          </p>
          <Link href="/login">
            <Button className="w-full rounded-2xl h-14 font-black uppercase tracking-widest bg-slate-900 hover:bg-emerald-600 transition-all">
              Voltar ao Login
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white p-10 rounded-[40px] shadow-2xl shadow-slate-200 animate-in slide-in-from-bottom-4 duration-500">
        <Link href="/login" className="inline-flex items-center gap-2 text-slate-400 hover:text-emerald-600 mb-8 transition-colors text-xs font-black uppercase tracking-widest">
          <ArrowLeft size={16} /> Voltar ao Login
        </Link>
        
        <h2 className="text-3xl font-black text-slate-900 mb-2 italic tracking-tighter uppercase">RECUPERAR ACESSO</h2>
        <p className="text-slate-400 mb-8 font-bold text-[10px] uppercase tracking-widest">
          Insira o e-mail da sua conta para receber as instruções.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">E-mail de Cadastro</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
              <input 
                type="email"
                placeholder="seu@email.com"
                className="w-full bg-slate-50 border-none h-14 pl-12 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-emerald-500 transition-all outline-none text-slate-900"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={mutation.isPending}
                autoComplete="email"
              />
            </div>
          </div>

          <Button 
            type="submit" 
            disabled={mutation.isPending}
            className="w-full bg-slate-900 text-white h-16 rounded-2xl font-black uppercase tracking-[0.2em] text-xs hover:bg-emerald-600 transition-all shadow-lg shadow-slate-200 disabled:opacity-50"
          >
            {mutation.isPending ? (
              <Loader2 className="animate-spin mr-2" size={18} />
            ) : (
              "Enviar Link Mágico"
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}