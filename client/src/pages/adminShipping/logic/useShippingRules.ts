// e:/IA/projects/Site_React/client/src/pages/adminShipping/logic/useShippingRules.ts

import { useState, useMemo } from "react";
import { trpc } from "@/_core/trpc";
import { appToast as toast } from "@/lib/app-toast";
import { safeNumber } from "@/lib/safe-parse";

// --- INTERFACES ---
interface LatLng { lat: number; lng: number; }

interface StoreLocation {
  address: string;
  lat: number;
  lng: number;
}

interface ShippingRulesOptions {
  storeSlug?: string | null;
}

// ✅ FIX ESLint: Trocado 'any' por 'unknown' para tipagem segura no payload
interface SaveRulePayload {
  id?: number;
  name: string;
  price?: number | string;
  shippingCost?: number | string;
  type: "zipcode" | "polygon" | "circle";
  data?: unknown; 
  polygonCoords?: LatLng[] | null;
  storeSlug?: string;
  cepStart?: string;
  cepEnd?: string;
}

export function useShippingRules(options?: ShippingRulesOptions) {
  const utils = trpc.useUtils();
  const currentSlug = options?.storeSlug || "default";

  const [editingRule, setEditingRule] = useState<string | number | "new" | null>(null);
  
  const [newRule, setNewRule] = useState({
    name: "",
    cepStart: "",
    cepEnd: "",
    price: "",
    type: "zipcode" as "zipcode" | "polygon" | "circle",
    polygonCoords: null as LatLng[] | null,
    radius: 0,
    center: null as LatLng | null,
  });

  // ==================== QUERIES ====================
  
  const { data: rules, isLoading: isLoadingRules } = trpc.admin.shippingRules.getRules.useQuery(
    { storeSlug: currentSlug },
    { staleTime: 1000 * 60 }
  );

  const { data: settings, isLoading: isLoadingSettings } = trpc.admin.shippingRules.getSettings.useQuery();
  
  const { data: storeConfig, isLoading: isLoadingStore } = trpc.admin.storeSettings.get.useQuery();

  const storeLocation = useMemo<StoreLocation | null>(() => {
    // ✅ FIX ESLint: Record<string, unknown> evita erro de severidade 8
    const config = storeConfig as Record<string, unknown>;
    const raw = config?.company_social_info;
    
    if (!raw) return null;
    try {
      const parsed = (typeof raw === 'string' ? JSON.parse(raw) : raw) as Record<string, unknown>;
      
      return {
        // ✅ FIX 2345: Conversão explícita para string para satisfazer a interface StoreLocation
        address: String(parsed.address || parsed.rua || "Endereço não definido"),
        lat: Number(parsed.lat || 0),
        lng: Number(parsed.lng || 0)
      };
    } catch { return null; }
  }, [storeConfig]);

  const invalidate = () => {
    utils.admin.shippingRules.getRules.invalidate();
    utils.admin.shippingRules.getSettings.invalidate();
  };

  // ==================== MUTATIONS ====================

  const createRule = trpc.admin.shippingRules.createRule.useMutation({
    onSuccess: () => { 
      toast.success("Logística atualizada!"); 
      setEditingRule(null); 
      setNewRule({
        name: "", cepStart: "", cepEnd: "", price: "",
        type: "zipcode", polygonCoords: null, radius: 0, center: null,
      });
      invalidate(); 
    },
    onError: (err) => toast.error("Erro ao salvar: " + err.message)
  });

  const deleteRuleMutation = trpc.admin.shippingRules.deleteRule.useMutation({
    onSuccess: () => {
      toast.success("Regra removida");
      invalidate();
    },
    onError: (err) => toast.error("Erro ao excluir: " + err.message)
  });

  // ==================== ACTIONS ====================

  const saveRule = async (externalData?: SaveRulePayload) => {
    const isFromMap = !!externalData;
    
    const id = isFromMap ? externalData.id : (typeof editingRule === 'number' ? editingRule : undefined);
    const name = isFromMap ? externalData.name : newRule.name;
    const rawPrice = isFromMap ? (externalData.price ?? externalData.shippingCost) : newRule.price;
    const type = isFromMap ? externalData.type : newRule.type;
    const storeSlug = isFromMap ? (externalData.storeSlug || currentSlug) : currentSlug;

    if (!name) return toast.error("O nome da regra é obrigatório.");

    let geoData = null;
    if (type === 'polygon') {
      geoData = JSON.stringify(isFromMap ? (externalData.data || externalData.polygonCoords) : newRule.polygonCoords);
    } else if (type === 'circle') {
      const circle = isFromMap ? externalData.data : { center: newRule.center, radius: newRule.radius };
      geoData = JSON.stringify(circle);
    }

    const payload = {
      id,
      name: name,
      type: type,
      price: safeNumber(String(rawPrice).replace(',', '.')),
      active: true,
      storeSlug: storeSlug,
      cepStart: type === 'zipcode' ? (isFromMap ? "00000000" : newRule.cepStart) : "00000000",
      cepEnd: type === 'zipcode' ? (isFromMap ? "99999999" : newRule.cepEnd) : "99999999",
      polygonCoords: geoData
    };

    return await createRule.mutateAsync(payload);
  };

  return {
    rules: rules || [],
    settings,
    storeLocation,
    isLoading: isLoadingRules || isLoadingSettings || isLoadingStore,
    state: { newRule, editingRule },
    actions: { 
      setNewRule, 
      setEditingRule, 
      saveRule, 
      deleteRule: (id: number) => deleteRuleMutation.mutate({ id }), 
      updateSettings: trpc.admin.shippingRules.updateSettings.useMutation()
    }
  };
}
