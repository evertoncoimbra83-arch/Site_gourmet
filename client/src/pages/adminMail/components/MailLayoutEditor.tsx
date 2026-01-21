// ✅ Adicionado 'Layout' na desestruturação do lucide-react
import { Mail, Type, Code, Info, Layout } from "lucide-react"; 
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function MailLayoutEditor({ formData, setFormData }: any) {
  return (
    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
          {/* Agora o ícone 'Layout' será encontrado corretamente */}
          <Layout size={20} />
        </div>
        <div>
          <h3 className="font-black uppercase italic tracking-tighter text-slate-900 leading-none">Design dos Templates</h3>
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Edite o conteúdo visual das mensagens</p>
        </div>
      </div>

      <Tabs defaultValue="order" className="w-full">
        <TabsList className="bg-slate-50 p-1 rounded-xl h-12 mb-6 border border-slate-100">
          <TabsTrigger value="order" className="rounded-lg px-4 font-black text-[9px] uppercase tracking-widest">Confirmação de Pedido</TabsTrigger>
          <TabsTrigger value="reset" className="rounded-lg px-4 font-black text-[9px] uppercase tracking-widest">Reset de Senha</TabsTrigger>
        </TabsList>

        {/* --- TEMPLATE: PEDIDO --- */}
        <TabsContent value="order" className="space-y-6">
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase text-slate-700 ml-1 tracking-widest flex items-center gap-2">
              <Type size={12} /> Assunto do E-mail
            </Label>
            <Input 
              value={formData?.email_order_subject || ""} 
              onChange={(e) => setFormData({ ...formData, email_order_subject: e.target.value })}
              placeholder="Ex: Seu pedido #{{orderId}} chegou!"
              className="h-12 rounded-xl border-slate-100 bg-slate-50 font-bold text-xs focus:ring-[#2D5A3D]"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase text-slate-700 ml-1 tracking-widest flex items-center gap-2">
              <Code size={12} /> Conteúdo HTML
            </Label>
            <Textarea 
              value={formData?.email_order_body || ""} 
              onChange={(e) => setFormData({ ...formData, email_order_body: e.target.value })}
              className="min-h-75 rounded-2xl border-slate-100 bg-slate-50 font-mono text-[11px] leading-relaxed p-6 focus:ring-[#2D5A3D]"
              placeholder="<html>..."
            />
          </div>

          <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
            <div className="flex items-center gap-2 mb-2">
              <Info size={14} className="text-emerald-600" />
              <span className="text-[10px] font-black uppercase text-emerald-700 tracking-tight">Variáveis Disponíveis</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {["customerName", "orderId", "total", "itemsHtml"].map(tag => (
                <code key={tag} className="text-[9px] font-bold bg-white px-2 py-1 rounded-md border border-emerald-200 text-emerald-600">
                  {"{{"}{tag}{"}}"}
                </code>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* --- TEMPLATE: RESET --- */}
        <TabsContent value="reset" className="space-y-6">
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase text-slate-700 ml-1 tracking-widest flex items-center gap-2">
              <Type size={12} /> Assunto
            </Label>
            <Input 
              value={formData?.email_reset_subject || ""} 
              onChange={(e) => setFormData({ ...formData, email_reset_subject: e.target.value })}
              className="h-12 rounded-xl border-slate-100 bg-slate-50 font-bold text-xs focus:ring-[#2D5A3D]"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase text-slate-700 ml-1 tracking-widest flex items-center gap-2">
              <Code size={12} /> Conteúdo HTML
            </Label>
            <Textarea 
              value={formData?.email_reset_body || ""} 
              onChange={(e) => setFormData({ ...formData, email_reset_body: e.target.value })}
              className="min-h-75 rounded-2xl border-slate-100 bg-slate-50 font-mono text-[11px] focus:ring-[#2D5A3D]"
            />
          </div>
          
          <div className="flex gap-2 p-4 bg-slate-50 rounded-2xl border border-slate-100">
             <code className="text-[9px] font-bold bg-white px-2 py-1 rounded border">{"{{name}}"}</code>
             <code className="text-[9px] font-bold bg-white px-2 py-1 rounded border">{"{{resetLink}}"}</code>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}