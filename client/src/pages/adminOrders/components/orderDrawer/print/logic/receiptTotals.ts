interface ReceiptRecord {
  [key: string]: unknown;
}

export interface DiscountLine {
  key: "coupon" | "loyalty" | "auto" | "payment" | "generic";
  label: string;
  amount: number;
}

export interface ReceiptDiscountSnapshot {
  couponCode?: string | null;
  couponDescription?: string | null;
  autoDiscountName?: string | null;
  paymentMethodName?: string | null;
  loyaltyValue?: number | string | null;
  paymentDiscount?: number | string | null;
  discountAmount?: number | string | null;
  finalNetCalculated?: number | string | null;
  totals?: ReceiptRecord;
  [key: string]: unknown;
}

export interface OrderReceiptTotals {
  subtotal: number;
  shippingCost: number;
  discountTotal: number;
  couponDiscount: number;
  loyaltyDiscount: number;
  autoDiscount: number;
  paymentDiscount: number;
  total: number;
  couponCode: string | null;
  couponDescription: string | null;
  autoDiscountName: string | null;
  paymentMethodName: string | null;
  discountLines: DiscountLine[];
}

function isRecord(value: unknown): value is ReceiptRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isMeaningfulText(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const trimmed = value.trim();
  if (!trimmed) return false;
  if (trimmed === "undefined" || trimmed === "null" || trimmed === "[object Object]") {
    return false;
  }
  return true;
}

function safeRound(value: number): number {
  return Math.round(value * 100) / 100;
}

function parseSnapshotValue(value: unknown): ReceiptDiscountSnapshot | null {
  if (!value) return null;
  if (isRecord(value)) return value as ReceiptDiscountSnapshot;
  if (typeof value !== "string") return null;

  try {
    const parsed = JSON.parse(value);
    return isRecord(parsed) ? (parsed as ReceiptDiscountSnapshot) : null;
  } catch {
    return null;
  }
}

function pickText(...values: unknown[]): string | null {
  for (const value of values) {
    if (isMeaningfulText(value)) return value.trim();
  }
  return null;
}

function pickNumber(...values: unknown[]): number {
  for (const value of values) {
    const parsed = safeMoney(value);
    if (parsed !== null) return parsed;
  }
  return 0;
}

export function safeMoney(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "number" && Number.isFinite(value)) return safeRound(value);

  const normalized = String(value).replace(/[^\d,.-]/g, "").replace(",", ".");
  if (!normalized) return null;

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? safeRound(parsed) : null;
}

export function formatReceiptMoney(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Math.abs(safeRound(value)));
}

function buildDetailedLines(order: ReceiptRecord, snapshot: ReceiptDiscountSnapshot | null): DiscountLine[] {
  const totals = isRecord(snapshot?.totals) ? snapshot.totals : null;
  const couponCode = pickText(order.couponCode, snapshot?.couponCode);
  const couponDescription = pickText(order.couponDescription, snapshot?.couponDescription);
  const autoDiscountName = pickText(order.autoDiscountName, snapshot?.autoDiscountName);
  const paymentMethodName = pickText(
    order.paymentMethodName,
    order.paymentMethod,
    order.payment_method,
    snapshot?.paymentMethodName,
  );

  const lines: DiscountLine[] = [];

  const autoDiscount = pickNumber(totals?.autoDiscount, snapshot?.autoDiscount, order.autoDiscount);
  if (autoDiscount > 0) {
    lines.push({
      key: "auto",
      label: autoDiscountName || "Desconto automatico",
      amount: autoDiscount,
    });
  }

  const couponDiscount = pickNumber(totals?.couponDiscount, snapshot?.couponDiscount, order.couponDiscount);
  if (couponDiscount > 0) {
    lines.push({
      key: "coupon",
      label: couponCode
        ? `Cupom ${couponCode}`
        : couponDescription
          ? `Cupom ${couponDescription}`
          : "Cupom",
      amount: couponDiscount,
    });
  }

  const loyaltyDiscount = pickNumber(
    order.loyaltyDiscount,
    order.loyalty_discount,
    totals?.loyaltyDiscount,
    snapshot?.loyaltyDiscount,
    snapshot?.loyaltyValue,
  );
  if (loyaltyDiscount > 0) {
    lines.push({
      key: "loyalty",
      label: "Fidelidade",
      amount: loyaltyDiscount,
    });
  }

  const paymentDiscount = pickNumber(
    totals?.paymentDiscount,
    snapshot?.paymentDiscount,
    order.paymentDiscount,
  );
  if (paymentDiscount > 0) {
    lines.push({
      key: "payment",
      label: paymentMethodName ? `Desconto ${paymentMethodName}` : "Desconto pagamento",
      amount: paymentDiscount,
    });
  }

  return lines;
}

export function parseDiscountsSnapshot(value: unknown): DiscountLine[] {
  return buildDetailedLines({}, parseSnapshotValue(value));
}

export function getOrderReceiptTotals(order: unknown): OrderReceiptTotals {
  const record = isRecord(order) ? order : {};
  const snapshot = parseSnapshotValue(record.discountsSnapshot);
  const totals = isRecord(snapshot?.totals) ? snapshot.totals : null;

  const subtotal = pickNumber(record.subtotal, totals?.subtotal);
  const shippingCost = pickNumber(record.shippingCost, record.shipping, totals?.shipping);
  const total = pickNumber(record.total, snapshot?.finalNetCalculated, totals?.total);

  const couponCode = pickText(record.couponCode, snapshot?.couponCode);
  const couponDescription = pickText(record.couponDescription, snapshot?.couponDescription);
  const autoDiscountName = pickText(record.autoDiscountName, snapshot?.autoDiscountName);
  const paymentMethodName = pickText(
    record.paymentMethodName,
    record.paymentMethod,
    record.payment_method,
    snapshot?.paymentMethodName,
  );

  const discountLines = buildDetailedLines(record, snapshot);
  const discountLinesTotal = safeRound(
    discountLines.reduce((sum, line) => sum + safeRound(line.amount), 0),
  );

  const explicitDiscountTotal = pickNumber(
    record.discountAmount,
    record.totalDiscount,
    snapshot?.discountAmount,
    totals?.totalDiscounts,
  );

  const totalBasedDiscount =
    subtotal > 0 || shippingCost > 0 || total > 0
      ? safeRound(Math.max(0, subtotal + shippingCost - total))
      : 0;

  let normalizedLines = [...discountLines];
  let discountTotal = discountLinesTotal;

  if (discountTotal <= 0 && explicitDiscountTotal > 0) {
    normalizedLines = [
      {
        key: "generic",
        label: "Desconto",
        amount: explicitDiscountTotal,
      },
    ];
    discountTotal = explicitDiscountTotal;
  }

  const expectedDiscount = totalBasedDiscount > 0 ? totalBasedDiscount : explicitDiscountTotal;
  const missingDifference = safeRound(expectedDiscount - discountTotal);

  if (missingDifference > 0.01) {
    normalizedLines.push({
      key: "generic",
      label: "Outros descontos",
      amount: missingDifference,
    });
    discountTotal = safeRound(discountTotal + missingDifference);
  } else if (expectedDiscount > 0) {
    discountTotal = expectedDiscount;
  }

  const couponDiscount = safeRound(
    normalizedLines
      .filter((line) => line.key === "coupon")
      .reduce((sum, line) => sum + line.amount, 0),
  );
  const loyaltyDiscount = safeRound(
    normalizedLines
      .filter((line) => line.key === "loyalty")
      .reduce((sum, line) => sum + line.amount, 0),
  );
  const autoDiscount = safeRound(
    normalizedLines
      .filter((line) => line.key === "auto")
      .reduce((sum, line) => sum + line.amount, 0),
  );
  const paymentDiscount = safeRound(
    normalizedLines
      .filter((line) => line.key === "payment")
      .reduce((sum, line) => sum + line.amount, 0),
  );

  return {
    subtotal,
    shippingCost,
    discountTotal: safeRound(discountTotal),
    couponDiscount,
    loyaltyDiscount,
    autoDiscount,
    paymentDiscount,
    total,
    couponCode,
    couponDescription,
    autoDiscountName,
    paymentMethodName,
    discountLines: normalizedLines.filter((line) => line.amount > 0),
  };
}
