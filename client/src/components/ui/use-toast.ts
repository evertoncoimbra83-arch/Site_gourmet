import { create } from 'zustand';

// 1. Tipos
type ToastType = 'default' | 'destructive' | 'success';

type Toast = {
  id: string;
  title?: string;
  description?: string;
  variant?: ToastType;
  open: boolean;
  duration?: number;
};

interface ToastStore {
  toasts: Toast[];
  // A função principal que adiciona ao estado
  addToast: (props: Omit<Toast, 'id' | 'open'>) => void;
  dismiss: (id: string) => void;
}

// 2. Store do Zustand
export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  
  addToast: (props) => {
    const id = Math.random().toString(36).substring(2, 9);
    set((state) => ({
      toasts: [{ id, open: true, ...props }, ...state.toasts],
    }));

    // Auto-dismiss
    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.map((t) => t.id === id ? { ...t, open: false } : t)
      }));
      
      // Limpeza final do array
      setTimeout(() => {
        set((state) => ({
          toasts: state.toasts.filter((t) => t.id !== id || t.open === true)
        }));
      }, 300);
    }, props.duration || 4000);
  },

  dismiss: (id) => set((state) => ({
    toasts: state.toasts.map((t) => t.id === id ? { ...t, open: false } : t)
  })),
}));

// 3. A PONTE (Adapter) para imitar o Sonner
// Isso permite usar toast.success() mesmo usando nosso sistema customizado
const toastFunction = (props: { title?: string; description?: string; variant?: ToastType; duration?: number }) => {
  useToastStore.getState().addToast(props);
};

export const toast = Object.assign(toastFunction, {
  success: (message: string, options?: { description?: string; duration?: number }) => 
    toastFunction({ 
      title: "Sucesso!", 
      description: message || options?.description, 
      variant: 'success',
      duration: options?.duration
    }),
  
  error: (message: string, options?: { description?: string; duration?: number }) => 
    toastFunction({ 
      title: "Erro", 
      description: message || options?.description, 
      variant: 'destructive',
      duration: options?.duration
    }),
  
  info: (message: string, options?: { description?: string; duration?: number }) => 
    toastFunction({ 
      title: "Informação", 
      description: message || options?.description, 
      variant: 'default',
      duration: options?.duration
    }),
    
  warning: (message: string, options?: { description?: string; duration?: number }) => 
    toastFunction({ 
      title: "Atenção", 
      description: message || options?.description, 
      variant: 'default', // Ou crie uma variante 'warning' no Toaster.tsx
      duration: options?.duration
    }),
});

// 4. Hook para usar dentro de componentes (opcional, mas bom ter)
export function useToast() {
  const dismiss = useToastStore((state) => state.dismiss);
  return { 
    toast, 
    dismiss,
    // Exportamos o store para o componente Toaster usar
    get: useToastStore 
  };
}