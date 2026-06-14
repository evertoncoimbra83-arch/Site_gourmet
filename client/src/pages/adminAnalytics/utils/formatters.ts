// client/src/pages/adminAnalytics/utils/formatters.ts

export function safeNum(val: unknown): number {
  if (typeof val === "number") return val;
  if (val === undefined || val === null) return 0;
  const parsed = parseFloat(String(val).replace(",", "."));
  return Number.isNaN(parsed) ? 0 : parsed;
}

export const formatters = {
  money: (v: unknown): string => {
    const amount = safeNum(v);
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL"
    }).format(amount);
  },

  num: (v: unknown): string => {
    const amount = safeNum(v);
    return new Intl.NumberFormat("pt-BR").format(amount);
  },

  percent: (v: unknown): string => {
    const amount = safeNum(v);
    const formatted = new Intl.NumberFormat("pt-BR", {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1
    }).format(amount);
    return `${formatted}%`;
  },

  avg: (v: unknown, metricKey: string): string => {
    const amount = safeNum(v);
    if (metricKey === "revenue" || metricKey === "ticket" || metricKey === "discounts") {
      return `${formatters.money(amount)}/dia`;
    }
    const unit = metricKey === "orders" ? "pedidos" : metricKey === "customers" ? "clientes" : "un.";
    const formatted = new Intl.NumberFormat("pt-BR", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 1
    }).format(amount);
    return `${formatted} ${unit}/dia`;
  }
};

export const formatCurrency = (n: unknown) => formatters.money(n);
export const formatNumber = (n: unknown) => formatters.num(n);