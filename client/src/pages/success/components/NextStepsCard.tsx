import { CalendarCheck } from "lucide-react";
import { safeNumber } from "@/lib/safe-parse";
import type { SuccessOrder } from "../types";
import { PaymentInstructions } from "./PaymentInstructions";

interface NextStepsCardProps {
  order: SuccessOrder;
  successMessage: string;
  money: (value: number) => string;
}

export function NextStepsCard({
  order,
  successMessage,
  money,
}: NextStepsCardProps) {
  return (
    <div className="bg-slate-50 rounded-[2rem] p-6 border border-slate-100 space-y-4">
      <div className="flex items-center gap-4">
        <div className="h-12 w-12 bg-white rounded-2xl shadow-sm flex items-center justify-center text-emerald-500">
          <CalendarCheck size={24} />
        </div>
        <div className="flex-1 text-left">
          <span className="text-[8px] font-black uppercase text-slate-400 tracking-widest">
            Proxima etapa
          </span>
          <p className="text-xs font-bold text-slate-700">{successMessage}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-200/60">
        <div className="text-left">
          <span className="text-[8px] font-black uppercase text-slate-400 tracking-widest block mb-1">
            Total a Pagar
          </span>
          <span className="text-sm font-black text-slate-900 italic">
            {money(safeNumber(order.total))}
          </span>
        </div>
        <PaymentInstructions paymentMethod={order.paymentMethod} />
      </div>
    </div>
  );
}
