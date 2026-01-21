import { useEffect } from "react";
import { useLocation } from "wouter";
import { trpc } from "../_core/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldAlert, Loader2 } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

export default function DevLogin() {
  const [, setLocation] = useLocation();

  // Mutation do tRPC que criamos acima
  const loginMutation = trpc.auth.devLogin.useMutation({
    onSuccess: (data) => {
      toast.success(`Bem-vindo, Chefe! Logado como: ${data.user.name}`);
      // Redireciona para o Admin
      setLocation("/admin");
      // Força um reload para garantir que o App pegue o novo cookie
      window.location.href = "/admin"; 
    },
    onError: (error) => {
      toast.error(error.message);
    }
  });

  const handleDevLogin = () => {
    loginMutation.mutate();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
      <Card className="w-full max-w-md border-slate-800 bg-slate-900 text-slate-100">
        <CardHeader className="text-center">
          <div className="mx-auto bg-yellow-500/10 p-4 rounded-full w-fit mb-4">
            <ShieldAlert className="h-10 w-10 text-yellow-500" />
          </div>
          <CardTitle className="text-2xl font-black uppercase tracking-widest text-yellow-500">
            Modo Desenvolvedor
          </CardTitle>
          <p className="text-slate-400 text-sm">
            Acesso de superusuário sem senha. <br/>
            <span className="text-red-400 font-bold uppercase text-[10px]">Apenas Localhost</span>
          </p>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={handleDevLogin} 
            disabled={loginMutation.isPending}
            className="w-full h-14 text-lg font-bold bg-yellow-500 hover:bg-yellow-600 text-slate-900"
          >
            {loginMutation.isPending ? (
              <><Loader2 className="mr-2 animate-spin"/> Acessando Mainframe...</>
            ) : (
              "ENTRAR COMO ADMIN"
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}