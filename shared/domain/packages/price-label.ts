export function formatPackageOptionPriceLabel(priceModifier?: number | string | null) {
  const value = Number(priceModifier ?? 0);
  if (!Number.isFinite(value) || value <= 0) return "incluso";

  return `+R$ ${value.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}
