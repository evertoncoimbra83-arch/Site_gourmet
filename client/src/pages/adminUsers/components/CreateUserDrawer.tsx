import React, { useState, useEffect } from "react";
import { 
  Sheet, 
  SheetContent, 
  SheetTitle,
  SheetDescription 
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { 
  UserPlus, X, ShieldCheck, Mail, User, 
  Fingerprint, Phone, Loader2, Save 
} from "lucide-react";

// Estado inicial isolado para facilitar o reset
const INITIAL_STATE = {
  name: "",
  email: "",
  customerDocument: "",
  phone: "",
  role: "user"
};

// --- INTERFACES ---

interface UserFormData {
  name: string;
  email: string;
  customerDocument: string;
  phone: string;
  role: string;
}

interface CreateUserDrawerProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: UserFormData) => void;
  isPending: boolean;
}

export function CreateUserDrawer({ 
  open, 
  onClose, 
  onSubmit, 
  isPending 
}: CreateUserDrawerProps) {
  const [formData, setFormData] = useState(INITIAL_STATE);

  // ✅ RESET LOGIC: Limpa o formulário sempre que o Drawer é fechado
  useEffect(() => {
    if (!open) {
      setFormData(INITIAL_STATE);
    }
  }, [open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:max-w-md p-0 border-none bg-white flex flex-col h-screen outline-none shadow-2xl">
        
        {/* HEADER PREMIUM DARK */}
        <div className="p-8 bg-slate-900 shrink-0 relative overflow-hidden">
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl" />
          
          <div className="flex justify-between items-start relative z-10">
            <div className="flex items-center gap-5">
              <div className="h-14 w-14 bg-emerald-500 rounded-2xl flex items-center justify-center text-white shadow-xl border border-white/10 shrink-0">
                <UserPlus size={28} strokeWidth={2.5} />
              </div>
              
              <div className="text-left space-y-0.5">
                <div className="flex items-center gap-2 text-emerald-400 mb-1">
                  <ShieldCheck size={12} strokeWidth={3} />
                  <span className="text-[9px] font-black uppercase tracking-[0.3em]">Novo Cadastro</span>
                </div>
                <SheetTitle className="text-2xl font-black uppercase italic tracking-tighter text-white leading-none">
                  Adicionar <span className="text-emerald-500">Membro</span>
                </SheetTitle>
                <SheetDescription className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mt-1">
                  Preencha os dados básicos de acesso
                </SheetDescription>
              </div>
            </div>
            
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-10 w-10 rounded-xl bg-white/5 text-white/40 hover:bg-white/10 hover:text-white transition-all shrink-0 border-none" 
              onClick={onClose}
            >
              <X size={18} />
            </Button>
          </div>
        </div>

        {/* FORMULÁRIO */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar bg-white">
            
            {/* CAMPO: NOME COMPLETO */}
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Nome Completo</Label>
              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-500 transition-colors" size={16} />
                <Input 
                  name="name"
                  required
                  placeholder="Ex: João Silva"
                  className="h-14 pl-12 rounded-2xl border-slate-100 bg-slate-50 focus:bg-white transition-all font-bold text-sm outline-none"
                  value={formData.name}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* CAMPO: E-MAIL */}
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">E-mail de Acesso</Label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-500 transition-colors" size={16} />
                <Input 
                  name="email"
                  type="email"
                  required
                  placeholder="joao@email.com"
                  className="h-14 pl-12 rounded-2xl border-slate-100 bg-slate-50 focus:bg-white transition-all font-bold text-sm outline-none"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* CAMPO: CPF */}
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">CPF</Label>
                <div className="relative group">
                  <Fingerprint className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-500 transition-colors" size={16} />
                  <Input 
                    name="customerDocument"
                    placeholder="000.000.000-00"
                    className="h-14 pl-12 rounded-2xl border-slate-100 bg-slate-50 focus:bg-white transition-all font-bold text-sm outline-none"
                    value={formData.customerDocument}
                    onChange={handleChange}
                  />
                </div>
              </div>

              {/* CAMPO: TELEFONE */}
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">WhatsApp</Label>
                <div className="relative group">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-500 transition-colors" size={16} />
                  <Input 
                    name="phone"
                    placeholder="(00) 00000-0000"
                    className="h-14 pl-12 rounded-2xl border-slate-100 bg-slate-50 focus:bg-white transition-all font-bold text-sm outline-none"
                    value={formData.phone}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>

            {/* CAMPO: NÍVEL DE ACESSO */}
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Nível de Permissão</Label>
              <select 
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="w-full h-14 px-5 rounded-2xl border border-slate-100 bg-slate-50 font-black text-[11px] uppercase tracking-widest focus:ring-2 focus:ring-emerald-500/20 outline-none appearance-none cursor-pointer"
              >
                <option value="user">Cliente Padrão</option>
                <option value="admin">Administrador GS</option>
              </select>
            </div>
          </div>

          {/* FOOTER COM BOTÃO DE SALVAR */}
          <div className="p-6 bg-slate-50 border-t border-slate-100 shrink-0">
            <Button 
              type="submit"
              disabled={isPending}
              className="w-full h-16 rounded-2xl bg-slate-900 hover:bg-emerald-600 text-white font-black uppercase text-xs tracking-[0.2em] shadow-xl transition-all active:scale-95 border-none"
            >
              {isPending ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <div className="flex items-center gap-2">
                  <Save size={18} />
                  <span>Finalizar Cadastro</span>
                </div>
              )}
            </Button>
            <Button 
              type="button"
              variant="ghost" 
              onClick={onClose}
              className="w-full mt-2 h-10 font-black text-[10px] uppercase tracking-widest text-slate-400 hover:text-slate-600 border-none"
            >
              Cancelar
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}