// client/src/pages/nutri/NutriRegister.tsx

import React, { useState, useEffect } from "react";
import { trpc } from "@/_core/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { 
  Stethoscope, User, Mail, Lock, MapPin, 
  Loader2, CheckCircle2, Building2, Hash, Sparkles,
  Info, Briefcase
} from "lucide-react";
import { appToast as toast } from "@/lib/app-toast";
import { cn } from "@/lib/utils";

// --- INTERFACES ---
interface InputProps {
  label: string;
  icon?: React.ReactNode;
  type?: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  disabled?: boolean;
}

export default function NutriRegister() {
  const { user } = useAuth();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSearchingZip, setIsSearchingZip] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "", email: "", password: "", crn: "", 
    specialty: "", bio: "",
    address: { 
      zipCode: "", street: "", number: "", 
      city: "", state: "", neighborhood: "" 
    }
  });

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        name: user.name || "",
        email: user.email || "",
        password: "USER_LOGGED_IN" 
      }));
    }
  }, [user]);

  const registerMutation = trpc.nutri.registerPublicProfile.useMutation({ 
    onSuccess: () => {
      toast.success("Cadastro enviado!");
      setIsSubmitted(true);
    },
    onError: (err) => toast.error(err.message || "Erro no cadastro.")
  });

  const handleZipCodeBlur = async () => {
    const zip = formData.address.zipCode.replace(/\D/g, "");
    if (zip.length !== 8) return;

    setIsSearchingZip(true);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${zip}/json/`);
      const data = await response.json();
      if (!data.erro) {
        setFormData(prev => ({
          ...prev,
          address: {
            ...prev.address,
            street: data.logradouro || "",
            city: data.localidade || "",
            state: data.uf || "",
            neighborhood: data.bairro || ""
          }
        }));
      }
    } catch {
      // ✅ FIX 1: Removido o parâmetro 'e' não utilizado para passar no ESLint
      toast.error("Erro ao buscar CEP.");
    } finally {
      setIsSearchingZip(false);
    }
  };

  const handleSubmit = () => {
    if (!formData.crn || !formData.address.zipCode || !formData.address.number) {
      return toast.error("Preencha todos os campos obrigatórios (*)");
    }
    
    registerMutation.mutate({
      name: formData.name,
      email: formData.email,
      // ✅ FIX 2: Garantido que seja uma string ('') caso formData.password seja falso.
      // Isso resolve o erro "Type 'string | undefined' is not assignable to type 'string'".
      password: formData.password || "",
      document: "PENDING",
      phone: "000000000",
      crn: formData.crn,
      specialty: formData.specialty,
      bio: formData.bio,
      offices: [{
        label: "Consultório Principal",
        zipCode: formData.address.zipCode,
        street: formData.address.street,
        number: formData.address.number,
        neighborhood: formData.address.neighborhood,
        city: formData.address.city,
        state: formData.address.state,
        isDefault: true
      }]
    });
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-[#FBFBFC] flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-white rounded-4xl p-12 text-center shadow-xl border border-slate-100 animate-in zoom-in-95 duration-500">
          <div className="h-20 w-20 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-200">
            <CheckCircle2 size={40} strokeWidth={3} />
          </div>
          <h2 className="text-2xl font-black uppercase italic text-slate-900 tracking-tighter mb-4">Solicitação Recebida</h2>
          <p className="text-slate-500 text-sm font-medium leading-relaxed mb-8">
            Sua documentação entrou em fila de análise. Você receberá um e-mail de confirmação em até 24h para acessar o painel.
          </p>
          <button onClick={() => window.location.href = "/"} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-emerald-600 transition-all">
            Voltar ao Início
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FBFBFC] py-12 px-4 md:px-6 font-sans">
      <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
        
        {/* HEADER SIMPLIFICADO */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 bg-emerald-500/10 text-emerald-600 px-4 py-1.5 rounded-full mb-2">
            <Sparkles size={14} />
            <span className="text-[10px] font-black uppercase tracking-widest">Seja um parceiro nutri</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 uppercase italic tracking-tighter">
            Gourmet <span className="text-emerald-500">Nutri</span>
          </h1>
          <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.3em]">Credenciamento Profissional</p>
        </div>

        <div className="bg-white rounded-4xl shadow-2xl shadow-slate-200/60 border border-slate-100 overflow-hidden">
          <div className="p-8 md:p-12 space-y-12">
            
            {/* SEÇÃO 1: ACESSO */}
            <section className="space-y-6">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <div className="h-8 w-8 bg-slate-900 text-white rounded-lg flex items-center justify-center font-black">1</div>
                <h2 className="font-black uppercase text-xs tracking-widest text-slate-900">Dados de Acesso</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input label="Nome Completo *" icon={<User size={18}/>} placeholder="Como no conselho" value={formData.name} onChange={(v) => setFormData({...formData, name: v})} disabled={!!user} />
                <Input label="E-mail Profissional *" icon={<Mail size={18}/>} placeholder="seu@email.com" value={formData.email} onChange={(v) => setFormData({...formData, email: v})} disabled={!!user} />
                {!user && (
                  <Input label="Defina uma Senha *" icon={<Lock size={18}/>} type="password" placeholder="Mínimo 6 dígitos" value={formData.password} onChange={(v) => setFormData({...formData, password: v})} />
                )}
                <Input label="CRN (Número/UF) *" icon={<Stethoscope size={18}/>} placeholder="Ex: 12345/P" value={formData.crn} onChange={(v) => setFormData({...formData, crn: v})} />
              </div>
            </section>

            {/* SEÇÃO 2: ATUAÇÃO */}
            <section className="space-y-6">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <div className="h-8 w-8 bg-slate-900 text-white rounded-lg flex items-center justify-center font-black">2</div>
                <h2 className="font-black uppercase text-xs tracking-widest text-slate-900">Especialidade e Consultório</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-3">
                  <Input label="Área de Especialidade" icon={<Briefcase size={18}/>} placeholder="Ex: Nutrição Esportiva, Funcional..." value={formData.specialty} onChange={(v) => setFormData({...formData, specialty: v})} />
                </div>
                <div className="relative">
                  <Input label="CEP de Atendimento *" icon={<MapPin size={18}/>} placeholder="00000-000" value={formData.address.zipCode} onChange={(v) => setFormData({...formData, address: {...formData.address, zipCode: v}})} onBlur={handleZipCodeBlur} />
                  {isSearchingZip && <Loader2 className="absolute right-3 bottom-4 animate-spin text-emerald-500" size={16} />}
                </div>
                <div className="md:col-span-2">
                  <Input label="Rua / Logradouro *" icon={<Building2 size={18}/>} placeholder="Endereço do consultório" value={formData.address.street} onChange={(v) => setFormData({...formData, address: {...formData.address, street: v}})} />
                </div>
                <Input label="Número *" icon={<Hash size={18}/>} placeholder="Ex: 102" value={formData.address.number} onChange={(v) => setFormData({...formData, address: {...formData.address, number: v}})} />
                <Input label="Cidade *" placeholder="Cidade" value={formData.address.city} onChange={(v) => setFormData({...formData, address: {...formData.address, city: v}})} />
                <Input label="Estado *" placeholder="UF" value={formData.address.state} onChange={(v) => setFormData({...formData, address: {...formData.address, state: v}})} />
              </div>
            </section>

            {/* BOTÃO FINAL */}
            <div className="pt-6">
              <button 
                onClick={handleSubmit} 
                disabled={registerMutation.isPending || !formData.crn || !formData.name} 
                className="w-full bg-emerald-500 text-white py-6 rounded-2xl font-black uppercase text-sm tracking-[0.2em] hover:bg-slate-900 transition-all flex items-center justify-center gap-4 shadow-xl shadow-emerald-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {registerMutation.isPending ? <Loader2 className="animate-spin" /> : "Finalizar Cadastro Profissional"}
              </button>
              <div className="flex items-center justify-center gap-2 mt-6 text-slate-400">
                <Info size={14} />
                <p className="text-[10px] font-bold uppercase tracking-widest">Os dados serão validados manualmente</p>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

// --- SUB-COMPONENT: INPUT ---
function Input({ label, icon, type = "text", placeholder, value, onChange, onBlur, disabled }: InputProps) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div className={cn("space-y-2 group text-left", disabled && "opacity-50")}>
      <label className={cn("text-[10px] font-black uppercase tracking-widest ml-1 transition-colors", isFocused ? "text-emerald-500" : "text-slate-400")}>
        {label}
      </label>
      <div className="relative">
        {icon && (
          <div className={cn("absolute left-4 top-1/2 -translate-y-1/2 transition-all z-10", isFocused ? "text-emerald-500 scale-110" : "text-slate-300")}>
            {icon}
          </div>
        )}
        <input 
          type={type}
          placeholder={placeholder}
          disabled={disabled}
          onFocus={() => setIsFocused(true)}
          onBlur={() => { setIsFocused(false); if (onBlur) onBlur(); }}
          className={cn(
            "w-full bg-slate-50 border-2 border-transparent rounded-2xl p-4 text-sm font-bold text-slate-700 transition-all outline-none",
            isFocused ? "bg-white border-emerald-500 shadow-lg" : "hover:bg-slate-100",
            icon ? "pl-12" : "pl-5",
            disabled && "cursor-not-allowed"
          )}
          value={value}
          onChange={e => onChange(e.target.value)}
        />
      </div>
    </div>
  );
}