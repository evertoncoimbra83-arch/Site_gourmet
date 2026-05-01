import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Save, Loader2, User, Phone, Fingerprint, Mail } from "lucide-react";
import { useAdminProfile } from "../../logic/useAdminProfile";

// ✅ Interface definida para evitar o erro de 'any'
interface ProfileTabProps {
  details: {
    user?: {
      id: string;
      name?: string;
      phone?: string;
      customerPhone?: string;
      customerDocument?: string;
      cpf?: string;
      email?: string;
    };
    email?: string;
  } | null;
}

export function ProfileTab({ details }: ProfileTabProps) {
  const { 
    formData, 
    setFormData, 
    isUpdating, 
    handleSave, 
    maskDocument, 
    maskPhone, 
    displayEmail 
  } = useAdminProfile(details);

  if (!details) return (
    <div className="py-20 text-center flex flex-col items-center justify-center gap-3">
      <Loader2 className="animate-spin text-slate-300" size={32} />
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Carregando Perfil...</p>
    </div>
  );

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-500 font-sans text-left">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
        
        {/* NOME */}
        <div className="space-y-2 group">
          <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1 group-focus-within:text-emerald-600 transition-colors">
            Nome Completo
          </Label>
          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-500 transition-colors" size={16} />
            <Input 
              className="h-14 pl-12 rounded-2xl bg-slate-50 border-none font-bold text-slate-900 focus-visible:ring-emerald-500/20 focus-visible:bg-white transition-all" 
              value={formData.name} 
              onChange={e => setFormData({...formData, name: e.target.value})} 
            />
          </div>
        </div>

        {/* DOCUMENTO (Read-only) */}
        <div className="space-y-2 opacity-80">
          <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">
            Documento de Identidade
          </Label>
          <div className="relative">
            <Fingerprint className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
            <Input 
              className="h-14 pl-12 rounded-2xl bg-slate-100/50 border-none font-bold text-slate-500 cursor-not-allowed" 
              value={maskDocument(formData.customerDocument)} 
              disabled 
            />
          </div>
        </div>

        {/* TELEFONE */}
        <div className="space-y-2 group">
          <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1 group-focus-within:text-emerald-600 transition-colors">
            Telefone Celular
          </Label>
          <div className="relative">
            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-500 transition-colors" size={16} />
            <Input 
              className="h-14 pl-12 rounded-2xl bg-slate-50 border-none font-bold text-slate-900 focus-visible:ring-emerald-500/20 focus-visible:bg-white transition-all" 
              value={maskPhone(formData.phone)} 
              placeholder="(00) 00000-0000"
              onChange={e => {
                const rawValue = e.target.value.replace(/\D/g, "");
                if(rawValue.length <= 11) {
                  setFormData({...formData, phone: rawValue});
                }
              }} 
            />
          </div>
        </div>

        {/* E-MAIL (Read-only) */}
        <div className="space-y-2 opacity-80">
          <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">
            E-mail de Cadastro
          </Label>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
            <Input 
              className="h-14 pl-12 rounded-2xl bg-slate-100/50 border-none font-bold text-slate-500 cursor-not-allowed" 
              value={String(displayEmail)} 
              disabled 
            />
          </div>
        </div>
      </div>
      
      <div className="pt-4 flex justify-start">
        <Button 
          onClick={handleSave} 
          disabled={isUpdating}
          className="bg-slate-900 hover:bg-emerald-600 text-white rounded-[1.25rem] h-14 px-10 font-black uppercase text-[10px] tracking-[0.2em] shadow-xl shadow-slate-200 transition-all active:scale-95 disabled:opacity-50"
        >
          {isUpdating ? (
            <><Loader2 className="mr-3 animate-spin" size={18} /> Sincronizando...</>
          ) : (
            <><Save className="mr-3" size={18} /> Salvar Alterações</>
          )}
        </Button>
      </div>
    </div>
  );
}