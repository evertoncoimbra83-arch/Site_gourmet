// client/src/pages/checkout/logic/checkoutMachine.types.ts

/**
 * 🚩 Estados Oficiais do Fluxo
 * Cada estado representa uma "parada" obrigatória ou processamento.
 */
export type CheckoutState = 
  | 'idle'                // Início de tudo
  | 'loading'             // Buscando configurações/dados iniciais
  | 'auth_required'       // Bloqueio de login
  | 'customer_ready'      // Dados básicos (Nome/CPF/Tel) preenchidos
  | 'address_editing'     // Usuário escolhendo/cadastrando endereço
  | 'shipping_validating' // Chamada de API para validar área/valor
  | 'shipping_ready'      // Frete OK (entrega ou retirada)
  | 'payment_editing'     // Escolhendo forma de pagamento
  | 'review_ready'        // Tudo certo, aguardando clique final
  | 'submitting'          // Enviando para o servidor
  | 'success'             // Pedido criado
  | 'error';              // Algo deu errado no envio (transacional)

/**
 * ⚡ Eventos que provocam transição
 */
export type CheckoutEvent = 
  | { type: 'LOAD_START' }
  | { type: 'LOAD_SUCCESS' }
  | { type: 'AUTH_MISSING' }
  | { type: 'CUSTOMER_CONFIRMED' }
  | { type: 'ADDRESS_UPDATED'; payload: { addressId: string | null } }
  | { type: 'SHIPPING_VALIDATE_REQUEST' }
  | { type: 'SHIPPING_VALIDATE_SUCCESS'; payload: { cost: number } }
  | { type: 'SHIPPING_VALIDATE_FAILURE'; payload: { message: string } }
  | { type: 'PAYMENT_SELECTED'; payload: { methodId: string } }
  | { type: 'REVIEW_CONFIRMED' }
  | { type: 'SUBMIT_REQUEST' }
  | { type: 'SUBMIT_SUCCESS'; payload: { orderId: string } }
  | { type: 'SUBMIT_FAILURE'; payload: { message: string } }
  | { type: 'BACK_STEP' }
  | { type: 'RESET' };

/**
 * 🧠 Contexto mínimo para controle de fluxo
 */
export interface CheckoutMachineContext {
  currentState: CheckoutState;
  history: CheckoutState[]; // Para o BACK_STEP funcionar com memória
  errorMessage?: string;
  isBusy: boolean;
}