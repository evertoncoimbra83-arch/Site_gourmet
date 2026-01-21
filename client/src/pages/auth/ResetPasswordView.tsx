import { useState } from "react";
import { trpc } from "@/_core/trpc";
import { Button } from "@/components/ui/button";
import { Lock, Check, Loader2, AlertCircle } from "lucide-react"; // Adicionado Loader2 e AlertCircle
import { useLocation } from "wouter";
import { toast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import { usePasswordStrength } from "@/_core/hooks/usePasswordStrength";

export function ResetPasswordView() {
  const [, setLocation] = useLocation();
  const [password, setPassword] = useState("");
  
  // Pegamos o token da URL
  const searchParams = new URLSearchParams(window.location.search);
  const token = searchParams.get("token");

  const { score, label, color, requirements } = usePasswordStrength(password);

  const mutation = trpc.auth.resetPassword.useMutation({
    onSuccess: () => {
      toast.success("Senha atualizada com sucesso! Já pode entrar.");
      setLocation("/login"); // Ajustado para ir direto ao login se preferir
    },
    onError: (err: any) => {
      toast.error(err.message || "Ocorreu um erro ao atualizar a senha.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return toast.error("Token de recuperação ausente ou inválido.");
    if (score < 3) return toast.error("A nova senha deve ser média ou forte.");
    
    mutation.mutate({ token, password });
  };

  // View para link inválido ou ausente
  if (!token) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white p-10 rounded-[40px] shadow-2xl shadow-slate-200 text-center border border-red-50">
          <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle size={32} />
          </div>
          <h2 className="text-xl font-black text-slate-900 mb-2 uppercase italic tracking-tighter">Link Inválido</h2>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-tight mb-8">
            Este link de recuperação expirou ou já foi utilizado.
          </p>
          <Button 
            variant="outline" 
            onClick={() => setLocation("/esqueci-senha")}
            className="w-full rounded-2xl h-12 font-black text-[10px] uppercase tracking-widest border-slate-200"
          >
            Solicitar Novo Link
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white p-10 rounded-[40px] shadow-2xl shadow-slate-200 animate-in zoom-in duration-500">
        <h2 className="text-3xl font-black text-slate-900 mb-2 italic tracking-tighter uppercase">NOVA SENHA</h2>
        <p className="text-slate-400 mb-8 font-bold text-[10px] uppercase tracking-widest">Escolha uma senha segura para o seu acesso.</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Crie sua nova Senha</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
              <input 
                type="password"
                placeholder="••••••••"
                className="w-full bg-slate-50 border-none h-14 pl-12 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-emerald-500 transition-all outline-none"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={mutation.isPending}
              />
            </div>

            {/* Medidor de Força */}
            {password.length > 0 && (
              <div className="px-1 pt-4 animate-in fade-in duration-300">
                <div className="flex justify-between items-center mb-1.5 text-[9px] font-black uppercase tracking-widest">
                  <span className="text-slate-400">Nível de Segurança:</span>
                  <span className={cn(color.replace('bg-', 'text-'))}>{label}</span>
                </div>
                <div className="flex gap-1 h-1.5">
                  {[1, 2, 3, 4].map((step) => (
                    <div key={step} className={cn("flex-1 rounded-full transition-all duration-500", score >= step ? color : "bg-slate-100")} />
                  ))}
                </div>
                <ul className="mt-4 space-y-1.5 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  {requirements.map((req) => (
                    <li key={req.id} className="flex items-center gap-2">
                      {req.met ? <Check className="text-emerald-500" size={10} strokeWidth={4} /> : <div className="w-1 h-1 rounded-full bg-slate-300 ml-1" />}
                      <span className={cn("text-[9px] font-bold tracking-tight", req.met ? "text-slate-700" : "text-slate-400")}>{req.label}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <Button 
            type="submit" 
            disabled={mutation.isPending || score < 3}
            className="w-full bg-slate-900 text-white h-16 rounded-2xl font-black uppercase tracking-[0.2em] text-xs hover:bg-emerald-600 transition-all shadow-xl shadow-slate-200 disabled:opacity-50"
          >
            {mutation.isPending ? (
              <Loader2 className="animate-spin mr-2" size={18} />
            ) : (
              "Confirmar Nova Senha"
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}