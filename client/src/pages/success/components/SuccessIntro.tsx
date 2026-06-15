import { Heart } from "lucide-react";
import type { SuccessOrder } from "../types";

interface SuccessIntroProps {
  order: SuccessOrder;
  displayOrderId: string;
}

export function SuccessIntro({ order, displayOrderId }: SuccessIntroProps) {
  return (
    <div className="text-center space-y-2">
      <div className="flex items-center justify-center gap-2 text-orange-500 font-black uppercase text-[10px] tracking-[0.2em]">
        <Heart size={12} fill="currentColor" /> Gratidao por escolher a gente
      </div>
      <h2 className="text-xl font-black text-slate-900">
        Ola, {order.customerName?.split(" ")[0] || "Gourmet"}!
      </h2>
      <p className="text-slate-500 text-sm font-medium leading-relaxed px-4">
        Agradecemos seu pedido, #{displayOrderId}. Vamos entrar em contato em
        breve para confirmar os detalhes da forma de entrega e horario.
      </p>
      <p>
        Enquanto isso, confira nossos parceiros no final da pagina e aproveite!
      </p>
    </div>
  );
}
