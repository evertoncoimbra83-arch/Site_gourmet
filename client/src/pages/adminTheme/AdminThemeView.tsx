// e:/IA/projects/Site_React/client/src/pages/adminTheme/AdminThemeView.tsx

import React, { useState, useEffect } from "react";
import { trpc } from "@/_core/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Palette, RotateCcw, Loader2, Sparkles, Monitor, Type } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

// --- INTERFACES ---

interface ThemeConfig {
  primary: string;
  background: string;
  foreground: string;
  accent: string;
}

// --- FUNÇÃO AUXILIAR DE CONTRASTE ---
const getContrastColor = (hexcolor: string) => {
  if (!hexcolor || hexcolor.length < 6) return "#ffffff";
  const r = parseInt(hexcolor.substring(1, 3), 16);
  const g = parseInt(hexcolor.substring(3, 5), 16);
  const b = parseInt(hexcolor.substring(5, 7), 16);
  const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
  return (yiq >= 128) ? '#000000' : '#ffffff';
};

export function AdminThemeView() {
  const { toast } = useToast();
  const utils = trpc.useUtils();
  
  const [theme, setTheme] = useState<ThemeConfig>({ 
    primary: "#065f46", 
    background: "#FBFBFC", 
    foreground: "#0f172a",
    accent: "#10b981" 
  });

  const { data: currentTheme, isLoading } = trpc.adminTheme.get.useQuery();
  
  const mutation = trpc.adminTheme.save.useMutation({
    onSuccess: () => {
      // ✅ FIX 2345: Passando o título como primeiro argumento (string) e as opções como segundo.
      // Caso o seu useToast não aceite segundo argumento, ele usará apenas a string do título.
      
      toast("DNA Visual Atualizado!", { 
        description: "As novas cores foram aplicadas ao sistema." 
      });
      utils.adminTheme.get.invalidate();
    },
    onError: (err) => {
      // ✅ FIX 2345: Mesmo ajuste para o erro
      
      toast("Erro ao salvar", { 
        variant: "destructive", 
        description: err.message 
      });
    }
  });

  useEffect(() => {
    if (currentTheme) {
      setTheme({
        primary: currentTheme.primary || "#065f46",
        background: currentTheme.background || "#FBFBFC",
        foreground: currentTheme.foreground || "#0f172a",
        accent: currentTheme.accent || "#10b981"
      });
    }
  }, [currentTheme]);

  if (isLoading) return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <Loader2 className="animate-spin text-emerald-600" size={40} />
      <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Sincronizando Studio...</span>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="grid lg:grid-cols-5 gap-8">
        
        {/* CONTROLES */}
        <div className="lg:col-span-2 space-y-6">
          {/* ✅ Tailwind: rounded-[2.5rem] -> rounded-4xl */}
          <Card className="rounded-4xl border-none shadow-2xl bg-white overflow-hidden">
            <CardHeader className="p-8 bg-slate-50/50 border-b border-slate-100">
              <div className="flex items-center gap-3 text-emerald-600">
                <Palette size={24} />
                <CardTitle className="text-2xl font-black uppercase italic tracking-tighter text-slate-900">
                  Style <span className="text-emerald-500">/</span> Studio
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              
              <div className="space-y-5">
                <ColorField label="Cor Principal (Botões)" value={theme.primary} onChange={(v) => setTheme({...theme, primary: v})} />
                <ColorField label="Cor de Destaque (Accent)" value={theme.accent} onChange={(v) => setTheme({...theme, accent: v})} />
                <ColorField label="Cor de Fundo" value={theme.background} onChange={(v) => setTheme({...theme, background: v})} />
                <ColorField label="Cor dos Textos" value={theme.foreground} onChange={(v) => setTheme({...theme, foreground: v})} />
              </div>

              <div className="pt-6 flex gap-3">
                <Button 
                  onClick={() => mutation.mutate(theme)}
                  disabled={mutation.isPending}
                  style={{ 
                    backgroundColor: theme.primary, 
                    color: getContrastColor(theme.primary)
                  }}
                  className="flex-1 h-16 rounded-3xl font-black uppercase text-[10px] tracking-widest shadow-xl border-none"
                >
                  {mutation.isPending ? <Loader2 className="animate-spin" /> : "Salvar DNA Visual"}
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => setTheme({ primary: "#065f46", background: "#FBFBFC", foreground: "#0f172a", accent: "#10b981" })}
                  className="h-16 w-16 rounded-3xl border-slate-200"
                >
                  <RotateCcw size={20} className="text-slate-400" />
                </Button>
              </div>
            </CardContent>
          </Card>
          
          <div className="p-6 bg-slate-900 rounded-3xl flex items-start gap-4 shadow-xl">
            <Sparkles className="text-emerald-400 shrink-0" size={20} />
            <p className="text-[9px] font-bold text-slate-400 leading-relaxed uppercase tracking-widest italic">
              O sistema detecta automaticamente o contraste ideal para os textos baseando-se na cor escolhida.
            </p>
          </div>
        </div>

        {/* PREVIEW */}
        <div className="lg:col-span-3">
          <div className="flex flex-col gap-4 h-full">
            <div className="flex items-center justify-between px-6">
              <Label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 flex items-center gap-2">
                <Monitor size={14} /> Preview Dinâmico
              </Label>
            </div>

            <div 
              style={{ backgroundColor: theme.background, color: theme.foreground }}
              /* ✅ Tailwind: border-[12px] -> border-12 | min-h-[500px] -> min-h-125 */
              className="flex-1 rounded-[3.5rem] border-12 border-slate-900 shadow-3xl overflow-hidden p-12 transition-all duration-700 relative min-h-125"
            >
               <h4 className="text-6xl font-black italic uppercase tracking-tighter leading-none mb-4">
                 Gourmet <br />
                 <span style={{ color: theme.primary }}>Saudável</span>
               </h4>
               <p className="opacity-60 text-[10px] font-black uppercase tracking-[0.3em] mb-10">Natural por essência.</p>
               
               <div className="flex gap-4">
                  <div 
                    style={{ backgroundColor: theme.primary, color: getContrastColor(theme.primary) }}
                    className="h-14 px-10 rounded-full flex items-center justify-center text-[10px] font-black uppercase tracking-widest shadow-xl"
                  >
                    Botão Ativo
                  </div>
                  <div 
                    style={{ borderColor: theme.accent, color: theme.accent }}
                    className="h-14 px-10 rounded-full border-2 flex items-center justify-center text-[10px] font-black uppercase tracking-widest"
                  >
                    Destaque
                  </div>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ColorField({ label, value, onChange }: { label: string, value: string, onChange: (v: string) => void }) {
  return (
    <div className="space-y-2">
      <Label className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">{label}</Label>
      <div className="flex gap-4">
        <input 
          type="color" 
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-14 w-20 rounded-xl cursor-pointer bg-slate-100 p-1 border-none transition-transform hover:scale-105 shadow-sm"
        />
        <div className="flex-1 bg-slate-50 rounded-xl h-14 px-6 flex items-center justify-between border border-slate-100">
          <span className="font-mono text-xs text-slate-500 uppercase">{value}</span>
          <Type size={14} className="text-slate-300" />
        </div>
      </div>
    </div>
  );
}