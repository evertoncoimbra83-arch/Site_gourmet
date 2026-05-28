// client/src/pages/checkout/logic/checkoutMachine.ts
import { CheckoutEvent, CheckoutMachineContext } from "./checkoutMachine.types";

export const initialMachineContext: CheckoutMachineContext = {
  currentState: 'idle',
  history: [],
  isBusy: false
};

export function checkoutMachine(
  state: CheckoutMachineContext, 
  event: CheckoutEvent
): CheckoutMachineContext {

  switch (state.currentState) {
    
    case 'idle':
      if (event.type === 'LOAD_START') return { ...state, currentState: 'loading', isBusy: true };
      break;

    case 'loading':
      if (event.type === 'AUTH_MISSING') return { ...state, currentState: 'auth_required', isBusy: false };
      if (event.type === 'LOAD_SUCCESS') return { ...state, currentState: 'customer_ready', isBusy: false };
      break;

    case 'customer_ready':
      if (event.type === 'ADDRESS_UPDATED') {
        return { 
          ...state, 
          currentState: 'shipping_validating', 
          history: [...state.history, 'customer_ready'] 
        };
      }
      break;

    case 'address_editing':
      if (event.type === 'ADDRESS_UPDATED') {
        return {
          ...state,
          currentState: 'shipping_validating',
          errorMessage: undefined,
          history: [...state.history, 'address_editing'],
        };
      }
      break;

    case 'shipping_validating':
      if (event.type === 'SHIPPING_VALIDATE_SUCCESS') return { ...state, currentState: 'shipping_ready', isBusy: false };
      if (event.type === 'SHIPPING_VALIDATE_FAILURE') return { ...state, currentState: 'address_editing', errorMessage: event.payload.message, isBusy: false };
      break;

    case 'shipping_ready':
      if (event.type === 'PAYMENT_SELECTED') return { ...state, currentState: 'payment_editing' };
      break;

    case 'payment_editing':
      if (event.type === 'REVIEW_CONFIRMED') return { ...state, currentState: 'review_ready' };
      break;

    case 'review_ready':
      if (event.type === 'SUBMIT_REQUEST') return { ...state, currentState: 'submitting', isBusy: true };
      if (event.type === 'BACK_STEP') return { ...state, currentState: 'payment_editing' };
      break;

    case 'submitting':
      if (event.type === 'SUBMIT_SUCCESS') return { ...state, currentState: 'success', isBusy: false };
      if (event.type === 'SUBMIT_FAILURE') return { ...state, currentState: 'review_ready', errorMessage: event.payload.message, isBusy: false };
      break;
    
    default:
      if (event.type === 'RESET') return initialMachineContext;
      return state;
  }

  return state;
}
