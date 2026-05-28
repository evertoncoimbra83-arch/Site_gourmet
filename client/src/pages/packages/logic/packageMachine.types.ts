// client/src/pages/packages/logic/packageMachine.types.ts

/**
 * Representa uma opção individual de acompanhamento selecionada
 */
export interface AccompanimentOption extends Record<string, unknown> {
  id: string;
  name: string;
  groupId: string; // Tornado obrigatório para consistência nos Guards
  groupName: string;
  priceModifier: number;
  weight: number;
}

/**
 * Representa um grupo de regras para acompanhamentos
 */
export interface AccompanimentGroupRule {
  id: string;
  name: string;
  min: number;
  max: number;
}

/**
 * Representa uma marmita individual dentro do pacote
 */
export interface PackageItem {
  dishId: string;
  dishName: string;
  requiresAccompaniments: boolean;
  dishRawData?: Record<string, unknown>; 
  // Tornado obrigatório (pode ser []) para facilitar a iteração nos Guards
  accompanimentGroups: AccompanimentGroupRule[]; 
  selectedAccompaniments: AccompanimentOption[];
  nutrition?: Record<string, unknown>;
}

/**
 * Estados possíveis do fluxo de montagem do pacote
 */
export type PackageState = 
  | 'idle' 
  | 'selecting_meals' 
  | 'configuring_items' 
  | 'ready' 
  | 'adding_to_cart';

/**
 * Eventos que disparam transições na Máquina de Estados
 */
export type PackageEvent = 
  | { type: 'START_SELECTION'; payload: { capacity: number } }
  | { type: 'ADD_MEAL'; payload: { item: PackageItem } }
  | { type: 'REMOVE_MEAL'; payload: { index: number } }
  | { type: 'VALIDATE_REQUEST'; payload: { items: PackageItem[] } }
  | { type: 'SUBMIT_CART' }
  | { type: 'RESET'; payload?: { capacity?: number } }; // ✅ Garantido na união para evitar erro 2367

/**
 * Contexto global da máquina de estados
 */
export interface PackageMachineContext {
  currentState: PackageState;
  capacity: number;
  selectedCount: number;
  isBusy: boolean;
}