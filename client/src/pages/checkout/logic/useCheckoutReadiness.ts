import { useMemo } from "react";
import { CheckoutViewModel } from "./CheckoutViewModel";

export type ReadinessGate =
  | "load"
  | "customer"
  | "visitor"
  | "logistics"
  | "payment"
  | "machine"
  | "terms"
  | "ready";

export interface CheckoutReadiness {
  gate: ReadinessGate;
  isReady: boolean;
  message: string;
  gates: {
    load: boolean;
    customer: boolean;
    visitor: boolean;
    logistics: boolean;
    payment: boolean;
    machine: boolean;
    terms: boolean;
  };
}

interface Options {
  viewModel: CheckoutViewModel;
  machineState: string;
  acceptedTerms: boolean;
}

const GATE_MESSAGES: Record<ReadinessGate, string> = {
  load: "Carregando dados do pedido...",
  customer: "Preencha seus dados (nome, CPF e telefone)",
  visitor: "Finalize sua identificação como visitante para continuar",
  logistics: "Selecione um endereço de entrega ou retirada",
  payment: "Selecione um método de pagamento",
  machine: "Aguardando confirmação do pedido...",
  terms: "Aceite os termos para finalizar",
  ready: "Tudo certo! Clique para finalizar",
};

export function useCheckoutReadiness({
  viewModel,
  machineState,
  acceptedTerms,
}: Options): CheckoutReadiness {
  return useMemo(() => {
    const loadOk = !viewModel.isLoading;

    const { customer } = viewModel;
    const customerOk =
      loadOk &&
      customer.name.trim().length > 3 &&
      customer.isCPFValid &&
      customer.phone.length >= 10;

    const visitorOk = customerOk && viewModel.session.isReady;

    const { logistics } = viewModel;
    const logisticsOk =
      visitorOk &&
      (logistics.type === "pickup"
        ? true
        : !!logistics.selectedAddressId &&
          logistics.canContinue &&
          !logistics.errorMessage);

    const paymentOk = logisticsOk && !!viewModel.payment.selectedId;
    const machineOk = paymentOk && machineState === "review_ready";
    const termsOk = machineOk && acceptedTerms;

    const gate: ReadinessGate = !loadOk
      ? "load"
      : !customerOk
        ? "customer"
        : !visitorOk
          ? "visitor"
          : !logisticsOk
            ? "logistics"
            : !paymentOk
              ? "payment"
              : !machineOk
                ? "machine"
                : !termsOk
                  ? "terms"
                  : "ready";

    return {
      gate,
      isReady: gate === "ready",
      message: GATE_MESSAGES[gate],
      gates: {
        load: loadOk,
        customer: customerOk,
        visitor: visitorOk,
        logistics: logisticsOk,
        payment: paymentOk,
        machine: machineOk,
        terms: termsOk,
      },
    };
  }, [
    viewModel.isLoading,
    viewModel.customer.name,
    viewModel.customer.isCPFValid,
    viewModel.customer.phone,
    viewModel.session.isReady,
    viewModel.logistics.type,
    viewModel.logistics.selectedAddressId,
    viewModel.logistics.canContinue,
    viewModel.logistics.errorMessage,
    viewModel.payment.selectedId,
    machineState,
    acceptedTerms,
  ]);
}
