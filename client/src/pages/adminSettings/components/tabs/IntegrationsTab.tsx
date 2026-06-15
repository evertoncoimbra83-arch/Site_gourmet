import React, { useState } from "react";
import {
  Activity,
  Eye,
  EyeOff,
  FileJson,
  Globe,
  Loader2,
  Radio,
  Save,
  ServerCog,
  ShieldCheck,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { GA4Panel } from "@/pages/adminAnalytics/components/GA4Panel";
import { AreaShell } from "../AreaShell";
import type { AdminSettingsData } from "../../logic/useAdminSettings";
import { settingsAreas } from "../../config/settingsAreas";
import { appToast as toast } from "@/lib/app-toast";

const area =
  settingsAreas.find((item) => item.id === "integrations") || settingsAreas[3];

interface IntegrationsTabProps {
  settingsTab: {
    state: {
      formData: AdminSettingsData;
      isPending: boolean;
      isTestingGoogle: boolean;
    };
    actions: {
      updateField: <K extends keyof AdminSettingsData>(
        field: K,
        value: AdminSettingsData[K],
      ) => void;
      handleSaveAll: () => Promise<void>;
      testGoogleOAuth: (data: { clientId: string; clientSecret: string; redirectUri: string }) => Promise<{ success: boolean; message: string }>;
    };
  };
}

function Field({
  label,
  children,
  icon,
}: {
  label: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
        {icon}
        {label}
      </Label>
      {children}
    </div>
  );
}

export function IntegrationsTab({ settingsTab }: IntegrationsTabProps) {
  const { state, actions } = settingsTab;
  const [showSecret, setShowSecret] = useState(false);
  const [showJson, setShowJson] = useState(false);
  const isUpdating = state.isPending;

  const handleSave = async () => {
    await actions.handleSaveAll();
  };

  const handleTestConnection = async () => {
    try {
      const res = await actions.testGoogleOAuth({
        clientId: state.formData.googleClientId,
        clientSecret: state.formData.googleClientSecret,
        redirectUri: state.formData.googleRedirectUri,
      });
      if (res.success) {
        toast.success("Conexão validada!", {
          description: res.message || "Conectividade e formatos validados com sucesso!",
        });
      }
    } catch (err: any) {
      toast.error("Falha na validação", {
        description: err.message || "Erro desconhecido ao validar conexão com o Google.",
      });
    }
  };

  return (
    <AreaShell area={area}>
      <Card className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
        <div className="flex flex-col gap-8 xl:grid xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="rounded-2xl bg-emerald-600 p-3 text-white shadow-lg shadow-emerald-100">
                <Activity size={22} />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-extrabold tracking-tight text-slate-900">
                  Rastreamento e autenticacao Google
                </h3>
                <p className="max-w-2xl text-sm leading-relaxed text-slate-500">
                  Centralize GTM, GA4, Service Account e o login com Google no
                  mesmo fluxo administrativo.
                </p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto]">
              <Field label="Container ID (GTM)" icon={<Globe size={10} />}>
                <Input
                  placeholder="Ex: GTM-XXXXXXX"
                  value={state.formData.gtmId || ""}
                  onChange={(e) => actions.updateField("gtmId", e.target.value)}
                  className="h-12 rounded-xl border-slate-200 bg-white font-semibold uppercase tracking-widest placeholder:normal-case placeholder:tracking-normal"
                />
              </Field>

              <div className="flex items-end">
                <Button
                  onClick={handleSave}
                  disabled={isUpdating}
                  className="h-12 gap-2 rounded-xl bg-slate-900 px-6 text-[11px] font-bold uppercase tracking-[0.18em] text-white hover:bg-emerald-600"
                >
                  {isUpdating ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Save size={16} />
                  )}
                  Salvar
                </Button>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Field
                label="Measurement ID (GA4)"
                icon={<Radio size={10} />}
              >
                <Input
                  value={state.formData.googleAnalyticsId || ""}
                  onChange={(e) =>
                    actions.updateField("googleAnalyticsId", e.target.value)
                  }
                  placeholder="G-XXXXXXXXXX"
                  className="h-12 rounded-xl border-slate-200 bg-slate-50 font-mono text-[11px]"
                />
              </Field>

              <Field label="GA4 Property ID" icon={<Radio size={10} />}>
                <Input
                  value={state.formData.ga4PropertyId || ""}
                  onChange={(e) =>
                    actions.updateField("ga4PropertyId", e.target.value)
                  }
                  placeholder="250001647"
                  className="h-12 rounded-xl border-slate-200 bg-slate-50 font-mono text-[11px]"
                />
              </Field>
            </div>

            <Field
              label="Service Account JSON"
              icon={<FileJson size={10} />}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-400">
                    Data API / leitura do painel GA4
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowJson((value) => !value)}
                    className="text-[10px] font-bold uppercase tracking-[0.15em] text-cyan-600"
                  >
                    {showJson ? "Ocultar" : "Mostrar"}
                  </button>
                </div>
                <Textarea
                  value={state.formData.gaServiceAccount || ""}
                  onChange={(e) =>
                    actions.updateField("gaServiceAccount", e.target.value)
                  }
                  placeholder='{ "type": "service_account", ... }'
                  className={cn(
                    "min-h-28 rounded-xl border-slate-200 bg-slate-50 font-mono text-[10px]",
                    !showJson && "blur-sm select-none pointer-events-none",
                  )}
                />
              </div>
            </Field>

            <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-700">
                    Login com Google
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    OAuth administrativo protegido pela configuracao segura atual.
                  </p>
                </div>
                <Switch
                  checked={!!state.formData.googleLoginEnabled}
                  onCheckedChange={(value) =>
                    actions.updateField("googleLoginEnabled", value)
                  }
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Client ID" icon={<ShieldCheck size={10} />}>
                  <Input
                    value={state.formData.googleClientId || ""}
                    onChange={(e) =>
                      actions.updateField("googleClientId", e.target.value)
                    }
                    className="h-12 rounded-xl border-slate-200 bg-white font-mono text-[11px]"
                  />
                </Field>

                <Field label="Client Secret" icon={<ShieldCheck size={10} />}>
                  <div className="relative">
                    <Input
                      type={showSecret ? "text" : "password"}
                      value={state.formData.googleClientSecret || ""}
                      onChange={(e) =>
                        actions.updateField("googleClientSecret", e.target.value)
                      }
                      className="h-12 rounded-xl border-slate-200 bg-white pr-12 font-mono text-[11px]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSecret((value) => !value)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                    >
                      {showSecret ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </Field>
              </div>

              <div className="grid gap-4 md:grid-cols-[1fr_auto] items-end">
                <div className="flex-1 min-w-0">
                  <Field label="Redirect URI" icon={<ShieldCheck size={10} />}>
                    <Input
                      placeholder="https://seu-dominio.com/auth/callback"
                      value={state.formData.googleRedirectUri || ""}
                      onChange={(e) =>
                        actions.updateField("googleRedirectUri", e.target.value)
                      }
                      className="h-12 rounded-xl border-slate-200 bg-white font-mono text-[11px]"
                    />
                  </Field>
                </div>

                <Button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={state.isTestingGoogle}
                  className="h-12 gap-2 rounded-xl bg-slate-900 px-6 text-[11px] font-bold uppercase tracking-[0.18em] text-white hover:bg-emerald-600 disabled:opacity-50"
                >
                  {state.isTestingGoogle ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <ServerCog size={16} />
                  )}
                  {state.isTestingGoogle ? "Validando..." : "Validar configuracao"}
                </Button>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <Card className="rounded-2xl border border-cyan-100 bg-cyan-50/40 p-6 shadow-none">
              <div className="flex items-start gap-4">
                <div className="rounded-2xl bg-white p-3 text-cyan-700 shadow-sm">
                  <ServerCog size={20} />
                </div>
                <div className="space-y-2">
                  <h4 className="text-base font-extrabold text-slate-900">
                    Politica de integracoes
                  </h4>
                  <p className="text-sm leading-relaxed text-slate-600">
                    Use esta area para tudo que depende de contas Google,
                    autenticacao OAuth e leitura de analytics.
                  </p>
                </div>
              </div>
            </Card>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <Radio size={14} className="text-orange-500" />
                <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-orange-600">
                  Painel Google Analytics 4
                </span>
              </div>
              <GA4Panel />
            </div>
          </div>
        </div>
      </Card>
    </AreaShell>
  );
}
