import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Truck, Store, Navigation2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { appToast as toast } from "@/lib/app-toast";

// --- INTERFACES ---

interface DeliveryAddress {
  shipping_address?: string;
  shipping_address_number?: string;
  shipping_neighborhood?: string;
  shipping_address_complement?: string;
  zipCode?: string; // ✅ Padronizado para zipCode
  shipping_city?: string;
  shipping_state?: string;
}

interface DeliveryStepData {
  deliveryMode: 'delivery' | 'pickup';
  deliveryFee: number;
  address?: DeliveryAddress | null;
}

interface StepDeliveryProps {
  data: DeliveryStepData;
  onUpdate: (payload: Partial<DeliveryStepData>) => void;
  hideNavigation?: boolean;
}

export function StepDeliveryPDV({ data, onUpdate, hideNavigation }: StepDeliveryProps) {
  const [showAddressForm, setShowAddressForm] = useState(false);
  
  // 1. Inicializa o form
  const [form, setForm] = useState({
    zipCode: data.address?.zipCode || "", // ✅ Usando zipCode
    street: data.address?.shipping_address || "",
    number: data.address?.shipping_address_number || "",
    neighborhood: data.address?.shipping_neighborhood || "",
    complement: data.address?.shipping_address_complement || "",
    city: data.address?.shipping_city || "Jundiaí",
    state: data.address?.shipping_state || "SP"
  });

  // 2. 🔥 DEBUG SINCRONIZAÇÃO
  useEffect(() => {
    if (data.address) {
      setForm({
        zipCode: data.address.zipCode || "", // ✅ Usando zipCode
        street: data.address.shipping_address || "",
        number: data.address.shipping_address_number || "",
        neighborhood: data.address.shipping_neighborhood || "",
        complement: data.address.shipping_address_complement || "",
        city: data.address.shipping_city || "Jundiaí",
        state: data.address.shipping_state || "SP"
      });
      console.log("✅ [PDV-COMP] Form interno atualizado com dados da Prop.");
    }
  }, [data.address]);

  const handleCepBlur = async () => {
    const cleanCep = form.zipCode.replace(/\D/g, "");
    if (cleanCep.length !== 8) return;

    try {
      const res = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      const dataCep = await res.json();

      if (dataCep.erro) {
        toast.error("CEP não encontrado.");
        return;
      }

      setForm(prev => ({
        ...prev,
        street: dataCep.logradouro,
        neighborhood: dataCep.bairro,
        city: dataCep.localidade,
        state: dataCep.uf
      }));
    } catch {
      toast.error("Erro ao buscar CEP.");
    }
  };

  const handleSaveNewAddress = () => {
    if (!form.street || !form.number) {
      toast.error("Rua e número são obrigatórios.");
      return;
    }
    
    const addressObject: DeliveryAddress = {
      shipping_address: form.street,
      shipping_address_number: form.number,
      shipping_neighborhood: form.neighborhood,
      shipping_address_complement: form.complement,
      zipCode: form.zipCode, // ✅ Padronizado para zipCode
      shipping_city: form.city,
      shipping_state: form.state
    };
    
    console.log("📤 [PDV-COMP] Enviando novo endereço via onUpdate:", addressObject);
    
    onUpdate({ address: addressObject });
    setShowAddressForm(false);
    toast.success("Endereço atualizado!");
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-500 p-4 text-left">
      
      {/* 🏎️ SELETOR DE MODO */}
      <div className="flex p-1.5 bg-slate-100 rounded-3xl gap-1 shadow-inner">
        {[
          { id: 'delivery' as const, label: 'Entrega', icon: Truck },
          { id: 'pickup' as const, label: 'Retirada', icon: Store }
        ].map((mode) => {
          const isSel = data.deliveryMode === mode.id;
          return (
            <button
              key={mode.id}
              type="button"
              onClick={() => onUpdate({ 
                deliveryMode: mode.id, 
                deliveryFee: mode.id === 'pickup' ? 0 : data.deliveryFee 
              })}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl transition-all duration-300",
                isSel ? "bg-white shadow-md text-slate-900" : "text-slate-400 hover:text-slate-600"
              )}
            >
              <mode.icon size={16} className={isSel ? "text-emerald-500" : ""} />
              <span className="text-[9px] font-black uppercase tracking-widest">{mode.label}</span>
            </button>
          );
        })}
      </div>

      {data.deliveryMode === 'delivery' && (
        <div className="space-y-4 animate-in slide-in-from-top-2">
          
          <div className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm relative text-left">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Navigation2 size={14} className="text-emerald-600 fill-emerald-600" />
                <h3 className="text-[9px] font-black uppercase tracking-widest text-slate-400">Destino da Entrega</h3>
              </div>
              
              <button 
                type="button"
                onClick={() => setShowAddressForm(!showAddressForm)}
                className={cn(
                  "text-[8px] font-black uppercase px-4 py-2 rounded-full transition-all",
                  showAddressForm ? "bg-red-50 text-red-500" : "bg-slate-900 text-white hover:bg-emerald-600"
                )}
              >
                {showAddressForm ? "Cancelar" : data.address?.shipping_address ? "Trocar Endereço" : "Definir Endereço"}
              </button>
            </div>

            {showAddressForm ? (
              <div className="grid grid-cols-6 gap-3 animate-in zoom-in-95 duration-200">
                <div className="col-span-2">
                  <Input 
                    value={form.zipCode}
                    onChange={e => setForm({...form, zipCode: e.target.value})}
                    onBlur={handleCepBlur}
                    placeholder="CEP"
                    className="rounded-xl font-bold h-10 text-xs"
                  />
                </div>
                <div className="col-span-4">
                  <Input value={form.street} onChange={e => setForm({...form, street: e.target.value})} placeholder="Rua / Logradouro" className="rounded-xl font-bold h-10 text-xs" />
                </div>
                <div className="col-span-2">
                  <Input value={form.number} onChange={e => setForm({...form, number: e.target.value})} placeholder="Nº" className="rounded-xl font-bold h-10 text-xs" />
                </div>
                <div className="col-span-4">
                  <Input value={form.neighborhood} onChange={e => setForm({...form, neighborhood: e.target.value})} placeholder="Bairro" className="rounded-xl font-bold h-10 text-xs" />
                </div>
                <div className="col-span-6">
                  <Button type="button" onClick={handleSaveNewAddress} className="w-full h-10 bg-emerald-600 text-white rounded-xl font-black uppercase text-[9px] tracking-widest">
                    Confirmar Endereço
                  </Button>
                </div>
              </div>
            ) : (
              <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100/50 text-left">
                {data.address?.shipping_address ? (
                  <>
                    <p className="text-sm font-black text-slate-900 leading-tight tracking-tight uppercase">
                      {data.address.shipping_address}, {data.address.shipping_address_number}
                    </p>
                    <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-tighter">
                      {data.address.shipping_neighborhood} • {data.address.shipping_city}
                    </p>
                  </>
                ) : (
                  <span className="text-slate-500 italic text-[10px] uppercase font-bold">Nenhum endereço definido</span>
                )}
              </div>
            )}
          </div>

          <div className="bg-white p-4 rounded-3xl border border-slate-100 flex items-center justify-between shadow-sm text-left">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-slate-900 flex items-center justify-center text-white">
                <Truck size={18} />
              </div>
              <div>
                <label className="text-[8px] font-black uppercase text-slate-400 tracking-widest block">Taxa de Frete</label>
                <div className="flex items-center gap-1">
                  <span className="text-xs font-black text-slate-400">R$</span>
                  <input 
                    type="number" 
                    className="bg-transparent border-none p-0 w-20 text-xl font-black italic focus:ring-0 outline-none text-slate-900"
                    value={data.deliveryFee}
                    onChange={(e) => onUpdate({ deliveryFee: Number(e.target.value) })}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {data.deliveryMode === 'pickup' && (
        <div className="bg-amber-50 border border-amber-100 p-6 rounded-[2rem] text-center animate-in zoom-in-95">
           <Store className="mx-auto text-amber-500 mb-2" size={24} />
           <p className="text-[10px] font-black uppercase text-amber-700 tracking-widest">O cliente retirará no balcão</p>
           <p className="text-[8px] font-bold text-amber-600/60 uppercase mt-1">Taxa de entrega zerada automaticamente</p>
        </div>
      )}

      {!hideNavigation && (
        <div className="flex gap-4 pt-4">
          <Button variant="ghost" className="h-16 flex-1 rounded-[1.5rem] font-black uppercase text-[10px] text-slate-400">Voltar</Button>
          <Button 
            disabled={data.deliveryMode === 'delivery' && !data.address?.shipping_address}
            className="h-16 flex-2 bg-slate-900 text-white rounded-[1.5rem] font-black uppercase text-[10px] shadow-2xl"
          >
            Continuar
          </Button>
        </div>
      )}
    </div>
  );
}

export default StepDeliveryPDV;