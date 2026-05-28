import React, { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { trpc } from "@/_core/trpc";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowRight,
  CalendarCheck,
  CheckCircle2,
  CreditCard,
  ExternalLink,
  Gift,
  Hash,
  Heart,
  LayoutGrid,
  Loader2,
  MessageCircle,
  SearchX,
  ShieldAlert,
  ShoppingBag,
  User,
  Utensils,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { normalizeImageUrl } from "@shared/utils/assets";
import { safeNumber } from "@/lib/safe-parse";
import { SEO } from "@/components/SEO";

interface Partner {
  name: string;
  link?: string;
  logo_url?: string;
  discount_text?: string;
}

type PageState =
  | "missing-order-id"
  | "loading"
  | "access-denied"
  | "not-found"
  | "unexpected-error"
  | "ready";

type PageStateContent = {
  title: string;
  eyebrow: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  primaryLabel: string;
  primaryTo?: string;
  primaryAction?: () => void;
  secondaryLabel?: string;
  secondaryTo?: string;
};

type LoyaltyMetrics =
  | {
      currentPoints: number;
      pointsEarned: number;
      hasValidRewardRule: false;
    }
  | {
      currentPoints: number;
      pointsEarned: number;
      currentCashback: number;
      pointsNeeded: number;
      percentProgress: number;
      redemptionRateMoney: number;
      hasValidRewardRule: true;
    };

function safeJsonParse(value: unknown): Record<string, any> {
  if (!value) return {};
  if (typeof value === "object" && value !== null && !Array.isArray(value)) {
    return value as Record<string, any>;
  }
  if (typeof value !== "string") return {};
  try {
    const parsed = JSON.parse(value);
    return typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)
      ? parsed
      : {};
  } catch {
    return {};
  }
}

function getItemSizeText(item: any) {
  const options =
    typeof item.options === "string"
      ? safeJsonParse(item.options)
      : item.options || {};
  const parsedOptions =
    typeof item.parsedOptions === "string"
      ? safeJsonParse(item.parsedOptions)
      : item.parsedOptions || {};

  const rawSize =
    options.selectedSizeName ||
    options.sizeName ||
    item.sizeName ||
    item.size_name ||
    (options.size as any)?.name ||
    (options.selectedSize as any)?.name ||
    options._sizeLabel ||
    parsedOptions.selectedSizeName ||
    parsedOptions.sizeName ||
    (parsedOptions.size as any)?.name ||
    (parsedOptions.selectedSize as any)?.name ||
    parsedOptions._sizeLabel ||
    "";

  const size = typeof rawSize === "string" ? rawSize.trim() : "";
  const normalized = size.toUpperCase();
  const isStandard = !size || normalized === "PADRAO" || normalized === "PADRÃO";
  return isStandard ? "" : size;
}

function getSelectedAccs(options: Record<string, any>) {
  if (Array.isArray(options.selectedAccs)) return options.selectedAccs;
  if (Array.isArray(options.selectedAccompaniments)) {
    return options.selectedAccompaniments;
  }
  return [];
}

function getPackageMeals(options: Record<string, any>) {
  if (Array.isArray(options.meals)) return options.meals;
  if (Array.isArray(options.items)) return options.items;
  return [];
}

function SuccessItemImage({ src, alt }: { src?: string | null; alt: string }) {
  const [hasError, setHasError] = useState(false);

  return (
    <div className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-200/60 bg-gradient-to-br from-slate-50 to-slate-100 shadow-xs transition-all duration-300 hover:shadow-sm sm:h-14 sm:w-14">
      {src && !hasError ? (
        <img
          src={src}
          alt={alt}
          onError={() => setHasError(true)}
          className="h-full w-full object-cover animate-in fade-in duration-300"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-emerald-50/50 to-teal-50/30">
          <Utensils className="h-5 w-5 text-emerald-600/60 animate-in fade-in duration-300 sm:h-6 sm:w-6" />
        </div>
      )}
    </div>
  );
}

function StatePanel({
  eyebrow,
  title,
  description,
  icon: Icon,
  primaryLabel,
  primaryTo,
  primaryAction,
  secondaryLabel,
  secondaryTo,
}: PageStateContent) {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-3">
        <div className="flex items-center justify-center gap-2 text-orange-500 font-black uppercase text-[10px] tracking-[0.2em]">
          <Icon className="h-4 w-4" />
          {eyebrow}
        </div>
        <h2 className="text-xl font-black text-slate-900">{title}</h2>
        <p className="mx-auto max-w-md px-4 text-sm font-medium leading-relaxed text-slate-500">
          {description}
        </p>
      </div>

      <div className="space-y-3 pt-2">
        {primaryTo ? (
          <Button
            asChild
            className="w-full h-14 rounded-2xl bg-primary hover:bg-primary-hover text-white font-black uppercase text-[10px] tracking-widest shadow-xl group"
          >
            <Link to={primaryTo}>
              <div className="flex items-center gap-2">
                <span>{primaryLabel}</span>
                <ArrowRight
                  size={16}
                  className="group-hover:translate-x-1 transition-transform ml-auto"
                />
              </div>
            </Link>
          </Button>
        ) : (
          <Button
            onClick={primaryAction}
            className="w-full h-14 rounded-2xl bg-primary hover:bg-primary-hover text-white font-black uppercase text-[10px] tracking-widest shadow-xl"
          >
            {primaryLabel}
          </Button>
        )}

        {secondaryLabel && secondaryTo && (
          <Button
            asChild
            variant="ghost"
            className="w-full h-12 rounded-xl text-slate-500 font-black uppercase text-[9px] tracking-widest hover:bg-slate-100"
          >
            <Link to={secondaryTo}>{secondaryLabel}</Link>
          </Button>
        )}
      </div>
    </div>
  );
}

export default function OrderSuccessPage() {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get("orderId");
  const hasOrderId =
    typeof orderId === "string" &&
    orderId.trim().length > 0 &&
    orderId !== "preview";
  const displayOrderId = hasOrderId
    ? orderId.slice(-9).toUpperCase()
    : "SEM-ID";

  const { data: storeInfo } = trpc.public.getStoreSettings.useQuery();

  const orderQuery = trpc.orders.getById.useQuery(
    { id: orderId || "" },
    {
      enabled: hasOrderId,
      retry: false,
      refetchOnWindowFocus: false,
    },
  );

  const order = orderQuery.data;
  const orderErrorCode = orderQuery.error?.data?.code;

  const { data: loyaltyPointsData } = trpc.loyalty.getPoints.useQuery(undefined, {
    enabled: Boolean(order),
  });

  const { data: loyaltySettings } = trpc.loyalty.getSettings.useQuery();

  const settings = useMemo(() => {
    const s = storeInfo as Record<string, unknown> | undefined;
    let partnersList: Partner[] = [];

    try {
      const rawPartners = s?.partners_json;
      partnersList =
        typeof rawPartners === "string"
          ? JSON.parse(rawPartners)
          : (rawPartners as Partner[] | undefined) || [];
    } catch {
      partnersList = [];
    }

    return {
      successMessage:
        (s?.success_order_message as string) ||
        (s?.successOrderMessage as string) ||
        "Seu pedido foi recebido! Agora nossa equipe vai preparar tudo com muito carinho.",
      whatsapp: (s?.whatsapp as string) || (s?.phone as string) || "",
      partners: partnersList,
    };
  }, [storeInfo]);

  const money = (value: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(Number.isFinite(value) ? value : 0);

  const pageState = useMemo<PageState>(() => {
    if (!hasOrderId) return "missing-order-id";
    if (orderQuery.isLoading) return "loading";

    if (orderQuery.error) {
      if (orderErrorCode === "UNAUTHORIZED" || orderErrorCode === "FORBIDDEN") {
        return "access-denied";
      }
      if (orderErrorCode === "NOT_FOUND") {
        return "not-found";
      }
      return "unexpected-error";
    }

    if (!order) return "unexpected-error";
    return "ready";
  }, [hasOrderId, order, orderErrorCode, orderQuery.error, orderQuery.isLoading]);

  const stateContent = useMemo<PageStateContent | null>(() => {
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
          primaryAction: () => {
            void orderQuery.refetch();
          },
          secondaryLabel: "Voltar ao Menu",
          secondaryTo: "/",
        };
      default:
        return null;
    }
  }, [orderQuery, pageState]);

  const showLoyaltyCard = useMemo(() => {
    if (!order || !loyaltySettings || !loyaltyPointsData) return false;
    return loyaltySettings.enabled === true || String(loyaltySettings.enabled) === "1";
  }, [loyaltyPointsData, loyaltySettings, order]);

  const loyaltyMetrics = useMemo<LoyaltyMetrics | null>(() => {
    if (!loyaltyPointsData || !loyaltySettings) return null;

    const currentPoints = safeNumber(
      loyaltyPointsData.current_points ?? loyaltyPointsData.loyaltyPoints,
    );
    const pointsEarned = safeNumber(order?.pointsEarned);
    const redemptionRatePoints = safeNumber(
      loyaltySettings.redemptionRatePoints,
      Number.NaN,
    );
    const redemptionRateMoney = safeNumber(
      loyaltySettings.redemptionRateMoney,
      Number.NaN,
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
      Math.max(0, (progressPoints / redemptionRatePoints) * 100),
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
  }, [loyaltyPointsData, loyaltySettings, order]);

  const headerTitle =
    pageState === "ready"
      ? "Confirmado!"
      : pageState === "loading"
        ? "Em Analise"
        : pageState === "access-denied"
          ? "Restrito"
          : pageState === "not-found"
            ? "Nao Encontrado"
            : "Indisponivel";

  const showReadyContent = pageState === "ready" && Boolean(order);

  return (
    <div
      data-testid="order-success-container"
      className="min-h-screen bg-[#FBFBFC] flex flex-col items-center justify-center p-4 sm:p-6 py-12"
    >
      <SEO title="Pedido Confirmado" noindex />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-115 space-y-6"
      >
        <div className="bg-white rounded-4xl md:rounded-[3rem] shadow-2xl shadow-slate-200/60 overflow-hidden border border-slate-100">
          <div className="bg-primary p-8 md:p-10 text-center relative overflow-hidden">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="relative z-10 flex flex-col items-center"
            >
              <div className="inline-flex bg-emerald-500 p-3 rounded-2xl mb-4 shadow-xl shadow-emerald-500/30 rotate-3">
                {pageState === "loading" ? (
                  <Loader2 className="text-white w-8 h-8 animate-spin" />
                ) : pageState === "ready" ? (
                  <CheckCircle2 className="text-white w-8 h-8" strokeWidth={3} />
                ) : pageState === "access-denied" ? (
                  <ShieldAlert className="text-white w-8 h-8" strokeWidth={2.4} />
                ) : pageState === "not-found" ? (
                  <SearchX className="text-white w-8 h-8" strokeWidth={2.4} />
                ) : (
                  <AlertTriangle className="text-white w-8 h-8" strokeWidth={2.4} />
                )}
              </div>

              <h1 className="text-white text-2xl font-black uppercase italic tracking-tighter leading-none">
                Pedido <span className="text-emerald-500">{headerTitle}</span>
              </h1>

              <div className="mt-4 bg-white/5 backdrop-blur-md border border-white/10 px-4 py-2 rounded-2xl flex items-center gap-2">
                <Hash size={12} className="text-emerald-500" />
                <span className="text-white font-black text-[10px] tracking-widest uppercase opacity-60">
                  ID:
                </span>
                <span className="text-white font-black text-sm tracking-widest uppercase">
                  {displayOrderId}
                </span>
              </div>
            </motion.div>
          </div>

          <div className="p-6 md:p-8 space-y-6">
            {showReadyContent && order ? (
              <>
                <div className="text-center space-y-2">
                  <div className="flex items-center justify-center gap-2 text-orange-500 font-black uppercase text-[10px] tracking-[0.2em]">
                    <Heart size={12} fill="currentColor" /> Gratidao por escolher a gente
                  </div>
                  <h2 className="text-xl font-black text-slate-900">
                    Ola, {order.customerName?.split(" ")[0] || "Gourmet"}!
                  </h2>
                  <p className="text-slate-500 text-sm font-medium leading-relaxed px-4">
                    Agradecemos seu pedido, #{displayOrderId}. Vamos entrar em
                    contato em breve para confirmar os detalhes da forma de
                    entrega e horario.
                  </p>
                  <p>Enquanto isso, confira nossos parceiros no final da pagina e aproveite!</p>
                </div>

                <div className="bg-slate-50 rounded-[2rem] p-6 border border-slate-100 space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 bg-white rounded-2xl shadow-sm flex items-center justify-center text-emerald-500">
                      <CalendarCheck size={24} />
                    </div>
                    <div className="flex-1 text-left">
                      <span className="text-[8px] font-black uppercase text-slate-400 tracking-widest">
                        Proxima etapa
                      </span>
                      <p className="text-xs font-bold text-slate-700">
                        {settings.successMessage}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-200/60">
                    <div className="text-left">
                      <span className="text-[8px] font-black uppercase text-slate-400 tracking-widest block mb-1">
                        Total a Pagar
                      </span>
                      <span className="text-sm font-black text-slate-900 italic">
                        {money(safeNumber(order.total))}
                      </span>
                    </div>
                    <div className="text-left">
                      <span className="text-[8px] font-black uppercase text-slate-400 tracking-widest block mb-1">
                        Pagamento
                      </span>
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 uppercase italic">
                        <CreditCard size={12} className="text-emerald-500" />
                        {order.paymentMethod || "Confirmado"}
                      </div>
                    </div>
                  </div>
                </div>

                {showLoyaltyCard && loyaltyMetrics && (
                  <div className="bg-gradient-to-br from-emerald-50 to-teal-50/50 rounded-[2rem] p-5 border border-emerald-100/60 shadow-sm relative overflow-hidden text-left space-y-4">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 blur-2xl rounded-full -mr-8 -mt-8 pointer-events-none" />

                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <div className="bg-emerald-500/10 p-1.5 rounded-lg text-emerald-600">
                            <Gift size={16} />
                          </div>
                          <span className="text-[10px] font-black uppercase text-emerald-800 tracking-wider">
                            Fidelidade
                          </span>
                        </div>
                        <h3 className="text-lg font-black text-slate-800 tracking-tight mt-1 leading-none">
                          Saldo:{" "}
                          <span className="text-emerald-600 italic font-black">
                            {loyaltyMetrics.currentPoints}
                          </span>{" "}
                          pts
                        </h3>
                        {loyaltyMetrics.hasValidRewardRule && (
                          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">
                            Equivale a{" "}
                            <span className="text-emerald-700">
                              {money(loyaltyMetrics.currentCashback)}
                            </span>{" "}
                            de cashback
                          </p>
                        )}
                      </div>

                      {loyaltyMetrics.pointsEarned > 0 && (
                        <div className="bg-emerald-500 text-white text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-lg shadow-sm shadow-emerald-500/20 shrink-0">
                          +{loyaltyMetrics.pointsEarned} PTS NESTE PEDIDO
                        </div>
                      )}
                    </div>

                    {loyaltyMetrics.hasValidRewardRule && (
                      <div className="space-y-1.5 pt-1">
                        <div className="flex justify-between items-center text-[9px] font-bold text-slate-400 uppercase tracking-wide">
                          <span>Progresso para proxima recompensa</span>
                          <span className="text-emerald-600 font-black">
                            {Math.round(loyaltyMetrics.percentProgress)}%
                          </span>
                        </div>

                        <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200/20">
                          <div
                            className="bg-gradient-to-r from-emerald-500 to-teal-500 h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${loyaltyMetrics.percentProgress}%`,
                            }}
                          />
                        </div>

                        <p className="text-[9px] font-bold text-slate-500 leading-normal uppercase tracking-tight">
                          Faltam{" "}
                          <span className="text-emerald-600 font-black">
                            {loyaltyMetrics.pointsNeeded} pontos
                          </span>{" "}
                          para ganhar +
                          <span className="text-emerald-600 font-black">
                            {money(loyaltyMetrics.redemptionRateMoney)}
                          </span>{" "}
                          de desconto.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {order.items && order.items.length > 0 && (
                  <div className="bg-slate-50/50 rounded-[2rem] p-5 border border-slate-100 space-y-4">
                    <div className="flex items-center gap-2 text-slate-700 font-black uppercase text-[10px] tracking-wider pb-2 border-b border-slate-200/40">
                      <ShoppingBag size={14} className="text-slate-500" />
                      Resumo dos Itens
                    </div>

                    <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                      {order.items.map((item: any) => {
                        const sizeText = getItemSizeText(item);
                        const options =
                          typeof item.options === "string"
                            ? safeJsonParse(item.options)
                            : item.options || {};
                        const meals = getPackageMeals(options);
                        const selectedAccs = getSelectedAccs(options);
                        const isPackage =
                          options._type === "package_custom" ||
                          meals.length > 0 ||
                          String(item.dishName || item.name || "")
                            .toLowerCase()
                            .includes("pacote");

                        let subDetailsText = "";
                        if (isPackage && meals.length > 0) {
                          subDetailsText = meals
                            .map(
                              (meal: any) =>
                                `${meal.quantity || 1}x ${
                                  meal.dishName || meal.name || "Marmita"
                                }`,
                            )
                            .join(" + ");
                        } else if (selectedAccs.length > 0) {
                          subDetailsText = selectedAccs
                            .map((acc: any) => {
                              const name = acc.name || acc.label || "";
                              const weight = acc.weight ? ` (${acc.weight}g)` : "";
                              return `${name}${weight}`;
                            })
                            .filter(Boolean)
                            .join(", ");
                        }

                        return (
                          <div
                            key={item.id}
                            className="flex items-start gap-3 py-2 border-b border-slate-100 last:border-none"
                          >
                            <SuccessItemImage
                              src={
                                item.imageUrl ? normalizeImageUrl(item.imageUrl) : null
                              }
                              alt={item.dishName || item.name || "Item"}
                            />
                            <div className="flex-1 min-w-0 text-left">
                              <div className="flex items-baseline gap-2">
                                <span className="text-[10px] font-black text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-md shrink-0">
                                  {item.quantity}x
                                </span>
                                <h4 className="text-xs font-black text-slate-800 truncate">
                                  {item.dishName || item.name}
                                </h4>
                              </div>
                              {sizeText && (
                                <span className="inline-block mt-0.5 text-[8px] font-black uppercase text-emerald-600 bg-emerald-50 px-1.5 py-0.2 rounded-sm tracking-wide">
                                  Porcao: {sizeText}
                                </span>
                              )}
                              {subDetailsText && (
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight mt-1 line-clamp-2 leading-snug">
                                  {subDetailsText}
                                </p>
                              )}
                            </div>
                            <div className="text-right shrink-0">
                              <span className="text-xs font-black text-slate-700 italic">
                                {money(safeNumber(item.totalPrice))}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="space-y-3 pt-2">
                  <Button
                    asChild
                    className="w-full h-14 rounded-2xl bg-primary hover:bg-primary-hover text-white font-black uppercase text-[10px] tracking-widest shadow-xl group"
                  >
                    <Link to="/perfil/pedidos">
                      <div className="flex items-center gap-2">
                        <User size={16} />
                        <span>Meus Pedidos</span>
                        <ArrowRight
                          size={16}
                          className="group-hover:translate-x-1 transition-transform ml-auto"
                        />
                      </div>
                    </Link>
                  </Button>

                  <div className="flex gap-2">
                    <Button
                      asChild
                      variant="ghost"
                      className="flex-1 h-12 rounded-xl text-slate-400 font-black uppercase text-[9px] tracking-widest hover:bg-slate-100"
                    >
                      <Link to="/">Voltar ao Menu</Link>
                    </Button>

                    <Button
                      onClick={() => {
                        const phone = settings.whatsapp.replace(/\D/g, "") || "";
                        const message = encodeURIComponent(
                          `Ola! Fiz um pedido (#${displayOrderId.slice(-6)}) e gostaria de agendar a entrega.`,
                        );
                        window.open(`https://wa.me/${phone}?text=${message}`);
                      }}
                      className="flex-[2] h-12 rounded-xl bg-[#25D366] hover:bg-[#128C7E] text-white font-black uppercase text-[9px] tracking-widest shadow-lg border-none"
                    >
                      <MessageCircle size={16} className="mr-2" /> Agendar no WhatsApp
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              stateContent && <StatePanel {...stateContent} />
            )}
          </div>
        </div>

        {settings.partners.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 px-2">
              <div className="h-px flex-1 bg-slate-200" />
              <div className="flex items-center gap-2 text-slate-400">
                <Star size={12} className="text-amber-500 fill-amber-500" />
                <span className="text-[8px] font-black uppercase tracking-[0.2em]">
                  Parceiros Gourmet
                </span>
              </div>
              <div className="h-px flex-1 bg-slate-200" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              {settings.partners.map((partner, idx) => (
                <a
                  key={idx}
                  href={partner.link || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group bg-white p-4 rounded-[2rem] border border-slate-100 shadow-sm hover:border-emerald-200 transition-all flex flex-col items-center text-center gap-2"
                >
                  <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center overflow-hidden group-hover:scale-110 transition-transform">
                    {partner.logo_url ? (
                      <img
                        src={normalizeImageUrl(partner.logo_url) || ""}
                        alt={partner.name}
                        className="w-full h-full object-contain p-1.5"
                      />
                    ) : (
                      <LayoutGrid size={14} className="text-slate-200" />
                    )}
                  </div>
                  <h4 className="text-[9px] font-black text-slate-900 uppercase leading-none truncate w-full">
                    {partner.name}
                  </h4>
                  <span className="text-[7px] font-bold text-emerald-500 uppercase flex items-center gap-1">
                    {partner.discount_text} <ExternalLink size={8} />
                  </span>
                </a>
              ))}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
