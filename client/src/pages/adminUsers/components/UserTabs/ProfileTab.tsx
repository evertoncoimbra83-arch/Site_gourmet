import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Save, Loader2 } from "lucide-react";

// Helpers de Máscara (Melhorados para tratar strings vazias)
const maskDocument = (v: string | null | undefined) => {
  if (!v) return "";
  const d = v.replace(/\D/g, "");
  return d.length > 11 
    ? d.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5")
    : d.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, "$1.$2.$3-$4");
};

const maskPhone = (v: string | null | undefined) => {
  if (!v) return "";
  const d = v.replace(/\D/g, "");
  if (d.length > 10) return d.replace(/^(\d{2})(\d{5})(\d{4})$/, "($1) $2-$3");
  return d.replace(/^(\d{2})(\d{4})(\d{4})$/, "($1) $2-$3");
};

export function ProfileTab({ details, onUpdate, isUpdating }: any) {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    customerDocument: ""
  });

  // ✅ ESSENCIAL: Sincroniza o formulário quando os dados chegam do backend
  useEffect(() => {
    if (details?.user) {
      setFormData({
        name: details.user.name || "",
        phone: details.user.phone || "", // Pegando de user.phone (onde descriptografamos)
        customerDocument: details.user.customerDocument || ""
      });
    }
  }, [details]);

  const handleSubmit = () => {
    if (!details?.user?.id) return;
    // Enviamos os dados limpos (sem máscara) ou como estão para o backend
    onUpdate({ 
      id: details.user.id, 
      ...formData 
    });
  };

  if (!details) return null;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* NOME */}
        <div className="space-y-2">
          <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
            Nome Completo
          </Label>
          <Input 
            className="h-12 rounded-2xl bg-slate-50 border-none font-bold focus-visible:ring-[#2D5A3D]" 
            value={formData.name} 
            onChange={e => setFormData({...formData, name: e.target.value})} 
          />
        </div>

        {/* CPF/CNPJ (Apenas leitura no seu exemplo) */}
        <div className="space-y-2">
          <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
            CPF/CNPJ
          </Label>
          <Input 
            className="h-12 rounded-2xl bg-slate-100 border-none font-bold text-slate-500 cursor-not-allowed" 
            value={maskDocument(formData.customerDocument)} 
            disabled 
          />
        </div>

        {/* TELEFONE */}
        <div className="space-y-2">
          <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
            Telefone de Contato
          </Label>
          <Input 
            className="h-12 rounded-2xl bg-slate-50 border-none font-bold focus-visible:ring-[#2D5A3D]" 
            value={maskPhone(formData.phone)} 
            onChange={e => {
              // Salva apenas os números no estado para facilitar a vida do backend
              const rawValue = e.target.value.replace(/\D/g, "");
              setFormData({...formData, phone: rawValue});
            }} 
          />
        </div>

        {/* E-MAIL (Apenas leitura) */}
        <div className="space-y-2">
          <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
            E-mail de Acesso
          </Label>
          <Input 
            className="h-12 rounded-2xl bg-slate-100 border-none font-bold text-slate-500 cursor-not-allowed" 
            value={details?.user?.email || ""} 
            disabled 
          />
        </div>
      </div>
      
      <Button 
        onClick={handleSubmit} 
        disabled={isUpdating}
        className="bg-[#2D5A3D] hover:bg-[#1e3d29] text-white rounded-2xl h-12 px-8 font-black uppercase text-[10px] tracking-widest shadow-lg shadow-emerald-900/20 transition-all active:scale-95"
      >
        {isUpdating ? (
          <><Loader2 className="mr-2 animate-spin" size={16} /> Salvando...</>
        ) : (
          <><Save className="mr-2" size={16} /> Salvar Alterações</>
        )}
      </Button>
    </div>
  );
}