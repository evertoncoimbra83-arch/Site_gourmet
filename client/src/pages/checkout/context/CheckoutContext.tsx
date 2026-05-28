// client/src/pages/checkout/context/CheckoutContext.tsx

import React, { createContext, useContext, useReducer, useEffect, ReactNode, useMemo, useRef } from "react";
import { useCheckoutViewModel } from "../logic/useCheckoutViewModel";
import { CheckoutViewModel } from "../logic/CheckoutViewModel";
import { checkoutMachine, initialMachineContext } from "../logic/checkoutMachine";
import { CheckoutState } from "../logic/checkoutMachine.types";
import * as Guards from "../logic/checkoutGuards";
import { useCheckoutTracking } from "@/_core/hooks/useCheckoutTracking";

// ✅ Contrato unificado: Dados (VM) + Fluxo (Machine)
interface CheckoutContextData extends CheckoutViewModel {
  machineState: CheckoutState;
  isBusy: boolean;
}

const CheckoutContext = createContext<CheckoutContextData | undefined>(undefined);

export function CheckoutProvider({ children }: { children: ReactNode }) {
  // 1️⃣ Máquina de Estados (Cérebro do Fluxo)
  const [machine, dispatch] = useReducer(checkoutMachine, initialMachineContext);
  
  // 2️⃣ ViewModel (Dados e Ações)
  const viewModel = useCheckoutViewModel();
  const trackedShippingKeysRef = useRef(new Set<string>());
  const trackedPaymentIdsRef = useRef(new Set<string>());
  const trackingCart = useMemo(
    () =>
      viewModel.summary.items.length > 0
        ? {
            items: viewModel.summary.items.map((item) => ({
              id: item.id,
              name: item.name,
              displayPrice: item.displayPrice,
              quantity: item.quantity,
              packageId: item.isPackage ? item.id : undefined,
            })),
            subtotal: viewModel.summary.subtotal,
          }
        : null,
    [viewModel.summary.items, viewModel.summary.subtotal],
  );
  const { trackShippingSelected, trackPaymentSelected } = useCheckoutTracking(
    viewModel.isLoading ? null : trackingCart,
  );

  /**
   * 3️⃣ ORQUESTRADOR DE FLUXO
   * Sincroniza as mudanças de dados da ViewModel com as transições da Máquina.
   */
  useEffect(() => {
    const { currentState } = machine;
    const customerReady = Guards.isCustomerReady(viewModel);
    const logisticsReady = Guards.isLogisticsReady(viewModel);
    const paymentReady = Guards.isPaymentReady(viewModel);

    // A. Sincronização de Carregamento Inicial
    if (viewModel.isLoading && currentState === 'idle') {
      dispatch({ type: 'LOAD_START' });
      return;
    }

    if (!viewModel.isLoading && currentState === 'loading') {
      dispatch({ type: 'LOAD_SUCCESS' });
      return;
    }

    // ✅ FIX A2: Dados já em cache — isLoading nunca ficou true, máquina presa em idle
    if (!viewModel.isLoading && currentState === 'idle') {
      dispatch({ type: 'LOAD_START' });
      dispatch({ type: 'LOAD_SUCCESS' });
      return;
    }

    // B. Monitoramento de Regressão (Segurança)
    // ✅ FIX B: Só reseta se o cliente ficou inválido APÓS ter chegado em shipping_validating ou além.
    // Evita reset por CPF transitoriamente inválido durante validação assíncrona.
    const statesAfterCustomer: CheckoutState[] = [
      'shipping_validating', 'address_editing', 'shipping_ready',
      'payment_editing', 'review_ready', 'submitting'
    ];
    if (statesAfterCustomer.includes(currentState as CheckoutState)) {
      if (!customerReady) {
        dispatch({ type: 'RESET' });
        return;
      }
    }

    // C. Transições Automáticas de Logística (Endereço/Frete)
    if (currentState === 'customer_ready' || currentState === 'address_editing') {
      if (customerReady && (viewModel.logistics.selectedAddressId || viewModel.logistics.type === 'pickup')) {
        dispatch({
          type: 'ADDRESS_UPDATED',
          payload: { addressId: viewModel.logistics.selectedAddressId }
        });
        return;
      }
    }

    if (currentState === 'shipping_validating') {
      if (logisticsReady) {
        dispatch({
          type: 'SHIPPING_VALIDATE_SUCCESS',
          payload: { cost: viewModel.logistics.shippingCost }
        });
        return;
      } else if (viewModel.logistics.errorMessage) {
        dispatch({
          type: 'SHIPPING_VALIDATE_FAILURE',
          payload: { message: viewModel.logistics.errorMessage }
        });
        return;
      }
      // ✅ FIX C: Se canContinue ficou false sem errorMessage (estado intermediário),
      // não trava — aguarda próximo ciclo. Sem reset aqui.
    }

    // D. Transição Automática para Revisão
    if (currentState === 'shipping_ready' && paymentReady) {
      dispatch({
        type: 'PAYMENT_SELECTED',
        payload: { methodId: viewModel.payment.selectedId! }
      });
      return;
    }

    // ✅ FIX D2: Pagamento selecionado enquanto em payment_editing — avança para review_ready
    // NÃO verifica logisticsReady aqui — a máquina já validou logística ao passar por
    // shipping_validating. Re-verificar pode travar se canContinue piscar false.
    if (currentState === 'payment_editing' && customerReady && paymentReady) {
      dispatch({ type: 'REVIEW_CONFIRMED' });
      return;
    }

  }, [
    viewModel.isLoading,
    viewModel.customer.name,
    viewModel.customer.isCPFValid,
    viewModel.customer.phone,
    viewModel.logistics.selectedAddressId,
    viewModel.logistics.canContinue,
    viewModel.logistics.shippingCost,
    viewModel.logistics.type,        // ✅ FIX B2: escuta mudança pickup ↔ delivery
    viewModel.logistics.errorMessage, // ✅ garante que erro de frete dispara efeito
    viewModel.payment.selectedId,
    machine.currentState,
  ]);

  // 4️⃣ Unificação para consumo da UI
  useEffect(() => {
    if (viewModel.isLoading || !Guards.isLogisticsReady(viewModel)) return;

    const shippingKey = [
      viewModel.logistics.type,
      viewModel.logistics.selectedAddressId || "pickup",
      viewModel.logistics.shippingCost,
    ].join(":");

    if (trackedShippingKeysRef.current.has(shippingKey)) return;
    trackedShippingKeysRef.current.add(shippingKey);
    trackShippingSelected(viewModel.logistics.type, viewModel.logistics.shippingCost);
  }, [
    viewModel.isLoading,
    viewModel.logistics.type,
    viewModel.logistics.selectedAddressId,
    viewModel.logistics.shippingCost,
    viewModel.logistics.canContinue,
    viewModel.logistics.errorMessage,
    trackShippingSelected,
    viewModel,
  ]);

  useEffect(() => {
    const selectedPaymentId = viewModel.payment.selectedId;
    if (viewModel.isLoading || !selectedPaymentId || !Guards.isPaymentReady(viewModel)) return;
    if (trackedPaymentIdsRef.current.has(selectedPaymentId)) return;

    trackedPaymentIdsRef.current.add(selectedPaymentId);
    trackPaymentSelected(selectedPaymentId);
  }, [
    viewModel.isLoading,
    viewModel.payment.selectedId,
    trackPaymentSelected,
    viewModel,
  ]);

  const value: CheckoutContextData = {
    ...viewModel,
    machineState: machine.currentState,
    isBusy: machine.isBusy || viewModel.isSubmitting,
    // Sincroniza indicadores de ocupado
    isLoading: machine.currentState === 'loading' || viewModel.isLoading,
    isSubmitting: machine.currentState === 'submitting' || viewModel.isSubmitting
  };

  return (
    <CheckoutContext.Provider value={value}>
      {children}
    </CheckoutContext.Provider>
  );
}

export const useCheckout = () => {
  const context = useContext(CheckoutContext);
  if (!context) throw new Error("useCheckout deve ser usado dentro de um CheckoutProvider");
  return context;
};