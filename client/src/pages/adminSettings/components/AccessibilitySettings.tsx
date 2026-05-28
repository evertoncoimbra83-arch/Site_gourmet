import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import {
  Accessibility,
  Type,
  Contrast,
  Loader2,
  Globe,
  ZoomIn,
  Languages,
} from "lucide-react";
import ImagePicker from "../../adminDishes/components/ImagePicker";
import { clampFontScale } from "@/_core/hooks/useAccessibility";

interface AccessibilityData {
  favicon: string;
  highContrast: boolean;
  dyslexicFont: boolean;
  fontScale: number;
  vLibrasActive: boolean;
}

interface AccessibilitySettingsProps {
  state: {
    accessibilityData: AccessibilityData;
    isLoading: boolean;
  };
  actions: {
    updateField: (data: Partial<AccessibilityData>) => void;
  };
}

export function AccessibilitySettings({
  state,
  actions,
}: AccessibilitySettingsProps) {
  const { accessibilityData, isLoading } = state;

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center rounded-[2.5rem] border border-slate-100 bg-white text-left">
        <Loader2 className="animate-spin text-indigo-500" size={32} />
      </div>
    );
  }

  return (
    <Card className="overflow-hidden rounded-[2.5rem] border border-slate-100 bg-white text-left shadow-sm">
      <CardHeader className="border-b border-slate-100 bg-slate-50/40 p-10 text-left">
        <div className="flex items-center gap-4 text-left">
          <div className="rounded-2xl bg-indigo-50 p-3 text-indigo-600">
            <Accessibility size={28} />
          </div>
          <div className="text-left">
            <CardTitle className="text-left text-2xl font-black uppercase italic leading-none tracking-tighter text-slate-900">
              Interface <span className="text-indigo-500">& Acessibilidade</span>
            </CardTitle>
            <p className="mt-1 text-left text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">
              Favicon, Inclusao e Experiencia
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6 p-10 text-left">
        <div className="space-y-4 rounded-[2rem] border border-slate-100/50 bg-slate-50/50 p-6 text-left">
          <div className="mb-2 flex items-center gap-3 text-left">
            <div className="rounded-xl bg-white p-2 text-indigo-500 shadow-sm">
              <Globe size={18} />
            </div>
            <div className="text-left">
              <Label className="text-left text-xs font-black uppercase tracking-widest text-slate-800">
                Favicon do Site
              </Label>
              <p className="text-left text-[10px] font-bold uppercase tracking-tight text-slate-400">
                Icone exibido na aba do navegador
              </p>
            </div>
          </div>

          <div className="max-w-xs text-left">
            <ImagePicker
              label="Upload do icone (.png ou .ico)"
              value={accessibilityData.favicon || ""}
              onChange={(url: string) => {
                actions.updateField({ favicon: url });
              }}
            />
          </div>
        </div>

        <div className="my-4 border-t border-slate-100"></div>

        <div className="group flex items-center justify-between rounded-[2rem] border border-slate-100/50 bg-slate-50/50 p-6 text-left transition-all hover:bg-slate-100/80">
          <div className="flex items-center gap-5 text-left">
            <div className="rounded-2xl bg-white p-4 text-indigo-500 shadow-sm transition-transform group-hover:scale-110">
              <Contrast size={20} />
            </div>
            <div className="space-y-1 text-left">
              <Label className="cursor-pointer text-left text-xs font-black uppercase tracking-widest text-slate-800">
                Alto Contraste
              </Label>
              <p className="text-left text-[10px] font-bold uppercase tracking-tight text-slate-400">
                Aplica a classe global de contraste elevado
              </p>
            </div>
          </div>
          <Switch
            checked={!!accessibilityData.highContrast}
            onCheckedChange={(val) =>
              actions.updateField({ highContrast: val })
            }
            className="scale-110 data-[state=checked]:bg-indigo-600"
          />
        </div>

        <div className="group flex items-center justify-between rounded-[2rem] border border-slate-100/50 bg-slate-50/50 p-6 text-left transition-all hover:bg-slate-100/80">
          <div className="flex items-center gap-5 text-left">
            <div className="rounded-2xl bg-white p-4 text-indigo-500 shadow-sm transition-transform group-hover:scale-110">
              <Type size={20} />
            </div>
            <div className="space-y-1 text-left">
              <Label className="cursor-pointer text-left text-xs font-black uppercase tracking-widest text-slate-800">
                Fonte OpenDyslexic
              </Label>
              <p className="text-left text-[10px] font-bold uppercase tracking-tight text-slate-400">
                Ativa a familia tipografica assistiva em todo o app
              </p>
            </div>
          </div>
          <Switch
            checked={!!accessibilityData.dyslexicFont}
            onCheckedChange={(val) =>
              actions.updateField({ dyslexicFont: val })
            }
            className="scale-110 data-[state=checked]:bg-indigo-600"
          />
        </div>

        <div className="space-y-4 rounded-[2rem] border border-slate-100/50 bg-slate-50/50 p-6 text-left">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-5 text-left">
              <div className="rounded-2xl bg-white p-4 text-indigo-500 shadow-sm">
                <ZoomIn size={20} />
              </div>
              <div className="space-y-1 text-left">
                <Label className="text-left text-xs font-black uppercase tracking-widest text-slate-800">
                  Escala da Fonte
                </Label>
                <p className="text-left text-[10px] font-bold uppercase tracking-tight text-slate-400">
                  Ajusta a escala global do texto entre 90% e 150%
                </p>
              </div>
            </div>
            <span className="rounded-md bg-indigo-50 px-2 py-1 text-[10px] font-black text-indigo-600">
              {Math.round(clampFontScale(accessibilityData.fontScale) * 100)}%
            </span>
          </div>

          <Slider
            value={[clampFontScale(accessibilityData.fontScale)]}
            min={0.9}
            max={1.5}
            step={0.05}
            onValueChange={([value]) =>
              actions.updateField({ fontScale: clampFontScale(value) })
            }
            aria-label="Escala da fonte"
          />
        </div>

        <div className="group flex items-center justify-between rounded-[2rem] border border-slate-100/50 bg-slate-50/50 p-6 text-left transition-all hover:bg-slate-100/80">
          <div className="flex items-center gap-5 text-left">
            <div className="rounded-2xl bg-white p-4 text-indigo-500 shadow-sm transition-transform group-hover:scale-110">
              <Languages size={20} />
            </div>
            <div className="space-y-1 text-left">
              <Label className="cursor-pointer text-left text-xs font-black uppercase tracking-widest text-slate-800">
                Libras (VLibras)
              </Label>
              <p className="text-left text-[10px] font-bold uppercase tracking-tight text-slate-400">
                Carrega o widget oficial do VLibras quando a flag estiver ativa
              </p>
            </div>
          </div>
          <Switch
            checked={!!accessibilityData.vLibrasActive}
            onCheckedChange={(val) =>
              actions.updateField({ vLibrasActive: val })
            }
            className="scale-110 data-[state=checked]:bg-indigo-600"
          />
        </div>
      </CardContent>
    </Card>
  );
}
