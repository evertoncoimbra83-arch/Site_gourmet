// client/src/pages/packages/logic/packageMachine.ts
import { PackageEvent, PackageMachineContext } from "./packageMachine.types";
import * as Guards from "./packageGuards";

export const initialPackageContext: PackageMachineContext = {
  currentState: 'idle',
  capacity: 0,
  selectedCount: 0,
  isBusy: false
};

export function packageMachine(
  state: PackageMachineContext,
  event: PackageEvent
): PackageMachineContext {
  
  if ((event.type as string) === 'RESET') {
    return { ...initialPackageContext, capacity: state.capacity };
  }

  switch (state.currentState) {
    case 'idle':
      if (event.type === 'START_SELECTION') {
        return { ...state, currentState: 'selecting_meals', capacity: event.payload.capacity, selectedCount: 0 };
      }
      break;

    case 'selecting_meals':
      if (event.type === 'ADD_MEAL') {
        if (!Guards.hasSpaceLeft(state)) return state;

        const nextCount = state.selectedCount + 1;
        const isFull = nextCount === state.capacity;
        
        return { 
          ...state, 
          selectedCount: nextCount,
          // Apenas avisa que encheu. O useEffect cuidará da validação milissegundos depois.
          currentState: isFull ? 'configuring_items' : 'selecting_meals'
        };
      }

      if (event.type === 'REMOVE_MEAL') {
        return { ...state, selectedCount: Math.max(0, state.selectedCount - 1), currentState: 'selecting_meals' };
      }
      break;

    case 'configuring_items':
    case 'ready': 
      if (event.type === 'VALIDATE_REQUEST') {
        const currentItems = event.payload.items; // ✅ Extrai a lista que veio do React (atualizada)
        const isFull = Guards.isSelectionFull(state);
        
        // Verifica se há itens e se todos bateram a meta de acompanhamentos
        const allDone = currentItems.length > 0 && currentItems.every(item => Guards.isMealComplete(item));

        return { 
          ...state, 
          currentState: (isFull && allDone) ? 'ready' : 'configuring_items'
        };
      }

      if (event.type === 'REMOVE_MEAL') {
        return { ...state, selectedCount: Math.max(0, state.selectedCount - 1), currentState: 'selecting_meals' };
      }

      if (state.currentState === 'ready' && event.type === 'SUBMIT_CART') {
        return { ...state, currentState: 'adding_to_cart', isBusy: true };
      }
      break;

    case 'adding_to_cart':
      break;

    default:
      return state;
  }

  return state;
}