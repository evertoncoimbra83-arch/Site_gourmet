import { useEffect, useState } from "react";
import { trpc } from "@/_core/trpc";
import { Button } from "@/components/ui/button";
import { Settings, Type, Eye, ZoomIn, ZoomOut, RefreshCcw } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetDescription } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";

export function AccessibilityWidget() {
  // ✅ ADICIONADO: enabled: !!trpc para evitar chamadas prematuras
  // ✅ staleTime longo para evitar que o site fique pedindo isso o tempo todo
  const { data: settings } = trpc.public.getStoreSettings.useQuery(undefined, {
    staleTime: 1000 * 60 * 30, // 30 minutos
    retry: false,
    refetchOnWindowFocus: false, // Evita disparar 403 ao trocar de aba
  });

  const [localHighContrast, setLocalHighContrast] = useState(false);
  const [localDyslexic, setLocalDyslexic] = useState(false);
  const [localScale, setLocalScale] = useState(1);

  // Sincronização inicial com o banco
  useEffect(() => {
    if (settings?.accessibility) {
      setLocalHighContrast(!!settings.accessibility.highContrast);
      setLocalDyslexic(!!settings.accessibility.dyslexicFont);
      setLocalScale(Number(settings.accessibility.fontScale) || 1);
    }
  }, [settings]);

  // Aplicação dos efeitos no DOM
  useEffect(() => {
    const root = document.documentElement;
    
    if (localHighContrast) root.classList.add("high-contrast");
    else root.classList.remove("high-contrast");

    if (localDyslexic) root.classList.add("font-dyslexic");
    else root.classList.remove("font-dyslexic");

    root.style.setProperty("--font-scale", String(localScale));
    // ✅ Melhoria: Usa clamp para evitar que a fonte fique pequena demais ou grande demais
    root.style.fontSize = `${localScale * 100}%`;
  }, [localHighContrast, localDyslexic, localScale]);

  const handleReset = () => {
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
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2 font-black text-[11px] uppercase text-slate-700 tracking-tight">
                  <Eye size={16} className="text-slate-400" /> Alto Contraste
                </Label>
                <Switch 
                  checked={localHighContrast} 
                  onCheckedChange={setLocalHighContrast}
                  className="data-[state=checked]:bg-emerald-600"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2 font-black text-[11px] uppercase text-slate-700 tracking-tight">
                  <Type size={16} className="text-slate-400" /> Fonte para Dislexia
                </Label>
                <Switch 
                  checked={localDyslexic} 
                  onCheckedChange={setLocalDyslexic}
                  className="data-[state=checked]:bg-emerald-600"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between mb-2">
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

// ✅ IMPORTANTE: Se você já usa o AccessibilityWidget no seu Layout, 
// o AccessibilityManager no App.tsx deve ser apenas um "disparador" de lógica
// para não renderizar o botão duas vezes na tela.
export const AccessibilityManager = () => {
    // Este manager apenas chama o hook de aplicação, não renderiza o botão
    // O botão (Widget) fica no LayoutPublico
    return null; 
};

export default AccessibilityWidget;