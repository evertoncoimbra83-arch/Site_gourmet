import { Gift } from "lucide-react";
import type { LoyaltyMetrics } from "../types";

interface LoyaltyCardProps {
  loyaltyMetrics: LoyaltyMetrics | null;
  money: (value: number) => string;
}

export function LoyaltyCard({ loyaltyMetrics, money }: LoyaltyCardProps) {
  if (!loyaltyMetrics) return null;

  return (
    <div className="bg-gradient-to-br from-emerald-50 to-teal-50/50 rounded-[2rem] p-5 border border-emerald-100/60 shadow-sm relative overflow-hidden text-left space-y-4">
      <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 blur-2xl rounded-full -mr-8 -mt-8 pointer-events-none" />

      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="bg-emerald-500/10 p-1.5 rounded-lg text-emerald-600">
              <Gift size={16} />
            </div>
            <span className="text-[10px] font-black uppercase text-emerald-800 tracking-wider">
              Fidelidade
            </span>
          </div>
          <h3 className="text-lg font-black text-slate-800 tracking-tight mt-1 leading-none">
            Saldo:{" "}
            <span className="text-emerald-600 italic font-black">
              {loyaltyMetrics.currentPoints}
            </span>{" "}
            pts
          </h3>
          {loyaltyMetrics.hasValidRewardRule && (
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">
              Equivale a{" "}
              <span className="text-emerald-700">
                {money(loyaltyMetrics.currentCashback)}
              </span>{" "}
              de cashback
            </p>
          )}
        </div>

        {loyaltyMetrics.pointsEarned > 0 && (
          <div className="bg-emerald-500 text-white text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-lg shadow-sm shadow-emerald-500/20 shrink-0">
            +{loyaltyMetrics.pointsEarned} PTS NESTE PEDIDO
          </div>
        )}
      </div>

      {loyaltyMetrics.hasValidRewardRule && (
        <div className="space-y-1.5 pt-1">
          <div className="flex justify-between items-center text-[9px] font-bold text-slate-400 uppercase tracking-wide">
            <span>Progresso para proxima recompensa</span>
            <span className="text-emerald-600 font-black">
              {Math.round(loyaltyMetrics.percentProgress)}%
            </span>
          </div>

          <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200/20">
            <div
              className="bg-gradient-to-r from-emerald-500 to-teal-500 h-full rounded-full transition-all duration-500"
              style={{
                width: `${loyaltyMetrics.percentProgress}%`,
              }}
            />
          </div>

          <p className="text-[9px] font-bold text-slate-500 leading-normal uppercase tracking-tight">
            Faltam{" "}
            <span className="text-emerald-600 font-black">
              {loyaltyMetrics.pointsNeeded} pontos
            </span>{" "}
            para ganhar +
            <span className="text-emerald-600 font-black">
              {money(loyaltyMetrics.redemptionRateMoney)}
            </span>{" "}
            de desconto.
          </p>
        </div>
      )}
    </div>
  );
}
