import React, { useState } from "react"; // ✅ Adicionado React para corrigir escopo JSX
import { trpc } from "@/_core/trpc";
import { Card } from "@/components/ui/card";
import { Gift, TrendingUp, History } from "lucide-react";

// --- INTERFACES ---

interface LoyaltyTransaction {
  id: string | number;
  reason: string;
  description: string;
  pointsChange: number;
  createdAt: string;
}

export default function LoyaltyPoints() {
  const { data: points, isLoading } = trpc.loyalty.getPoints.useQuery();
  // ✅ Tipagem da query para garantir consistência no map
  const { data: history } = trpc.loyalty.getHistory.useQuery({ limit: 5 });
  const [showHistory, setShowHistory] = useState(false);

  if (isLoading) {
    return (
      <Card className="p-4 bg-gradient-to-r from-emerald-50 to-emerald-100 border-emerald-200">
        <div className="animate-pulse h-20 bg-emerald-200 rounded-xl"></div>
      </Card>
    );
  }

  if (!points) {
    return null;
  }

  return (
    <div className="space-y-4 text-left">
      <Card className="p-6 bg-gradient-to-r from-emerald-50 to-emerald-100 border-emerald-200 rounded-3xl shadow-sm">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Gift className="w-5 h-5 text-emerald-600" />
              <h3 className="text-[10px] font-black uppercase tracking-widest text-emerald-800/60">
                Saldo de Pontos
              </h3>
            </div>
            <p className="text-4xl font-black text-emerald-700 italic tracking-tighter leading-none">
              {points.loyaltyPoints ?? 0}
            </p>
            <p className="text-[10px] font-bold text-emerald-800/40 uppercase mt-2">
              Equivalente a R$ {((points.loyaltyPoints ?? 0) * 0.01).toFixed(2)} em desconto
            </p>
          </div>

          <div className="text-right">
            <div className="flex items-center justify-end gap-1 text-emerald-600 mb-2">
              <TrendingUp className="w-4 h-4" />
              <span className="text-[10px] font-black uppercase tracking-widest">Total Gasto</span>
            </div>
            <p className="text-2xl font-black text-slate-900 italic tracking-tighter">
              R$ {parseFloat(String(points.totalSpent || "0")).toFixed(2)}
            </p>
          </div>
        </div>
      </Card>

      {history && history.length > 0 && (
        <Card className="p-2 rounded-2xl border-slate-100 shadow-sm overflow-hidden">
          <button
            type="button"
            onClick={() => setShowHistory(!showHistory)}
            className="w-full flex items-center justify-between hover:bg-slate-50 p-3 rounded-xl transition-colors"
          >
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-slate-400" />
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">
                Histórico Recente
              </span>
            </div>
            <span className="text-xs text-slate-400">
              {showHistory ? "▼" : "▶"}
            </span>
          </button>

          {showHistory && (
            <div className="mt-2 space-y-1 max-h-64 overflow-y-auto p-2">
              {(history as unknown as LoyaltyTransaction[]).map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-3 bg-slate-50 rounded-xl text-sm border border-white"
                >
                  <div className="text-left">
                    <p className="text-[11px] font-black uppercase text-slate-700 leading-tight">
                      {transaction.reason}
                    </p>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">
                      {transaction.description}
                    </p>
                  </div>
                  <div
                    className={`text-xs font-black italic ${
                      (transaction.pointsChange || 0) > 0
                        ? "text-emerald-600"
                        : "text-red-500"
                    }`}
                  >
                    {(transaction.pointsChange || 0) > 0 ? "+" : ""}
                    {transaction.pointsChange} pts
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}