// client/src/pages/checkout/logic/checkoutGuards.ts
import { CheckoutViewModel } from "./CheckoutViewModel";
import { CheckoutState } from "./checkoutMachine.types";

/**
 * Define se o cliente já preencheu os dados básicos obrigatórios.
 */
export const isCustomerReady = (vm: CheckoutViewModel): boolean => {
  const { customer } = vm;
  return (
    customer.name.trim().length > 3 &&
    customer.isCPFValid &&
    customer.phone.length >= 10 &&
    vm.session.isReady
  );
};

/**
 * Define se a logística está pronta para avançar para o pagamento.
 */
export const isLogisticsReady = (vm: CheckoutViewModel): boolean => {
  const { logistics } = vm;

  // Se for retirada, não precisa de endereço
  if (logistics.type === 'pickup') return true;

  // Se for entrega, precisa de endereço selecionado e sem erros (frete calculado/cobertura OK)
  return !!logistics.selectedAddressId && logistics.canContinue && !logistics.errorMessage;
};

/**
 * Define se o método de pagamento foi selecionado.
 */
export const isPaymentReady = (vm: CheckoutViewModel): boolean => {
  return !!vm.payment.selectedId;
};

/**
 * Guarda central que decide se o fluxo pode mudar de estado baseado na ViewModel.
 */
export const canTransitionTo = (
  targetState: CheckoutState,
  vm: CheckoutViewModel
): boolean => {
  switch (targetState) {
    case 'customer_ready':
      return isCustomerReady(vm);

    case 'shipping_validating':
      // Só tenta validar frete se o cliente estiver pronto e houver um endereço (ou for pickup)
      return isCustomerReady(vm) && (vm.logistics.type === 'pickup' || !!vm.logistics.selectedAddressId);

    case 'shipping_ready':
      return isLogisticsReady(vm);

    case 'payment_editing':
      return isLogisticsReady(vm);

    case 'review_ready':
      return isLogisticsReady(vm) && isPaymentReady(vm);

    case 'submitting':
      return isLogisticsReady(vm) && isPaymentReady(vm) && !vm.isSubmitting;

    default:
      return true;
  }
};
