import { create } from 'zustand';
import { APP_TOAST_DURATION } from "@/lib/app-toast";

// 1. Tipos revisados para alinhar com Shadcn/Sonner
type ToastType = 'default' | 'destructive' | 'success' | 'warning' | 'info';

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
  addToast: (props: Omit<Toast, 'id' | 'open'>) => void;
  dismiss: (id: string) => void;
}

type ToastInput = string | Omit<Toast, 'id' | 'open'>;
type ToastOptions = {
  title?: string;
  description?: string;
  variant?: ToastType;
  duration?: number;
};

// 2. Store do Zustand
export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  
  addToast: (props) => {
    const id = Math.random().toString(36).substring(2, 9);
    
    set((state) => ({
      toasts: [{ id, open: true, ...props }, ...state.toasts],
    }));

    // Auto-dismiss: Primeiro fecha a animação, depois remove do array
    const duration = props.duration || APP_TOAST_DURATION.info;

    setTimeout(() => {
      // Inicia fechamento (animação)
      set((state) => ({
        toasts: state.toasts.map((t) => t.id === id ? { ...t, open: false } : t)
      }));
      
      // Remove do estado após a animação acabar (300ms)
      setTimeout(() => {
        set((state) => ({
          toasts: state.toasts.filter((t) => t.id !== id)
        }));
      }, 300);
    }, duration);
  },

  dismiss: (id) => set((state) => ({
    toasts: state.toasts.map((t) => t.id === id ? { ...t, open: false } : t)
  })),
}));

// 3. A PONTE (Adapter) 
// Melhorado para aceitar (message, options) como o Sonner original
function getDuration(variant: ToastType, duration?: number) {
  if (duration) return duration;
  if (variant === "destructive") return APP_TOAST_DURATION.error;
  if (variant === "success") return APP_TOAST_DURATION.success;
  if (variant === "warning") return APP_TOAST_DURATION.warning;
  return APP_TOAST_DURATION.info;
}

const toastFunction = (message: ToastInput, options?: ToastOptions) => {
  if (typeof message === "object" && message !== null) {
    const variant = message.variant || "default";
    useToastStore.getState().addToast({
      ...message,
      variant,
      duration: getDuration(variant, message.duration),
    });
    return;
  }

  const variant = options?.variant || 'default';
  useToastStore.getState().addToast({
    title: options?.title || message,
    description: options?.description,
    variant,
    duration: getDuration(variant, options?.duration)
  });
};

export const toast = Object.assign(toastFunction, {
  success: (message: string, options?: { description?: string; duration?: number }) => 
    useToastStore.getState().addToast({ 
      title: "Sucesso!", 
      description: message, 
      variant: 'success',
      duration: getDuration("success", options?.duration)
    }),
  
  error: (message: string, options?: { description?: string; duration?: number }) => 
    useToastStore.getState().addToast({ 
      title: "Erro", 
      description: message, 
      variant: 'destructive',
      duration: getDuration("destructive", options?.duration)
    }),
  
  info: (message: string, options?: { description?: string; duration?: number }) => 
    useToastStore.getState().addToast({ 
      title: "Informação", 
      description: message, 
      variant: 'info',
      duration: getDuration("info", options?.duration)
    }),
    
  warning: (message: string, options?: { description?: string; duration?: number }) => 
    useToastStore.getState().addToast({ 
      title: "Atenção", 
      description: message, 
      variant: 'warning',
      duration: getDuration("warning", options?.duration)
    }),
});

// 4. Hook para uso em componentes
export function useToast() {
  const toasts = useToastStore((state) => state.toasts);
  const dismiss = useToastStore((state) => state.dismiss);
  
  return { 
    toast, 
    toasts,
    dismiss 
  };
}
