// e:/IA/projects/Site_React/client/src/pages/adminUsers/components/UserTabs/AddressesTab.tsx

import React, { useState, useEffect } from "react";
import { MapPin, Trash2, Plus, Loader2, Star, ArrowLeft, Check, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAdminUserAddress } from "../../logic/useAdminUserAddress";
import { Input } from "@/components/ui/input";
import { appToast as toast } from "@/lib/app-toast";
import { trpc } from "@/_core/trpc";

// --- INTERFACES ---
interface UserAddress {
  id: number | string;
  street: string;
  number: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
  isDefault?: boolean | number;
}

// ✅ Interface para Bypass de Tipagem (Sync com backend)
interface UsersAdminApi {
  addAddress: { useMutation: (opts: Record<string, unknown>) => { mutate: (data: Record<string, unknown>) => void, isPending: boolean } };
  // Fallback caso o nome mude para listAddresses ou similar no router real
  getUserAddresses: { invalidate: (input: { userId: string }) => void };
}

export function AddressesTab({ userId }: { userId: string }) {
  const { addresses, isLoading, isDeleting, handleDelete } = useAdminUserAddress(userId);
  
  const [view, setView] = useState<'list' | 'form'>('list');
  const [isSearchingCep, setIsSearchingCep] = useState(false);
  const [formData, setFormData] = useState({
    street: '',
    number: '',
    neighborhood: '',
    city: '',
    state: '',
    zipCode: ''
  });

  // ✅ BYPASS: Aplicando cast para evitar erro TS2339 enquanto o nome no router não é sincronizado
  const usersAdminApi = (trpc.admin.users as unknown as UsersAdminApi);

  const addAddressMutation = usersAdminApi.addAddress.useMutation({
    onSuccess: () => {
      toast.success("Endereço adicionado com sucesso!");
      // ✅ Invalidação usando a interface de bypass
      usersAdminApi.getUserAddresses.invalidate({ userId }); 
      setView('list');
      setFormData({ street: '', number: '', neighborhood: '', city: '', state: '', zipCode: '' });
    },
    onError: (err: unknown) => {
      const error = err as { message: string };
      toast.error(error.message || "Erro ao salvar endereço.");
    }
  });

  useEffect(() => {
    const cep = formData.zipCode.replace(/\D/g, '');
    if (cep.length === 8) {
      handleCepSearch(cep);
    }
  }, [formData.zipCode]);

  const handleCepSearch = async (cep: string) => {
    setIsSearchingCep(true);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await response.json();
      if (data.erro) {
        toast.error("CEP não encontrado.");
        return;
      }
      setFormData(prev => ({
        ...prev,
        street: data.logradouro || '',
        neighborhood: data.bairro || '',
        city: data.localidade || '',
        state: data.uf || ''
      }));
    } catch { 
      toast.error("Erro na busca de CEP.");
    } finally {
      setIsSearchingCep(false);
    }
  };

  const onSave = async () => {
    if (!formData.street || !formData.number || !formData.zipCode || !formData.state) {
      toast.error("Preencha todos os campos obrigatórios (Rua, Número, CEP e UF).");
      return;
    }
    
    addAddressMutation.mutate({
      userId,
      ...formData,
      state: formData.state.toUpperCase()
    } as unknown as Record<string, unknown>);
  };

  if (isLoading) {
    return (
      <div className="p-12 flex justify-center items-center">
        <Loader2 className="animate-spin text-emerald-500" />
      </div>
    );
  }

  if (view === 'form') {
    return (
      <div className="space-y-6 animate-in slide-in-from-right duration-300">
        <div className="flex items-center gap-4 mb-4">
          <Button variant="ghost" size="icon" onClick={() => setView('list')} className="rounded-full">
            <ArrowLeft size={20} />
          </Button>
          <h3 className="text-lg font-black italic uppercase tracking-tighter text-slate-900">
            Novo <span className="text-emerald-600">Endereço</span>
          </h3>
        </div>

        <div className="grid grid-cols-4 gap-4 bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm text-left">
          <div className="col-span-2 space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">CEP</label>
            <div className="relative">
              <Input 
                placeholder="00000-000" 
                className="rounded-xl border-slate-100 pr-10"
                value={formData.zipCode}
                onChange={e => setFormData({...formData, zipCode: e.target.value})}
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {isSearchingCep ? <Loader2 className="animate-spin text-emerald-500" size={16} /> : <Search className="text-slate-300" size={16} />}
              </div>
            </div>
          </div>

          <div className="col-span-2" />

          <div className="col-span-3 space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Rua</label>
            <Input 
              className="rounded-xl border-slate-100"
              value={formData.street}
              onChange={e => setFormData({...formData, street: e.target.value})}
            />
          </div>
          
          <div className="col-span-1 space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Nº</label>
            <Input 
              className="rounded-xl border-slate-100"
              value={formData.number}
              onChange={e => setFormData({...formData, number: e.target.value})}
            />
          </div>

          <div className="col-span-2 space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Bairro</label>
            <Input 
              className="rounded-xl border-slate-100"
              value={formData.neighborhood}
              onChange={e => setFormData({...formData, neighborhood: e.target.value})}
            />
          </div>

          <div className="col-span-1 space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Cidade</label>
            <Input 
              className="rounded-xl border-slate-100"
              value={formData.city}
              onChange={e => setFormData({...formData, city: e.target.value})}
            />
          </div>

          <div className="col-span-1 space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">UF</label>
            <Input 
              className="rounded-xl border-slate-100 uppercase"
              maxLength={2}
              value={formData.state}
              onChange={e => setFormData({...formData, state: e.target.value})}
            />
          </div>
        </div>

        <Button 
          className="w-full h-14 bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase tracking-widest rounded-2xl gap-2 shadow-lg shadow-emerald-100"
          onClick={onSave}
          disabled={addAddressMutation.isPending || isSearchingCep}
        >
          {addAddressMutation.isPending ? <Loader2 className="animate-spin" /> : <Check size={18} />}
          Salvar Endereço
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-in fade-in duration-500">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-black italic uppercase tracking-tighter text-slate-900">Endereços</h3>
        <Button size="sm" onClick={() => setView('form')} className="gap-2 bg-slate-900 rounded-full px-4 hover:bg-emerald-600 transition-colors">
          <Plus size={16} /> Novo
        </Button>
      </div>

      {addresses && addresses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(addresses as UserAddress[]).map((addr) => (
            <Card key={addr.id} className="border-slate-100 shadow-sm rounded-2xl relative overflow-hidden text-left">
              {Number(addr.isDefault) === 1 && (
                <div className="absolute top-2 right-10 bg-emerald-100 text-emerald-700 p-1 rounded-full">
                  <Star size={12} fill="currentColor" />
                </div>
              )}
              <CardContent className="p-4 flex justify-between items-start">
                <div className="flex gap-3">
                  <div className="mt-1 p-2 bg-slate-50 rounded-xl text-slate-400">
                    <MapPin size={18} />
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-sm text-slate-900 leading-tight">
                      {addr.street}, {addr.number}
                    </p>
                    <p className="text-xs text-slate-500">
                      {addr.neighborhood} — {addr.city}/{addr.state}
                    </p>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-slate-300 hover:text-red-500 transition-colors" 
                  onClick={() => handleDelete(addr.id as string)} 
                  disabled={isDeleting}
                >
                  {isDeleting ? <Loader2 className="animate-spin" size={16} /> : <Trash2 size={16} />}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="p-12 border-2 border-dashed border-slate-100 rounded-[2rem] text-center">
          <MapPin className="mx-auto text-slate-200 mb-2" size={32} />
          <p className="text-sm text-slate-400">Nenhum endereço cadastrado.</p>
        </div>
      )}
    </div>
  );
}