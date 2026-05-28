// client/src/pages/adminSettings/components/tabs/SecurityTab.tsx
import React from "react";
import { Lock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { PanicButton } from "../PanicButton";
import { SecurityDiagnosticsCard } from "../SecurityDiagnosticsCard";
import { DatabaseBackupsCard } from "../DatabaseBackupsCard";
import { InfrastructureCard } from "../InfrastructureCard";
import { AreaShell } from "../AreaShell";
import { settingsAreas } from "../../config/settingsAreas";

const area =
  settingsAreas.find((item) => item.id === "security") || settingsAreas[2];

export function SecurityTab() {
  return (
    <AreaShell area={area}>
      <div className="grid grid-cols-1 gap-6 2xl:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
        <div className="space-y-6">
          <PanicButton />
          <SecurityDiagnosticsCard />
          <DatabaseBackupsCard />
          <Card className="rounded-[2rem] border border-slate-200 bg-slate-950 p-6 text-white shadow-sm">
            <div className="flex items-start gap-4">
              <div className="rounded-2xl bg-white/10 p-3 text-emerald-400">
                <Lock size={20} />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-black uppercase tracking-tight">
                  Proteção de credenciais
                </h3>
                <p className="text-sm leading-relaxed text-slate-300">
                  As chaves sensíveis seguem protegidas por criptografia antes da
                  persistência. Esta área exibe apenas status e ferramentas
                  administrativas, sem revelar valores.
                </p>
              </div>
            </div>
          </Card>
        </div>
        <InfrastructureCard />
      </div>
    </AreaShell>
  );
}
