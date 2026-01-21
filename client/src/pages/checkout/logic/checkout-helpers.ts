/* ----------------------------- FORMATAÇÃO / ETC ---------------------------- */

export function formatMoney(value: number | string) {
  const amount = typeof value === "string" ? parseFloat(value) : value;
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(amount || 0);
}

/**
 * 🛡️ EXTRAÇÃO DE FINANCEIROS
 * Sincronizado com o novo 'syncCartTotals' do backend.
 */
export function extractFinancials(raw: any) {
  if (!raw) return null;
  
  let json: any = {};
  try {
    // Tenta fazer o parse caso venha como string do MySQL
    json = typeof raw === "string" ? JSON.parse(raw) : raw;
  } catch {
    return null;
  }

  // O servidor agora salva tudo dentro de "details"
  const d = json.details || {};

  return {
    subtotal: Number(d.subtotal || 0),
    shipping: Number(d.shipping || 0),
    autoDiscount: Number(d.autoDiscount || 0),
    couponDiscount: Number(d.couponDiscount || 0),
    loyaltyDiscount: Number(d.loyaltyDiscount || 0),
    // O backend salva como 'final', mas mantemos o fallback para 'total'
    total: Number(d.final || d.total || 0), 
    couponCode: d.couponCode || json.couponCode || "",
    autoName: json.autoDiscountName || "Desconto Progressivo"
  };
}

/* -------------------------- CÁLCULOS DE DESCONTOS -------------------------- */

export function computePaymentDiscount(
  paymentMethods: any[],
  selectedPaymentId: string | number | null,
  subtotal: number
) {
  const method = paymentMethods.find(
    (m: any) => String(m.id) === String(selectedPaymentId)
  );
  if (!method) return 0;
  
  // Garante que o cálculo seja sobre o subtotal limpo (sem frete)
  const perc = Number(method.discountPercentage || method.discount_percentage || 0);
  return subtotal * (perc / 100);
}

/**
 * 🧮 CÁLCULO DO TOTAL FINAL
 */
export function computeFinalTotal(opts: {
  originalFinal: number;     // Valor 'final' vindo do details do banco
  originalShipping: number;  // Frete que estava salvo no banco
  shippingCost: number;      // Frete que o usuário selecionou agora
  paymentDiscountAmount: number; // Desconto de PIX calculado na hora
}) {
  const {
    originalFinal,
    originalShipping,
    shippingCost,
    paymentDiscountAmount,
  } = opts;

  // Calcula a diferença do frete (se o usuário mudou o endereço ou tipo de entrega)
  const deltaShipping = shippingCost - originalShipping;

  // O total final é a base do banco + ajuste de frete - desconto extra de pagamento
  const finalValue = originalFinal + deltaShipping - paymentDiscountAmount;

  return Math.max(0, finalValue);
}

/* --------------------------- REGRAS DE ENTREGA ----------------------------- */

export function computeDeliveryStatus(params: {
  subtotal: number;
  minOrderAmount: number;
  isZipValid: boolean | null;
  selectedShippingType: "delivery" | "pickup";
}) {
  const { subtotal, minOrderAmount, isZipValid, selectedShippingType } = params;

  // Se for retirada, nada bloqueia
  if (selectedShippingType !== "delivery") {
    return { isDeliveryBlocked: false, isBelowMin: false, isZipOutOfArea: false };
  }

  const isZipOutOfArea = isZipValid === false;
  const isBelowMin = isZipValid === true && subtotal > 0 && subtotal < minOrderAmount;
  
  // Bloqueia se o CEP for inválido, se estiver abaixo do mínimo ou se ainda estiver validando (null)
  const isDeliveryBlocked = isZipOutOfArea || isBelowMin || isZipValid === null;

  return { isDeliveryBlocked, isBelowMin, isZipOutOfArea };
}