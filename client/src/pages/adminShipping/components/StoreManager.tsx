// e:/IA/projects/Site_React/client/src/pages/adminShipping/components/StoreManager.tsx

import React, { useState, useEffect } from 'react';
import { trpc } from "@/_core/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Store, Loader2, Settings2, Plus, Globe2, Truck, Navigation2, X, Check, ChevronsUpDown, Search 
} from "lucide-react"; 
import { appToast as toast } from "@/lib/app-toast";
import { cn } from "@/lib/utils";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,
} from "@/components/ui/command";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";

import { PickupSettingsCard } from "./PickupSettingsCard";
import { useStoreConfig } from "../logic/useStoreConfig";

// ✅ Interface para tipar o retorno do validador de CEP
interface ZipValidationResult {
  isValid: boolean;
  cityAllowed: boolean;
  minOrderValue: number;
  minOrderMessage: string;
  source: string;
  shippingCost: number;
}

export function StoreManager() {
  const utils = trpc.useUtils();
  const { data: stores, isLoading: isLoadingStores } = trpc.admin.shippingMesh.listStores.useQuery();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const [formData, setFormData] = useState({ storeSlug: '', companyName: '' });

  const updateStoreMutation = trpc.admin.shippingMesh.updateStoreLocation.useMutation({
    onSuccess: () => {
      toast.success("Unidade cadastrada!");
      utils.admin.shippingMesh.listStores.invalidate();
      setFormData({ storeSlug: '', companyName: '' });
      setIsDialogOpen(false);
    },
    onError: (err) => toast.error("Erro: " + err.message)
  });

  return (
    <div className="space-y-4 animate-in fade-in duration-500 pb-20 text-left">
      <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-slate-100 rounded-lg text-slate-600">
            <Settings2 size={20} />
          </div>
          <div>
            <h2 className="text-sm font-black uppercase tracking-tight text-slate-800">Hubs de Distribuição</h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{stores?.length || 0} Unidades Operacionais</p>
          </div>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-slate-900 hover:bg-slate-800 text-white font-bold uppercase text-[10px] h-10 px-4 rounded-xl transition-all">
              <Plus size={16} className="mr-2" /> Novo Hub
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-106.25 rounded-3xl border-none shadow-2xl">
            <DialogHeader>
              <DialogTitle className="text-lg font-black uppercase italic tracking-tighter">Cadastrar Unidade</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold uppercase text-slate-500">ID (Slug único)</Label>
                <Input 
                  placeholder="ex: matriz-jundiai"
                  value={formData.storeSlug}
                  onChange={e => setFormData({...formData, storeSlug: e.target.value})}
                  className="rounded-xl border-slate-200 bg-slate-50 h-11 text-xs font-bold"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold uppercase text-slate-500">Nome Comercial</Label>
                <Input 
                  placeholder="Ex: Gourmet Saudável Matriz"
                  value={formData.companyName}
                  onChange={e => setFormData({...formData, companyName: e.target.value})}
                  className="rounded-xl border-slate-200 bg-slate-50 h-11 text-xs font-bold"
                />
              </div>
              <Button 
                onClick={() => updateStoreMutation.mutate({
                  storeSlug: formData.storeSlug.toLowerCase().trim().replace(/\s+/g, '-'),
                  companyName: formData.companyName,
                  address: "", 
                  lat: 0, 
                  lng: 0, 
                  allowedCities: [],
                  pickupEnabled: false, 
                  pickupLabel: "Retirada", 
                  pickupInstruction: "",
                  minOrderValue: 0, 
                  minOrderMessage: "Valor mínimo não atingido para entrega."
                })}
                disabled={updateStoreMutation.isPending || !formData.companyName}
                className="w-full h-12 bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase text-xs rounded-2xl transition-all"
              >
                {updateStoreMutation.isPending ? <Loader2 className="animate-spin" /> : "Finalizar Cadastro"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoadingStores ? (
        <div className="h-64 flex flex-col items-center justify-center bg-white rounded-3xl border border-slate-200 border-dashed">
          <Loader2 className="animate-spin text-slate-300" size={32} />
        </div>
      ) : (
        <Accordion type="single" collapsible className="space-y-3">
          {stores?.map((store) => {
            if (!store) return null;
            return (
              <AccordionItem key={store.slug} value={store.slug} className="border border-slate-200 bg-white rounded-2xl overflow-hidden">
                <AccordionTrigger className="px-6 py-4 hover:no-underline group hover:bg-slate-50/50 transition-all">
                  <div className="flex items-center gap-4 w-full text-left">
                    <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 group-data-[state=open]:bg-slate-900 group-data-[state=open]:text-white transition-all">
                      <Store size={20} />
                    </div>
                    <div className="flex flex-col flex-1">
                      <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">ID: {store.slug}</span>
                      <h3 className="text-sm font-black uppercase text-slate-800">{store.name}</h3>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-0 pb-0 border-t border-slate-100 bg-slate-50/20">
                  <HubDetailManager storeSlug={store.slug} />
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      )}
    </div>
  );
}

function HubDetailManager({ storeSlug }: { storeSlug: string }) {
  const { mappedSettings, actions, state } = useStoreConfig(storeSlug);
  const utils = trpc.useUtils();

  const [cityName, setCityName] = useState('');
  const [refCep, setRefCep] = useState('');
  const [isLocating, setIsLocating] = useState(false);
  const [allCities, setAllCities] = useState<{ nome: string }[]>([]);
  const [openSelector, setOpenSelector] = useState(false);
  const [testCep, setTestCep] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ status: 'success' | 'warning' | 'error'; message: string; details?: string; } | null>(null);

  useEffect(() => {
    fetch("https://servicodados.ibge.gov.br/api/v1/localidades/estados/35/municipios")
      .then(res => res.json())
      // ✅ FIX: Trocado 'any' por tipagem de objeto genérico do IBGE
      .then((data: Array<{ nome: string }>) => setAllCities(data.map((c) => ({ nome: c.nome }))))
      .catch(() => toast.error("Erro ao carregar municípios."));
  }, []);

  const registerMarcoZeroMutation = trpc.admin.shippingMesh.bindOperativeCity.useMutation({
    onSuccess: () => {
      const updatedCities = Array.from(new Set([...(mappedSettings?.allowedCities || []), cityName]));
      actions.saveConfig({ ...mappedSettings!, allowedCities: updatedCities });
      toast.success("Cidade vinculada!");
      setCityName('');
      setRefCep('');
    },
    onError: (err) => toast.error("Erro: " + err.message)
  });

  const handleAddCity = async () => {
    if (!cityName) return toast.error("Selecione uma cidade");
    setIsLocating(true);
    try {
      let geo = { lat: "0", lng: "0" };
      if (refCep.replace(/\D/g, "").length === 8) {
        const foundGeo = await actions.searchCep(refCep);
        if (foundGeo) geo = { lat: foundGeo.lat, lng: foundGeo.lng };
      }
      registerMarcoZeroMutation.mutate({
        rows: [{
          cep: refCep.replace(/\D/g, "") || "00000000",
          cidade: cityName,
          lat: geo.lat,
          lng: geo.lng
        }]
      });
    // ✅ FIX: Removido 'any' e o 'err' não utilizado
    } catch {
      toast.error("Erro ao localizar CEP de referência.");
    } finally {
      setIsLocating(false);
    }
  };

  const handleTestRule = async () => {
    const cleanCep = testCep.replace(/\D/g, "");
    if (cleanCep.length !== 8) return toast.error("CEP inválido");
    setIsTesting(true);
    setTestResult(null);

    try {
      // ✅ FIX: Cast seguro para a interface ZipValidationResult em vez de 'any'
      const res = await utils.addresses.validateZipZone.fetch({ zipCode: cleanCep, storeSlug }) as ZipValidationResult;
      
      if (res.isValid) {
        const minMsg = res.minOrderValue > 0 ? ` | Mínimo: R$ ${res.minOrderValue}` : '';
        setTestResult({ 
          status: 'success', 
          message: "Entrega Confirmada!", 
          details: `Via ${res.source}. Valor: R$ ${res.shippingCost.toFixed(2)}${minMsg}` 
        });
      } else if (res.cityAllowed) {
        setTestResult({ 
          status: 'warning', 
          message: "Bairro não atendido.", 
          details: "Cidade ativa, mas coordenadas fora do polígono." 
        });
      } else {
        setTestResult({ 
          status: 'error', 
          message: "Região não atendida.", 
          details: "Cidade não habilitada para este Hub." 
        });
      }
    // ✅ FIX: Removido 'any' e o 'err' não utilizado
    } catch {
      setTestResult({ status: 'error', message: "Erro no teste", details: "Falha na conexão." });
    } finally {
      setIsTesting(false);
    }
  };

  const handleDeleteCity = (name: string) => {
    if (!confirm(`Remover ${name}?`)) return;
    const updatedCities = mappedSettings?.allowedCities?.filter(c => c !== name) || [];
    actions.saveConfig({ ...mappedSettings!, allowedCities: updatedCities });
  };

  if (state.isLoading || !mappedSettings) return <div className="p-10 text-center"><Loader2 className="animate-spin inline text-slate-300" /></div>;

  return (
    <div className="p-6 space-y-8 animate-in fade-in">
      <section className="space-y-3">
        <div className="flex items-center gap-2 px-1">
          <Truck size={16} className="text-slate-400" />
          <h4 className="text-[10px] font-black uppercase text-slate-500">Logística de Retirada & Regras</h4>
        </div>
        <PickupSettingsCard 
          settings={mappedSettings} 
          isUpdating={state.isSaving} 
          onSave={(data) => {
            actions.saveConfig(data);
          }} 
        />
      </section>

      <section className="space-y-3">
        <div className="flex items-center gap-2 px-1">
          <Globe2 size={16} className="text-slate-400" />
          <h4 className="text-[10px] font-black uppercase text-slate-500">Cidades com Entrega Ativa</h4>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 bg-white p-3 rounded-2xl border border-slate-200">
          <Popover open={openSelector} onOpenChange={setOpenSelector}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="justify-between rounded-lg border-slate-100 bg-slate-50 h-9 text-xs font-bold w-full">
                {cityName ? cityName : "Selecionar Cidade (SP)..."}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-75 p-0 shadow-2xl border-slate-100">
              <Command>
                <CommandInput placeholder="Procurar município..." />
                <CommandList>
                  <CommandEmpty>Não encontrado.</CommandEmpty>
                  <CommandGroup>
                    {allCities.map((city) => (
                      <CommandItem key={city.nome} value={city.nome} onSelect={(val) => { setCityName(val); setOpenSelector(false); }}>
                        <Check className={cn("mr-2 h-4 w-4", cityName === city.nome ? "opacity-100" : "opacity-0")} />
                        {city.nome}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>

          <Input 
            placeholder="CEP Ref. p/ Mapa (Opcional)" 
            className="rounded-lg border-slate-100 bg-slate-50 h-9 text-xs font-bold"
            value={refCep}
            onChange={e => setRefCep(e.target.value)}
          />
          
          <Button 
            onClick={handleAddCity}
            disabled={isLocating || registerMarcoZeroMutation.isPending || state.isSaving}
            className="h-9 bg-slate-900 hover:bg-emerald-600 text-white rounded-lg text-[9px] font-black uppercase shadow-none transition-all"
          >
            {(isLocating || registerMarcoZeroMutation.isPending || state.isSaving) ? <Loader2 className="animate-spin" /> : "Ativar Cidade"}
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
          {mappedSettings.allowedCities?.map((city) => (
            <div key={city} className="flex items-center justify-between px-4 py-3 bg-white rounded-xl border border-slate-200 hover:bg-slate-50/50">
              <div className="flex items-center gap-2">
                <Navigation2 size={12} className="text-slate-400" />
                <span className="text-[10px] font-black uppercase text-slate-600">{city}</span>
              </div>
              <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-300 hover:text-red-500" onClick={() => handleDeleteCity(city)}>
                <X size={14} />
              </Button>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-3 pt-4 border-t border-slate-200">
        <div className="flex items-center gap-2 px-1">
          <Search size={16} className="text-emerald-500" />
          <h4 className="text-[10px] font-black uppercase text-slate-500">Simulador de Cascata (Real)</h4>
        </div>

        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-4">
          <div className="flex gap-2">
            <Input 
              placeholder="Digite um CEP para testar a geolocalização..." 
              className="rounded-xl border-slate-200 bg-white h-11 text-xs font-bold flex-1"
              value={testCep}
              onChange={e => setTestCep(e.target.value)}
            />
            <Button onClick={handleTestRule} disabled={isTesting} className="h-11 px-6 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase">
              {isTesting ? <Loader2 className="animate-spin" /> : "Simular Entrega"}
            </Button>
          </div>

          {testResult && (
            <div className={cn("p-4 rounded-xl border animate-in slide-in-from-top-2", 
              testResult.status === 'success' ? "bg-emerald-50 border-emerald-100 text-emerald-800" : 
              testResult.status === 'warning' ? "bg-amber-50 border-amber-100 text-amber-800" :
              "bg-red-50 border-red-100 text-red-800")}>
              <div className="flex items-start gap-3">
                {testResult.status === 'success' ? <Check size={18} /> : <X size={18} />}
                <div>
                  <p className="text-xs font-black uppercase italic">{testResult.message}</p>
                  <p className="text-[10px] font-medium mt-1 opacity-80 leading-tight">{testResult.details}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
