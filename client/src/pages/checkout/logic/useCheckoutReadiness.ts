// client/src/pages/checkout/logic/useCheckoutReadiness.ts
//
// Orquestrador independente de prontidão do checkout.
// Avalia cada portão sequencialmente e expõe qual está bloqueando.
// NÃO depende da máquina de estados — pode ser debugado isoladamente.

import { useMemo } from "react";
import { CheckoutViewModel } from "./CheckoutViewModel";

export type ReadinessGate =
  | "load"        // 1. Dados ainda carregando
  | "customer"    // 2. Nome, CPF ou telefone inválido
  | "logistics"   // 3. Endereço ou frete não resolvido
  | "payment"     // 4. Método de pagamento não selecionado
  | "machine"     // 5. Máquina de estados ainda não chegou em review_ready
  | "terms"       // 6. Termos não aceitos
  | "ready";      // ✅ Todos os portões passaram

export interface CheckoutReadiness {
  /** Portão atual que está bloqueando. "ready" = pode finalizar. */
  gate: ReadinessGate;

  /** true apenas quando gate === "ready" */
  isReady: boolean;

  /** Mensagem amigável para exibir ao usuário */
  message: string;

  /** Resultado de cada portão individualmente para debug */
  gates: {
    load: boolean;
    customer: boolean;
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
  load:      "Carregando dados do pedido...",
  customer:  "Preencha seus dados (nome, CPF e telefone)",
  logistics: "Selecione um endereço de entrega ou retirada",
  payment:   "Selecione um método de pagamento",
  machine:   "Aguardando confirmação do pedido...",
  terms:     "Aceite os termos para finalizar",
  ready:     "Tudo certo! Clique para finalizar",
};

export function useCheckoutReadiness({
  viewModel,
  machineState,
  acceptedTerms,
}: Options): CheckoutReadiness {
  return useMemo(() => {
    // --- PORTÃO 1: LOAD ---
    const loadOk = !viewModel.isLoading;

    // --- PORTÃO 2: CUSTOMER ---
    const { customer } = viewModel;
    const customerOk =
      loadOk &&
      customer.name.trim().length > 3 &&
      customer.isCPFValid &&
      customer.phone.length >= 10;

    // --- PORTÃO 3: LOGISTICS ---
    const { logistics } = viewModel;
    const logisticsOk =
      customerOk &&
      (logistics.type === "pickup"
        ? true
        : !!logistics.selectedAddressId &&
          logistics.canContinue &&
          !logistics.errorMessage);

    // --- PORTÃO 4: PAYMENT ---
    const paymentOk = logisticsOk && !!viewModel.payment.selectedId;

    // --- PORTÃO 5: MACHINE ---
    const machineOk = paymentOk && machineState === "review_ready";

    // --- PORTÃO 6: TERMS ---
    const termsOk = machineOk && acceptedTerms;

    // Determina o portão atual
    const gate: ReadinessGate = !loadOk
      ? "load"
      : !customerOk
      ? "customer"
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
    viewModel.logistics.type,
    viewModel.logistics.selectedAddressId,
    viewModel.logistics.canContinue,
    viewModel.logistics.errorMessage,
    viewModel.payment.selectedId,
    machineState,
    acceptedTerms,
  ]);
}