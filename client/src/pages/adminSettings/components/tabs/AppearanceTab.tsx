import React from "react";
import { Palette, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { AccessibilitySettings } from "../AccessibilitySettings";
import { AreaShell } from "../AreaShell";
import { ShortcutGrid } from "../ShortcutGrid";
import { settingsAreas } from "../../config/settingsAreas";

const area = settingsAreas.find((item) => item.id === "appearance") || settingsAreas[2];

interface AppearanceTabProps {
  accessibilityTab: {
    state: {
      accessibilityData: {
        favicon: string;
        highContrast: boolean;
        dyslexicFont: boolean;
        fontScale: number;
        vLibrasActive: boolean;
      };
      isLoading: boolean;
    };
    actions: {
      updateField: (data: {
        favicon?: string;
        highContrast?: boolean;
        dyslexicFont?: boolean;
        fontScale?: number;
        vLibrasActive?: boolean;
      }) => void;
    };
  };
}

export function AppearanceTab({ accessibilityTab }: AppearanceTabProps) {
  return (
    <AreaShell area={area}>
      <div className="grid grid-cols-1 gap-8 xl:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          <AccessibilitySettings
            state={accessibilityTab.state}
            actions={accessibilityTab.actions}
          />
        </div>

        <div className="space-y-6">
          <Card className="rounded-[2.5rem] border border-slate-200 bg-slate-50/50 p-8 shadow-sm transition-all hover:bg-white hover:shadow-md">
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="rounded-2xl bg-violet-600 p-3 text-white shadow-lg shadow-violet-200">
                  <Palette size={22} />
                </div>
                <div>
                  <h3 className="text-xl font-black uppercase italic tracking-tighter text-slate-900">
                    Design <span className="text-violet-600">&</span> UI
                  </h3>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                    Acessibilidade e Identidade
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <p className="text-sm font-medium leading-relaxed text-slate-600">
                  Esta area controla o favicon, os defaults globais de
                  acessibilidade e o carregamento do VLibras para publico e
                  Admin.
                </p>

                <div className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-white p-4">
                  <Sparkles className="shrink-0 text-amber-400" size={18} />
                  <p className="text-[11px] font-semibold italic leading-relaxed text-slate-500">
                    As preferencias do usuario continuam podendo sobrescrever os
                    defaults via painel publico de acessibilidade.
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <div className="mt-8">
        <ShortcutGrid shortcuts={area.shortcuts || []} />
      </div>
    </AreaShell>
  );
}
