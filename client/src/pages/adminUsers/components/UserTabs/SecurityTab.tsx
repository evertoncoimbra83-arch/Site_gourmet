import { useState } from "react";
import { trpc } from "@/_core/trpc";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Key, ShieldAlert } from "lucide-react";
import { PasswordInput } from "@/components/PasswordInput";
import { toast } from "@/components/ui/use-toast";

export function SecurityTab({ userId }: { userId: number }) {
  const [pw, setPw] = useState("");
  const setPwMut = trpc.admin.users.setPassword.useMutation({
    onSuccess: () => { toast.success("Senha alterada com sucesso!"); setPw(""); }
  });

  return (
    <div className="max-w-md mx-auto py-10 space-y-8 animate-in zoom-in-95 duration-300">
      <div className="text-center space-y-3">
        <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-3xl flex items-center justify-center mx-auto shadow-sm">
          <Key size={30} />
        </div>
        <h4 className="font-black uppercase italic tracking-tighter text-xl text-slate-900">Alteração de Credenciais</h4>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Defina uma nova senha temporária para o cliente</p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Nova Senha de Acesso</Label>
          <PasswordInput 
             className="h-14 rounded-2xl bg-slate-50 border-none font-bold" 
             value={pw} 
             onChange={e => setPw(e.target.value)} 
          />
        </div>

        <div className="p-4 bg-amber-50 rounded-2xl flex gap-3 border border-amber-100">
           <ShieldAlert className="text-amber-600 shrink-0" size={18} />
           <p className="text-[10px] font-bold text-amber-800 leading-relaxed uppercase">
             Atenção: Ao salvar, a senha anterior será invalidada imediatamente. O cliente deverá usar a nova senha no próximo login.
           </p>
        </div>

        <Button 
          className="w-full h-14 bg-slate-900 hover:bg-black text-white rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-xl"
          onClick={() => {
            if (pw.length < 6) return toast.error("A senha deve ter no mínimo 6 caracteres.");
            setPwMut.mutate({ userId, password: pw });
          }}
          disabled={setPwMut.isPending || !pw}
        >
          CONFIRMAR NOVA SENHA
        </Button>
      </div>
    </div>
  );
}