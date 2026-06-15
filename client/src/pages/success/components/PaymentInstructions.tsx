import { CreditCard } from "lucide-react";

interface PaymentInstructionsProps {
  paymentMethod?: string | null;
}

export function PaymentInstructions({
  paymentMethod,
}: PaymentInstructionsProps) {
  return (
    <div className="text-left">
      <span className="text-[8px] font-black uppercase text-slate-400 tracking-widest block mb-1">
        Pagamento
      </span>
      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 uppercase italic">
        <CreditCard size={12} className="text-emerald-500" />
        {paymentMethod || "Confirmado"}
      </div>
    </div>
  );
}
