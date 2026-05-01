// client/src/components/ui/toaster.tsx
import React from "react";
import { useToast } from "./use-toast";
import { AnimatePresence, motion } from "framer-motion";
import { X, CheckCircle2, AlertCircle, Info, AlertTriangle } from "lucide-react";

export function Toaster() {
  // ✅ Pegamos os dados diretamente do seu hook baseado em Zustand
  const { toasts, dismiss } = useToast();

  // Garante que nunca tentaremos dar .map em algo que não seja array
  const safeToasts = Array.isArray(toasts) ? toasts : [];

  return (
    <div 
      className="fixed top-6 right-6 z-[9999] flex flex-col gap-3 w-full max-w-[380px] pointer-events-none"
      aria-live="assertive"
    >
      <AnimatePresence mode="popLayout">
        {safeToasts.map((toast) => (
          // ✅ Verificamos se está aberto para disparar a animação de saída do Framer Motion
          toast.open && (
            <motion.div
              key={toast.id}
              layout
              initial={{ opacity: 0, x: 50, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 20, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className={`
                pointer-events-auto relative group overflow-hidden rounded-2xl p-4 shadow-2xl border flex items-start gap-3
                ${toast.variant === 'destructive' 
                  ? 'bg-red-50 border-red-100 text-red-900' : 
                  toast.variant === 'success' 
                  ? 'bg-emerald-50 border-emerald-100 text-emerald-900' : 
                  toast.variant === 'warning'
                  ? 'bg-amber-50 border-amber-100 text-amber-900' :
                  'bg-white border-slate-100 text-slate-900'}
              `}
            >
              {/* Ícones dinâmicos baseados no variant da sua Store */}
              <div className="mt-0.5 shrink-0">
                {toast.variant === 'success' && <CheckCircle2 size={18} className="text-emerald-500" />}
                {toast.variant === 'destructive' && <AlertCircle size={18} className="text-red-500" />}
                {toast.variant === 'warning' && <AlertTriangle size={18} className="text-amber-500" />}
                {(toast.variant === 'info' || toast.variant === 'default') && <Info size={18} className="text-blue-500" />}
              </div>

              <div className="flex-1 min-w-0">
                {toast.title && (
                  <h4 className="text-[10px] font-black uppercase tracking-widest leading-tight mb-1 truncate text-inherit opacity-90">
                    {toast.title}
                  </h4>
                )}
                {toast.description && (
                  <p className="text-xs font-medium opacity-80 leading-snug line-clamp-2">
                    {toast.description}
                  </p>
                )}
              </div>

              <button 
                type="button"
                onClick={() => dismiss(toast.id)}
                className="shrink-0 p-1 rounded-lg hover:bg-black/5 transition-colors group-hover:bg-black/5"
              >
                <X size={14} className="text-slate-400" />
              </button>

              {/* Barra de progresso visual baseada na duration da Store */}
              <motion.div 
                initial={{ width: "100%" }}
                animate={{ width: "0%" }}
                transition={{ 
                  duration: (toast.duration || 4000) / 1000, 
                  ease: "linear" 
                }}
                className={`absolute bottom-0 left-0 h-1 ${
                  toast.variant === 'success' ? 'bg-emerald-500/40' : 
                  toast.variant === 'destructive' ? 'bg-red-500/40' : 
                  toast.variant === 'warning' ? 'bg-amber-500/40' : 'bg-slate-200'
                }`}
              />
            </motion.div>
          )
        ))}
      </AnimatePresence>
    </div>
  );
}