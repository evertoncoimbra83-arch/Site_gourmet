import { useState } from "react";
import { useAdminSettings } from "../logic/useAdminSettings";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Loader2, Save, Globe, Lock, 
  Settings2, Palette, ShieldAlert, Database,
  Image as ImageIcon
} from "lucide-react";

import { GoogleAuthConfig } from "../components/GoogleAuthConfig"; 
import { CompanyInfoForm } from "../components/CompanyInfoForm"; 
import { PanicButton } from "../components/PanicButton";
import { AccessibilitySettings } from "../components/AccessibilitySettings";
import { InfrastructureCard } from "../components/InfrastructureCard";
import { MediaLibraryDrawer } from "../../adminMedia/view/MediaLibraryDrawer";
import { LoyaltyAutomationCard } from "../components/LoyaltyAutomationCard";

// ✅ Removida a importação do SMTPSettingsForm daqui

export function AdminSettingsView() { 
  const { state, actions } = useAdminSettings();
  const [isMediaOpen, setIsMediaOpen] = useState(false);

  if (state.isLoading) return (
    <div className="flex flex-col items-center justify-center py-32 gap-4">
      <Loader2 className="animate-spin text-[#2D5A3D]" size={40} />
      <p className="text-slate-400 font-black uppercase text-[10px] tracking-[0.3em]">Sincronizando Kernel...</p>
    </div>
  );

  const handleFaviconSelect = (fileName: string) => {
    const cleanName = fileName.split('/').pop() || fileName;
    actions.setFormData({
      ...state.formData,
      favicon: cleanName
    });
    setIsMediaOpen(false);
  };

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      
      {/* HEADER E BOTÃO SALVAR */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">
            Ajustes do <span className="text-[#2D5A3D]">Sistema</span>
          </h1>
          <p className="text-slate-500 font-bold text-[10px] uppercase tracking-widest mt-2">
            Gestão de branding e processos automatizados
          </p>
        </div>
        <Button 
          onClick={actions.handleSave} 
          disabled={state.isPending}
          className="bg-[#2D5A3D] hover:bg-[#1e3b28] text-white rounded-2xl h-14 px-8 font-black shadow-xl transition-all active:scale-95"
        >
          {state.isPending ? <Loader2 className="animate-spin mr-2" /> : <Save className="mr-2" size={18} />}
          SALVAR TUDO
        </Button>
      </header>

      <Tabs defaultValue="general" className="w-full space-y-8">
        <TabsList className="bg-slate-100 p-1 rounded-2xl h-16 w-full md:w-auto justify-start border border-slate-200/50">
          <TabsTrigger value="general" className="rounded-xl px-6 font-black text-[10px] uppercase tracking-widest data-[state=active]:bg-white">
            <Settings2 size={16} className="mr-2" /> Geral
          </TabsTrigger>
          <TabsTrigger value="appearance" className="rounded-xl px-6 font-black text-[10px] uppercase tracking-widest data-[state=active]:bg-white">
            <Palette size={16} className="mr-2" /> Interface & Automação
          </TabsTrigger>
          <TabsTrigger value="security" className="rounded-xl px-6 font-black text-[10px] uppercase tracking-widest data-[state=active]:bg-white">
            <ShieldAlert size={16} className="mr-2" /> Segurança
          </TabsTrigger>
          <TabsTrigger value="infra" className="rounded-xl px-6 font-black text-[10px] uppercase tracking-widest data-[state=active]:bg-white">
            <Database size={16} className="mr-2" /> Infra
          </TabsTrigger>
        </TabsList>

        {/* --- ABA GERAL --- */}
        <TabsContent value="general" className="outline-none">
          <CompanyInfoForm />
        </TabsContent>

        {/* --- ABA APARÊNCIA E AUTOMAÇÃO --- */}
        <TabsContent value="appearance" className="space-y-8 outline-none">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                  <Globe size={20} />
                </div>
                <h3 className="font-black uppercase italic tracking-tighter text-slate-900">Branding do Site</h3>
              </div>

              <div className="flex items-center gap-6 p-6 bg-slate-50 rounded-4xl border border-slate-100">
                <div className="h-20 w-20 rounded-2xl bg-white border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden shadow-inner">
                  {state.formData?.favicon ? (
                    <img 
                      src={`http://localhost:3001/uploads/${state.formData.favicon}`} 
                      className="h-10 w-10 object-contain"
                      alt="Favicon"
                      onError={(e) => e.currentTarget.src = "https://placehold.co/32x32/f1f5f9/cbd5e1?text=ICO"}
                    />
                  ) : (
                    <ImageIcon className="text-slate-200" size={24} />
                  )}
                </div>

                <div className="flex-1 space-y-3">
                  <p className="text-[10px] font-black uppercase text-slate-700 leading-tight">Ícone do Navegador (.ico)</p>
                  <Button 
                    variant="outline" 
                    onClick={() => setIsMediaOpen(true)}
                    className="h-10 px-6 rounded-xl border-slate-200 bg-white font-black text-[9px] uppercase tracking-widest hover:bg-[#2D5A3D] hover:text-white transition-all"
                  >
                    Alterar Favicon
                  </Button>
                </div>
              </div>
            </div>

            <LoyaltyAutomationCard />
          </div>

          <AccessibilitySettings 
            settings={state.formData || {}} 
            onUpdate={(v: any) => actions.setFormData({ ...state.formData, ...v })} 
          />
        </TabsContent>

        {/* --- ABA SEGURANÇA --- */}
        <TabsContent value="security" className="grid grid-cols-1 lg:grid-cols-2 gap-8 outline-none">
          <div className="space-y-8">
            <PanicButton />
            <GoogleAuthConfig />
          </div>
          <Card className="p-8 bg-slate-900 text-white rounded-[2.5rem] border-none flex flex-col justify-center items-center text-center space-y-4">
            <div className="h-20 w-20 bg-[#2D5A3D]/20 rounded-full flex items-center justify-center">
              <Lock size={40} className="text-[#2D5A3D]" />
            </div>
            <h3 className="font-black uppercase italic text-xl tracking-tighter">Segurança Ativa</h3>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-tight max-w-70">
              O núcleo utiliza criptografia de nível militar (AES-256-GCM) para proteger dados sensíveis.
            </p>
          </Card>
        </TabsContent>

        {/* --- ABA INFRA --- */}
        <TabsContent value="infra" className="outline-none space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            <InfrastructureCard />
            
            {/* ✅ Removido o SMTPSettingsForm daqui */}
            <div className="p-8 bg-slate-50 border border-dashed border-slate-200 rounded-[2.5rem] flex flex-col items-center justify-center text-center space-y-3">
              <Database className="text-slate-300" size={32} />
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                Dados de Conectividade agora residem na <br/>
                <span className="text-[#2D5A3D]">Central de Comunicação</span>
              </p>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <MediaLibraryDrawer 
        open={isMediaOpen}
        onClose={() => setIsMediaOpen(false)}
        onSelect={handleFaviconSelect}
      />
    </div>
  );
}