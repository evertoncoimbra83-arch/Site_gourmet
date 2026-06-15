import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { trpc } from "@/_core/trpc";
import type { SuccessOrder, SuccessPageViewModel } from "../types";
import {
  calculateLoyaltyMetrics,
  derivePageState,
  formatSuccessMoney,
  getDisplayOrderId,
  getHeaderTitle,
  getStateContent,
  isLoyaltyEnabled,
  parseSuccessSettings,
} from "../utils/successHelpers";

type LoyaltyPointsData = {
  current_points?: unknown;
  loyaltyPoints?: unknown;
};

type LoyaltySettingsData = {
  enabled?: unknown;
  redemptionRatePoints?: unknown;
  redemptionRateMoney?: unknown;
};

export function useSuccessPage(): SuccessPageViewModel {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get("orderId");
  const token = searchParams.get("token");
  const { hasOrderId, displayOrderId } = getDisplayOrderId(orderId);

  const { data: storeInfo } = trpc.public.getStoreSettings.useQuery();

  const orderQuery = trpc.orders.getById.useQuery(
    {
      id: orderId || "",
      token: token || undefined
    },
    {
      enabled: hasOrderId,
      retry: false,
      refetchOnWindowFocus: false,
    }
  );

  const order = orderQuery.data as SuccessOrder | undefined;
  const orderErrorCode = orderQuery.error?.data?.code;

  const { data: loyaltyPointsData } = trpc.loyalty.getPoints.useQuery(
    undefined,
    {
      enabled: Boolean(order),
    }
  );

  const { data: loyaltySettings } = trpc.loyalty.getSettings.useQuery();

  const settings = useMemo(
    () =>
      parseSuccessSettings(storeInfo as Record<string, unknown> | undefined),
    [storeInfo]
  );

  const pageState = useMemo(
    () =>
      derivePageState({
        hasOrderId,
        isLoading: orderQuery.isLoading,
        hasError: Boolean(orderQuery.error),
        errorCode: orderErrorCode,
        hasOrder: Boolean(order),
      }),
    [hasOrderId, order, orderErrorCode, orderQuery.error, orderQuery.isLoading]
  );

  const stateContent = useMemo(
    () =>
      getStateContent(pageState, () => {
        void orderQuery.refetch();
      }),
    [orderQuery, pageState]
  );

  const showLoyaltyCard = useMemo(
    () =>
      isLoyaltyEnabled(
        order,
        loyaltySettings as LoyaltySettingsData | undefined,
        loyaltyPointsData
      ),
    [loyaltyPointsData, loyaltySettings, order]
  );

  const loyaltyMetrics = useMemo(
    () =>
      calculateLoyaltyMetrics({
        order,
        loyaltyPointsData: loyaltyPointsData as LoyaltyPointsData | undefined,
        loyaltySettings: loyaltySettings as LoyaltySettingsData | undefined,
      }),
    [loyaltyPointsData, loyaltySettings, order]
  );

  const headerTitle = getHeaderTitle(pageState);
  const showReadyContent = pageState === "ready" && Boolean(order);

  return {
    orderId,
    hasOrderId,
    displayOrderId,
    order,
    pageState,
    stateContent,
    headerTitle,
    showReadyContent,
    settings,
    loyaltyMetrics,
    showLoyaltyCard,
    money: formatSuccessMoney,
  };
}
