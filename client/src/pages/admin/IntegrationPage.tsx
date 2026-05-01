import React from "react";
import { KeyRound, RefreshCw, Copy, PlugZap } from "lucide-react";
import { appToast as toast } from "@/lib/app-toast";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useIntegrationAdmin } from "@/pages/admin/logic/useIntegrationAdmin";

export default function IntegrationPage() {
  const { state, actions } = useIntegrationAdmin();

  const handleCopyToken = async () => {
    if (!state.generatedToken) return;

    try {
      await navigator.clipboard.writeText(state.generatedToken);
      toast.success("Chave copiada para a area de transferencia.");
    } catch {
      toast.error("Nao foi possivel copiar a chave.");
    }
  };

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-8 md:px-6">
      <section className="overflow-hidden rounded-[2rem] border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-lime-50 p-8 shadow-sm">
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white/80 px-3 py-1 text-[11px] font-black uppercase tracking-[0.25em] text-emerald-700">
              <PlugZap className="h-4 w-4" />
              GourmetIA Bridge
            </div>
            <div className="space-y-2">
              <h1 className="text-3xl font-black uppercase tracking-tight text-slate-900 md:text-4xl">
                Integracao administrativa
              </h1>
              <p className="max-w-2xl text-sm text-slate-600">
                Gere uma nova chave para conexoes internas do GourmetIA Bridge e
                distribua o token atualizado para os servicos externos.
              </p>
            </div>
          </div>

          <Button
            onClick={actions.handleGenerateToken}
            disabled={state.isGenerating}
            className="h-12 rounded-2xl bg-slate-900 px-6 text-[11px] font-black uppercase tracking-[0.2em] text-white hover:bg-emerald-600"
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${state.isGenerating ? "animate-spin" : ""}`}
            />
            Gerar Nova Chave
          </Button>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_0.9fr]">
        <Card className="rounded-[2rem] border-slate-200 bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-900">
              <KeyRound className="h-5 w-5 text-emerald-600" />
              Token atual
            </CardTitle>
            <CardDescription>
              O valor completo so aparece apos a geracao nesta sessao.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="bridge-token">Chave completa</Label>
              <Textarea
                id="bridge-token"
                readOnly
                value={
                  state.generatedToken ||
                  "Nenhuma chave gerada nesta sessao. Clique em 'Gerar Nova Chave'."
                }
                className="min-h-32 rounded-2xl border-slate-200 bg-slate-50 font-mono text-xs text-slate-700"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="bridge-token-mask">Preview seguro</Label>
                <Input
                  id="bridge-token-mask"
                  readOnly
                  value={state.maskedToken || "Aguardando geracao"}
                  className="rounded-xl border-slate-200 bg-slate-50 font-mono text-xs"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bridge-generated-at">Gerado em</Label>
                <Input
                  id="bridge-generated-at"
                  readOnly
                  value={
                    state.generatedAt
                      ? new Date(state.generatedAt).toLocaleString("pt-BR")
                      : "Ainda nao gerado"
                  }
                  className="rounded-xl border-slate-200 bg-slate-50 text-sm"
                />
              </div>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-3 border-t border-slate-100 pt-6 md:flex-row md:justify-between">
            <p className="text-sm text-slate-500">
              Gere uma nova chave sempre que houver rotacao de credenciais.
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={actions.clearToken}
                disabled={!state.hasToken || state.isGenerating}
                className="rounded-xl"
              >
                Limpar
              </Button>
              <Button
                variant="outline"
                onClick={handleCopyToken}
                disabled={!state.hasToken}
                className="rounded-xl"
              >
                <Copy className="mr-2 h-4 w-4" />
                Copiar Chave
              </Button>
            </div>
          </CardFooter>
        </Card>

        <Card className="rounded-[2rem] border-slate-200 bg-slate-900 text-white shadow-sm">
          <CardHeader>
            <CardTitle>Boas praticas do Bridge</CardTitle>
            <CardDescription className="text-slate-300">
              Checklist rapido para evitar falhas de integracao.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-slate-200">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              Atualize o servico consumidor imediatamente apos gerar uma nova
              chave.
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              O token e aplicado ao processo atual do servidor. Se precisar
              persistencia entre reinicializacoes, replique o valor na sua
              configuracao segura.
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              Envie a chave no header <code className="font-mono">Authorization: Bearer ...</code>.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
