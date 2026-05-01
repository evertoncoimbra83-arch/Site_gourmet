import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea"; // Certifique-se de ter este componente
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, ShieldCheck, Lock, Key, Eye, EyeOff, BrainCircuit, BarChart3, FileJson } from "lucide-react";
import { cn } from "@/lib/utils";

interface SecurityConfigProps {
  state: {
    formData: {
      geminiApiKey?: string;
      googleLoginEnabled?: boolean;
      googleClientId?: string;
      googleClientSecret?: string;
      googleAnalyticsId?: string; // ✅ Adicionado
      gaServiceAccount?: string;  // ✅ Adicionado
  ga4PropertyId?: string;
    };
    isLoading: boolean;
    isPending: boolean;
  };
  actions: {
    updateField: (field: string, value: string | boolean) => void;
  };
}

export function SecurityConfig({ state, actions }: SecurityConfigProps) {
  const [showSecret, setShowSecret] = useState(false);
  const [showGemini, setShowGemini] = useState(false);
  const [showJSON, setShowJSON] = useState(false);

  const { formData, isLoading } = state;

  return (
    <div className="space-y-6 text-left">
      
      {/* --- 1. CARD GEMINI AI --- */}
      <Card className="rounded-4xl border-none shadow-sm bg-white overflow-hidden border border-slate-100">
        <CardHeader className="p-8 bg-emerald-50/20 border-b border-emerald-100/50">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="text-xl font-black uppercase italic tracking-tighter text-slate-900 flex items-center gap-2">
                <BrainCircuit className="text-emerald-600" size={22} /> 
                Inteligência <span className="text-emerald-600">Gemini AI</span>
              </CardTitle>
              <CardDescription className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1">
                <Lock size={12} /> Motor de Prescrição Ativo
              </CardDescription>
            </div>
            {isLoading && <Loader2 className="animate-spin text-emerald-500" size={20} />}
          </div>
        </CardHeader>
        <CardContent className="p-8">
            <div className="space-y-3">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1">
                <Key size={10} /> Google Gemini API Key
              </Label>
              <div className="relative">
                <Input 
                  type={showGemini ? "text" : "password"}
                  value={formData.geminiApiKey || ""}
                  onChange={(e) => actions.updateField('geminiApiKey', e.target.value)}
                  className="h-14 rounded-2xl bg-slate-50 border-none font-mono text-[11px] shadow-inner pr-12"
                  placeholder="Insira a chave do AI Studio..."
                  disabled={isLoading}
                />
                <button 
                  type="button" 
                  onClick={() => setShowGemini(!showGemini)} 
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-emerald-600 transition-colors"
                >
                  {showGemini ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
        </CardContent>
      </Card>

      {/* --- 2. CARD ANALYTICS & BI (NOVO) --- */}
      <Card className="rounded-4xl border-none shadow-sm bg-white overflow-hidden border border-slate-100">
        <CardHeader className="p-8 bg-blue-50/20 border-b border-blue-100/50">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="text-xl font-black uppercase italic tracking-tighter text-slate-900 flex items-center gap-2">
                <BarChart3 className="text-blue-600" size={22} /> 
                Business <span className="text-blue-600">Intelligence</span>
              </CardTitle>
              <CardDescription className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1">
                <Lock size={12} /> Sincronização Google Cloud
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-8 space-y-6">
          <div className="space-y-3">
            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1">
              <Key size={10} /> Google Analytics ID (G-XXXX)
            </Label>
            <Input 
              value={formData.googleAnalyticsId || ""} 
              onChange={(e) => actions.updateField('googleAnalyticsId', e.target.value)} 
              placeholder="G-..."
              className="h-14 rounded-2xl bg-slate-50 border-none font-mono text-[11px] shadow-inner"
              disabled={isLoading}
            />
          </div>

          <div className="space-y-3">
            <Flex justifyContent="between" alignItems="center">
               <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1">
                 <FileJson size={10} /> Service Account JSON (BI API)
               </Label>
               <button 
                  type="button" 
                  onClick={() => setShowJSON(!showJSON)}
                  className="text-[9px] font-black uppercase text-blue-600 hover:underline"
                >
                  {showJSON ? "Ocultar" : "Mostrar JSON"}
               </button>
            </Flex>
            <Textarea 
              value={formData.gaServiceAccount || ""} 
              onChange={(e) => actions.updateField('gaServiceAccount', e.target.value)} 
              placeholder='{ "type": "service_account", ... }'
              className={cn(
                "min-h-30 rounded-2xl bg-slate-50 border-none font-mono text-[10px] shadow-inner resize-none transition-all",
                !showJSON && "blur-sm select-none"
              )}
              disabled={isLoading}
            />
          </div>
        </CardContent>
      </Card>

      {/* --- 3. CARD GOOGLE AUTH --- */}
      <Card className="rounded-4xl border-none shadow-sm bg-white overflow-hidden border border-slate-100">
        <CardHeader className="p-8 bg-slate-50/40 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="text-xl font-black uppercase italic tracking-tighter text-slate-900 flex items-center gap-2">
                <ShieldCheck className="text-slate-600" size={22} /> 
                Autenticação <span className="text-slate-600">Google</span>
              </CardTitle>
              <CardDescription className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1">
                <Lock size={12} /> Criptografia AES-256 GCM
              </CardDescription>
            </div>
            <Switch 
              checked={!!formData.googleLoginEnabled} 
              onCheckedChange={(val) => actions.updateField('googleLoginEnabled', val)} 
              disabled={isLoading} 
            />
          </div>
        </CardHeader>
        <CardContent className="p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1">
                <Key size={10} /> Client ID
              </Label>
              <Input 
                value={formData.googleClientId || ""} 
                onChange={(e) => actions.updateField('googleClientId', e.target.value)} 
                className="h-14 rounded-2xl bg-slate-50 border-none font-mono text-[11px] shadow-inner"
                disabled={isLoading}
              />
            </div>
            <div className="space-y-3">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1">
                <Lock size={10} /> Client Secret
              </Label>
              <div className="relative">
                <Input 
                  type={showSecret ? "text" : "password"} 
                  value={formData.googleClientSecret || ""} 
                  onChange={(e) => actions.updateField('googleClientSecret', e.target.value)} 
                  className="h-14 rounded-2xl bg-slate-50 border-none font-mono text-[11px] shadow-inner pr-12"
                  disabled={isLoading}
                />
                <button 
                  type="button" 
                  onClick={() => setShowSecret(!showSecret)} 
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showSecret ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

    </div>
  );
}

// Helper local para o Flex do Tremor (se não quiser importar o componente inteiro)
interface FlexProps {
  children: React.ReactNode;
  justifyContent?: "start" | "end" | "center" | "between" | "around" | "evenly";
  alignItems?: "start" | "end" | "center" | "baseline" | "stretch";
}

function Flex({ children, justifyContent = "between", alignItems = "center" }: FlexProps) {
    return <div className={`flex justify-${justifyContent} items-${alignItems}`}>{children}</div>;
}