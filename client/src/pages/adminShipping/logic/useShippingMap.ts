// e:/IA/projects/Site_React/client/src/pages/adminShipping/logic/useShippingMap.ts

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';

// --- INTERFACES ---
export interface LatLng { lat: number; lng: number; }
export interface CircleData { center: LatLng; radius: number; }

interface StoreAddress {
  lat: string | number;
  lng: string | number;
  address?: string;
}

// ✅ Definindo o que esperamos nos dados iniciais para evitar o 'any'
interface InitialShippingData {
  type: 'polygon' | 'circle';
  polygonCoords?: string | LatLng[] | { center: LatLng; radius: number; lat?: number; lng?: number; };
  [key: string]: unknown;
}

export function useShippingMap(
  storeAddress: StoreAddress | null | undefined,
  initialData?: InitialShippingData | string | null // ✅ Tipagem segura
) {
  const [mode, setMode] = useState<'polygon' | 'circle'>('polygon');
  const [polygonCoords, setPolygonCoords] = useState<LatLng[]>([]);
  const [circleData, setCircleData] = useState<CircleData | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const mapRef = useRef<google.maps.Map | null>(null);
  const polygonRef = useRef<google.maps.Polygon | null>(null);
  const circleRef = useRef<google.maps.Circle | null>(null);

  const defaultCenter = useMemo(() => ({
    lat: Number(storeAddress?.lat) || -23.1857,
    lng: Number(storeAddress?.lng) || -46.8978,
  }), [storeAddress?.lat, storeAddress?.lng]);

  const clear = useCallback(() => {
    setPolygonCoords([]);
    setCircleData(null);
  }, []);

  useEffect(() => {
    // Se for 'new' ou nulo, não processa
    if (!initialData || initialData === 'new') return;

    try {
      const data = initialData as InitialShippingData;
      const raw = data.polygonCoords;
      if (!raw) return;
      
      const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;

      if (data.type === 'polygon' && Array.isArray(parsed)) {
        setMode('polygon');
        // ✅ FIX ESLint: Trocado 'any' por 'LatLng' ou cast seguro
        const coords = (parsed as LatLng[]).map((c) => ({ 
          lat: Number(c.lat), 
          lng: Number(c.lng) 
        }));
        setPolygonCoords(coords);
        setCircleData(null);
        if (coords.length > 0) mapRef.current?.panTo(coords[0]);
      } 
      else if (data.type === 'circle') {
        setMode('circle');
        // Normaliza estrutura de centro do círculo
        const center = parsed.center 
          ? { lat: Number(parsed.center.lat), lng: Number(parsed.center.lng) }
          : { lat: Number(parsed.lat), lng: Number(parsed.lng) };
        
        const radius = Number(parsed.radius);
        
        setCircleData({ center, radius });
        setPolygonCoords([]);
        mapRef.current?.panTo(center);
      }
    } catch (e) {
      console.error("Erro ao carregar geometria:", e);
    }
  }, [initialData]);

  const analyzeArea = useCallback(() => {
    return;
  }, []);

  const memoizedActions = useMemo(() => ({
    setMode, 
    setPolygonCoords, 
    setCircleData, 
    setIsEditing, 
    clear, 
    analyzeArea 
  }), [clear, analyzeArea]);

  return {
    state: { 
      mode, 
      polygonCoords, 
      circleData, 
      isEditing, 
      cepsInside: [], 
      zipRange: { start: '', end: '' }, 
      defaultCenter 
    },
    refs: { mapRef, polygonRef, circleRef },
    actions: memoizedActions 
  };
}