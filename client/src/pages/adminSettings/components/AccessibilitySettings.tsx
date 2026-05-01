import React from "react"; // ✅ Adicionado para escopo JSX
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Accessibility, Eye, Type, Contrast, Loader2, Globe } from "lucide-react";

// Import do ImagePicker corrigido conforme o contexto anterior
import ImagePicker from "../../adminDishes/components/ImagePicker"; 

// --- INTERFACES ---

interface AccessibilityData {
  favicon: string;
  accessibilityHighContrast: boolean;
  accessibilityDyslexicFont: boolean;
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

export function AccessibilitySettings({ state, actions }: AccessibilitySettingsProps) {
  const { accessibilityData, isLoading } = state;

  if (isLoading) {
    return (
      <div className="h-64 flex items-center justify-center bg-white rounded-[2.5rem] border border-slate-100 text-left">
        <Loader2 className="animate-spin text-indigo-500" size={32} />
      </div>
    );
  }

  return (
    <Card className="rounded-[2.5rem] border-none shadow-sm bg-white overflow-hidden border border-slate-100 text-left">
      <CardHeader className="p-10 bg-slate-50/40 border-b border-slate-100 text-left">
        <div className="flex items-center gap-4 text-left">
          <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600">
            <Accessibility size={28} />
          </div>
          <div className="text-left">
            <CardTitle className="text-2xl font-black uppercase italic tracking-tighter text-slate-900 leading-none text-left">
              Interface <span className="text-indigo-500">& Acessibilidade</span>
            </CardTitle>
            <p className="text-[11px] font-bold uppercase text-slate-400 tracking-[0.2em] mt-1 text-left">
              Favicon, Inclusão e Experiência
            </p>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-10 space-y-6 text-left">
        
        {/* SEÇÃO FAVICON */}
        <div className="p-6 bg-slate-50/50 rounded-[2rem] border border-slate-100/50 space-y-4 text-left">
            <div className="flex items-center gap-3 mb-2 text-left">
                <div className="p-2 bg-white rounded-xl text-indigo-500 shadow-sm">
                    <Globe size={18} />
                </div>
                <div className="text-left">
                    <Label className="text-xs font-black uppercase tracking-widest text-slate-800 text-left">
                        Favicon do Site
                    </Label>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight text-left">
                        Ícone exibido na aba do navegador (Recomendado: 32x32px)
                    </p>
                </div>
            </div>

            <div className="max-w-xs text-left">
                <ImagePicker 
                    label="Upload do Ícone (.png ou .ico)"
                    value={accessibilityData?.favicon || ""}
                    onChange={(url: string) => {
                        actions.updateField({ favicon: url });
                    }}
                />
            </div>
        </div>

        <div className="border-t border-slate-100 my-4"></div>

        {/* ALTO CONTRASTE */}
        <div className="flex items-center justify-between p-6 bg-slate-50/50 rounded-[2rem] border border-slate-100/50 transition-all hover:bg-slate-100/80 group text-left">
          <div className="flex items-center gap-5 text-left">
            <div className="p-4 bg-white rounded-2xl shadow-sm text-indigo-500 group-hover:scale-110 transition-transform">
              <Contrast size={20} />
            </div>
            <div className="space-y-1 text-left">
              <Label className="text-xs font-black uppercase tracking-widest text-slate-800 cursor-pointer text-left">
                Alto Contraste
              </Label>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight text-left">Melhora a legibilidade para baixa visão</p>
            </div>
          </div>
          <Switch 
            checked={!!accessibilityData.accessibilityHighContrast} 
            onCheckedChange={(val) => actions.updateField({ accessibilityHighContrast: val })} 
            className="data-[state=checked]:bg-indigo-600 scale-110"
          />
        </div>

        {/* OPEN DYSLEXIC */}
        <div className="flex items-center justify-between p-6 bg-slate-50/50 rounded-[2rem] border border-slate-100/50 transition-all hover:bg-slate-100/80 group text-left">
          <div className="flex items-center gap-5 text-left">
            <div className="p-4 bg-white rounded-2xl shadow-sm text-indigo-500 group-hover:scale-110 transition-transform">
              <Type size={20} />
            </div>
            <div className="space-y-1 text-left">
              <Label className="text-xs font-black uppercase tracking-widest text-slate-800 cursor-pointer text-left">
                Fonte OpenDyslexic
              </Label>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight text-left">Fonte desenhada para facilitar a leitura</p>
            </div>
          </div>
          <Switch 
            checked={!!accessibilityData.accessibilityDyslexicFont} 
            onCheckedChange={(val) => actions.updateField({ accessibilityDyslexicFont: val })} 
            className="data-[state=checked]:bg-indigo-600 scale-110"
          />
        </div>

        {/* VLIBRAS */}
        <div className="flex items-center justify-between p-6 bg-slate-50/50 rounded-[2rem] border border-slate-100/50 transition-all hover:bg-slate-100/80 group text-left">
          <div className="flex items-center gap-5 text-left">
            <div className="p-4 bg-white rounded-2xl shadow-sm text-indigo-500 group-hover:scale-110 transition-transform">
              <Eye size={20} />
            </div>
            <div className="space-y-1 text-left">
              <Label className="text-xs font-black uppercase tracking-widest text-slate-800 cursor-pointer text-left">
                Libras (VLibras)
              </Label>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight text-left">Avatar de tradução para Linguagem de Sinais</p>
            </div>
          </div>
          <Switch 
            checked={!!accessibilityData.vLibrasActive} 
            onCheckedChange={(val) => actions.updateField({ vLibrasActive: val })} 
            className="data-[state=checked]:bg-indigo-600 scale-110"
          />
        </div>

      </CardContent>
    </Card>
  );
}