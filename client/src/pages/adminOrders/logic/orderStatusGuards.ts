export const FINALIZED_ORDER_STATUSES = ["completed", "cancelled", "delivered"] as const;

export const FINALIZED_ORDER_MESSAGE =
  "Pedidos finalizados não podem ser modificados.";

export function isFinalizedOrderStatus(status: string | null | undefined): boolean {
  return FINALIZED_ORDER_STATUSES.includes(
    String(status || "") as (typeof FINALIZED_ORDER_STATUSES)[number],
  );
}
