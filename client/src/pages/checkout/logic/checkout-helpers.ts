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
  size?: PricingSizeUI;
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
 */
export function processCartItems(items: RawCartItem[], money: (v: number) => string) {
  if (!items || !Array.isArray(items)) return [];

  return items.map((item) => {
    const options = parseOptions(item.options);

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
  // ✅ FIX 1: guard contra null/undefined — tRPC pode retornar dados inesperados
  if (!Array.isArray(paymentMethods)) return 0;

  const method = paymentMethods.find(
    (m) => String(m.id) === String(selectedPaymentId)
  );

  const perc = toNumber(method?.discountPercentage ?? method?.discount_percentage);

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
  return calculateGrandTotal(opts.subtotal, opts.shippingCost, opts.discountTotal);
}

/* --------------------------- REGRAS DE INTERFACE (UX) ----------------------- */

/**
 * 💳 Categoriza métodos entre Padrão (PIX/Cartão) e Benefícios (VR/VA)
 */
export function categorizePaymentMethods(methods: PaymentMethodBase[]) {
  // ✅ FIX 2: guard contra null/undefined — evita crash se API retornar vazio
  if (!Array.isArray(methods)) return { standard: [], benefits: [] };

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

/**
 * Mapeia erros do tRPC (sejam Zod ou manuais do backend) para campos específicos do checkout.
 */
export function mapValidationError(err: any): {
  errors: { name?: string; cpf?: string; phone?: string };
  isValidationError: boolean;
  focusField?: "customerName" | "customerPhone" | "customerCpf";
} {
  const errors: { name?: string; cpf?: string; phone?: string } = {};
  let isValidationError = false;
  let focusField: "customerName" | "customerPhone" | "customerCpf" | undefined;

  const msg = err?.message || "";
  // tRPC parseia erros de validação do Zod nesta estrutura
  const zodErrors = err?.data?.zodError?.fieldErrors;

  if (zodErrors && typeof zodErrors === "object") {
    const nameErr = zodErrors.customerName?.[0] || zodErrors.name?.[0];
    const phoneErr = zodErrors.customerPhone?.[0] || zodErrors.phone?.[0];
    const cpfErr = zodErrors.customerDocument?.[0] || zodErrors.customerCpf?.[0] || zodErrors.cpf?.[0];

    if (nameErr) {
      errors.name = nameErr;
      isValidationError = true;
      focusField = "customerName";
    }
    if (phoneErr) {
      errors.phone = phoneErr;
      isValidationError = true;
      if (!focusField) focusField = "customerPhone";
    }
    if (cpfErr) {
      errors.cpf = cpfErr;
      isValidationError = true;
      if (!focusField) focusField = "customerCpf";
    }
  }

  // Fallback por mensagem se não foi mapeado pelo Zod
  if (!isValidationError && msg) {
    if (msg.includes("telefone informado é inválido") || msg.includes("Telefone inválido")) {
      errors.phone = "O telefone informado é inválido.";
      isValidationError = true;
      focusField = "customerPhone";
    } else if (msg.includes("CPF informado é inválido") || msg.includes("CPF inválido")) {
      errors.cpf = "O CPF informado é inválido.";
      isValidationError = true;
      focusField = "customerCpf";
    } else if (msg.includes("nome do cliente é obrigatório") || msg.includes("Nome é obrigatório")) {
      errors.name = "O nome do cliente é obrigatório.";
      isValidationError = true;
      focusField = "customerName";
    }
  }

  return { errors, isValidationError, focusField };
}