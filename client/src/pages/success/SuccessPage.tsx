import { motion } from "framer-motion";
import { SEO } from "@/components/SEO";
import { LoyaltyCard } from "./components/LoyaltyCard";
import { NextStepsCard } from "./components/NextStepsCard";
import { OrderSummaryCard } from "./components/OrderSummaryCard";
import { PartnersCard } from "./components/PartnersCard";
import { StatePanel } from "./components/StatePanel";
import { SuccessActions } from "./components/SuccessActions";
import { SuccessHeader } from "./components/SuccessHeader";
import { SuccessIntro } from "./components/SuccessIntro";
import { useSuccessPage } from "./hooks/useSuccessPage";

export default function OrderSuccessPage() {
  const {
    displayOrderId,
    order,
    pageState,
    stateContent,
    headerTitle,
    showReadyContent,
    settings,
    loyaltyMetrics,
    showLoyaltyCard,
    money,
  } = useSuccessPage();

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
          <SuccessHeader
            pageState={pageState}
            headerTitle={headerTitle}
            displayOrderId={displayOrderId}
          />

          <div className="p-6 md:p-8 space-y-6">
            {showReadyContent && order ? (
              <>
                <SuccessIntro order={order} displayOrderId={displayOrderId} />
                <NextStepsCard
                  order={order}
                  successMessage={settings.successMessage}
                  money={money}
                />
                {showLoyaltyCard && (
                  <LoyaltyCard loyaltyMetrics={loyaltyMetrics} money={money} />
                )}
                <OrderSummaryCard items={order.items} money={money} />
                <SuccessActions
                  whatsapp={settings.whatsapp}
                  displayOrderId={displayOrderId}
                />
              </>
            ) : (
              stateContent && <StatePanel {...stateContent} />
            )}
          </div>
        </div>

        <PartnersCard partners={settings.partners} />
      </motion.div>
    </div>
  );
}
