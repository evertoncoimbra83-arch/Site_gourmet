// client/src/pages/checkout/context/CheckoutContext.tsx

import React, { createContext, useContext, useReducer, useEffect, ReactNode, useMemo, useRef, useState } from "react";
import { useCheckoutViewModel } from "../logic/useCheckoutViewModel";
import { CheckoutViewModel } from "../logic/CheckoutViewModel";
import { checkoutMachine, initialMachineContext } from "../logic/checkoutMachine";
import { CheckoutState } from "../logic/checkoutMachine.types";
import * as Guards from "../logic/checkoutGuards";
import { useCheckoutTracking } from "@/_core/hooks/useCheckoutTracking";
import { useCheckoutReadiness, CheckoutReadiness } from "../logic/useCheckoutReadiness";
import { getFirstCheckoutFocusIssue, CheckoutFocusIssue } from "@shared/domain/ux/checkoutFocus";
import { appToast as toast } from "@/lib/app-toast";

// ✅ Contrato unificado: Dados (VM) + Fluxo (Machine)
interface CheckoutContextData extends CheckoutViewModel {
  machineState: CheckoutState;
  isBusy: boolean;
  acceptedTerms: boolean;
  setAcceptedTerms: (accepted: boolean) => void;
  readiness: CheckoutReadiness;
  firstIssue: CheckoutFocusIssue | null;
  handleFinalizeClick: () => void;
}

const CheckoutContext = createContext<CheckoutContextData | undefined>(undefined);

export function CheckoutProvider({ children }: { children: ReactNode }) {
  // 1️⃣ Máquina de Estados (Cérebro do Fluxo)
  const [machine, dispatch] = useReducer(checkoutMachine, initialMachineContext);

  // 2️⃣ ViewModel (Dados e Ações)
  const viewModel = useCheckoutViewModel();

  // Termos Aceitos (Persiste nas transições de endereço/pagamento/frete)
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  // Orquestrador de prontidão do checkout
  const readiness = useCheckoutReadiness({ viewModel, machineState: machine.currentState, acceptedTerms });

  // Detecção de primeiro erro impeditivo
  const firstIssue = useMemo(
    () =>
      getFirstCheckoutFocusIssue({
        hasItems: viewModel.summary.items.length > 0,
        customerName: viewModel.customer.name,
        customerPhone: viewModel.customer.phone,
        customerCpf: viewModel.customer.cpf,
        isCpfValid: viewModel.customer.isCPFValid,
        guestSessionReady: viewModel.session.isReady,
        shippingType: viewModel.logistics.type,
        selectedAddressId: viewModel.logistics.selectedAddressId,
        canDeliver: viewModel.logistics.canDeliver,
        canContinueShipping: viewModel.logistics.canContinue,
        shippingErrorMessage: viewModel.logistics.errorMessage,
        selectedPaymentId: viewModel.payment.selectedId,
        acceptedTerms,
      }),
    [
      viewModel.summary.items.length,
      viewModel.customer.name,
      viewModel.customer.phone,
      viewModel.customer.cpf,
      viewModel.customer.isCPFValid,
      viewModel.session.isReady,
      viewModel.payment.selectedId,
      viewModel.logistics.type,
      viewModel.logistics.selectedAddressId,
      viewModel.logistics.canDeliver,
      viewModel.logistics.canContinue,
      viewModel.logistics.errorMessage,
      acceptedTerms,
    ],
  );

  // Foca e rola até o campo com erro
  const requestFocus = (issue: CheckoutFocusIssue) => {
    window.dispatchEvent(
      new CustomEvent("checkout-focus-error", {
        detail: { field: issue.field, section: issue.section },
      }),
    );
    window.setTimeout(() => {
      const target = document.querySelector<HTMLElement>(
        `[data-checkout-field="${issue.field}"]`,
      );
      target?.scrollIntoView({ behavior: "smooth", block: "center" });
      target
        ?.querySelector<HTMLElement>("button,input,[tabindex]")
        ?.focus({ preventScroll: true });
    }, 100);
  };

  // Handler de finalização compartilhado (sem duplicação de lógica de submit)
  const handleFinalizeClick = () => {
    const isProcessing = machine.currentState === 'submitting' || viewModel.isSubmitting;
    if (isProcessing || viewModel.isLoading) return;

    if (firstIssue) {
      toast.warning(firstIssue.message);
      requestFocus(firstIssue);
      return;
    }

    viewModel.actions.placeOrder();
  };

  const trackedShippingKeysRef = useRef(new Set<string>());
  const trackedPaymentIdsRef = useRef(new Set<string>());
  const lastValidatedRef = useRef<string | null>(null);
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

    // Resoluções de CEP para a chave de validação
    const currentValidationKey = [
      viewModel.logistics.type,
      viewModel.logistics.selectedAddressId || "manual",
      viewModel.logistics.zipCode || "",
      viewModel.summary.subtotal
    ].join("|");

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

    // Reset de lastValidatedRef se a máquina for resetada ou recarregada
    if (currentState === 'idle' || currentState === 'loading') {
      lastValidatedRef.current = null;
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

        // Evita re-disparar se os parâmetros de validação não mudaram
        const isSameConfig = lastValidatedRef.current === currentValidationKey;

        if (currentState === 'customer_ready' || !isSameConfig) {
          dispatch({
            type: 'ADDRESS_UPDATED',
            payload: { addressId: viewModel.logistics.selectedAddressId }
          });
          return;
        }
      }
    }

    if (currentState === 'shipping_validating') {
      // Grava a chave da configuração que está sendo validada
      lastValidatedRef.current = currentValidationKey;

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
    viewModel.session.isReady,
    viewModel.logistics.selectedAddressId,
    viewModel.logistics.addresses,
    viewModel.logistics.canContinue,
    viewModel.logistics.shippingCost,
    viewModel.logistics.type,        // ✅ FIX B2: escuta mudança pickup ↔ delivery
    viewModel.logistics.errorMessage, // ✅ garante que erro de frete dispara efeito
    viewModel.logistics.zipCode,      // ✅ escuta alteração do CEP reativo
    viewModel.payment.selectedId,
    viewModel.summary.subtotal,       // ✅ monitora subtotal do carrinho
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
    isSubmitting: machine.currentState === 'submitting' || viewModel.isSubmitting,
    acceptedTerms,
    setAcceptedTerms,
    readiness,
    firstIssue,
    handleFinalizeClick,
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
