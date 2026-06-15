import { AlertTriangle, Loader2, SearchX, ShieldAlert } from "lucide-react";
import { safeNumber } from "@/lib/safe-parse";
import type {
  LoyaltyMetrics,
  PageState,
  PageStateContent,
  Partner,
  SuccessOrder,
  SuccessSettings,
} from "../types";

export function getDisplayOrderId(orderId: string | null) {
  const hasOrderId =
    typeof orderId === "string" &&
    orderId.trim().length > 0 &&
    orderId !== "preview";

  return {
    hasOrderId,
    displayOrderId: hasOrderId ? orderId.slice(-9).toUpperCase() : "SEM-ID",
  };
}

export function parseSuccessSettings(
  storeInfo: Record<string, unknown> | undefined
): SuccessSettings {
  let partnersList: Partner[] = [];

  try {
    const rawPartners = storeInfo?.partners_json;
    partnersList =
      typeof rawPartners === "string"
        ? JSON.parse(rawPartners)
        : (rawPartners as Partner[] | undefined) || [];
  } catch {
    partnersList = [];
  }

  return {
    successMessage:
      (storeInfo?.success_order_message as string) ||
      (storeInfo?.successOrderMessage as string) ||
      "Seu pedido foi recebido! Agora nossa equipe vai preparar tudo com muito carinho.",
    whatsapp:
      (storeInfo?.whatsapp as string) || (storeInfo?.phone as string) || "",
    partners: partnersList,
  };
}

export function formatSuccessMoney(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number.isFinite(value) ? value : 0);
}

export function derivePageState({
  hasOrderId,
  isLoading,
  hasError,
  errorCode,
  hasOrder,
}: {
  hasOrderId: boolean;
  isLoading: boolean;
  hasError: boolean;
  errorCode?: string;
  hasOrder: boolean;
}): PageState {
  if (!hasOrderId) return "missing-order-id";
  if (isLoading) return "loading";

  if (hasError) {
    if (errorCode === "UNAUTHORIZED" || errorCode === "FORBIDDEN") {
      return "access-denied";
    }
    if (errorCode === "NOT_FOUND") {
      return "not-found";
    }
    return "unexpected-error";
  }

  if (!hasOrder) return "unexpected-error";
  return "ready";
}

export function getHeaderTitle(pageState: PageState) {
  return pageState === "ready"
    ? "Confirmado!"
    : pageState === "loading"
      ? "Em Analise"
      : pageState === "access-denied"
        ? "Restrito"
        : pageState === "not-found"
          ? "Nao Encontrado"
          : "Indisponivel";
}

export function getStateContent(
  pageState: PageState,
  onRetry: () => void
): PageStateContent | null {
  switch (pageState) {
    case "missing-order-id":
      return {
        eyebrow: "Identificador ausente",
        title: "Nao foi possivel localizar o pedido",
        description:
          "Este link nao trouxe um codigo de pedido valido. Volte ao inicio ou consulte sua area de pedidos.",
        icon: AlertTriangle,
        primaryLabel: "Voltar ao Menu",
        primaryTo: "/",
        secondaryLabel: "Meus Pedidos",
        secondaryTo: "/perfil/pedidos",
      };
    case "loading":
      return {
        eyebrow: "Carregando pedido",
        title: "Estamos buscando os detalhes do seu pedido",
        description:
          "A confirmacao ja foi recebida. Assim que a consulta terminar, os itens e o status vao aparecer aqui.",
        icon: Loader2,
        primaryLabel: "Voltar ao Menu",
        primaryTo: "/",
        secondaryLabel: "Meus Pedidos",
        secondaryTo: "/perfil/pedidos",
      };
    case "access-denied":
      return {
        eyebrow: "Acesso restrito",
        title: "Este pedido nao esta disponivel nesta sessao",
        description:
          "Para ver este pedido, entre com a conta correta ou abra a pagina a partir da sua area de pedidos.",
        icon: ShieldAlert,
        primaryLabel: "Meus Pedidos",
        primaryTo: "/perfil/pedidos",
        secondaryLabel: "Voltar ao Menu",
        secondaryTo: "/",
      };
    case "not-found":
      return {
        eyebrow: "Pedido nao encontrado",
        title: "Nao encontramos este pedido",
        description:
          "O codigo informado nao retornou nenhum pedido. Confira o link recebido ou consulte seu historico.",
        icon: SearchX,
        primaryLabel: "Meus Pedidos",
        primaryTo: "/perfil/pedidos",
        secondaryLabel: "Voltar ao Menu",
        secondaryTo: "/",
      };
    case "unexpected-error":
      return {
        eyebrow: "Falha na consulta",
        title: "Nao foi possivel carregar esta confirmacao",
        description:
          "Ocorreu um erro inesperado ao buscar o pedido. Tente novamente em instantes ou consulte seu historico.",
        icon: AlertTriangle,
        primaryLabel: "Tentar Novamente",
        primaryAction: onRetry,
        secondaryLabel: "Voltar ao Menu",
        secondaryTo: "/",
      };
    default:
      return null;
  }
}

export function isLoyaltyEnabled(
  order: SuccessOrder | undefined,
  loyaltySettings: { enabled?: unknown } | undefined,
  loyaltyPointsData: unknown
) {
  if (!order || !loyaltySettings || !loyaltyPointsData) return false;
  return (
    loyaltySettings.enabled === true || String(loyaltySettings.enabled) === "1"
  );
}

export function calculateLoyaltyMetrics({
  order,
  loyaltyPointsData,
  loyaltySettings,
}: {
  order: SuccessOrder | undefined;
  loyaltyPointsData:
    | { current_points?: unknown; loyaltyPoints?: unknown }
    | undefined;
  loyaltySettings:
    | {
        redemptionRatePoints?: unknown;
        redemptionRateMoney?: unknown;
      }
    | undefined;
}): LoyaltyMetrics | null {
  if (!loyaltyPointsData || !loyaltySettings) return null;

  const currentPoints = safeNumber(
    loyaltyPointsData.current_points ?? loyaltyPointsData.loyaltyPoints
  );
  const pointsEarned = safeNumber(order?.pointsEarned);
  const redemptionRatePoints = safeNumber(
    loyaltySettings.redemptionRatePoints,
    Number.NaN
  );
  const redemptionRateMoney = safeNumber(
    loyaltySettings.redemptionRateMoney,
    Number.NaN
  );
  const hasValidRewardRule =
    Number.isFinite(redemptionRatePoints) &&
    Number.isFinite(redemptionRateMoney) &&
    redemptionRatePoints > 0 &&
    redemptionRateMoney > 0;

  if (!hasValidRewardRule) {
    return {
      currentPoints,
      pointsEarned,
      hasValidRewardRule: false,
    };
  }

  const currentCashback =
    (currentPoints / redemptionRatePoints) * redemptionRateMoney;
  const progressPoints = currentPoints % redemptionRatePoints;
  const pointsNeeded =
    progressPoints === 0
      ? redemptionRatePoints
      : redemptionRatePoints - progressPoints;
  const percentProgress = Math.min(
    100,
    Math.max(0, (progressPoints / redemptionRatePoints) * 100)
  );

  return {
    currentPoints,
    pointsEarned,
    currentCashback,
    pointsNeeded,
    percentProgress,
    redemptionRateMoney,
    hasValidRewardRule: true,
  };
}

export function buildWhatsappUrl({
  whatsapp,
  displayOrderId,
}: {
  whatsapp: string;
  displayOrderId: string;
}) {
  const phone = whatsapp.replace(/\D/g, "") || "";
  const message = encodeURIComponent(
    `Ola! Fiz um pedido (#${displayOrderId.slice(
      -6
    )}) e gostaria de agendar a entrega.`
  );
  return `https://wa.me/${phone}?text=${message}`;
}
