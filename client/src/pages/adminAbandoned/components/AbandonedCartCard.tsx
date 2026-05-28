// client/src/pages/adminAbandoned/components/AbandonedCartCard.tsx
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { User, Ghost, Clock, ExternalLink, MessageCircle, CreditCard, LogIn, ShoppingBag } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AbandonedCart } from "../logic/useAdminAbandoned";

interface AbandonedCartCardProps {
  cart: AbandonedCart;
  isOnline: boolean;
  customMessage: string;
}

export function AbandonedCartCard({ cart, isOnline, customMessage }: AbandonedCartCardProps) {
  const getStage = () => {
    if (!cart.customerEmail) return { label: "Vitrine", icon: ShoppingBag, color: "text-slate-500", bg: "bg-slate-100" };
    if (!cart.shippingAddressId && !cart.selectedAddressId) return { label: "Checkout", icon: LogIn, color: "text-blue-600", bg: "bg-blue-50" };
    return { label: "Pagamento", icon: CreditCard, color: "text-orange-600", bg: "bg-orange-50" };
  };

  const stage = getStage();
  const timeLabel = cart.updatedAt ? formatDistanceToNow(new Date(cart.updatedAt), { locale: ptBR, addSuffix: true }) : "---";

  return (
    <Card className={cn(
      "transition-all duration-300 border border-slate-200 shadow-sm overflow-hidden bg-white", // ✅ Forçado fundo branco
      isOnline && "border-emerald-500 ring-1 ring-emerald-100 bg-emerald-50/30"
    )}>
      <CardContent className="p-6 flex flex-col md:flex-row items-center justify-between gap-6 bg-white"> {/* ✅ Forçado bg-white aqui também */}
        
        {/* Lado Esquerdo: Info Cliente */}
        <div className="flex items-start gap-4 flex-1">
          <div className={cn(
            "h-12 w-12 rounded-2xl flex items-center justify-center shrink-0", 
            isOnline ? "bg-emerald-500 text-white shadow-lg" : "bg-slate-100 text-slate-400"
          )}>
            {cart.customerName && cart.customerName !== "Visitante Anônimo" ? <User size={24} /> : <Ghost size={24} />}
          </div>
          <div className="text-left space-y-1">
            <h3 className="font-black text-slate-900 uppercase italic tracking-tighter text-lg leading-tight">
              {cart.customerName || "Visitante Anônimo"}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="secondary" className={cn("text-[10px] font-black border-none px-2 py-0.5", stage.bg, stage.color)}>
                <stage.icon size={12} className="mr-1" /> {stage.label}
              </Badge>
              <span className="text-[10px] text-slate-500 font-bold uppercase flex items-center gap-1">
                <Clock size={10} /> {timeLabel}
              </span>
            </div>
          </div>
        </div>

        {/* Centro: Valores (Corrigindo contraste) */}
        <div className="text-right min-w-30">
          <p className="text-2xl font-black text-slate-900 leading-none tracking-tighter">
            {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cart.total)}
          </p>
          <p className="text-[10px] font-black text-emerald-600 uppercase mt-1 tracking-widest">
            {cart.itemCount} {cart.itemCount === 1 ? 'Item' : 'Itens'}
          </p>
        </div>

        {/* Direita: Botões */}
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="icon" 
            className="rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50"
            onClick={() => window.open(`https://clarity.microsoft.com/projects/view/vfh49ngyny/recordings?search=${cart.customerEmail || cart.visitorId}`, '_blank')}
          >
            <ExternalLink size={18} />
          </Button>
          <Button 
            className="bg-[#25D366] hover:bg-[#1fb355] text-white rounded-xl gap-2 font-black uppercase text-[11px] px-6 shadow-md transition-all active:scale-95" 
            disabled={!cart.customerPhone}
            onClick={() => {
              const phone = cart.customerPhone?.replace(/\D/g, '');
              window.open(`https://wa.me/55${phone}?text=${encodeURIComponent(customMessage)}`);
            }}
          >
            <MessageCircle size={18} /> Recuperar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}