// checkoutMachine.js
import { createMachine } from 'xstate';

const checkoutMachine = createMachine({
  id: 'checkout',
  initial: 'idle',
  states: {
    idle: {
      on: {
        START_CHECKOUT: 'processing'
      }
    },
    processing: {
      on: {
        PAYMENT_SUCCESS: 'success',
        PAYMENT_FAILURE: 'failure'
      }
    },
    success: {},
    failure: {}
  }
});

export default checkoutMachine;
