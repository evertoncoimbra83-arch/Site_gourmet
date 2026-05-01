import { useState } from "react";
import { trpc } from "@/_core/trpc";
import { processShippingResult } from "@shared/domain/checkout/shipping";
import { ShippingValidation, RawShippingResponse } from "@shared/domain/checkout/types";

export function useZipValidation(moneyFormatter: (val: number) => string) {
  const utils = trpc.useUtils();
  const [isCalculating, setIsCalculating] = useState(false);
  const [result, setResult] = useState<ShippingValidation | null>(null);

  const validateZip = async (zipCode: string, addressId?: string | number) => {
    const cleanCep = zipCode.replace(/\D/g, "");
    if (cleanCep.length !== 8) return;

    setIsCalculating(true);
    setResult(null);

    try {
      const res = await utils.store.addresses.validateZipZone.fetch({ 
        zipCode: cleanCep,
        addressId: addressId ? String(addressId) : undefined 
      }) as RawShippingResponse;

      // ✅ A lógica agora vem do Domínio
      const validation = processShippingResult(res, moneyFormatter);
      setResult(validation);
      
    } catch {
      setResult({
        isDeliverable: false,
        fee: 0,
        minOrderValue: null,
        type: "error",
        message: "Erro ao validar CEP. Tente novamente."
      });
    } finally {
      setIsCalculating(false);
    }
  };

  return { validateZip, isCalculating, result, clearResult: () => setResult(null) };
}