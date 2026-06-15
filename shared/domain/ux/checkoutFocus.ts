import { isValidCpf, normalizeCpf } from "../checkout/cpf";

export type CheckoutFocusField =
  | "items"
  | "customerName"
  | "customerPhone"
  | "customerCpf"
  | "address"
  | "cep"
  | "payment"
  | "terms";

export interface CheckoutFocusIssue {
  field: CheckoutFocusField;
  section: "cart" | "customer" | "shipping" | "payment" | "summary";
  message: string;
}

export interface CheckoutFocusInput {
  hasItems: boolean;
  customerName?: string | null;
  customerPhone?: string | null;
  customerCpf?: string | null;
  isCpfValid: boolean;
  guestSessionReady?: boolean;
  shippingType?: "delivery" | "pickup" | string | null;
  selectedAddressId?: string | number | null;
  canDeliver?: boolean;
  canContinueShipping?: boolean;
  shippingErrorMessage?: string | null;
  selectedPaymentId?: string | number | null;
  acceptedTerms: boolean;
}

const onlyDigits = (value?: string | null) => (value ?? "").replace(/\D/g, "");

export function getFirstCheckoutFocusIssue(
  input: CheckoutFocusInput,
): CheckoutFocusIssue | null {
  if (!input.hasItems) {
    return {
      field: "items",
      section: "cart",
      message: "Seu carrinho esta vazio.",
    };
  }

  if (!input.customerName?.trim()) {
    return {
      field: "customerName",
      section: "customer",
      message: "Informe seu nome para continuar.",
    };
  }

  if (onlyDigits(input.customerPhone).length < 10) {
    return {
      field: "customerPhone",
      section: "customer",
      message: "Informe um telefone valido.",
    };
  }

  const normalizedCpf = normalizeCpf(input.customerCpf);
  if (normalizedCpf.length !== 11 || !isValidCpf(normalizedCpf)) {
    return {
      field: "customerCpf",
      section: "customer",
      message: "Informe um CPF valido.",
    };
  }

  if (!input.guestSessionReady) {
    return {
      field: "customerName",
      section: "customer",
      message: "Finalize sua identificacao como visitante para continuar.",
    };
  }

  if (input.shippingType === "delivery") {
    if (!input.selectedAddressId) {
      return {
        field: "address",
        section: "shipping",
        message: "Selecione ou cadastre um endereco de entrega.",
      };
    }

    if (input.canDeliver === false || input.canContinueShipping === false) {
      const isCepError = /cep/i.test(input.shippingErrorMessage ?? "");
      return {
        field: isCepError ? "cep" : "address",
        section: "shipping",
        message:
          input.shippingErrorMessage ||
          "Revise o endereco de entrega para continuar.",
      };
    }
  }

  if (!input.selectedPaymentId) {
    return {
      field: "payment",
      section: "payment",
      message: "Escolha uma forma de pagamento.",
    };
  }

  if (!input.acceptedTerms) {
    return {
      field: "terms",
      section: "summary",
      message: "Aceite os termos para finalizar o pedido.",
    };
  }

  return null;
}

export function getCheckoutFocusSelector(field: CheckoutFocusField) {
  return `[data-checkout-field="${field}"]`;
}
