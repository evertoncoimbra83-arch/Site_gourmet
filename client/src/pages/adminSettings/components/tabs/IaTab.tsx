// client/src/pages/adminSettings/components/tabs/IaTab.tsx
import React, { ComponentProps } from "react";
import { BrainCircuit } from "lucide-react";
import { Card } from "@/components/ui/card";
import { SecurityConfig } from "../GoogleAuthConfig";
import { AreaShell } from "../AreaShell";
import { ShortcutGrid } from "../ShortcutGrid";
import { settingsAreas } from "../../config/settingsAreas";

const area = settingsAreas[3];

interface IaTabProps {
  settingsTab: {
    state: ComponentProps<typeof SecurityConfig>["state"];
    actions: ComponentProps<typeof SecurityConfig>["actions"];
  };
}

export function IaTab({ settingsTab }: IaTabProps) {
  return (
    <AreaShell area={area}>
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
        <SecurityConfig state={settingsTab.state} actions={settingsTab.actions} />
        <Card className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-blue-50 p-3 text-blue-600">
                <BrainCircuit size={20} />
              </div>
              <div>
                <h3 className="text-lg font-black uppercase tracking-tight text-slate-900">
                  Hub de automação
                </h3>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                  IA, BI e conectores
                </p>
              </div>
            </div>
            <p className="text-sm leading-relaxed text-slate-500">
              As credenciais de Gemini, Google Auth e BI permanecem nas estruturas
              atuais. O ajuste aqui foi só de navegação e contexto visual.
            </p>
            <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                Observação
              </p>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                Workers, prompts e rotinas adicionais seguem acessíveis pelas telas
                dedicadas já existentes no admin.
              </p>
            </div>
          </div>
        </Card>
      </div>
      <ShortcutGrid shortcuts={area.shortcuts || []} />
    </AreaShell>
  );
}