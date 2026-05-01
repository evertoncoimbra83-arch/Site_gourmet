// client/src/pages/adminSettings/components/SecurityDiagnosticsCard.tsx
// ✅ Adicionado estado de erro explícito — sem loading eterno quando o servidor falha.

import React from "react";
import { trpc } from "@/_core/trpc";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AlertTriangle,
  CheckCircle2,
  Loader2,
  RefreshCcw,
  ShieldAlert,
  WifiOff,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

type RiskLevel = "secure" | "attention" | "critical";

function riskLabel(risk: RiskLevel) {
  if (risk === "secure") return "Seguro";
  if (risk === "attention") return "Atenção";
  return "Crítico";
}

function RiskIcon({ risk }: { risk: RiskLevel }) {
  if (risk === "secure") return <CheckCircle2 size={16} className="text-emerald-600" />;
  if (risk === "attention") return <AlertTriangle size={16} className="text-amber-600" />;
  return <XCircle size={16} className="text-rose-600" />;
}

export function SecurityDiagnosticsCard() {
  const { data, isLoading, error, refetch, isFetching } =
    trpc.admin.security.getEnvironmentSecurityReport.useQuery(undefined, {
      refetchOnWindowFocus: false,
      retry: 1,
    });

  const status = (data?.status || "attention") as RiskLevel;
  const checks = data?.checks || [];
  const isLocalEnvironment = data?.environment !== "production";

  return (
    <Card className="rounded-3xl border border-slate-200 p-6 md:p-8 text-left">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h3 className="text-lg font-black uppercase tracking-tight text-slate-900">
            Diagnóstico de Segurança
          </h3>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
            Sem exposição de segredos
          </p>
        </div>
        <Button
          variant="outline"
          className="rounded-xl border-slate-300 text-[10px] font-black uppercase tracking-widest"
          onClick={() => void refetch()}
          disabled={isFetching}
        >
          {isFetching ? (
            <Loader2 size={14} className="mr-2 animate-spin" />
          ) : (
            <RefreshCcw size={14} className="mr-2" />
          )}
          Atualizar Diagnóstico
        </Button>
      </div>

      {/* ✅ Estado de erro explícito — não fica em loading eterno */}
      {error && !isLoading && (
        <div className="mt-5 flex items-center gap-3 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3">
          <WifiOff size={16} className="shrink-0 text-rose-500" />
          <div>
            <p className="text-[11px] font-black uppercase tracking-widest text-rose-700">
              Falha ao carregar diagnóstico
            </p>
            <p className="text-[11px] font-semibold text-rose-600">
              Verifique se o servidor está respondendo e clique em Atualizar.
            </p>
          </div>
        </div>
      )}

      {!error && (
        <>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {isLocalEnvironment && (
              <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-amber-700">
                Ambiente local — alguns alertas podem ser esperados
              </span>
            )}
            {data?.runtime === "pm2" && (
              <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-slate-700">
                Runtime: PM2
              </span>
            )}
          </div>

          <div className="mt-5 flex items-center gap-3">
            <ShieldAlert
              size={18}
              className={cn(
                status === "secure"
                  ? "text-emerald-600"
                  : status === "attention"
                    ? "text-amber-600"
                    : "text-rose-600",
              )}
            />
            <span
              className={cn(
                "text-[11px] font-black uppercase tracking-widest",
                status === "secure"
                  ? "text-emerald-700"
                  : status === "attention"
                    ? "text-amber-700"
                    : "text-rose-700",
              )}
            >
              {riskLabel(status)}
            </span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
              {data?.summary || "Aguardando diagnóstico..."}
            </span>
          </div>

          {isLoading ? (
            <div className="mt-6 flex items-center gap-2 text-slate-500">
              <Loader2 size={16} className="animate-spin" />
              <span className="text-[10px] font-black uppercase tracking-widest">
                Analisando ambiente...
              </span>
            </div>
          ) : (
            <ul className="mt-6 space-y-3">
              {checks.map((check) => {
                const risk = check.risk as RiskLevel;
                return (
                  <li
                    key={check.id}
                    className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3"
                  >
                    <div className="mt-0.5">
                      <RiskIcon risk={risk} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] font-black uppercase tracking-widest text-slate-900">
                        {check.title}
                      </p>
                      <p className="text-[11px] font-semibold text-slate-600">
                        {check.message}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}
    </Card>
  );
}