import React, { useState, useMemo } from "react"; // ✅ Adicionado React scope
import { Type, Code, Info, Layout, Eye } from "lucide-react"; // ✅ Removido Smartphone (unused)
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// --- INTERFACES ---

interface MailLayoutFormData {
  email_order_subject?: string;
  email_order_body?: string;
  email_reset_subject?: string;
  email_reset_body?: string;
  [key: string]: unknown;
}

interface MailLayoutEditorProps {
  formData: MailLayoutFormData;
  setFormData: (data: MailLayoutFormData) => void;
  // branding removido por não ser utilizado no código
}

export function MailLayoutEditor({ formData, setFormData }: MailLayoutEditorProps) { // ✅ Removido 'any' e 'branding'
  const [activeTab, setActiveTab] = useState("order");

  /**
   * ✅ LÓGICA DE RENDERIZAÇÃO DO PREVIEW
   */
  const renderPreview = (html: string | undefined, type: string) => {
    if (!html || html.trim() === "") {
      return `
        <body style="font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; color: #cbd5e1; text-align: center; padding: 20px;">
          <div>
            <p style="font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.1em;">Aguardando HTML...</p>
          </div>
        </body>
      `;
    }

    let preview = html;
    
    if (type === "order") {
      preview = preview
        .replace(/{{customerName}}/g, "João Silva")
        .replace(/{{orderId}}/g, "8829")
        .replace(/{{total}}/g, "145,90")
        .replace(/{{itemsHtml}}/g, `
          <div style="border: 1px solid #f1f5f9; padding: 10px; border-radius: 8px;">
            <p style="margin: 0; font-size: 12px;">• 1x Pizza Calabresa</p>
            <p style="margin: 0; font-size: 12px;">• 1x Coca-Cola 2L</p>
          </div>
        `);
    } else {
      preview = preview
        .replace(/{{name}}/g, "João Silva")
        .replace(/{{resetLink}}/g, "#");
    }

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
            img { max-width: 100%; height: auto; }
          </style>
        </head>
        <body>
          ${preview}
        </body>
      </html>
    `;
  };

  const currentHtml = activeTab === "order" ? formData?.email_order_body : formData?.email_reset_body;
  const previewContent = useMemo(() => renderPreview(currentHtml, activeTab), [currentHtml, activeTab]);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 animate-in fade-in duration-500 text-left">
      
      {/* COLUNA DA ESQUERDA: EDITOR */}
      <div className="xl:col-span-7 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-8">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
            <Layout size={20} />
          </div>
          <div>
            <h3 className="font-black uppercase italic tracking-tighter text-slate-900 leading-none">Design dos Templates</h3>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Edite o conteúdo visual das mensagens</p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="bg-slate-50 p-1 rounded-xl h-12 mb-6 border border-slate-100">
            <TabsTrigger value="order" className="rounded-lg px-4 font-black text-[9px] uppercase tracking-widest">Confirmação de Pedido</TabsTrigger>
            <TabsTrigger value="reset" className="rounded-lg px-4 font-black text-[9px] uppercase tracking-widest">Reset de Senha</TabsTrigger>
          </TabsList>

          <TabsContent value="order" className="space-y-6 outline-none">
            <div className="space-y-2 text-left">
              <Label className="text-[10px] font-black uppercase text-slate-700 ml-1 tracking-widest flex items-center gap-2">
                <Type size={12} /> Assunto do E-mail
              </Label>
              <Input 
                value={formData?.email_order_subject || ""} 
                onChange={(e) => setFormData({ ...formData, email_order_subject: e.target.value })}
                placeholder="Ex: Seu pedido #{{orderId}} chegou!"
                className="h-12 rounded-xl border-slate-100 bg-slate-50 font-bold text-xs"
              />
            </div>

            <div className="space-y-2 text-left">
              <Label className="text-[10px] font-black uppercase text-slate-700 ml-1 tracking-widest flex items-center gap-2">
                <Code size={12} /> Conteúdo HTML
              </Label>
              <Textarea 
                value={formData?.email_order_body || ""} 
                onChange={(e) => setFormData({ ...formData, email_order_body: e.target.value })}
                className="min-h-[400px] rounded-2xl border-slate-100 bg-slate-50 font-mono text-[11px] leading-relaxed p-6 focus:ring-[#2D5A3D]"
                placeholder="<html>..."
              />
            </div>
          </TabsContent>

          <TabsContent value="reset" className="space-y-6 outline-none">
            <div className="space-y-2 text-left">
              <Label className="text-[10px] font-black uppercase text-slate-700 ml-1 tracking-widest flex items-center gap-2">
                <Type size={12} /> Assunto
              </Label>
              <Input 
                value={formData?.email_reset_subject || ""} 
                onChange={(e) => setFormData({ ...formData, email_reset_subject: e.target.value })}
                className="h-12 rounded-xl border-slate-100 bg-slate-50 font-bold text-xs"
              />
            </div>

            <div className="space-y-2 text-left">
              <Label className="text-[10px] font-black uppercase text-slate-700 ml-1 tracking-widest flex items-center gap-2">
                <Code size={12} /> Conteúdo HTML
              </Label>
              <Textarea 
                value={formData?.email_reset_body || ""} 
                onChange={(e) => setFormData({ ...formData, email_reset_body: e.target.value })}
                className="min-h-[400px] rounded-2xl border-slate-100 bg-slate-50 font-mono text-[11px] p-6 focus:ring-[#2D5A3D]"
              />
            </div>
          </TabsContent>

          <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100 mt-6 text-left">
            <div className="flex items-center gap-2 mb-2">
              <Info size={14} className="text-emerald-600" />
              <span className="text-[10px] font-black uppercase text-emerald-700 tracking-tight">Variáveis Disponíveis</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {(activeTab === "order" ? ["customerName", "orderId", "total", "itemsHtml"] : ["name", "resetLink"]).map(tag => (
                <code key={tag} className="text-[9px] font-bold bg-white px-2 py-1 rounded-md border border-emerald-200 text-emerald-600">
                  {"{{"}{tag}{"}}"}
                </code>
              ))}
            </div>
          </div>
        </Tabs>
      </div>

      {/* COLUNA DA DIREITA: PREVIEW */}
      <div className="xl:col-span-5 space-y-4">
        <div className="flex items-center justify-between ml-4">
          <div className="flex items-center gap-2">
            <Eye size={14} className="text-slate-400" />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Preview em Tempo Real</span>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-[340px] border-[8px] border-slate-900 rounded-[3rem] shadow-2xl overflow-hidden bg-white aspect-[9/18.5]">
          <div className="absolute top-0 inset-x-0 h-7 bg-slate-900 flex justify-center items-end pb-1.5 z-20">
             <div className="w-12 h-1 bg-slate-800 rounded-full" />
          </div>

          <div className="mt-7 px-6 py-4 border-b border-slate-100 bg-slate-50/50 relative z-10 text-left">
             <p className="text-[7px] font-bold text-slate-400 uppercase tracking-widest mb-1">Assunto:</p>
             <p className="text-[10px] font-black text-slate-800 line-clamp-1">
                {(activeTab === "order" ? formData?.email_order_subject : formData?.email_reset_subject) || "(Sem assunto)"}
             </p>
          </div>

          <iframe 
            key={`${activeTab}-${(currentHtml || "").length}`}
            title="Email Preview"
            className="w-full h-full border-none bg-white"
            srcDoc={previewContent}
          />
        </div>
        
        <p className="text-center text-[9px] font-bold text-slate-400 uppercase tracking-tighter px-10">
          Nota: O preview simula o preenchimento automático das tags.
        </p>
      </div>
    </div>
  );
}