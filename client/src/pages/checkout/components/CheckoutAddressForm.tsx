import { useState, useEffect } from "react";
import { Loader2, MapPin, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/_core/trpc";
import { toast } from "@/components/ui/use-toast";

interface CheckoutAddressFormProps {
  createAddressMutation: any; 
  onSuccess: () => void;
  onCancel: () => void;
}

// 🎭 Máscara de CEP
const maskCep = (value: string) => {
  return value
    .replace(/\D/g, "")
    .replace(/^(\d{5})(\d)/, "$1-$2")
    .slice(0, 9);
};

export function CheckoutAddressForm({ createAddressMutation, onSuccess, onCancel }: CheckoutAddressFormProps) {
  const [form, setForm] = useState({
    label: "", 
    zipCode: "", 
    street: "", 
    number: "", 
    complement: "", 
    neighborhood: "", 
    city: "Jundiaí", 
    state: "SP"
  });

  const cleanZip = form.zipCode.replace(/\D/g, "");
  
  // Busca CEP automático
  const { data: cepData, isLoading: isLoadingCep } = trpc.addresses.getCep.useQuery(
    { cep: cleanZip },
    { enabled: cleanZip.length === 8, refetchOnWindowFocus: false }
  );

  useEffect(() => {
    if (cepData) {
      setForm(prev => ({
        ...prev,
        street: cepData.street || prev.street,
        neighborhood: cepData.neighborhood || prev.neighborhood,
        city: cepData.city || prev.city,
        state: cepData.state || prev.state
      }));
      toast.success("Endereço encontrado!");
    }
  }, [cepData]);

  const handleSave = () => {
    if (!form.zipCode || !form.street || !form.number || !form.neighborhood) {
      return toast.warning("Preencha os campos obrigatórios (CEP, Rua, Número e Bairro).");
    }
    
    createAddressMutation.mutate(form, {
      onSuccess: () => {
        toast.success("Endereço salvo com sucesso!");
        onSuccess();
        setForm({ label: "", zipCode: "", street: "", number: "", complement: "", neighborhood: "", city: "Jundiaí", state: "SP" });
      },
      onError: (err: any) => {
        toast.error("Erro ao salvar endereço: " + err.message);
      }
    });
  };

  return (
    <div className="p-6 border-2 border-dashed border-emerald-100 rounded-[2rem] bg-emerald-50/20 animate-in fade-in zoom-in-95 duration-300 space-y-4">
      
      {/* Título do Form */}
      <div className="flex items-center gap-2 mb-2 text-emerald-700">
        <MapPin size={16} />
        <span className="text-xs font-black uppercase tracking-widest">Novo Endereço</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* CEP */}
        <div className="md:col-span-1 space-y-1.5">
          <Label className="text-[9px] font-black uppercase text-slate-400 ml-1">CEP</Label>
          <div className="relative">
            <Input 
              value={form.zipCode} 
              onChange={e => setForm({...form, zipCode: maskCep(e.target.value)})} 
              className="h-11 rounded-xl bg-white pr-8" 
              placeholder="00000-000" 
              maxLength={9}
            />
            {isLoadingCep && (
              <div className="absolute right-3 top-3">
                <Loader2 size={16} className="animate-spin text-emerald-500" />
              </div>
            )}
          </div>
        </div>

        {/* Apelido */}
        <div className="md:col-span-3 space-y-1.5">
          <Label className="text-[9px] font-black uppercase text-slate-400 ml-1">Apelido (Ex: Casa, Trabalho)</Label>
          <Input 
            value={form.label} 
            onChange={e => setForm({...form, label: e.target.value})} 
            className="h-11 rounded-xl bg-white" 
            placeholder="Minha Casa"
          />
        </div>

        {/* Rua */}
        <div className="md:col-span-3 space-y-1.5">
          <Label className="text-[9px] font-black uppercase text-slate-400 ml-1">Rua / Avenida</Label>
          <Input 
            value={form.street} 
            onChange={e => setForm({...form, street: e.target.value})} 
            className="h-11 rounded-xl bg-white" 
            placeholder="Nome da rua..."
          />
        </div>

        {/* Número */}
        <div className="md:col-span-1 space-y-1.5">
          <Label className="text-[9px] font-black uppercase text-slate-400 ml-1">Número</Label>
          <Input 
            value={form.number} 
            onChange={e => setForm({...form, number: e.target.value})} 
            className="h-11 rounded-xl bg-white" 
            placeholder="123"
          />
        </div>

        {/* Bairro */}
        <div className="md:col-span-2 space-y-1.5">
          <Label className="text-[9px] font-black uppercase text-slate-400 ml-1">Bairro</Label>
          <Input 
            value={form.neighborhood} 
            onChange={e => setForm({...form, neighborhood: e.target.value})} 
            className="h-11 rounded-xl bg-white" 
          />
        </div>

        {/* Complemento */}
        <div className="md:col-span-2 space-y-1.5">
          <Label className="text-[9px] font-black uppercase text-slate-400 ml-1">Complemento (Opcional)</Label>
          <Input 
            value={form.complement} 
            onChange={e => setForm({...form, complement: e.target.value})} 
            className="h-11 rounded-xl bg-white" 
            placeholder="Apto 101, Bloco B"
          />
        </div>

        {/* Cidade e Estado */}
        <div className="md:col-span-3 space-y-1.5">
          <Label className="text-[9px] font-black uppercase text-slate-400 ml-1">Cidade</Label>
          <Input 
            value={form.city} 
            onChange={e => setForm({...form, city: e.target.value})} 
            className="h-11 rounded-xl bg-slate-50 border-slate-100" 
          />
        </div>
        <div className="md:col-span-1 space-y-1.5">
          <Label className="text-[9px] font-black uppercase text-slate-400 ml-1">UF</Label>
          <Input 
            value={form.state} 
            onChange={e => setForm({...form, state: e.target.value})} 
            className="h-11 rounded-xl bg-slate-50 border-slate-100" 
            maxLength={2}
          />
        </div>
      </div>
      
      {/* Botões de Ação (Aqui estava o erro do corte) */}
      <div className="flex justify-end gap-3 pt-2">
        <Button 
          variant="ghost" 
          onClick={onCancel} 
          className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl"
        >
          <X size={16} className="mr-2" /> Cancelar
        </Button>
        <Button 
          onClick={handleSave} 
          disabled={createAddressMutation.isPending || isLoadingCep} 
          className="bg-emerald-600 hover:bg-emerald-700 rounded-xl h-11 px-6 font-black uppercase text-[10px] shadow-lg shadow-emerald-600/20"
        >
          {createAddressMutation.isPending ? <Loader2 className="animate-spin" /> : (
            <><Save size={16} className="mr-2" /> Salvar Endereço</>
          )}
        </Button>
      </div>
    </div>
  );
}