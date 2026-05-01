import React, { useState } from "react"; 
import { Mail, Server, Key, Hash, ShieldCheck, Send, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

// --- INTERFACES ---

interface MailFormData {
  smtp_host?: string;
  smtp_port?: string | number;
  smtp_user?: string;
  smtp_pass?: string;
  [key: string]: unknown;
}

interface MailConfigProps {
  formData: MailFormData;
  setFormData: (data: MailFormData) => void;
  onTestConnection: (email: string) => void; // ✅ Nova prop
  isTesting: boolean; // ✅ Nova prop
}

export function MailConfigCard({ formData, setFormData, onTestConnection, isTesting }: MailConfigProps) {
  const [testEmail, setTestEmail] = useState(""); // Estado local para o input de teste

  return (
    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-8 animate-in fade-in duration-500 text-left">
      
      {/* Título e Subtítulo */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
          <Mail size={20} />
        </div>
        <div>
          <h3 className="font-black uppercase italic tracking-tighter text-slate-900 leading-none">Conectividade SMTP</h3>
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Configurações do Servidor de Saída</p>
        </div>
      </div>

      {/* Grid de Inputs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2 text-left">
          <Label className="text-[10px] font-black uppercase text-slate-700 ml-1 tracking-widest flex items-center gap-2">
            <Server size={12} /> Host SMTP
          </Label>
          <Input 
            value={formData?.smtp_host || ""} 
            onChange={(e) => setFormData({ ...formData, smtp_host: e.target.value })}
            placeholder="smtp.hostinger.com"
            className="h-12 rounded-xl border-slate-100 bg-slate-50 font-bold text-xs focus:ring-[#2D5A3D]"
          />
        </div>

        <div className="space-y-2 text-left">
          <Label className="text-[10px] font-black uppercase text-slate-700 ml-1 tracking-widest flex items-center gap-2">
            <Hash size={12} /> Porta
          </Label>
          <Input 
            value={formData?.smtp_port || ""} 
            onChange={(e) => setFormData({ ...formData, smtp_port: e.target.value })}
            placeholder="465"
            className="h-12 rounded-xl border-slate-100 bg-slate-50 font-bold text-xs focus:ring-[#2D5A3D]"
          />
        </div>

        <div className="space-y-2 text-left">
          <Label className="text-[10px] font-black uppercase text-slate-700 ml-1 tracking-widest flex items-center gap-2">
            <Mail size={12} /> Usuário (E-mail)
          </Label>
          <Input 
            value={formData?.smtp_user || ""} 
            onChange={(e) => setFormData({ ...formData, smtp_user: e.target.value })}
            placeholder="pedidos@dominio.com.br"
            className="h-12 rounded-xl border-slate-100 bg-slate-50 font-bold text-xs focus:ring-[#2D5A3D]"
          />
        </div>

        <div className="space-y-2 text-left">
          <Label className="text-[10px] font-black uppercase text-slate-700 ml-1 tracking-widest flex items-center gap-2">
            <Key size={12} /> Senha do E-mail
          </Label>
          <Input 
            type="password"
            value={formData?.smtp_pass || ""} 
            onChange={(e) => setFormData({ ...formData, smtp_pass: e.target.value })}
            placeholder="••••••••"
            className="h-12 rounded-xl border-slate-100 bg-slate-50 font-bold text-xs focus:ring-[#2D5A3D]"
          />
        </div>
      </div>

      {/* --- SEÇÃO DE TESTE DE CONEXÃO --- */}
      <div className="pt-6 border-t border-slate-100">
        <div className="bg-slate-900 rounded-[2rem] p-6 text-white shadow-2xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-1">
              <h4 className="text-sm font-black uppercase italic tracking-tighter flex items-center gap-2">
                <Send size={16} className="text-emerald-400" /> Testar Protocolos
              </h4>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                Envie um disparo de teste para validar o Host e Porta.
              </p>
            </div>

            <div className="flex w-full md:w-auto gap-2">
              <Input 
                placeholder="E-mail de destino..."
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                className="h-12 bg-white/10 border-white/10 text-white placeholder:text-slate-500 font-bold text-xs rounded-xl min-w-[200px]"
              />
              <Button 
                onClick={() => onTestConnection(testEmail)}
                disabled={isTesting || !testEmail}
                className="h-12 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black transition-all active:scale-95"
              >
                {isTesting ? <Loader2 className="animate-spin" size={18} /> : "ENVIAR"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Info Box de Segurança */}
      <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex gap-3 items-center text-left">
        <div className="text-emerald-600 shrink-0"><ShieldCheck size={20} /></div>
        <p className="text-[9px] font-bold text-emerald-800 uppercase leading-relaxed tracking-tight">
          Proteção Ativa: Esta senha será criptografada via AES-256-GCM antes de ser salva no banco de dados.
        </p>
      </div>
    </div>
  );
}