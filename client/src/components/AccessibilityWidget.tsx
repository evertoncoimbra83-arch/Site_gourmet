import React, { useEffect, useState } from "react";
import { trpc } from "@/_core/trpc";
import { Button } from "@/components/ui/button";
import {
  Settings,
  Type,
  Eye,
  ZoomIn,
  ZoomOut,
  RefreshCcw,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetDescription,
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  applyAccessibilityToDOM,
  clampFontScale,
  clearStoredAccessibilityPreferences,
  LS_A11Y_CONTRAST,
  LS_A11Y_DYSLEXIC,
  LS_A11Y_SCALE,
  persistAccessibilityPreferences,
} from "@/_core/hooks/useAccessibility";

export function AccessibilityWidget() {
  const { data: settings } = trpc.public.getStoreSettings.useQuery(undefined, {
    staleTime: 1000 * 60 * 30,
    retry: false,
    refetchOnWindowFocus: false,
  });

  const [localHighContrast, setLocalHighContrast] = useState(() => {
    const saved = localStorage.getItem(LS_A11Y_CONTRAST);
    return saved !== null ? saved === "true" : false;
  });

  const [localDyslexic, setLocalDyslexic] = useState(() => {
    const saved = localStorage.getItem(LS_A11Y_DYSLEXIC);
    return saved !== null ? saved === "true" : false;
  });

  const [localScale, setLocalScale] = useState(() => {
    const saved = localStorage.getItem(LS_A11Y_SCALE);
    return saved !== null ? clampFontScale(saved) : 1;
  });

  useEffect(() => {
    if (!settings?.accessibility) return;

    if (localStorage.getItem(LS_A11Y_CONTRAST) === null) {
      setLocalHighContrast(!!settings.accessibility.highContrast);
    }

    if (localStorage.getItem(LS_A11Y_DYSLEXIC) === null) {
      setLocalDyslexic(!!settings.accessibility.dyslexicFont);
    }

    if (localStorage.getItem(LS_A11Y_SCALE) === null) {
      setLocalScale(clampFontScale(settings.accessibility.fontScale));
    }
  }, [settings]);

  useEffect(() => {
    const nextScale = clampFontScale(localScale);

    applyAccessibilityToDOM({
      highContrast: localHighContrast,
      dyslexicFont: localDyslexic,
      fontScale: nextScale,
    });

    persistAccessibilityPreferences({
      highContrast: localHighContrast,
      dyslexicFont: localDyslexic,
      fontScale: nextScale,
    });
  }, [localHighContrast, localDyslexic, localScale]);

  const handleReset = () => {
    clearStoredAccessibilityPreferences();
    setLocalHighContrast(!!settings?.accessibility?.highContrast);
    setLocalDyslexic(!!settings?.accessibility?.dyslexicFont);
    setLocalScale(clampFontScale(settings?.accessibility?.fontScale));
  };

  return (
    <div className="fixed bottom-4 left-4 z-50 print:hidden">
      <Sheet>
        <SheetTrigger asChild>
          <Button
            size="icon"
            className="h-12 w-12 rounded-full border-2 border-white/20 bg-slate-900 text-white shadow-xl transition-all hover:bg-emerald-600 active:scale-90"
            title="Acessibilidade"
            aria-label="Abrir painel de acessibilidade"
          >
            <Eye size={22} />
          </Button>
        </SheetTrigger>
        <SheetContent
          side="left"
          className="w-[320px] border-r border-slate-100 bg-white/95 backdrop-blur-md"
        >
          <SheetHeader className="mb-6">
            <SheetTitle className="flex items-center gap-2 text-xl font-black uppercase italic tracking-tighter text-slate-900">
              <Settings className="text-emerald-500" /> Acessibilidade
            </SheetTitle>
            <SheetDescription className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
              Personalize sua experiencia de leitura
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2 text-[11px] font-black uppercase tracking-tight text-slate-700">
                <Eye size={16} className="text-slate-400" /> Alto Contraste
              </Label>
              <Switch
                checked={localHighContrast}
                onCheckedChange={setLocalHighContrast}
                className="data-[state=checked]:bg-emerald-600"
                aria-label="Ativar alto contraste"
              />
            </div>

            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2 text-[11px] font-black uppercase tracking-tight text-slate-700">
                <Type size={16} className="text-slate-400" /> Fonte para
                Dislexia
              </Label>
              <Switch
                checked={localDyslexic}
                onCheckedChange={setLocalDyslexic}
                className="data-[state=checked]:bg-emerald-600"
                aria-label="Ativar fonte OpenDyslexic"
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2 text-[11px] font-black uppercase tracking-tight text-slate-700">
                  <ZoomIn size={16} className="text-slate-400" /> Escala do
                  Texto
                </Label>
                <span className="rounded-md bg-emerald-50 px-2 py-1 text-[10px] font-black text-emerald-600">
                  {Math.round(clampFontScale(localScale) * 100)}%
                </span>
              </div>
              <div className="flex items-center gap-4">
                <ZoomOut size={14} className="text-slate-400" />
                <Slider
                  value={[clampFontScale(localScale)]}
                  min={0.9}
                  max={1.5}
                  step={0.05}
                  onValueChange={([val]) => setLocalScale(clampFontScale(val))}
                  className="flex-1"
                  aria-label="Escala do texto"
                />
                <ZoomIn size={14} className="text-slate-400" />
              </div>
            </div>

            <Button
              variant="outline"
              onClick={handleReset}
              className="w-full rounded-xl border-slate-200 text-[10px] font-black uppercase tracking-widest transition-all hover:border-red-100 hover:bg-red-50 hover:text-red-500"
            >
              <RefreshCcw size={14} className="mr-2" /> Restaurar Padroes
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

export default AccessibilityWidget;
