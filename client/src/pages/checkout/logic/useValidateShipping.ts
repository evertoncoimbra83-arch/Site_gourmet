// client/src/pages/checkout/logic/useValidateShipping.ts
import { useState, useEffect, useMemo } from "react";
import { trpc } from "@/_core/trpc";

// --- INTERFACES ---
export interface AddressShort {
  id: string | number;
  zipCode: string;
}

interface ShippingProps {
  selectedAddressId: string | number | null;
  selectedShippingType: "delivery" | "pickup";
  subtotal: number;
  addresses: AddressShort[];
}

interface ZipValidationResponse {
  isValid: boolean;
  cityAllowed?: boolean;
  shippingCost?: number;
  price?: number; 
  minOrderValue?: number;
  message?: string;
}

function toNumber(value: unknown, fallback = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeZipValidationResponse(value: unknown): ZipValidationResponse {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { isValid: false };
  }

  const record = value as Record<string, unknown>;
  return {
    isValid: record.isValid === true,
    cityAllowed:
      typeof record.cityAllowed === "boolean" ? record.cityAllowed : undefined,
    shippingCost: toNumber(record.shippingCost),
    price: toNumber(record.price),
    minOrderValue: toNumber(record.minOrderValue),
    message: typeof record.message === "string" ? record.message : undefined,
  };
}

export interface ShippingValidationResult {
  isLoading: boolean;
  isZipOutOfArea: boolean;
  isCityDenied: boolean;
  isBelowMin: boolean;
  shippingCost: number;
  minOrderValue: number;
  canContinue: boolean;
}

export function useValidateShipping({
  selectedAddressId,
  selectedShippingType,
  subtotal,
  addresses
}: ShippingProps): ShippingValidationResult {
  const utils = trpc.useUtils();
  const [isLoading, setIsLoading] = useState(false);
  const [isZipOutOfArea, setIsZipOutOfArea] = useState(false);
  const [isCityDenied, setIsCityDenied] = useState(false);
  const [shippingCost, setShippingCost] = useState(0);
  const [zoneMinOrder, setZoneMinOrder] = useState<number>(0);

  // 1. Extração reativa do CEP
  const currentZip = useMemo(() => {
    if (!selectedAddressId || !addresses.length) return null;
    const addr = addresses.find((a) => String(a.id) === String(selectedAddressId));
    return addr ? addr.zipCode.replace(/\D/g, "") : null;
  }, [selectedAddressId, addresses]);

  // 2. Lógica de Valor Mínimo (Calculado localmente baseado no retorno da zona)
  const isBelowMin = useMemo(() => {
    if (selectedShippingType === "pickup") return false;
    return zoneMinOrder > 0 && subtotal < zoneMinOrder;
  }, [subtotal, zoneMinOrder, selectedShippingType]);

  // 3. Validação Logística no Backend
  useEffect(() => {
    let isMounted = true;

    const validate = async () => {
      if (selectedShippingType === "pickup" || !currentZip || currentZip.length !== 8) {
        if (isMounted) {
          setIsZipOutOfArea(false);
          setIsCityDenied(false);
          setShippingCost(0);
          setZoneMinOrder(0);
        }
        return;
      }

      setIsLoading(true);

      try {
        const rawRes = await utils.addresses.validateZipZone.fetch({ 
          zipCode: currentZip,
          storeSlug: "jundiai" 
        });
        const res = normalizeZipValidationResponse(rawRes);
        
        if (!isMounted) return;

        if (res.isValid) {
          setIsZipOutOfArea(false);
          setIsCityDenied(false);
          setShippingCost(toNumber(res.price ?? res.shippingCost));
        } else {
          const denied = res.cityAllowed === false;
          setIsCityDenied(denied);
          setIsZipOutOfArea(!denied);
          setShippingCost(0);
        }

        setZoneMinOrder(toNumber(res.minOrderValue));

      } catch (error) {
        if (isMounted) {
          console.error("[useValidateShipping] Erro na rota de frete:", error);
          setIsZipOutOfArea(true);
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    validate();

    return () => { isMounted = false; };
  }, [currentZip, selectedShippingType, utils]);

  return {
    isLoading, 
    isZipOutOfArea,
    isCityDenied,
    isBelowMin,
    shippingCost: selectedShippingType === "pickup" ? 0 : shippingCost,
    minOrderValue: zoneMinOrder,
    canContinue: selectedShippingType === "pickup" 
      ? true 
      : (
          !!currentZip && 
          currentZip.length === 8 && 
          !isZipOutOfArea && 
          !isCityDenied && 
          !isBelowMin && 
          !isLoading
        ),
  };
}
