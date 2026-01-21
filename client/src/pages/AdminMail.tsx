import { Mail, Settings, Layout, Save, Loader2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";

// Importação dos componentes que criamos
import { MailConfigCard } from "./adminMail/components/MailConfigCard";
import { MailLayoutEditor } from "./adminMail/components/MailLayoutEditor";
import { useAdminMail } from "./adminMail/logic/useAdminMail";

export function AdminMailView() {
  const { state, actions } = useAdminMail();

  // Loading state para quando abre a página e busca as configs do banco
  if (state.isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <Loader2 className="animate-spin text-emerald-600" size={40} />
        <p className="text-slate-400 font-black uppercase text-[10px] tracking-[0.3em]">
          Carregando Protocolos...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      
      {/* --- HEADER --- */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">
            Central de <span className="text-emerald-600">Comunicação</span>
          </h1>
          <p className="text-slate-500 font-bold text-[10px] uppercase tracking-widest mt-2">
            Gestão de SMTP e Design de Mensagens Transacionais
          </p>
        </div>
        
        <Button 
          onClick={actions.saveAll}
          disabled={state.isSaving}
          className="bg-slate-900 hover:bg-black text-white rounded-2xl h-14 px-8 font-black shadow-xl transition-all active:scale-95 disabled:opacity-70"
        >
          {state.isSaving ? (
            <Loader2 className="animate-spin mr-2" size={18} />
          ) : (
            <Save className="mr-2" size={18} />
          )}
          ATUALIZAR CENTRAL
        </Button>
      </header>

      {/* --- ABAS DE NAVEGAÇÃO --- */}
      <Tabs defaultValue="config" className="w-full space-y-8">
        <TabsList className="bg-slate-100 p-1 rounded-2xl h-16 w-full md:w-auto justify-start border border-slate-200/50">
          <TabsTrigger 
            value="config" 
            className="rounded-xl px-6 font-black text-[10px] uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:shadow-sm"
          >
            <Settings size={16} className="mr-2" /> Conectividade (SMTP)
          </TabsTrigger>
          <TabsTrigger 
            value="layout" 
            className="rounded-xl px-6 font-black text-[10px] uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:shadow-sm"
          >
            <Layout size={16} className="mr-2" /> Templates & Design
          </TabsTrigger>
        </TabsList>

        {/* --- CONTEÚDO: SMTP --- */}
        <TabsContent value="config" className="outline-none">
          <MailConfigCard 
            formData={state.formData} 
            setFormData={actions.setFormData} 
          />
        </TabsContent>

        {/* --- CONTEÚDO: TEMPLATES HTML --- */}
        <TabsContent value="layout" className="outline-none">
          <MailLayoutEditor 
            formData={state.formData} 
            setFormData={actions.setFormData} 
          />
        </TabsContent>
      </Tabs>

      {/* Rodapé de Status */}
      <footer className="pt-10 border-t border-slate-100 flex items-center gap-4">
        <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
        <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">
          Sistema de mensageria ativo e encriptado via AES-256-GCM
        </p>
      </footer>
    </div>
  );
}