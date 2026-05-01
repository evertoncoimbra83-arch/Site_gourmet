// e:/IA/projects/Site_React/client/src/pages/adminShipping/components/ShippingMapDrawer.tsx

import React, { useRef, useEffect, useState, useCallback } from 'react'; 
import { GoogleMap, useJsApiLoader, Polygon, Circle, StandaloneSearchBox } from '@react-google-maps/api';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Save, Target, Search, RefreshCw, DollarSign, Tag, X, Undo2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { GOOGLE_MAPS_LIBRARIES, mapStyles } from "../logic/MapConfigs";
import { useShippingMap } from "../logic/useShippingMap";
import { appToast as toast } from "@/lib/app-toast";

// --- INTERFACES ---
interface GeoCoords { lat: number; lng: number; }

interface StoreAddress {
  address: string;
  lat: number;
  lng: number;
}

interface ShippingRule {
  id?: number;
  name: string;
  type: 'polygon' | 'circle' | 'zipcode';
  shippingCost?: string | number;
  price?: number;
  polygonCoords?: string | GeoCoords[] | { center: GeoCoords; radius: number };
}

interface ShippingMapDrawerProps {
  googleMapsApiKey: string;
  onSaveArea: (payload: {
    id?: number;
    name: string;
    price: number;
    type: 'polygon' | 'circle';
    data: GeoCoords[] | { center: GeoCoords; radius: number };
    ceps: string[];
    zipCodeStart: string;
    zipCodeEnd: string;
  }) => void;
  onCancelEdit?: () => void;
  storeAddress?: StoreAddress | null;
  initialData?: ShippingRule | null; 
  existingRules?: ShippingRule[];
}

export function ShippingMapDrawer({ 
  googleMapsApiKey, 
  onSaveArea, 
  onCancelEdit,
  storeAddress,
  initialData,
  existingRules = [] 
}: ShippingMapDrawerProps) {
  
  const { isLoaded } = useJsApiLoader({ 
    id: 'google-map-script', 
    googleMapsApiKey, 
    libraries: GOOGLE_MAPS_LIBRARIES 
  });

  type MapHookInitialData = Parameters<typeof useShippingMap>[1];
  const { state, actions, refs } = useShippingMap(
    storeAddress, 
    initialData as unknown as MapHookInitialData
  );

  const searchBoxRef = useRef<google.maps.places.SearchBox | null>(null);
  
  // ✅ FIX: Mecanismo Anti-Loop Infinito
  // Guarda o ID (ou assinatura "novo") do último initialData processado
  const processedDataIdRef = useRef<string | number | null>(null);
  
  const [ruleName, setRuleName] = useState('');
  const [rulePrice, setRulePrice] = useState('');

  const handleClearDrawing = useCallback(() => {
    actions.setPolygonCoords([]);
    actions.setCircleData(null);
    if (refs.polygonRef.current) refs.polygonRef.current = null;
    if (refs.circleRef.current) refs.circleRef.current = null;
  }, [actions, refs]);

  const undoLastPoint = () => {
    if (state.mode === 'polygon' && state.polygonCoords.length > 0) {
      actions.setPolygonCoords(state.polygonCoords.slice(0, -1));
    }
  };

  // ✅ SINCRONIZAÇÃO SEGURA
  useEffect(() => {
    // Determina a "assinatura" atual (ID ou a string mágica 'new' do seu fluxo)
    const currentSignature = initialData?.id ?? (initialData as unknown) === 'new' ? 'new' : null;

    // Se a assinatura for igual à última processada, ABORTA para evitar o loop infinito
    if (currentSignature === processedDataIdRef.current) {
      return; 
    }

    // Registra a nova assinatura como processada
    processedDataIdRef.current = currentSignature;

    if (initialData && currentSignature !== 'new') {
      setRuleName(initialData.name || '');
      const currentPrice = initialData.shippingCost || initialData.price;
      setRulePrice(currentPrice?.toString() || '');

      try {
        const rawCoords = initialData.polygonCoords;
        if (!rawCoords) return;
        const parsedData = typeof rawCoords === 'string' ? JSON.parse(rawCoords) : rawCoords;

        if (initialData.type === 'polygon' && Array.isArray(parsedData)) {
          actions.setMode('polygon');
          actions.setPolygonCoords(parsedData);
        } else if (initialData.type === 'circle' && parsedData.center) {
          actions.setMode('circle');
          actions.setCircleData({
            center: parsedData.center,
            radius: Number(parsedData.radius)
          });
        }
      } catch {
        console.warn("Erro ao processar coordenadas iniciais");
      }
    } else {
      // É um novo cadastro ou foi limpo
      setRuleName('');
      setRulePrice('');
      handleClearDrawing();
    }
  }, [initialData, actions, handleClearDrawing]); 

  const handleCancelAndClear = () => {
    processedDataIdRef.current = null; // Reseta o rastreador
    handleClearDrawing();
    setRuleName('');
    setRulePrice('');
    if (onCancelEdit) onCancelEdit();
  };

  const handleFinalSave = () => {
    if (!ruleName.trim()) return toast.error("Dê um nome para esta área.");
    if (!rulePrice) return toast.error("Defina um valor de frete.");
    
    let finalPolygon = state.polygonCoords;
    let finalCircle = state.circleData;

    if (state.mode === 'polygon' && refs.polygonRef.current) {
       const path = refs.polygonRef.current.getPath();
       if (path) finalPolygon = path.getArray().map(p => ({ lat: p.lat(), lng: p.lng() }));
    }
    if (state.mode === 'circle' && refs.circleRef.current) {
       const center = refs.circleRef.current.getCenter();
       const radius = refs.circleRef.current.getRadius();
       if (center && radius) finalCircle = { center: { lat: center.lat(), lng: center.lng() }, radius };
    }

    const isPolygon = state.mode === 'polygon';
    const geometryData = isPolygon ? finalPolygon : finalCircle;
    const isInvalidPolygon = isPolygon && Array.isArray(geometryData) && geometryData.length < 3;

    if (!geometryData || isInvalidPolygon) {
      return toast.error("Desenhe a área no mapa antes de salvar.");
    }

    onSaveArea({
      id: initialData?.id,
      name: ruleName,
      price: Number(rulePrice),
      type: state.mode,
      data: isPolygon ? (geometryData as GeoCoords[]) : (geometryData as { center: GeoCoords; radius: number }),
      ceps: [],
      zipCodeStart: '',
      zipCodeEnd: ''
    });
  };

  if (!isLoaded) return <div className="h-150 w-full bg-slate-900 animate-pulse rounded-[3rem] mt-6" />;

  return (
    <Card className="rounded-[3rem] border-none shadow-2xl bg-white overflow-hidden mt-6 relative border border-slate-100">
      <CardHeader className={cn(
        "p-6 text-white border-b border-white/5 space-y-4 transition-all duration-500",
        initialData?.id ? "bg-amber-600" : "bg-slate-900"
      )}>
        <div className="flex items-center gap-4">
          <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center shadow-lg", initialData?.id ? "bg-white text-amber-600" : "bg-emerald-500 text-white")}>
            <Target size={20} />
          </div>
          <div className="flex-1 text-left">
            <h3 className="text-lg font-black uppercase italic leading-none tracking-tighter">
              {initialData?.id ? `Editando: ${initialData.name}` : "Radar de Perímetro"}
            </h3>
            <p className="text-[9px] text-white/60 font-bold uppercase tracking-widest mt-1">
              {initialData?.id ? "Modo de Edição Ativado" : "Desenhe uma nova regra de frete"}
            </p>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-3">
          <div className="relative flex-1">
            <Tag className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={14} />
            <Input 
              placeholder="Nome da Regra..." 
              value={ruleName}
              onChange={e => setRuleName(e.target.value)}
              className="bg-white/10 border-white/10 text-white pl-9 h-11 rounded-xl focus:ring-white/20 font-bold w-full"
            />
          </div>
          <div className="relative flex-1">
            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={14} />
            <Input 
              type="number"
              placeholder="Preço (R$)" 
              value={rulePrice}
              onChange={e => setRulePrice(e.target.value)}
              className="bg-white/10 border-white/10 text-white pl-9 h-11 rounded-xl focus:ring-white/20 font-bold w-full"
            />
          </div>
          <div className="flex gap-2">
            {initialData?.id && (
              <Button onClick={handleCancelAndClear} variant="ghost" className="h-11 font-black text-xs uppercase rounded-xl px-4 text-white hover:bg-white/20">
                <X size={16} className="mr-2" /> Cancelar
              </Button>
            )}
            <Button onClick={handleFinalSave} className={cn("h-11 font-black text-xs uppercase rounded-xl px-6 transition-all active:scale-95", initialData?.id ? "bg-white text-amber-600 hover:bg-white/90" : "bg-emerald-500 text-white hover:bg-emerald-400")}>
              <Save size={16} className="mr-2" /> {initialData?.id ? "Atualizar" : "Salvar"}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0 relative h-150 bg-slate-800 text-left">
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 bg-slate-900/90 backdrop-blur-xl p-2 rounded-2xl shadow-2xl border border-white/10">
          <StandaloneSearchBox 
            onLoad={ref => { searchBoxRef.current = ref; }} 
            onPlacesChanged={() => {
              const loc = searchBoxRef.current?.getPlaces()?.[0]?.geometry?.location;
              if (loc) { refs.mapRef.current?.panTo(loc); refs.mapRef.current?.setZoom(15); }
            }}
          >
            <div className="relative shrink-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
              <input type="text" placeholder="Buscar local..." className="w-32 md:w-48 h-10 bg-white/5 border border-white/10 rounded-xl pl-9 text-white text-xs outline-none" />
            </div>
          </StandaloneSearchBox>
          <div className="flex bg-black/40 p-1 rounded-xl shrink-0">
            <Button 
                variant="ghost" 
                size="sm" 
                className={cn("h-8 rounded-lg text-[9px] font-black uppercase", state.mode === 'polygon' ? "bg-emerald-500 text-white" : "text-slate-400")} 
                onClick={() => { handleClearDrawing(); actions.setMode('polygon'); }}
            >Polígono</Button>
            <Button 
                variant="ghost" 
                size="sm" 
                className={cn("h-8 rounded-lg text-[9px] font-black uppercase", state.mode === 'circle' ? "bg-emerald-500 text-white" : "text-slate-400")} 
                onClick={() => { handleClearDrawing(); actions.setMode('circle'); }}
            >Raio KM</Button>
          </div>
          
          <div className="flex gap-1 border-l border-white/10 pl-2">
            {state.mode === 'polygon' && state.polygonCoords.length > 0 && (
                <Button variant="outline" size="icon" onClick={undoLastPoint} title="Desfazer último ponto" className="h-10 w-10 border-white/10 bg-white/5 text-slate-400 rounded-xl hover:text-white">
                    <Undo2 size={16} />
                </Button>
            )}
            <Button variant="outline" size="icon" onClick={handleClearDrawing} title="Limpar desenho" className="h-10 w-10 border-white/10 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-xl transition-all">
                <RefreshCw size={16} />
            </Button>
          </div>
        </div>

        <GoogleMap
          mapContainerStyle={{ width: '100%', height: '100%' }}
          center={state.defaultCenter}
          zoom={13}
          onLoad={m => { refs.mapRef.current = m; }}
          options={{ styles: mapStyles, disableDefaultUI: true, zoomControl: true }}
          onClick={e => {
            if (!e.latLng) return;
            const pt = { lat: e.latLng.lat(), lng: e.latLng.lng() };
            if (state.mode === 'polygon') {
                actions.setPolygonCoords([...state.polygonCoords, pt]);
            } else {
                handleClearDrawing(); 
                actions.setCircleData({ center: pt, radius: 2500 });
            }
          }}
        >
          {existingRules.map((rule) => {
            if (!rule.polygonCoords || rule.id === initialData?.id) return null;
            try {
              const coords = typeof rule.polygonCoords === 'string' ? JSON.parse(rule.polygonCoords) : rule.polygonCoords;
              if (rule.type === 'polygon' && Array.isArray(coords)) {
                return <Polygon key={rule.id} paths={coords} options={{ fillColor: "#64748b", fillOpacity: 0.12, strokeColor: "#94a3b8", strokeWeight: 1, clickable: false }} />
              } else if (rule.type === 'circle' && coords.center) {
                return <Circle key={rule.id} center={coords.center} radius={Number(coords.radius)} options={{ fillColor: "#64748b", fillOpacity: 0.12, strokeColor: "#94a3b8", strokeWeight: 1, clickable: false }} />
              }
            } catch { return null; }
            return null;
          })}

          {state.mode === 'polygon' && state.polygonCoords.length > 0 && (
            <Polygon 
              paths={state.polygonCoords} 
              onLoad={p => { refs.polygonRef.current = p; }} 
              options={{ fillColor: "#10b981", fillOpacity: 0.3, strokeColor: "#10b981", strokeWeight: 3, editable: true, draggable: true }} 
            />
          )}

          {state.mode === 'circle' && state.circleData && (
            <Circle 
              center={state.circleData.center} 
              radius={state.circleData.radius} 
              onLoad={c => { refs.circleRef.current = c; }} 
              options={{ fillColor: "#3b82f6", fillOpacity: 0.3, strokeColor: "#3b82f6", strokeWeight: 3, editable: true, draggable: true }} 
            />
          )}
        </GoogleMap>
      </CardContent>
    </Card>
  );
}