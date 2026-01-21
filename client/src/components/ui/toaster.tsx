// client/src/components/ui/toaster.tsx
import { useToast } from "./use-toast";
import { AnimatePresence, motion } from "framer-motion";
import { X, CheckCircle2, AlertCircle, Info } from "lucide-react";

export function Toaster() {
  // ✅ Importamos o hook. O segredo é usar a função 'get' como um seletor reativo.
  const { get, dismiss } = useToast();
  
  // ✅ Ao usar get(state => state.toasts), o componente "assina" as mudanças nesse array.
  const toasts = get((state) => state.toasts);

  return (
    <div 
      className="fixed top-6 right-6 z-[9999] flex flex-col gap-3 w-full max-w-[380px] pointer-events-none"
      aria-live="assertive"
    >
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          // ✅ Verificamos se o toast existe e está com a flag 'open' ativa
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
                  'bg-white border-slate-100 text-slate-900'}
              `}
            >
              {/* Seção do Ícone */}
              <div className="mt-0.5 shrink-0">
                {toast.variant === 'success' && <CheckCircle2 size={18} className="text-emerald-500" />}
                {toast.variant === 'destructive' && <AlertCircle size={18} className="text-red-500" />}
                {toast.variant === 'default' && <Info size={18} className="text-slate-400" />}
              </div>

              {/* Conteúdo do Texto */}
              <div className="flex-1 min-w-0">
                {toast.title && (
                  <h4 className="text-[10px] font-black uppercase tracking-widest leading-tight mb-1 truncate">
                    {toast.title}
                  </h4>
                )}
                {toast.description && (
                  <p className="text-xs font-medium opacity-80 leading-snug line-clamp-2">
                    {toast.description}
                  </p>
                )}
              </div>

              {/* Botão de Fechar */}
              <button 
                onClick={() => dismiss(toast.id)}
                className="shrink-0 p-1 rounded-lg hover:bg-black/5 transition-colors group-hover:bg-black/5"
              >
                <X size={14} className="text-slate-400" />
              </button>

              {/* ✅ Barra de tempo (Efeito Visual) */}
              <motion.div 
                initial={{ width: "100%" }}
                animate={{ width: "0%" }}
                transition={{ 
                  duration: (toast.duration || 3000) / 1000, 
                  ease: "linear" 
                }}
                className={`absolute bottom-0 left-0 h-1 ${
                  toast.variant === 'success' ? 'bg-emerald-500/40' : 
                  toast.variant === 'destructive' ? 'bg-red-500/40' : 'bg-slate-200'
                }`}
              />
            </motion.div>
          )
        ))}
      </AnimatePresence>
    </div>
  );
}