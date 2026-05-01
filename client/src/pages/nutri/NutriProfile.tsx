// client/src/pages/nutri/NutriProfile.tsx

import React, { useEffect, useState, useRef } from 'react';
import { trpc } from '@/_core/trpc';
import { 
  User, MapPin, Globe, Award, Trash2, Plus, 
  Camera, CheckCircle2, Loader2, Sparkles, Search,
  Edit3, ExternalLink, MapPinned, Phone, UploadCloud
} from 'lucide-react'; 
import { cn } from "@/lib/utils";
import { appToast as toast } from "@/lib/app-toast";

// --- INTERFACES ---
interface Address {
  id?: string;
  label: string;
  zipCode: string;
  street: string;
  number: string;
  city: string;
}

interface ProfileData {
  crn?: string | null;
  referralCode?: string | null;
  specialty?: string | null;
  bio?: string | null;
  website?: string | null;
  avatarUrl?: string | null;
  phone?: string | null;
  user?: { name?: string | null } | null;
  offices?: Address[] | null;
}

/**
 * Página de Perfil do Nutricionista
 * Gerencia dados profissionais, fotos e locais de atendimento.
 */
export default function NutriProfilePage() {
  const utils = trpc.useUtils(); 
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    crn: '',
    referralCode: '',
    specialty: '',
    bio: '',
    website: '',
    avatarUrl: '',
    phone: ''
  });

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [loadingCepIndex, setLoadingCepIndex] = useState<number | null>(null);
  const [editingAddressIndex, setEditingAddressIndex] = useState<number | null>(null);

  const { data: profile, isLoading: isLoadingProfile } = trpc.nutri.getPublicProfile.useQuery();

  useEffect(() => {
    if (profile) {
      const data = profile as unknown as ProfileData;
      setFormData({
        name: data.user?.name || '',
        crn: data.crn || '',
        referralCode: data.referralCode || '',
        specialty: data.specialty || '',
        bio: data.bio || '',
        website: data.website || '',
        avatarUrl: data.avatarUrl || '',
        phone: data.phone || ''
      });
      if (data.offices) setAddresses(data.offices);
    }
  }, [profile]);

  // ☁️ UPLOAD DIRETO DA FOTO
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const toastId = toast.loading("Enviando foto profissional...");
    setIsUploading(true);

    try {
      const uploadData = new FormData();
      uploadData.append('file', file);
      uploadData.append('folder', `nutris/${formData.crn || 'perfil'}`);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: uploadData
      });

      if (!res.ok) throw new Error("Falha no upload");

      const data = await res.json() as { url: string };
      setFormData(prev => ({ ...prev, avatarUrl: data.url }));
      toast.success("Foto atualizada!", { id: toastId });
    } catch {
      // ✅ FIX: Removido 'err' não utilizado para satisfazer o ESLint
      toast.error("Erro ao subir imagem.", { id: toastId });
    } finally {
      setIsUploading(false);
    }
  };

  const handleCepSearch = async (index: number, cep: string) => {
    const cleanCep = cep.replace(/\D/g, "");
    if (cleanCep.length !== 8) return;

    setLoadingCepIndex(index);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      const data = await response.json() as { erro?: boolean; logradouro: string; localidade: string; uf: string };

      if (data.erro) {
        toast.error("CEP não encontrado.");
        return;
      }

      const newAddresses = [...addresses];
      newAddresses[index] = {
        ...newAddresses[index],
        zipCode: cleanCep.replace(/(\d{5})(\d{3})/, "$1-$2"),
        street: data.logradouro,
        city: `${data.localidade} - ${data.uf}`
      };
      setAddresses(newAddresses);
      toast.success("Endereço localizado!");
    } catch {
      toast.error("Erro ao buscar CEP.");
    } finally {
      setLoadingCepIndex(null);
    }
  };

  const updateProfile = trpc.nutri.updateProfile.useMutation({
    onSuccess: () => {
      utils.nutri.getPublicProfile.invalidate();
      toast.success("Perfil profissional atualizado!");
      setEditingAddressIndex(null);
    },
    onError: (err) => toast.error("Erro ao atualizar: " + err.message)
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    type MutationInput = Parameters<typeof updateProfile.mutate>[0];

    const payload: MutationInput = {
      ...formData,
      offices: addresses.map(addr => ({
        label: addr.label,
        zipCode: addr.zipCode,
        street: addr.street,
        number: addr.number,
        city: addr.city
      }))
    };

    updateProfile.mutate(payload);
  };

  const addAddress = () => {
    const newIdx = addresses.length;
    setAddresses([...addresses, { label: '', zipCode: '', street: '', number: '', city: '' }]);
    setEditingAddressIndex(newIdx);
  };

  const removeAddress = (index: number) => {
    setAddresses(addresses.filter((_, i) => i !== index));
    if (editingAddressIndex === index) setEditingAddressIndex(null);
  };

  const updateAddress = (index: number, field: keyof Address, value: string) => {
    const newAddresses = [...addresses];
    newAddresses[index] = { ...newAddresses[index], [field]: value };
    setAddresses(newAddresses);
  };

  if (isLoadingProfile) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50 py-12 px-4 text-left">
      <div className="mx-auto max-w-4xl text-left">
        
        <header className="mb-10 flex items-center justify-between text-left">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-emerald-600 mb-2">
               <Sparkles size={16} />
               <span className="text-[10px] font-black uppercase tracking-[0.3em]">Painel do Especialista</span>
            </div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tighter italic uppercase leading-none">
              Meu <span className="text-emerald-600">Perfil</span>.
            </h1>
            <p className="text-slate-500 font-medium text-sm">Gerencie sua identidade visual e locais de atendimento.</p>
          </div>
          <CheckCircle2 className="h-12 w-12 text-emerald-500/10" />
        </header>

        <form onSubmit={handleSubmit} className="space-y-8 text-left">
          
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 bg-slate-50/50 px-8 py-5 flex items-center gap-2">
              <User className="h-5 w-5 text-emerald-600" />
              <h2 className="font-black uppercase tracking-tight text-slate-800 text-sm">Informações de Carreira</h2>
            </div>
            <div className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                
                <div className="flex flex-col items-center gap-4">
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*" 
                    onChange={handlePhotoUpload} 
                  />
                  <div 
                    className="relative group cursor-pointer" 
                    onClick={() => !isUploading && fileInputRef.current?.click()}
                  >
                    <div className={cn(
                      "h-36 w-36 rounded-4xl border-4 border-white shadow-xl overflow-hidden transition-all group-hover:ring-4 group-hover:ring-emerald-500/20",
                      !formData.avatarUrl && "bg-slate-100 border-dashed border-slate-200",
                      isUploading && "opacity-50"
                    )}>
                      {formData.avatarUrl ? (
                        <img src={formData.avatarUrl} alt="Preview" className="h-full w-full object-cover transition-transform group-hover:scale-110" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center"><Camera className="h-10 w-10 text-slate-300" /></div>
                      )}
                    </div>
                    <div className="absolute inset-0 bg-black/40 rounded-4xl opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white gap-1">
                       {isUploading ? <Loader2 className="animate-spin h-6 w-6" /> : <UploadCloud size={20} />}
                       <span className="text-[8px] font-black uppercase tracking-widest">Trocar Foto</span>
                    </div>
                  </div>
                  <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Foto Profissional</span>
                </div>

                <div className="md:col-span-2 space-y-6">
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <div className="sm:col-span-2 space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Nome Completo</label>
                      <input className="w-full rounded-2xl border-none bg-slate-50 p-4 font-bold text-slate-700 focus:ring-2 focus:ring-emerald-500/20 outline-none" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 flex items-center gap-1"><Award size={12}/> Registro CRN</label>
                      <input className="w-full rounded-2xl border-none bg-slate-100 p-4 font-mono text-sm text-slate-500 cursor-not-allowed" value={formData.crn} readOnly />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 flex items-center gap-1">
                        <Phone size={12}/> Telefone de Atendimento
                      </label>
                      <input 
                        className="w-full rounded-2xl border-none bg-slate-50 p-4 font-bold text-slate-700 focus:ring-2 focus:ring-emerald-500/20 outline-none" 
                        value={formData.phone} 
                        onChange={e => setFormData({...formData, phone: e.target.value})} 
                        placeholder="(00) 00000-0000"
                      />
                    </div>
                    <div className="sm:col-span-2 space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Especialidade Principal</label>
                      <input className="w-full rounded-2xl border-none bg-slate-50 p-4 font-bold text-slate-700 focus:ring-2 focus:ring-emerald-500/20 outline-none" value={formData.specialty} onChange={e => setFormData({...formData, specialty: e.target.value})} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 space-y-6 border-t border-slate-50 pt-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 flex items-center gap-1"><Globe size={12}/> Website Profissional</label>
                    <input className="w-full rounded-2xl border-none bg-slate-50 p-4 font-bold text-slate-700" placeholder="https://..." value={formData.website} onChange={e => setFormData({...formData, website: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 flex items-center gap-1"><ExternalLink size={12}/> Código de Indicação (Referral)</label>
                    <input className="w-full rounded-2xl border-none bg-slate-100 p-4 font-black text-emerald-600 uppercase cursor-not-allowed" value={formData.referralCode} readOnly />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Sobre Você (Bio Profissional)</label>
                  <textarea rows={4} className="w-full rounded-3xl border-none bg-slate-50 p-5 font-medium text-slate-600 resize-none focus:ring-2 focus:ring-emerald-500/20" value={formData.bio} onChange={e => setFormData({...formData, bio: e.target.value})} />
                </div>
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 bg-slate-50/50 px-8 py-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPinned className="h-5 w-5 text-emerald-600" />
                <h2 className="font-black uppercase tracking-tight text-slate-800 text-sm">Consultórios e Clínicas</h2>
              </div>
              <button type="button" onClick={addAddress} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-50 text-[10px] font-black uppercase text-emerald-600 hover:bg-emerald-600 hover:text-white transition-all shadow-sm">
                <Plus className="h-3.5 w-3.5" /> Novo Local
              </button>
            </div>

            <div className="p-8 space-y-4">
              {addresses.length === 0 ? (
                <div className="py-12 text-center border-2 border-dashed border-slate-100 rounded-4xl">
                   <MapPin className="mx-auto text-slate-200 mb-2" size={32} />
                   <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Nenhum local cadastrado</p>
                </div>
              ) : (
                addresses.map((addr, index) => (
                  <div key={index} className={cn(
                    "group relative rounded-3xl border transition-all p-6",
                    editingAddressIndex === index 
                      ? "border-emerald-200 bg-white shadow-xl ring-4 ring-emerald-50/50" 
                      : "border-slate-100 bg-slate-50/30 hover:bg-white hover:shadow-md"
                  )}>
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-white rounded-xl shadow-sm border border-slate-100">
                          <MapPin size={16} className={editingAddressIndex === index ? "text-emerald-600" : "text-slate-400"} />
                        </div>
                        <span className="font-black uppercase text-[11px] tracking-wider text-slate-700">
                          {addr.label || "Novo Local de Atendimento"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {editingAddressIndex === index ? (
                          <button type="button" onClick={() => setEditingAddressIndex(null)} className="p-2 bg-slate-900 text-white rounded-xl shadow-sm hover:scale-105 transition-transform">
                            <CheckCircle2 size={14} />
                          </button>
                        ) : (
                          <button type="button" onClick={() => setEditingAddressIndex(index)} className="p-2 bg-white text-slate-400 border border-slate-100 rounded-xl shadow-sm hover:text-emerald-600 transition-colors">
                            <Edit3 size={14} />
                          </button>
                        )}
                        <button type="button" onClick={() => removeAddress(index)} className="p-2 bg-white text-slate-400 border border-slate-100 rounded-xl shadow-sm hover:text-red-500 transition-colors">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    {editingAddressIndex === index ? (
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 animate-in fade-in zoom-in-95 duration-200">
                        <div className="md:col-span-2 space-y-1">
                          <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Nome do Local</label>
                          <input className="w-full bg-slate-50 rounded-xl p-3 text-sm font-bold border-none focus:ring-2 focus:ring-emerald-500/20 outline-none" value={addr.label} onChange={e => updateAddress(index, 'label', e.target.value)} placeholder="Ex: Matriz Jundiaí" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-black uppercase text-slate-400 ml-1">CEP</label>
                          <div className="relative">
                            <input 
                              className="w-full bg-slate-50 rounded-xl p-3 text-sm font-bold border-none pr-10 focus:ring-2 focus:ring-emerald-500/20 outline-none"
                              value={addr.zipCode}
                              placeholder="00000-000"
                              maxLength={9}
                              onChange={e => {
                                const val = e.target.value;
                                updateAddress(index, 'zipCode', val);
                                if (val.replace(/\D/g, "").length === 8) handleCepSearch(index, val);
                              }} 
                            />
                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                              {loadingCepIndex === index ? <Loader2 size={14} className="animate-spin text-emerald-600" /> : <Search size={14} className="text-slate-300" />}
                            </div>
                          </div>
                        </div>
                        <div className="md:col-span-2 space-y-1">
                          <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Logradouro</label>
                          <input className="w-full bg-slate-50 rounded-xl p-3 text-sm font-bold border-none focus:ring-2 focus:ring-emerald-500/20 outline-none" value={addr.street} onChange={e => updateAddress(index, 'street', e.target.value)} />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Número</label>
                          <input className="w-full bg-slate-50 rounded-xl p-3 text-sm font-bold border-none focus:ring-2 focus:ring-emerald-500/20 outline-none" value={addr.number} onChange={e => updateAddress(index, 'number', e.target.value)} />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Cidade/UF</label>
                          <input className="w-full bg-slate-50 rounded-xl p-3 text-sm font-bold border-none focus:ring-2 focus:ring-emerald-500/20 outline-none" value={addr.city} onChange={e => updateAddress(index, 'city', e.target.value)} />
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-y-2 text-slate-500 text-sm font-medium">
                        <span className="flex items-center gap-1 mr-4"><span className="text-[10px] font-black uppercase text-slate-300">CEP:</span> {addr.zipCode || '---'}</span>
                        <span className="flex items-center gap-1 mr-4"><span className="text-[10px] font-black uppercase text-slate-300">Endereço:</span> {addr.street || '---'}, {addr.number || 'S/N'}</span>
                        <span className="flex items-center gap-1"><span className="text-[10px] font-black uppercase text-slate-300">Local:</span> {addr.city || '---'}</span>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button 
              disabled={updateProfile.isPending || isUploading} 
              className="group flex items-center gap-3 rounded-2xl bg-slate-900 px-10 py-5 text-white font-black uppercase text-xs tracking-widest shadow-2xl hover:bg-emerald-600 transition-all active:scale-95 disabled:bg-slate-200"
            >
              {(updateProfile.isPending || isUploading) ? (
                <><Loader2 className="h-5 w-5 animate-spin" /> {isUploading ? "Subindo Foto..." : "Salvando..."}</>
              ) : (
                <>Confirmar Alterações <CheckCircle2 className="h-5 w-5 group-hover:animate-bounce" /></>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}