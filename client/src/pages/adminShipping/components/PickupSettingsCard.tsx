import React, { useState, useEffect } from "react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MapPin, Save, Loader2, Info, Store, Building2, Search, Banknote } from "lucide-react";
import { cn } from "@/lib/utils";
import { appToast as toast } from "@/lib/app-toast";

// --- INTERFACES ---
interface StoreSettings {
  companyName: string;
  fullAddress: string;
  lat: string;
  lng: string;
  allowedCities: string[];
  pickupEnabled: boolean;
  pickupLabel: string;
  pickupInstruction: string;
  // ✅ Novos campos de Pedido Mínimo
  minOrderValue: number;
  minOrderMessage: string;
}

interface PickupSettingsCardProps {
  settings: Partial<StoreSettings> | null | undefined;
  onSave: (data: StoreSettings) => void;
  isUpdating: boolean;
}

export function PickupSettingsCard({ settings, onSave, isUpdating }: PickupSettingsCardProps) {
  const [localSettings, setLocalSettings] = useState<StoreSettings>({
    companyName: "",
    fullAddress: "",
    lat: "",
    lng: "",
    allowedCities: [],
    pickupEnabled: false,
    pickupLabel: "",
    pickupInstruction: "",
    minOrderValue: 0,
    minOrderMessage: ""
  });

  const [cepInput, setCepInput] = useState("");
  const [isSearchingCep, setIsSearchingCep] = useState(false);

  // Sincroniza dados iniciais vindo do Hook
  useEffect(() => {
    if (settings) {
      setLocalSettings({
        companyName: settings.companyName || "",
        fullAddress: settings.fullAddress || "",
        lat: settings.lat || "",
        lng: settings.lng || "",
        allowedCities: settings.allowedCities || [],
        pickupEnabled: settings.pickupEnabled ?? false,
        pickupLabel: settings.pickupLabel || "",
        pickupInstruction: settings.pickupInstruction || "",
        minOrderValue: Number(settings.minOrderValue) || 0,
        minOrderMessage: settings.minOrderMessage || "Valor mínimo não atingido para entrega."
      });
    }
  }, [settings]);

  // Busca endereço pelo CEP e gera Lat/Lng da Base
  const handleSearchCep = async () => {
    const cleanCep = cepInput.replace(/\D/g, "");
    if (cleanCep.length !== 8) return toast.error("Formato de CEP inválido");

    setIsSearchingCep(true);
    try {
      const cepResponse = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      const cepData = await cepResponse.json();
      if (cepData.erro) throw new Error();

      const completeAddress = `${cepData.logradouro}, ${cepData.bairro}, ${cepData.localidade} - ${cepData.uf}`;
      
      const geoResponse = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(completeAddress)}&limit=1`,
        { headers: { 'User-Agent': 'GourmetSaudavel-Admin' } }
      );
      const geoData = await geoResponse.json();

      setLocalSettings(prev => ({
        ...prev,
        fullAddress: completeAddress,
        lat: geoData[0]?.lat || "",
        lng: geoData[0]?.lon || ""
      }));
      toast.success("Localização da unidade identificada!");
    } catch {
      toast.error("Erro ao localizar CEP ou coordenadas.");
    } finally {
      setIsSearchingCep(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      <div className="bg-white rounded-[2rem] border border-slate-200 overflow-hidden shadow-sm">
        
        {/* HEADER INDUSTRIAL */}
        <div className="p-6 bg-slate-50 border-b border-slate-200 flex flex-col md:flex-row items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-slate-900 flex items-center justify-center text-white">
            <Store size={24} />
          </div>
          <div className="text-center md:text-left">
            <h3 className="text-sm font-black uppercase tracking-tight text-slate-800">Diretrizes da Unidade</h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Identidade & Base Operacional</p>
          </div>
        </div>

        <div className="p-6 space-y-8">
          
          {/* SEÇÃO 1: LOCALIZAÇÃO E IDENTIDADE */}
          <div className="space-y-6">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
              <Building2 size={16} className="text-slate-400" />
              <h4 className="text-[10px] font-black uppercase text-slate-500">Identidade & Localização</h4>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
              <div className="space-y-1.5">
                <Label className="text-[9px] font-bold uppercase text-slate-400 ml-1">Nome de Exibição</Label>
                <Input 
                  className="h-11 rounded-xl bg-slate-50 border-slate-200 font-bold text-slate-700 text-xs" 
                  value={localSettings.companyName}
                  onChange={(e) => setLocalSettings({ ...localSettings, companyName: e.target.value })}
                  placeholder="Ex: Gourmet Saudável Matriz"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-[9px] font-bold uppercase text-slate-400 ml-1">Atualizar Endereço via CEP</Label>
                <div className="flex gap-2">
                  <Input 
                    className="h-11 rounded-xl bg-slate-50 border-slate-200 font-bold text-slate-700 text-xs flex-1" 
                    placeholder="00000-000"
                    value={cepInput}
                    onChange={(e) => setCepInput(e.target.value)}
                  />
                  <Button onClick={handleSearchCep} disabled={isSearchingCep} className="h-11 w-11 rounded-xl bg-slate-900 text-white hover:bg-slate-800 transition-all">
                    {isSearchingCep ? <Loader2 className="animate-spin" size={16} /> : <Search size={16} />}
                  </Button>
                </div>
              </div>
            </div>

            <div className="space-y-2 text-left bg-slate-50 p-4 rounded-xl border border-slate-100">
              <Label className="text-[9px] font-black uppercase text-slate-400">Endereço Registrado</Label>
              <p className="text-xs font-bold text-slate-600 leading-tight">
                {localSettings.fullAddress || "Nenhum endereço localizado."}
              </p>
              <div className="flex gap-4 mt-1">
                <p className="text-[9px] font-mono font-bold text-emerald-600 uppercase tracking-tighter">Lat: {localSettings.lat || '---'}</p>
                <p className="text-[9px] font-mono font-bold text-emerald-600 uppercase tracking-tighter">Lng: {localSettings.lng || '---'}</p>
              </div>
            </div>
          </div>

          {/* ✅ SEÇÃO 2: REGRAS DE PEDIDO MÍNIMO */}
          <div className="space-y-6">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
              <Banknote size={16} className="text-slate-400" />
              <h4 className="text-[10px] font-black uppercase text-slate-500">Restrições de Compra</h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
              <div className="space-y-1.5">
                <Label className="text-[9px] font-bold uppercase text-slate-400 ml-1">Valor Mínimo (R$)</Label>
                <Input 
                  type="number"
                  className="h-11 rounded-xl bg-white border-slate-200 font-bold text-emerald-600 text-xs" 
                  value={localSettings.minOrderValue}
                  onChange={(e) => setLocalSettings({ ...localSettings, minOrderValue: Number(e.target.value) })}
                  placeholder="0.00"
                />
              </div>
              <div className="md:col-span-2 space-y-1.5">
                <Label className="text-[9px] font-bold uppercase text-slate-400 ml-1">Aviso no Carrinho</Label>
                <Input 
                  className="h-11 rounded-xl bg-white border-slate-200 font-bold text-slate-700 text-xs" 
                  value={localSettings.minOrderMessage}
                  onChange={(e) => setLocalSettings({ ...localSettings, minOrderMessage: e.target.value })}
                  placeholder="Mensagem quando o valor não for atingido..."
                />
              </div>
            </div>
          </div>

          {/* SEÇÃO 3: RETIRADA NO LOCAL (PICKUP) */}
          <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-6 text-left">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin size={18} className="text-slate-400" />
                <h4 className="text-[10px] font-black uppercase text-slate-700">Opção de Retirada (Take Away)</h4>
              </div>
              <div className="flex items-center gap-2">
                 <span className="text-[8px] font-black uppercase text-slate-400 tracking-wider">Habilitar</span>
                 <Switch 
                  checked={localSettings.pickupEnabled} 
                  onCheckedChange={(val) => setLocalSettings({ ...localSettings, pickupEnabled: val })}
                  className="data-[state=checked]:bg-emerald-600"
                />
              </div>
            </div>

            <div className={cn("grid grid-cols-1 gap-4 transition-all duration-300", !localSettings.pickupEnabled && "opacity-40 grayscale pointer-events-none")}>
              <div className="space-y-1.5">
                <Label className="text-[9px] font-bold uppercase text-slate-400 ml-1">Título no Checkout</Label>
                <Input 
                  className="h-11 rounded-xl bg-white border-slate-200 font-bold text-slate-700 text-xs" 
                  placeholder="Ex: Retirar na Unidade Jundiaí"
                  value={localSettings.pickupLabel}
                  onChange={(e) => setLocalSettings({ ...localSettings, pickupLabel: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[9px] font-bold uppercase text-slate-400 ml-1">Instruções de Retirada</Label>
                <Textarea 
                  className="rounded-xl bg-white border-slate-200 font-medium h-20 resize-none p-3 text-xs" 
                  placeholder="Ex: Horário das 09h às 18h. Tocar o interfone e informar o número do pedido."
                  value={localSettings.pickupInstruction}
                  onChange={(e) => setLocalSettings({ ...localSettings, pickupInstruction: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* FOOTER / SALVAMENTO */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 pt-2">
            <div className="flex items-start gap-2 text-slate-400 italic">
              <Info size={14} className="text-slate-300 mt-0.5 shrink-0" />
              <p className="text-[8px] font-bold uppercase tracking-tight max-w-xs leading-tight text-left">
                As configurações acima impactam diretamente o checkout do cliente com base no HUB selecionado.
              </p>
            </div>
            <Button 
              onClick={() => onSave(localSettings)}
              disabled={isUpdating}
              className="w-full md:w-auto h-12 px-8 rounded-xl bg-slate-900 hover:bg-emerald-600 text-white font-bold uppercase text-[10px] tracking-widest transition-all shadow-lg active:scale-95"
            >
              {isUpdating ? <Loader2 className="animate-spin mr-2" size={16} /> : <Save className="mr-2" size={16} />}
              Salvar Diretrizes
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}