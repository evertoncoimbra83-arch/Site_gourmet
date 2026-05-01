// e:/IA/projects/Site_React/client/src/pages/adminShipping/view/AdminShippingView.tsx

import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Loader2, MapPin, Store, Database, LayoutGrid, Settings2, LucideProps } from "lucide-react";
import { appToast as toast } from "@/lib/app-toast";

// Componentes de Interface
import { ShippingMapDrawer } from "../components/ShippingMapDrawer";
import { GeoMeshView } from "../components/GeoMeshView";
import { StoreManager } from "../components/StoreManager";
import { ShippingRulesList, ShippingRule } from "../components/ShippingRulesList"; 

// Hooks de Lógica
import { useShippingMesh } from "../logic/useShippingMesh";
import { useMultiStoreShipping } from "../logic/useMultiStoreShipping";
import { useShippingRules } from "../logic/useShippingRules";

// 🛡️ Interfaces Refinadas Auxiliares
interface GeoCoords { 
  lat: number; 
  lng: number; 
}

export function AdminShippingView() {
  const [activeTab, setActiveTab] = useState("stores");
  const [selectedRuleForMap, setSelectedRuleForMap] = useState<ShippingRule | null>(null);

  const { 
    selectedStoreId, 
    setSelectedStoreId, 
    stores, 
    storeConfig, 
    isLoading: loadingStores 
  } = useMultiStoreShipping();

  const { actions: meshActions } = useShippingMesh();

  const {
    rules,
    isLoading: loadingRules,
    actions: ruleActions
  } = useShippingRules({ storeSlug: selectedStoreId });

  // 📍 Marco Zero: Localização central do Hub selecionado
  const storeLocation = storeConfig?.lat ? {
    address: storeConfig.address || "Base Operacional",
    lat: Number(storeConfig.lat),
    lng: Number(storeConfig.lng)
  } : null;

  /**
   * 🚀 SALVAMENTO E SINCRONIZAÇÃO DA MALHA
   */
  const handleSaveFullRule = async (payload: {
    id?: number;
    name: string;
    price: number;
    type: 'polygon' | 'circle';
    data: GeoCoords[] | { center: GeoCoords; radius: number };
  }) => {
    if (!selectedStoreId) return toast.error("Selecione um Hub operacional primeiro.");

    const toastId = toast.loading("Sincronizando malha de CEPs...");

    try {
      await ruleActions.saveRule({
        id: payload.id,
        name: payload.name,
        shippingCost: payload.price,
        type: payload.type,
        data: payload.data,
        storeSlug: selectedStoreId
      });

      await meshActions.saveDrawnArea();

      toast.success("Logística atualizada com sucesso!", { id: toastId });
      setSelectedRuleForMap(null); 
      
    } catch (err: unknown) {
      console.error("Erro na sincronização logística:", err);
      toast.error("Falha ao processar malha de CEPs.", { id: toastId });
    }
  };

  if (loadingStores) {
    return (
      <div className="p-12 flex flex-col items-center justify-center min-h-100 gap-4 bg-white rounded-3xl border border-slate-100">
        <Loader2 className="animate-spin text-emerald-500" size={40} />
        <p className="text-slate-400 font-black uppercase text-[9px] tracking-widest italic animate-pulse">
          Sincronizando Hubs Logísticos...
        </p>
      </div>
    );
  }

  // ✅ FIX FINAL 2322: 'storeSlug' agora recebe uma string vazia (ou o valor) para nunca ser undefined
  const normalizedRules: ShippingRule[] = (rules || []).map(r => ({
    ...r,
    id: r.id ?? 0, 
    type: (r.type as 'polygon' | 'circle' | 'zipcode') || 'zipcode',
    shippingCost: r.shippingCost || "0",
    storeSlug: r.storeSlug || "" // <--- O SEGREDO ESTÁ AQUI
  }));

  return (
    <div className="p-4 max-w-7xl mx-auto space-y-6 text-left animate-in fade-in duration-700 bg-slate-50/50 rounded-4xl min-h-screen border border-slate-100">
      
      <header className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-6 rounded-3xl border border-slate-200">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-slate-900 rounded-2xl text-emerald-400">
            <Settings2 size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-black uppercase italic tracking-tighter text-slate-900 leading-none">
              Logística Gourmet
            </h1>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">
              Malha de CEPs & Perímetros Inteligentes
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 bg-slate-100 p-1.5 rounded-2xl border border-slate-200 w-full md:w-auto">
          <div className="flex items-center gap-2 px-3">
            <Store size={14} className="text-slate-400" />
            <span className="text-[9px] font-black text-slate-500 uppercase">Hub Ativo:</span>
          </div>
          <select 
            value={selectedStoreId || ""} 
            onChange={(e) => {
              setSelectedStoreId(e.target.value);
              setSelectedRuleForMap(null);
            }}
            className="bg-white text-slate-900 text-xs font-black h-9 px-4 rounded-xl border border-slate-200 outline-none cursor-pointer min-w-50 hover:border-emerald-500 transition-colors"
          >
            <option value="" disabled>Selecione uma Unidade...</option>
            {stores.map((s) => (
              <option key={s?.slug} value={s?.slug || ""}>
                {s?.name?.toUpperCase()}
              </option>
            ))}
          </select>
        </div>
      </header>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-white p-1 rounded-2xl border border-slate-200 flex w-full max-w-2xl">
          <TabsTrigger value="stores" className="rounded-xl font-black uppercase text-[9px] w-full py-3 data-[state=active]:bg-slate-900 data-[state=active]:text-white transition-all">
            <LayoutGrid size={14} className="mr-2" /> 1. Operação & Cidades
          </TabsTrigger>
          <TabsTrigger value="areas" className="rounded-xl font-black uppercase text-[9px] w-full py-3 data-[state=active]:bg-slate-900 data-[state=active]:text-white transition-all">
            <MapPin size={14} className="mr-2" /> 2. Radar de Frete
          </TabsTrigger>
          <TabsTrigger value="mesh" className="rounded-xl font-black uppercase text-[9px] w-full py-3 data-[state=active]:bg-slate-900 data-[state=active]:text-white transition-all">
            <Database size={14} className="mr-2" /> 3. Malha de CEPs
          </TabsTrigger>
        </TabsList>

        <TabsContent value="stores" className="animate-in slide-in-from-bottom-2 duration-500 outline-none">
          <StoreManager />
        </TabsContent>

        <TabsContent value="areas" className="space-y-6 animate-in slide-in-from-bottom-2 duration-500 outline-none">
          {selectedStoreId ? (
            <div className="space-y-6">
              <div className="rounded-3xl border border-slate-200 overflow-hidden bg-white">
                <ShippingMapDrawer 
                  googleMapsApiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''} 
                  onSaveArea={handleSaveFullRule}
                  onCancelEdit={() => setSelectedRuleForMap(null)} 
                  initialData={selectedRuleForMap}
                  existingRules={normalizedRules}
                  storeAddress={storeLocation}
                />
              </div>

              <ShippingRulesList 
                rules={normalizedRules} 
                isLoading={loadingRules}
                onEdit={(rule) => {
                  setSelectedRuleForMap(rule);
                  window.scrollTo({ top: 150, behavior: 'smooth' });
                }}
                onDelete={(id) => ruleActions.deleteRule(id)}
              />
            </div>
          ) : (
            <Card className="h-96 flex flex-col items-center justify-center bg-white rounded-[3rem] border-2 border-dashed border-slate-200 transition-colors shadow-none">
              <div className="p-6 bg-slate-50 rounded-full mb-6">
                <Navigation2 className="text-slate-200 h-12 w-12 animate-pulse" />
              </div>
              <p className="text-slate-400 font-black uppercase text-[10px] tracking-[0.2em] text-center leading-relaxed">
                Hub operacional não selecionado.<br/>Defina a unidade no topo para<br/>gerenciar perímetros.
              </p>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="mesh" className="animate-in slide-in-from-bottom-2 duration-500 outline-none">
            <GeoMeshView />
        </TabsContent>
      </Tabs>
    </div>
  );
}

const Navigation2 = ({ className, ...props }: LucideProps) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className} 
    {...props}
  >
    <polygon points="3 11 22 2 13 21 11 13 3 11" />
  </svg>
);