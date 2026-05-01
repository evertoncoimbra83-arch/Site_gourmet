// e:/IA/projects/Site_React/client/src/pages/adminShipping/logic/useCepsInPolygon.ts

import { polygon, point, booleanPointInPolygon } from '@turf/turf';

// --- INTERFACES ---

interface CepData {
  cep: string;
  lat: number | string;
  lng: number | string;
  bairro?: string;
  cidade?: string;
}

// ✅ Definindo a estrutura esperada para o Polígono (padrão GeoJSON)
interface PolygonGeoJSON {
  coordinates: number[][][]; // Array de anéis (rings), onde cada anel é um array de pontos [lng, lat]
  type?: string;
}

/**
 * 🌍 HOOK DE FILTRO GEOMÉTRICO DINÂMICO
 * Realiza o cálculo de Geofencing no navegador para feedback visual instantâneo.
 */
export const useCepsInPolygon = () => {
  
  /**
   * Filtra quais CEPs de uma lista estão dentro de um desenho (GeoJSON)
   * @param polygonGeoJSON - Coordenadas do polígono vindas do Leaflet/Mapbox/Google
   * @param cityBaseCeps - Lista de CEPs da cidade (carregada da base_ceps via TRPC)
   */
  // ✅ FIX ESLint: Substituído 'any' pela interface PolygonGeoJSON
  const extractCepsFromPolygon = (polygonGeoJSON: PolygonGeoJSON, cityBaseCeps: CepData[]) => {
    
    // 1. Validação de segurança
    if (!cityBaseCeps || cityBaseCeps.length === 0 || !polygonGeoJSON?.coordinates) {
      return { ceps: [], count: 0, prefixSummary: {}, fullData: [] };
    }

    try {
      // 2. Converte a estrutura do mapa para um objeto funcional do Turf
      const targetPolygon = polygon(polygonGeoJSON.coordinates);

      // 3. Filtra os CEPs matematicamente
      const cepsInside = cityBaseCeps.filter((item) => {
        const lat = Number(item.lat);
        const lng = Number(item.lng);
        
        // Ignora registros sem coordenadas válidas
        if (isNaN(lat) || isNaN(lng) || lat === 0 || lng === 0) return false;

        // Cria o ponto (Turf usa padrão [Longitude, Latitude])
        const currentPoint = point([lng, lat]);
        
        return booleanPointInPolygon(currentPoint, targetPolygon);
      });

      // 4. Gera resumo por prefixo (ex: 13200) para estatísticas do Admin
      const prefixGroups: Record<string, number> = {};
      
      cepsInside.forEach((c) => {
        const prefix = c.cep.substring(0, 5);
        prefixGroups[prefix] = (prefixGroups[prefix] || 0) + 1;
      });

      return {
        ceps: cepsInside.map((c) => c.cep),
        count: cepsInside.length,
        prefixSummary: prefixGroups,
        fullData: cepsInside,
      };

    } catch (error) {
      console.error("Erro no processamento geométrico do Turf:", error);
      return { ceps: [], count: 0, prefixSummary: {}, fullData: [] };
    }
  };

  return { extractCepsFromPolygon };
};