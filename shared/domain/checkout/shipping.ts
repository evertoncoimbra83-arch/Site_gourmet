// shared/domain/checkout/shipping.ts
import { ShippingValidation, RawShippingResponse } from "./types";

export function processShippingResult(
  res: RawShippingResponse,
  moneyFormatter: (val: number) => string
): ShippingValidation {
  const isValid = !!(res?.isValid || res?.is_valid);
  const isCityAllowed = !!res?.cityAllowed;
  const cost = Number(res?.shippingCost || res?.price || 0);
  const minOrder = res?.minOrderValue || null;

  if (isValid) {
    return {
      isDeliverable: true,
      fee: cost,
      minOrderValue: minOrder,
      type: "success",
      message: cost > 0 
        ? `Entrega disponível! Frete: ${moneyFormatter(cost)}` 
        : "Entrega disponível com Frete Grátis!"
    };
  }

  if (isCityAllowed) {
    return {
      isDeliverable: false,
      fee: 0,
      minOrderValue: null,
      type: "warning",
      cityMatch: true,
      message: "Atendemos sua cidade, mas este endereço está fora do nosso raio de entrega. Deseja retirar no local?"
    };
  }

  return {
    isDeliverable: false,
    fee: 0,
    minOrderValue: null,
    type: "warning",
    cityMatch: false,
    message: "Ainda não chegamos na sua região. Disponível apenas para retirada."
  };
}