import React, { useState, useEffect } from "react";
import { ArrowRight, ShoppingCart, MessageCircle, X } from "lucide-react";
import { useCart } from "@/_core/CartContext";
import { useNavigate, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

export function FloatingCartFooter() {
  const { totals, items, money } = useCart();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  // Estado para capturar erros técnicos do tRPC
  const [hasTechnicalError, setHasTechnicalError] = useState(false);

  useEffect(() => {
    const handleError = () => setHasTechnicalError(true);
    window.addEventListener("trpc-error", handleError);
    return () => window.removeEventListener("trpc-error", handleError);
  }, []);

  const totalItems = totals?.totalQuantity || items?.length || 0;
  const cartSubtotal = totals?.subtotal || 0;
  const itemLabel = totalItems === 1 ? "1 item" : `${totalItems} itens`;
  if (totalItems === 0) return null;

  const excludedPaths = ["/admin", "/nutri", "/finalizar-pedido", "/sucesso", "/carrinho"];
  const isExcluded = excludedPaths.some(path => pathname.startsWith(path));
  if (isExcluded) return null;

  // Link direto para o seu WhatsApp com mensagem pronta
  const handleWhatsAppHelp = () => {
    const phoneNumber = "551145265941";
    const message = encodeURIComponent("Olá! Estou tendo dificuldades para finalizar meu pedido na Gourmet Saudável. Poderia me ajudar?");
    window.open(`https://wa.me/${phoneNumber}?text=${message}`, "_blank");
  };

  return (
    <div className={cn(
      "fixed left-0 w-full px-4 z-40 animate-in fade-in slide-in-from-bottom-5 duration-500 flex flex-col items-center gap-3",
      "bottom-[calc(5.75rem+env(safe-area-inset-bottom,0px))] md:bottom-8"
    )}>

      {/* FLOAT DE AJUDA (Aparece em caso de erro técnico) */}
      {hasTechnicalError && (
        <div className="relative animate-bounce">
          <button
            onClick={handleWhatsAppHelp}
            className="flex items-center gap-3 bg-white border-2 border-emerald-500 pl-3 pr-4 py-2 rounded-2xl shadow-[0_15px_30px_rgba(0,0,0,0.2)] group transition-all active:scale-95"
          >
            <div className="bg-emerald-500 p-2 rounded-xl text-white shadow-lg shadow-emerald-200">
              <MessageCircle size={16} fill="currentColor" />
            </div>
            <div className="flex flex-col items-start leading-tight">
              <span className="text-[8px] font-black uppercase text-slate-400 tracking-tighter">Ops! Algo deu errado?</span>
              <span className="text-[11px] font-black uppercase text-emerald-600 tracking-tight italic">Finalizar pelo WhatsApp</span>
            </div>
          </button>

          {/* Botão para fechar o aviso de erro */}
          <button
            onClick={(e) => { e.stopPropagation(); setHasTechnicalError(false); }}
            className="absolute -top-2 -right-2 bg-slate-900 text-white rounded-full p-1 border-2 border-white hover:bg-red-500 transition-colors"
          >
            <X size={10} />
          </button>
        </div>
      )}

      {/* CARRINHO FLUTUANTE */}
      <button
        onClick={() => navigate("/carrinho")}
        className={cn(
          "group flex w-full max-w-md items-center justify-between gap-3 sm:w-auto",
          "bg-slate-900/95 hover:bg-slate-900 backdrop-blur-lg",
          "border border-white/10 pl-4 pr-2 py-2 rounded-3xl sm:rounded-full",
          "shadow-[0_20px_50px_rgba(0,0,0,0.5)] transition-all active:scale-95",
          // Se tiver erro, o botão do carrinho ganha um destaque visual (glow)
          hasTechnicalError && "ring-2 ring-emerald-500 ring-offset-4 ring-offset-slate-50 shadow-[0_0_20px_rgba(16,185,129,0.4)]"
        )}
      >
        <div className="flex min-w-0 items-center gap-3">
          <div className="relative">
            <div className="bg-emerald-500/10 p-2 rounded-full">
               <ShoppingCart size={18} className="text-emerald-400" />
            </div>
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-black text-slate-900 border-2 border-slate-900">
              {totalItems}
            </span>
          </div>
          <div className="flex min-w-0 flex-col items-start leading-tight">
            <span className="text-[9px] font-black uppercase tracking-widest text-white/60">
              {itemLabel}
            </span>
            <span className="text-sm font-black text-white italic tracking-tight">
              {money(cartSubtotal)}
            </span>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2 bg-emerald-500 text-slate-900 px-4 py-2 rounded-full font-black uppercase text-[10px] tracking-tighter italic shadow-lg shadow-emerald-500/20 group-hover:bg-emerald-400 transition-colors">
          <span>Ver Sacola</span>
          <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
        </div>
      </button>
    </div>
  );
}
