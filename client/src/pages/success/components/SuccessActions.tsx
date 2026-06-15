import { Link } from "react-router-dom";
import { ArrowRight, MessageCircle, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { buildWhatsappUrl } from "../utils/successHelpers";

interface SuccessActionsProps {
  whatsapp: string;
  displayOrderId: string;
}

export function SuccessActions({
  whatsapp,
  displayOrderId,
}: SuccessActionsProps) {
  return (
    <div className="space-y-3 pt-2">
      <Button
        asChild
        className="w-full h-14 rounded-2xl bg-primary hover:bg-primary-hover text-white font-black uppercase text-[10px] tracking-widest shadow-xl group"
      >
        <Link to="/perfil/pedidos">
          <div className="flex items-center gap-2">
            <User size={16} />
            <span>Meus Pedidos</span>
            <ArrowRight
              size={16}
              className="group-hover:translate-x-1 transition-transform ml-auto"
            />
          </div>
        </Link>
      </Button>

      <div className="flex gap-2">
        <Button
          asChild
          variant="ghost"
          className="flex-1 h-12 rounded-xl text-slate-400 font-black uppercase text-[9px] tracking-widest hover:bg-slate-100"
        >
          <Link to="/">Voltar ao Menu</Link>
        </Button>

        <Button
          onClick={() => {
            window.open(buildWhatsappUrl({ whatsapp, displayOrderId }));
          }}
          className="flex-[2] h-12 rounded-xl bg-[#25D366] hover:bg-[#128C7E] text-white font-black uppercase text-[9px] tracking-widest shadow-lg border-none"
        >
          <MessageCircle size={16} className="mr-2" /> Agendar no WhatsApp
        </Button>
      </div>
    </div>
  );
}
