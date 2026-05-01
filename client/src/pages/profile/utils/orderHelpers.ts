import { Order, OrderItem } from "../types/orderTypes";

export interface OrderDiscounts {
  subtotal: number;
  shippingCost: number;
  couponDiscount: number;
  autoDiscount: number;
  loyaltyDiscount: number;
  paymentDiscount: number;
  totalDiscount: number;
  total: number;
  pointsEarned: number;
  pointsUsed: number;
  couponCode?: string;
  autoDiscountName?: string;
  paymentMethodName?: string;
}

export const statusLabels: Record<string, string> = {
  pending: "Aguardando Pagamento",
  processing: "Em Preparo",
  completed: "Entregue",
  cancelled: "Cancelado",
  shipped: "Em Rota",
  on_hold: "Aguardando",
  failed: "Falha",
};

export const statusStyles: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700 border-amber-100",
  processing: "bg-blue-50 text-blue-700 border-blue-100",
  completed: "bg-emerald-50 text-emerald-700 border-emerald-100",
  cancelled: "bg-slate-50 text-slate-500 border-slate-200",
  shipped: "bg-indigo-50 text-indigo-700 border-indigo-100",
  on_hold: "bg-orange-50 text-orange-700 border-orange-100",
  failed: "bg-red-50 text-red-700 border-red-100",
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isMeaningfulText(value: unknown): value is string {
  if (typeof value !== "string") return false;

  const trimmed = value.trim();
  if (!trimmed) return false;
  if (trimmed === "undefined" || trimmed === "null" || trimmed === "[object Object]") {
    return false;
  }
  if (/^[A-Za-z0-9+/=]+:[A-Za-z0-9+/=]+$/.test(trimmed)) return false;

  return true;
}

export function safeJsonParse(value: unknown): Record<string, unknown> {
  if (!value) return {};
  if (isRecord(value)) return value;
  if (typeof value !== "string") return {};

  try {
    const parsed = JSON.parse(value);
    return isRecord(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

export function safeNum(val: unknown): number {
  if (typeof val === "number") return val;
  const parsed = parseFloat(String(val ?? "0").replace(",", "."));
  return Number.isNaN(parsed) ? 0 : parsed;
}

export function formatCurrency(value: number | string | undefined): string {
  const amount = safeNum(value);
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(amount);
}

export function getOrderDiscounts(order: Order): OrderDiscounts {
  const snapshot = safeJsonParse(order.discountsSnapshot);
  const totals = safeJsonParse(snapshot.totals);

  const pointsEarned = safeNum(
    order.pointsEarned ?? order.loyaltyPointsEarned ?? order.loyalty_points_earned ?? snapshot.pointsEarned,
  );
  const pointsUsed = safeNum(
    order.pointsUsed ?? order.loyaltyPointsUsed ?? order.loyalty_points_used ?? snapshot.pointsUsed,
  );

  const subtotal = safeNum(order.subtotal ?? totals.subtotal);
  const shipping = safeNum(order.shippingCost ?? totals.shipping);
  const couponDiscount = safeNum(totals.couponDiscount ?? snapshot.couponDiscount);
  const autoDiscount = safeNum(totals.autoDiscount ?? snapshot.autoDiscount);
  const loyaltyDiscount = safeNum(
    order.loyaltyDiscount ?? order.loyalty_discount ?? totals.loyaltyDiscount,
  );
  const paymentDiscount = safeNum(snapshot.paymentDiscount);
  const total = safeNum(order.total ?? snapshot.finalNetCalculated ?? totals.total);

  const calculatedTotalDiscount =
    couponDiscount + autoDiscount + loyaltyDiscount + paymentDiscount;

  return {
    subtotal,
    shippingCost: shipping,
    couponDiscount,
    autoDiscount,
    loyaltyDiscount,
    paymentDiscount,
    totalDiscount:
      safeNum(totals.totalDiscounts) > 0
        ? safeNum(totals.totalDiscounts)
        : calculatedTotalDiscount,
    total,
    pointsEarned,
    pointsUsed,
    couponCode: isMeaningfulText(snapshot.couponCode) ? snapshot.couponCode : "",
    autoDiscountName: isMeaningfulText(snapshot.autoDiscountName)
      ? snapshot.autoDiscountName
      : "",
    paymentMethodName: isMeaningfulText(snapshot.paymentMethodName)
      ? snapshot.paymentMethodName
      : "",
  };
}

export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return "--/--/----";
  const parsed = new Date(date);
  return parsed.toLocaleDateString("pt-BR");
}

export function formatAddress(order: Order): string {
  const snapshot = safeJsonParse(order.discountsSnapshot);

  const street = isMeaningfulText(snapshot.shippingStreet) ? snapshot.shippingStreet : "";
  const number = isMeaningfulText(snapshot.shippingNumber) ? snapshot.shippingNumber : "";
  const complement = isMeaningfulText(snapshot.shippingComplement)
    ? snapshot.shippingComplement
    : "";
  const neighborhood = isMeaningfulText(snapshot.shippingNeighborhood)
    ? snapshot.shippingNeighborhood
    : "";

  if (street) {
    return [number ? `${street}, ${number}` : street, complement, neighborhood]
      .filter(Boolean)
      .join(" - ");
  }

  if (isMeaningfulText(order.shippingAddress)) {
    return order.shippingAddress;
  }

  if (isRecord(order.shippingAddress)) {
    const streetFromObject = isMeaningfulText(order.shippingAddress.street)
      ? order.shippingAddress.street
      : isMeaningfulText(order.shippingAddress.address)
        ? order.shippingAddress.address
        : isMeaningfulText(order.shippingAddress.logradouro)
          ? order.shippingAddress.logradouro
          : "";
    const numberFromObject = isMeaningfulText(order.shippingAddress.number)
      ? order.shippingAddress.number
      : isMeaningfulText(order.shippingAddress.numero)
        ? order.shippingAddress.numero
        : "";
    const complementFromObject = isMeaningfulText(order.shippingAddress.complement)
      ? order.shippingAddress.complement
      : isMeaningfulText(order.shippingAddress.complemento)
        ? order.shippingAddress.complemento
        : "";
    const neighborhoodFromObject = isMeaningfulText(order.shippingAddress.neighborhood)
      ? order.shippingAddress.neighborhood
      : isMeaningfulText(order.shippingAddress.bairro)
        ? order.shippingAddress.bairro
        : "";

    if (streetFromObject) {
      return [
        numberFromObject ? `${streetFromObject}, ${numberFromObject}` : streetFromObject,
        complementFromObject,
        neighborhoodFromObject,
      ]
        .filter(Boolean)
        .join(" - ");
    }
  }

  return "Retirada na loja ou endereço não informado";
}

export function getStatusLabel(status: string | undefined): string {
  if (!status) return "Processando";
  return statusLabels[status.toLowerCase()] || status;
}

export function parseOptions(item: OrderItem) {
  const options = safeJsonParse(item.options || item.parsedOptions);
  const nutrition =
    item.nutritionalInfo ??
    item.appliedNutrition ??
    item.applied_nutrition;

  return { options, nutrition };
}
