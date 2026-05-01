import React, { useMemo } from "react"; 
import { Link } from "react-router-dom"; 
import { trpc } from "@/_core/trpc";
import { motion } from "framer-motion";
import { 
  CheckCircle2, ArrowRight, Star, CalendarCheck, 
  Hash, LayoutGrid, ExternalLink, MessageCircle, Heart, User, CreditCard
} from "lucide-react";
import { Button } from "@/components/ui/button";

// --- INTERFACES ---
interface Partner {
  name: string;
  link?: string;
  logo_url?: string;
  discount_text?: string;
}

export default function OrderSuccessPage() {
  const params = new URLSearchParams(window.location.search);
  const orderId = params.get("orderId");

  // 1. Busca configurações globais
  const { data: storeInfo } = trpc.public.getStoreSettings.useQuery();
  
  // 2. Busca pedido detalhado
  const { data: order } = trpc.orders.getById.useQuery(
    { id: orderId || "" }, 
    { enabled: !!orderId && orderId !== "preview" }
  );

  const settings = useMemo(() => {
    const s = storeInfo as Record<string, unknown> | undefined;
    let partnersList: Partner[] = [];
    
    try {
      const rawPartners = s?.partners_json;
      partnersList = typeof rawPartners === 'string' 
        ? JSON.parse(rawPartners) 
        : (rawPartners as Partner[] || []);
    } catch { 
      partnersList = []; 
    }

    return {
      // Prioriza a mensagem personalizada do banco, com fallback acolhedor
      successMessage: (s?.success_order_message as string) || (s?.successOrderMessage as string) || "Seu pedido foi recebido! Agora nossa equipe vai preparar tudo com muito carinho.",
      whatsapp: (s?.whatsapp as string) || (s?.phone as string) || "",
      partners: partnersList
    };
  }, [storeInfo]);

  const money = (v: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v || 0);

  const getImageUrl = (path: string) => {
    if (!path) return "";
    if (path.startsWith('http')) return path;
    const BACKEND_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";
    return `${BACKEND_URL}/uploads/${path.replace(/^\/+/, "").replace(/^uploads\//, "")}`;
  };

  return (
    <div
      data-testid="order-success-container"
      className="min-h-screen bg-[#FBFBFC] flex flex-col items-center justify-center p-4 sm:p-6 py-12"
    >
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-115 space-y-6"
      >
        <div className="bg-white rounded-4xl md:rounded-[3rem] shadow-2xl shadow-slate-200/60 overflow-hidden border border-slate-100">
          
          {/* HEADER PREMIUM */}
          <div className="bg-slate-900 p-8 md:p-10 text-center relative overflow-hidden">
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="relative z-10 flex flex-col items-center"
            >
              <div className="inline-flex bg-emerald-500 p-3 rounded-2xl mb-4 shadow-xl shadow-emerald-500/30 rotate-3">
                <CheckCircle2 className="text-white w-8 h-8" strokeWidth={3} />
              </div>
              
              <h1 className="text-white text-2xl font-black uppercase italic tracking-tighter leading-none">
                Pedido <span className="text-emerald-500">Confirmado!</span>
              </h1>

              <div className="mt-4 bg-white/5 backdrop-blur-md border border-white/10 px-4 py-2 rounded-2xl flex items-center gap-2">
                <Hash size={12} className="text-emerald-500" />
                <span className="text-white font-black text-[10px] tracking-widest uppercase opacity-60">ID:</span>
                <span className="text-white font-black text-sm tracking-widest uppercase">
                  {orderId?.slice(-9).toUpperCase()}
                </span>
              </div>
            </motion.div>
          </div>

          <div className="p-6 md:p-8 space-y-6">
            
            {/* MENSAGEM ACOLHEDORA */}
            <div className="text-center space-y-2">
               <div className="flex items-center justify-center gap-2 text-orange-500 font-black uppercase text-[10px] tracking-[0.2em]">
                  <Heart size={12} fill="currentColor" /> Gratidão por escolher a gente
               </div>
               <h2 className="text-xl font-black text-slate-900">
                  Olá, {order?.customerName?.split(' ')[0] || 'Gourmet'}!
               </h2>
               <p className="text-slate-500 text-sm font-medium leading-relaxed px-4">
                  Agradecemos seu podido, #{orderId?.slice(-9).toUpperCase()}.
                  Vamos entrar em contato em breve para confirmar os detalhes da formaa de entrega e horário.</p>
                  <p> Enquanto isso, confira nossos parceiros no final da página e aproveite!
               </p>
            </div>

            {/* STATUS CARD */}
            <div className="bg-slate-50 rounded-[2rem] p-6 border border-slate-100 space-y-4">
               <div className="flex items-center gap-4">
                  <div className="h-12 w-12 bg-white rounded-2xl shadow-sm flex items-center justify-center text-emerald-500">
                     <CalendarCheck size={24} />
                  </div>
                  <div className="flex-1 text-left">
                     <span className="text-[8px] font-black uppercase text-slate-400 tracking-widest">Próxima etapa</span>
                     <p className="text-xs font-bold text-slate-700">{settings.successMessage}</p>
                  </div>
               </div>

               <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-200/60">
                  <div className="text-left">
                     <span className="text-[8px] font-black uppercase text-slate-400 tracking-widest block mb-1">Total a Pagar</span>
                     <span className="text-sm font-black text-slate-900 italic">{money(Number(order?.total) || 0)}</span>
                  </div>
                  <div className="text-left">
                     <span className="text-[8px] font-black uppercase text-slate-400 tracking-widest block mb-1">Pagamento</span>
                     <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 uppercase italic">
                        <CreditCard size={12} className="text-emerald-500" />
                        {order?.paymentMethod || 'Confirmado'}
                     </div>
                  </div>
               </div>
            </div>

            {/* BOTÕES DE AÇÃO */}
            <div className="space-y-3 pt-2">
              <Button asChild className="w-full h-14 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-black uppercase text-[10px] tracking-widest shadow-xl group">
                <Link to="/perfil/pedidos">
                  <div className="flex items-center gap-2">
                    <User size={16} />
                    <span>Meus Pedidos</span>
                    <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform ml-auto" />
                  </div>
                </Link>
              </Button>
              
              <div className="flex gap-2">
                <Button asChild variant="ghost" className="flex-1 h-12 rounded-xl text-slate-400 font-black uppercase text-[9px] tracking-widest hover:bg-slate-100">
                  <Link to="/">Voltar ao Menu</Link>
                </Button>
                
                <Button 
                  onClick={() => {
                    const phone = settings.whatsapp.replace(/\D/g, '') || ""; 
                    const message = encodeURIComponent(`Olá! Fiz um pedido (#${orderId?.slice(-6).toUpperCase()}) e gostaria de agendar a entrega.`);
                    window.open(`https://wa.me/${phone}?text=${message}`);
                  }}
                  className="flex-2 h-12 rounded-xl bg-[#25D366] hover:bg-[#128C7E] text-white font-black uppercase text-[9px] tracking-widest shadow-lg border-none"
                >
                  <MessageCircle size={16} className="mr-2" /> Agendar no WhatsApp
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* CLUBE DE BENEFÍCIOS */}
        {settings.partners.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 px-2">
              <div className="h-px flex-1 bg-slate-200" />
              <div className="flex items-center gap-2 text-slate-400">
                <Star size={12} className="text-amber-500 fill-amber-500" />
                <span className="text-[8px] font-black uppercase tracking-[0.2em]">Parceiros Gourmet</span>
              </div>
              <div className="h-px flex-1 bg-slate-200" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              {settings.partners.map((p, idx) => (
                <a key={idx} href={p.link || "#"} target="_blank" rel="noopener noreferrer" className="group bg-white p-4 rounded-[2rem] border border-slate-100 shadow-sm hover:border-emerald-200 transition-all flex flex-col items-center text-center gap-2">
                  <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center overflow-hidden group-hover:scale-110 transition-transform">
                    {p.logo_url ? (
                      <img src={getImageUrl(p.logo_url)} alt={p.name} className="w-full h-full object-contain p-1.5" />
                    ) : (
                      <LayoutGrid size={14} className="text-slate-200" />
                    )}
                  </div>
                  <h4 className="text-[9px] font-black text-slate-900 uppercase leading-none truncate w-full">{p.name}</h4>
                  <span className="text-[7px] font-bold text-emerald-500 uppercase flex items-center gap-1">
                    {p.discount_text} <ExternalLink size={8}/>
                  </span>
                </a>
              ))}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
