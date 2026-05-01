// client/src/pages/adminSettings/components/tabs/AppearanceTab.tsx
import React, { ComponentProps } from "react";
import { Palette } from "lucide-react";
import { Card } from "@/components/ui/card";
import { AccessibilitySettings } from "../AccessibilitySettings";
import { AreaShell } from "../AreaShell";
import { ShortcutGrid } from "../ShortcutGrid";
import { settingsAreas } from "../../config/settingsAreas";

const area = settingsAreas[4];

interface AppearanceTabProps {
  accessibilityTab: {
    state: ComponentProps<typeof AccessibilitySettings>["state"];
    actions: ComponentProps<typeof AccessibilitySettings>["actions"];
  };
}

export function AppearanceTab({ accessibilityTab }: AppearanceTabProps) {
  return (
    <AreaShell area={area}>
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
        <AccessibilitySettings
          state={accessibilityTab.state}
          actions={accessibilityTab.actions}
        />
        <Card className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-violet-50 p-3 text-violet-600">
                <Palette size={20} />
              </div>
              <div>
                <h3 className="text-lg font-black uppercase tracking-tight text-slate-900">
                  Experiência visual
                </h3>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                  Acessibilidade e identidade
                </p>
              </div>
            </div>
            <p className="text-sm leading-relaxed text-slate-500">
              Favicon, contraste e recursos de leitura permanecem nesta página. Tema,
              vitrines e mídia foram agrupados logo abaixo como acessos dedicados.
            </p>
          </div>
        </Card>
      </div>
      <ShortcutGrid shortcuts={area.shortcuts || []} />
    </AreaShell>
  );
}