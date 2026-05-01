// client/src/pages/checkout/logic/checkout-helpers.ts

import { 
  calculateItemUnitPrice,
  calculateDiscountValue,
  calculateGrandTotal 
} from "../../../../../shared/domain/math/pricing";

/* --------------------------------- TYPES ---------------------------------- */

interface CartItemOption {
  name: string;
  weight?: number;
  price?: number | string;
}

interface CartItemMeal {
  dishName: string;
  selectedAccompaniments?: CartItemOption[];
}

interface PricingSizeUI {
  name?: string;
  priceDiff?: number | string;
}

interface ParsedOptions {
  _type?: string;
  selectedSizeName?: string;
  size?: PricingSizeUI; // Estrutura para o motor de pricing
  meals?: CartItemMeal[];
  selectedAccs?: CartItemOption[];
  selectedAccompaniments?: CartItemOption[];
}

interface RawCartItem {
  id: string | number;
  name: string;
  quantity: number;
  price: number;
  itemType?: string;
  sizeName?: string;
  options?: string | ParsedOptions;
}

interface PaymentMethodBase {
  id: string | number;
  name: string;
  type?: string;
  icon?: string;
  discountPercentage?: number | string | null;
  discount_percentage?: number | string | null;
}

/* ----------------------------- CONSTANTES --------------------------------- */

const BENEFIT_KEYWORDS = [
  'vr', 'alelo', 'verocard', 'sodexo', 'ticket', 
  'ben', 'vale', 'refeição', 'alimentação', 'pluxee', 'msbeneficios'
];

function toNumber(value: unknown, fallback = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function parseOptions(value: RawCartItem["options"]): ParsedOptions {
  if (!value) return {};
  if (typeof value !== "string") return value;

  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as ParsedOptions)
      : {};
  } catch {
    return {};
  }
}

/* ----------------------------- FORMATAÇÃO / UI ---------------------------- */

/**
 * 💰 Formata valores para a moeda brasileira
 */
export function formatMoney(value: number | string): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(toNumber(value));
}

/* -------------------------- PROCESSAMENTO DE ITENS -------------------------- */

/**
 * 🍱 Transforma os itens brutos do carrinho em dados amigáveis para a View.
 * ✅ Agora utiliza o motor central de pricing para evitar produtos zerados.
 */
export function processCartItems(items: RawCartItem[], money: (v: number) => string) {
  if (!items || !Array.isArray(items)) return [];

  return items.map((item) => {
    const options = parseOptions(item.options);
    
    // ✅ Calcula o preço unitário real usando o domínio (Base + Tamanho + Extras)
    const unitPrice = calculateItemUnitPrice(item.price, {
      size: options.size,
      accompaniments: options.selectedAccs || options.selectedAccompaniments || []
    });

    const isPackage = item.itemType === "package" || options._type === "package";

    return {
      id: item.id,
      name: item.name,
      quantity: item.quantity,
      priceFormatted: money(unitPrice * item.quantity),
      displaySize: options.selectedSizeName || item.sizeName || null,
      isPackage,
      packageMeals: isPackage ? (options.meals || []).map((m: CartItemMeal) => ({
        dishName: m.dishName,
        accompaniments: (m.selectedAccompaniments || [])
          .sort((a, b) => (b.weight || 0) - (a.weight || 0))
          .map((acc) => acc.name)
      })) : [],
      accompaniments: !isPackage ? (options.selectedAccs || options.selectedAccompaniments || [])
        .sort((a, b) => (b.weight || 0) - (a.weight || 0))
        .map((acc) => acc.name) : []
    };
  });
}

/* -------------------------- ADAPTADORES DE DOMÍNIO -------------------------- */

/**
 * 🧮 CÁLCULO DE DESCONTO DE PAGAMENTO
 */
export function computePaymentDiscount(
  paymentMethods: PaymentMethodBase[],
  selectedPaymentId: string | number | null,
  subtotal: number
) {
  const method = paymentMethods.find(
    (m) => String(m.id) === String(selectedPaymentId)
  );
  
  const perc = toNumber(method?.discountPercentage ?? method?.discount_percentage);
  
  // ✅ Usa o motor de pricing centralizado
  return calculateDiscountValue(subtotal, { type: 'percentage', value: perc });
}

/**
 * 🧮 CÁLCULO DO TOTAL FINAL
 */
export function computeFinalTotal(opts: {
  subtotal: number;
  shippingCost: number;
  discountTotal: number;
}) {
  // ✅ Usa o motor de pricing centralizado
  return calculateGrandTotal(opts.subtotal, opts.shippingCost, opts.discountTotal);
}

/* --------------------------- REGRAS DE INTERFACE (UX) ----------------------- */

/**
 * 💳 Categoriza métodos entre Padrão (PIX/Cartão) e Benefícios (VR/VA)
 */
export function categorizePaymentMethods(methods: PaymentMethodBase[]) {
  const standard: PaymentMethodBase[] = [];
  const benefits: PaymentMethodBase[] = [];

  methods.forEach((m) => {
    const name = (m.name || "").toLowerCase();
    const isBenefit = BENEFIT_KEYWORDS.some(k => name.includes(k)) || m.type === 'meal' || m.icon === 'meal';
    
    if (isBenefit) benefits.push(m);
    else standard.push(m);
  });

  return { standard, benefits };
}

/**
 * 🚚 STATUS DE ENTREGA (BLOQUEIOS)
 */
export function computeDeliveryStatus(params: {
  subtotal: number;
  minOrderAmount: number;
  isZipValid: boolean | null;
  selectedShippingType: "delivery" | "pickup";
}) {
  const { subtotal, minOrderAmount, isZipValid, selectedShippingType } = params;

  if (selectedShippingType !== "delivery") {
    return { isDeliveryBlocked: false, isBelowMin: false, isZipOutOfArea: false };
  }

  const isZipOutOfArea = isZipValid === false;
  const isBelowMin = isZipValid === true && subtotal > 0 && subtotal < minOrderAmount;
  const isDeliveryBlocked = isZipOutOfArea || isBelowMin || isZipValid === null;

  return { isDeliveryBlocked, isBelowMin, isZipOutOfArea };
}
