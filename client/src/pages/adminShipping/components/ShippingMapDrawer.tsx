import React, { useState, useCallback, useRef, useMemo } from 'react';
import { GoogleMap, useJsApiLoader, DrawingManager, Polygon } from '@react-google-maps/api';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Trash2, Save, Map as MapIcon, Crosshair, AlertTriangle } from "lucide-react";

interface ShippingMapDrawerProps {
  googleMapsApiKey: string;
  onSaveArea: (coords: { lat: number; lng: number }[]) => void;
  centerConfig?: { lat: number; lng: number }; 
}

// ✅ Constante externa para evitar re-renders da API
const LIBRARIES: ("drawing" | "geometry" | "places")[] = ["drawing"];

export function ShippingMapDrawer({ googleMapsApiKey, onSaveArea, centerConfig }: ShippingMapDrawerProps) {
  const [polygonCoords, setPolygonCoords] = useState<{ lat: number; lng: number }[]>([]);
  const mapRef = useRef<google.maps.Map | null>(null);

  // ✅ Define o centro: Prioriza centerConfig, depois fallback para Jundiaí/SP (exemplo)
  const defaultCenter = useMemo(() => ({
    lat: centerConfig?.lat || -23.1857, 
    lng: centerConfig?.lng || -46.8978
  }), [centerConfig]);

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: googleMapsApiKey,
    libraries: LIBRARIES
  });

  const onPolygonComplete = useCallback((polygon: google.maps.Polygon) => {
    const path = polygon.getPath();
    const coords = path.getArray().map(latLng => ({
      lat: latLng.lat(),
      lng: latLng.lng()
    }));
    
    setPolygonCoords(coords);
    polygon.setMap(null); 
  }, []);

  const reCenter = () => {
    if (mapRef.current) {
      mapRef.current.panTo(defaultCenter);
      mapRef.current.setZoom(14);
    }
  };

  // 🚨 TRATAMENTO DE ERRO: ApiProjectMapError (Billing ou API Desativada)
  if (loadError) {
    return (
      <Card className="rounded-[2.5rem] border-2 border-red-100 bg-red-50/50 p-12 text-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center text-red-600 shadow-inner">
            <AlertTriangle size={32} />
          </div>
          <h3 className="font-black uppercase text-red-900 tracking-tighter text-xl">Erro Crítico do Google Maps</h3>
          <p className="text-xs text-red-700 max-w-sm font-bold leading-relaxed">
            O Google retornou o erro <code className="bg-red-200 px-1 italic">ApiProjectMapError</code>. 
            Isso geralmente significa que o faturamento (Billing) não está ativo ou a Maps JavaScript API não foi habilitada no console do Google Cloud.
          </p>
          <Button 
            className="bg-red-600 hover:bg-red-700 text-white rounded-xl px-8 font-black text-[10px] uppercase tracking-widest mt-4"
            onClick={() => window.open('https://console.cloud.google.com/google/maps-apis/overview', '_blank')}
          >
            Acessar Google Cloud
          </Button>
        </div>
      </Card>
    );
  }

  if (!isLoaded) return (
    <div className="h-[500px] flex flex-col items-center justify-center bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-200">
      <Loader2 className="animate-spin text-emerald-500 mb-2" size={32} />
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Sincronizando Satélites...</p>
    </div>
  );

  return (
    <Card className="rounded-[2.5rem] border-none shadow-2xl bg-white overflow-hidden border border-slate-100">
      <CardHeader className="p-8 bg-slate-900 text-white flex flex-row items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
            <MapIcon className="text-emerald-400" size={20} />
          </div>
          <div>
            <CardTitle className="text-xl font-black uppercase italic tracking-tighter leading-none">
              Área de <span className="text-emerald-400">Entrega Dinâmica</span>
            </CardTitle>
            <p className="text-[9px] text-slate-400 uppercase font-bold tracking-widest mt-1">Geofencing Operacional</p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={reCenter} 
            className="text-white hover:bg-white/10 rounded-xl"
          >
            <Crosshair size={18} />
          </Button>
          
          {polygonCoords.length > 0 && (
            <>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setPolygonCoords([])} 
                className="text-red-400 hover:bg-red-500/10 rounded-xl font-black text-[10px] uppercase"
              >
                <Trash2 size={16} className="mr-2" /> Limpar
              </Button>
              <Button 
                size="sm" 
                onClick={() => onSaveArea(polygonCoords)} 
                className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-black text-[10px] uppercase px-6 shadow-lg shadow-emerald-500/20"
              >
                <Save size={16} className="mr-2" /> Salvar Área
              </Button>
            </>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="p-0 relative">
        <GoogleMap
          mapContainerStyle={{ width: '100%', height: '500px' }}
          center={defaultCenter}
          zoom={14}
          onLoad={map => { mapRef.current = map }}
          options={{
            disableDefaultUI: false,
            zoomControl: true,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: false,
            styles: mapStyles
          }}
        >
          <DrawingManager
            onPolygonComplete={onPolygonComplete}
            options={{
              drawingControl: polygonCoords.length === 0,
              drawingControlOptions: {
                position: google.maps.ControlPosition.TOP_CENTER,
                drawingModes: [google.maps.drawing.OverlayType.POLYGON],
              },
              polygonOptions: {
                fillColor: "#10b981",
                fillOpacity: 0.3,
                strokeWeight: 3,
                strokeColor: "#059669",
                editable: true,
                draggable: true,
              },
            }}
          />

          {polygonCoords.length > 0 && (
            <Polygon
              path={polygonCoords}
              options={{
                fillColor: "#10b981",
                fillOpacity: 0.3,
                strokeWeight: 3,
                strokeColor: "#059669",
              }}
            />
          )}
        </GoogleMap>
        
        {polygonCoords.length === 0 && (
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 pointer-events-none">
            <div className="bg-slate-900/90 backdrop-blur-md text-white px-6 py-3 rounded-2xl shadow-2xl border border-white/10 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
              <p className="text-[10px] font-black uppercase tracking-[0.2em]">
                Use a ferramenta de desenho no topo para marcar sua área
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

const mapStyles = [
  { featureType: "all", elementType: "geometry", stylers: [{ color: "#242f3e" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#17263c" }] },
  { featureType: "poi", elementType: "all", stylers: [{ visibility: "off" }] }
];