import React, { useState } from "react"; // ✅ Adicionado React para o escopo do JSX
import { trpc } from "@/_core/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, ArrowLeft, CheckCircle2, Loader2, Leaf } from "lucide-react"; // ✅ Adicionado Leaf para o tema
import { Link } from "react-router-dom"; 
import { appToast as toast } from "@/lib/app-toast"; 

export default function ForgotPasswordView() {
  const [email, setEmail] = useState("");
  const [isSent, setIsSent] = useState(false);

  // ✅ Removido 'any' e alinhado ao tom Gourmet Saudável
  const mutation = trpc.auth.requestPasswordReset.useMutation({
    onSuccess: () => {
      setIsSent(true);
      toast.success("Tudo pronto! 📧", {
        description: "Enviamos as instruções de recuperação para o seu e-mail."
      });
    },
    onError: (err) => {
      toast.error("Houve um imprevisto 🍎", {
        description: err.message || "Não conseguimos processar sua solicitação agora."
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim();

    if (!cleanEmail) {
      return toast.warning("Campo vazio? 📝", { description: "Informe seu e-mail para receber o link." });
    }
    
    if (!cleanEmail.includes("@")) {
      return toast.warning("E-mail incompleto 📧", { description: "Por favor, insira um endereço de e-mail válido." });
    }
    
    mutation.mutate({ email: cleanEmail });
  };

  // ✅ ESTADO: SUCESSO NO ENVIO
  if (isSent) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white p-10 rounded-4xl shadow-2xl shadow-slate-200 text-center animate-in zoom-in duration-500 border border-slate-50">
          <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 size={40} />
          </div>
          <h2 className="text-2xl font-black text-slate-900 mb-4 uppercase italic tracking-tighter">
            Verifique seu e-mail
          </h2>
          <p className="text-slate-500 mb-8 font-medium text-sm leading-relaxed">
            Se o e-mail <strong className="text-slate-900">{email}</strong> estiver em nossa horta, enviamos um link mágico para você redefinir sua senha. 🍏
          </p>
          
          <Link to="/">
            <Button className="w-full rounded-2xl h-14 font-black uppercase tracking-widest bg-slate-900 hover:bg-emerald-600 transition-all border-none text-white">
              Voltar ao Início
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // ✅ ESTADO: FORMULÁRIO INICIAL
  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white p-10 rounded-4xl shadow-2xl shadow-slate-200 animate-in slide-in-from-bottom-4 duration-500 border border-slate-50">
        
        <Link to="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-emerald-600 mb-8 transition-colors text-xs font-black uppercase tracking-widest">
          <ArrowLeft size={16} /> Voltar ao Início
        </Link>
        
        <div className="flex items-center gap-2 mb-2">
          <Leaf className="text-emerald-500" size={24} />
          <h2 className="text-3xl font-black text-slate-900 italic tracking-tighter uppercase leading-none">
            RECUPERAR <span className="text-emerald-600">ACESSO</span>
          </h2>
        </div>
        <p className="text-slate-400 mb-8 font-bold text-[10px] uppercase tracking-widest">
          Insira o e-mail da sua conta Gourmet Saudável para receber as instruções.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">
              E-mail de Cadastro
            </Label>
            <div className="relative group">
              <Input 
                type="email"
                placeholder="seu@email.com"
                className="h-14 pl-12 rounded-2xl bg-slate-50 border-none font-bold focus:bg-white transition-all outline-none"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={mutation.isPending}
                autoComplete="email"
              />
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-500 transition-colors" size={18} />
            </div>
          </div>

          <Button 
            type="submit" 
            disabled={mutation.isPending}
            className="w-full bg-slate-900 text-white h-16 rounded-[1.5rem] font-black uppercase tracking-[0.2em] text-xs hover:bg-emerald-600 transition-all shadow-xl shadow-slate-200 disabled:opacity-50 active:scale-[0.98]"
          >
            {mutation.isPending ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              "Enviar Link de Recuperação"
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}