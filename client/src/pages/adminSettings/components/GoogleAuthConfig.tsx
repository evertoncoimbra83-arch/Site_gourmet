import { useState, useEffect } from "react";
import { trpc } from "@/_core/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";
import { Loader2, ShieldCheck, Lock, Key } from "lucide-react"; // ✅ Corrigido para Key

export function GoogleAuthConfig() {
  const [enabled, setEnabled] = useState(false);
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");

  // Busca configurações (Agora o 'get' retorna o objeto googleLogin unido)
  const { data: currentConfigs, isLoading: isFetching } = trpc.admin.storeSettings.get.useQuery();

  // ✅ SINCRONIZAÇÃO COM O BANCO
  useEffect(() => {
    // Usamos o cast 'as any' caso o cache do tRPC ainda não tenha atualizado o Schema no seu editor
    const config = (currentConfigs as any)?.googleLogin;
    
    if (config) {
      setEnabled(config.enabled ?? false);
      setClientId(config.clientId ?? "");
      setClientSecret(config.clientSecret ?? "");
    }
  }, [currentConfigs]);

  const mutation = trpc.admin.storeSettings.saveGoogleConfig.useMutation({
    onSuccess: () => {
      toast.success("Credenciais protegidas e salvas com sucesso!");
    },
    onError: (err) => toast.error(`Falha ao salvar: ${err.message}`)
  });

  const handleSave = () => {
    if (!clientId || !clientSecret) {
      return toast.error("Por favor, preencha o Client ID e o Secret.");
    }
    mutation.mutate({ enabled, clientId, clientSecret });
  };

  return (
    <Card className="rounded-[2.5rem] border-none shadow-sm bg-white overflow-hidden border border-slate-100">
      <CardHeader className="p-8 bg-slate-50/50 border-b border-slate-100">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-xl font-black uppercase italic tracking-tighter text-slate-900 flex items-center gap-2">
              <ShieldCheck className="text-emerald-600" size={22} /> 
              Autenticação <span className="text-emerald-600">Google</span>
            </CardTitle>
            <CardDescription className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1">
              <Lock size={12} /> Criptografia AES-256-GCM Ativa
            </CardDescription>
          </div>
          <Switch 
            disabled={isFetching}
            checked={enabled} 
            onCheckedChange={setEnabled}
            className="data-[state=checked]:bg-emerald-600"
          />
        </div>
      </CardHeader>

      <CardContent className="p-8 space-y-6">
        {isFetching ? (
          <div className="py-10 flex flex-col items-center gap-2">
            <Loader2 className="animate-spin text-slate-300" />
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Sincronizando...</span>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 flex items-center gap-1">
                  <Key size={10} /> Google Client ID
                </Label>
                <Input 
                  placeholder="000000000-xxx.apps.googleusercontent.com" 
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  className="h-14 rounded-2xl bg-slate-50 border-none font-mono text-xs text-slate-700"
                />
              </div>

              <div className="space-y-3">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 flex items-center gap-1">
                  <Lock size={10} /> Google Client Secret
                </Label>
                <Input 
                  type="password"
                  placeholder="••••••••••••••••" 
                  value={clientSecret}
                  onChange={(e) => setClientSecret(e.target.value)}
                  className="h-14 rounded-2xl bg-slate-50 border-none font-mono text-xs text-slate-700"
                />
              </div>
            </div>

            <Button 
              onClick={handleSave} 
              disabled={mutation.isPending}
              className="w-full h-14 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] shadow-xl transition-all active:scale-95"
            >
              {mutation.isPending ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="animate-spin w-4 h-4" />
                  <span>CRIPTOGRAFANDO DADOS...</span>
                </div>
              ) : "ATUALIZAR CREDENCIAIS"}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}