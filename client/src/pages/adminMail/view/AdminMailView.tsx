import { Mail, Settings, Layout, Save, Loader2, Send } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input"; // Certifique-se de ter esse componente
import { MailConfigCard } from "../components/MailConfigCard";
import { MailLayoutEditor } from "../components/MailLayoutEditor";
import { useAdminMail } from "../logic/useAdminMail";
import { trpc } from "@/_core/trpc";
import { useState } from "react";
import { toast } from "@/components/ui/use-toast";

export function AdminMailView() {
  const { state, actions } = useAdminMail();
  const [testEmail, setTestEmail] = useState("");

  // Hook para disparar o e-mail de teste
  const testMutation = trpc.admin.mail.testConnection.useMutation({
  onSuccess: () => toast.success("E-mail disparado! Confira o Mailpit."),
  onError: (err) => toast.error("Falha: " + err.message)
});

  const handleSendTest = () => {
    if (!testEmail) return toast.error("Insira um e-mail para testar.");
    testMutation.mutate({ to: testEmail });
  };

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      {/* Header Identitário */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">
            Central de <span className="text-emerald-600">Comunicação</span>
          </h1>
          <p className="text-slate-500 font-bold text-[10px] uppercase tracking-widest mt-2">
            Configurações de SMTP e Personalização de Mensagens
          </p>
        </div>
        
        <Button 
          onClick={actions.saveAll}
          disabled={state.isSaving}
          className="bg-slate-900 hover:bg-black text-white rounded-2xl h-14 px-8 font-black shadow-xl transition-all active:scale-95"
        >
          {state.isSaving ? <Loader2 className="animate-spin mr-2" /> : <Save className="mr-2" size={18} />}
          ATUALIZAR CENTRAL
        </Button>
      </header>

      <Tabs defaultValue="config" className="w-full space-y-8">
        <TabsList className="bg-slate-100 p-1 rounded-2xl h-16 w-full md:w-auto justify-start border border-slate-200/50">
          <TabsTrigger value="config" className="rounded-xl px-6 font-black text-[10px] uppercase tracking-widest data-[state=active]:bg-white">
            <Settings size={16} className="mr-2" /> Conectividade (SMTP)
          </TabsTrigger>
          <TabsTrigger value="layout" className="rounded-xl px-6 font-black text-[10px] uppercase tracking-widest data-[state=active]:bg-white">
            <Layout size={16} className="mr-2" /> Templates & Design
          </TabsTrigger>
        </TabsList>

        {/* Tab de Configuração SMTP */}
        <TabsContent value="config" className="space-y-6">
          <MailConfigCard formData={state.formData} setFormData={actions.setFormData} />
          
          {/* ✅ SEÇÃO DE TESTE ADICIONADA AQUI */}
          <div className="bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-sm">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="max-w-md">
                <h3 className="text-sm font-black uppercase tracking-widest text-slate-900">Validar Conexão</h3>
                <p className="text-[11px] font-bold text-slate-400 uppercase mt-1">
                  Certifique-se de salvar as alterações acima antes de testar.
                </p>
              </div>
              
              <div className="flex w-full md:w-auto items-center gap-3">
                <Input 
                  placeholder="Seu melhor e-mail..."
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  className="h-12 rounded-xl bg-slate-50 border-none font-bold text-xs px-4 w-full md:w-64"
                />
                <Button 
                  onClick={handleSendTest}
                  disabled={testMutation.isPending}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl h-12 px-6 font-black text-[10px] uppercase tracking-widest"
                >
                  {testMutation.isPending ? <Loader2 className="animate-spin" /> : <Send size={14} className="mr-2" />}
                  Testar
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Tab de Layout */}
        <TabsContent value="layout">
          <MailLayoutEditor formData={state.formData} setFormData={actions.setFormData} />
        </TabsContent>
      </Tabs>
    </div>
  );
}