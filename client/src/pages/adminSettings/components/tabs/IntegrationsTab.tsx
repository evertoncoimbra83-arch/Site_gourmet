// client/src/pages/adminSettings/components/tabs/IntegrationsTab.tsx
import React from "react";
import { ServerCog } from "lucide-react";
import { Card } from "@/components/ui/card";
import { AreaShell } from "../AreaShell";
import { ShortcutGrid } from "../ShortcutGrid";
import { settingsAreas } from "../../config/settingsAreas";

const area = settingsAreas[5];

export function IntegrationsTab() {
  return (
    <AreaShell area={area}>
      <Card className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm md:p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="rounded-2xl bg-cyan-50 p-3 text-cyan-700">
              <ServerCog size={20} />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-black uppercase tracking-tight text-slate-900">
                Integrações centralizadas por atalho
              </h3>
              <p className="max-w-2xl text-sm leading-relaxed text-slate-500">
                Nesta etapa, a área de integrações funciona como hub de navegação. Os
                formulários continuam nas telas já existentes para evitar mudança de
                fluxo ou de contrato.
              </p>
            </div>
          </div>
          <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
              Estado atual
            </p>
            <p className="mt-1 text-sm text-slate-600">
              Sem seção vazia: apenas atalhos para áreas reais.
            </p>
          </div>
        </div>
      </Card>
      <ShortcutGrid shortcuts={area.shortcuts || []} />
    </AreaShell>
  );
}