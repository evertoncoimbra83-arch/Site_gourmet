// client/src/pages/ThankYou.tsx
import { useLocation } from "wouter";
import { CheckCircle2, Gift, ShoppingBag, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";

export default function ThankYou() {
  const [, setLocation] = useLocation();
  const params = new URLSearchParams(window.location.search);
  const orderId = params.get("id");
  const points = params.get("points");

  // Se alguém tentar entrar na página sem um ID de pedido, volta para a home
  useEffect(() => {
    if (!orderId) setLocation("/");
  }, [orderId, setLocation]);

  return (
    <div className="min-h-screen bg-emerald-50/30 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-[3rem] p-10 shadow-2xl shadow-emerald-900/10 text-center animate-in fade-in zoom-in duration-500">
        <div className="mb-6 inline-flex p-5 bg-emerald-100 rounded-full text-emerald-600 animate-bounce">
          <CheckCircle2 size={56} strokeWidth={2.5} />
        </div>
        
        <h1 className="text-3xl font-black text-slate-900 mb-2">Pedido Recebido!</h1>
        <p className="text-slate-500 font-medium mb-8">O teu pedido <span className="font-bold text-slate-900">#{orderId}</span> já está na nossa cozinha.</p>

        {/* Card de Pontos - Impacto Visual */}
        <div className="bg-amber-50 border-2 border-dashed border-amber-200 rounded-3xl p-6 mb-8 relative overflow-hidden">
          <div className="absolute -right-2 -top-2 opacity-10 rotate-12">
            <Gift size={80} />
          </div>
          <div className="flex items-center justify-center gap-2 text-amber-600 font-black text-xs uppercase tracking-widest mb-2">
            <Gift size={16} /> Recompensa do dia
          </div>
          <div className="text-5xl font-black text-amber-700">+{points} <span className="text-xl">pts</span></div>
          <p className="text-[10px] text-amber-600/60 mt-3 font-bold">Usa estes pontos para descontos na próxima compra!</p>
        </div>

        <div className="space-y-3">
          <Button 
            onClick={() => setLocation("/meus-pedidos")} 
            className="w-full h-14 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold flex items-center justify-center gap-2 transition-transform active:scale-95"
          >
            <ShoppingBag size={18} /> Acompanhar Pedido
          </Button>
          <Button 
            variant="ghost" 
            onClick={() => setLocation("/")} 
            className="w-full text-slate-400 font-bold hover:text-emerald-600 group"
          >
            Voltar para a loja <ArrowRight size={16} className="ml-1 inline transition-transform group-hover:translate-x-1" />
          </Button>
        </div>
      </div>
    </div>
  );
}