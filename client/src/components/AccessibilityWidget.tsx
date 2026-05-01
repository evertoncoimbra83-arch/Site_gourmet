// client/src/components/AccessibilityWidget.tsx
// ✅ Salva preferências no localStorage — persiste entre page reloads.
// ✅ Inicializa do localStorage (preferência do usuário) ou padrão do admin (banco).

import React, { useEffect, useState } from "react";
import { trpc } from "@/_core/trpc";
import { Button } from "@/components/ui/button";
import { Settings, Type, Eye, ZoomIn, ZoomOut, RefreshCcw } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetDescription } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";

const LS_CONTRAST = "a11y-high-contrast";
const LS_DYSLEXIC = "a11y-font-dyslexic";
const LS_SCALE    = "a11y-font-scale";

function applyToDOM(contrast: boolean, dyslexic: boolean, scale: number) {
  const root = document.documentElement;
  root.classList.toggle("high-contrast", contrast);
  root.classList.toggle("font-dyslexic", dyslexic);
  root.style.fontSize = `${scale * 100}%`;
}

export function AccessibilityWidget() {
  const { data: settings } = trpc.public.getStoreSettings.useQuery(undefined, {
    staleTime: 1000 * 60 * 30,
    retry: false,
    refetchOnWindowFocus: false,
  });

  // Lê localStorage primeiro; cai no padrão do banco se não houver preferência salva
  const [localHighContrast, setLocalHighContrast] = useState(() => {
    const saved = localStorage.getItem(LS_CONTRAST);
    return saved !== null ? saved === "true" : false;
  });

  const [localDyslexic, setLocalDyslexic] = useState(() => {
    const saved = localStorage.getItem(LS_DYSLEXIC);
    return saved !== null ? saved === "true" : false;
  });

  const [localScale, setLocalScale] = useState(() => {
    const saved = localStorage.getItem(LS_SCALE);
    return saved !== null ? parseFloat(saved) : 1;
  });

  // Quando o banco carregar, aplica padrões do admin SOMENTE se o usuário nunca alterou
  useEffect(() => {
    if (!settings?.accessibility) return;
    if (localStorage.getItem(LS_CONTRAST) === null) {
      setLocalHighContrast(!!settings.accessibility.highContrast);
    }
    if (localStorage.getItem(LS_DYSLEXIC) === null) {
      setLocalDyslexic(!!settings.accessibility.dyslexicFont);
    }
    if (localStorage.getItem(LS_SCALE) === null) {
      setLocalScale(Number(settings.accessibility.fontScale) || 1);
    }
  }, [settings]);

  // Aplica ao DOM e persiste no localStorage sempre que mudar
  useEffect(() => {
    applyToDOM(localHighContrast, localDyslexic, localScale);
    localStorage.setItem(LS_CONTRAST, String(localHighContrast));
    localStorage.setItem(LS_DYSLEXIC, String(localDyslexic));
    localStorage.setItem(LS_SCALE, String(localScale));
  }, [localHighContrast, localDyslexic, localScale]);

  const handleReset = () => {
    localStorage.removeItem(LS_CONTRAST);
    localStorage.removeItem(LS_DYSLEXIC);
    localStorage.removeItem(LS_SCALE);
    setLocalHighContrast(false);
    setLocalDyslexic(false);
    setLocalScale(1);
  };

  return (
    <div className="fixed bottom-4 left-4 z-50 print:hidden">
      <Sheet>
        <SheetTrigger asChild>
          <Button
            size="icon"
            className="rounded-full h-12 w-12 bg-slate-900 text-white shadow-xl hover:bg-emerald-600 transition-all border-2 border-white/20 active:scale-90"
            title="Acessibilidade"
            aria-label="Abrir painel de acessibilidade"
          >
            <Eye size={22} />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-[320px] bg-white/95 backdrop-blur-md border-r border-slate-100">
          <SheetHeader className="mb-6">
            <SheetTitle className="flex items-center gap-2 text-xl font-black uppercase text-slate-900 italic tracking-tighter">
              <Settings className="text-emerald-500" /> Acessibilidade
            </SheetTitle>
            <SheetDescription className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">
              Personalize sua experiência de leitura
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2 font-black text-[11px] uppercase text-slate-700 tracking-tight">
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
              <Label className="flex items-center gap-2 font-black text-[11px] uppercase text-slate-700 tracking-tight">
                <Type size={16} className="text-slate-400" /> Fonte para Dislexia
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
                <Label className="flex items-center gap-2 font-black text-[11px] uppercase text-slate-700 tracking-tight">
                  <ZoomIn size={16} className="text-slate-400" /> Escala do Texto
                </Label>
                <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">
                  {Math.round(localScale * 100)}%
                </span>
              </div>
              <div className="flex items-center gap-4">
                <ZoomOut size={14} className="text-slate-400" />
                <Slider
                  value={[localScale]}
                  min={0.8}
                  max={1.5}
                  step={0.05}
                  onValueChange={([val]) => setLocalScale(val)}
                  className="flex-1"
                  aria-label="Escala do texto"
                />
                <ZoomIn size={14} className="text-slate-400" />
              </div>
            </div>

            <Button
              variant="outline"
              onClick={handleReset}
              className="w-full rounded-xl border-slate-200 font-black uppercase text-[10px] tracking-widest hover:bg-red-50 hover:text-red-500 hover:border-red-100 transition-all"
            >
              <RefreshCcw size={14} className="mr-2" /> Restaurar Padrões
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

export default AccessibilityWidget;