import { trpc } from "@/_core/trpc";
import { Card } from "@/components/ui/card";
import { Gift, TrendingUp, History } from "lucide-react";
import { useState } from "react";

export default function LoyaltyPoints() {
  const { data: points, isLoading } = trpc.loyalty.getPoints.useQuery();
  const { data: history } = trpc.loyalty.getHistory.useQuery({ limit: 5 });
  const [showHistory, setShowHistory] = useState(false);

  if (isLoading) {
    return (
      <Card className="p-4 bg-gradient-to-r from-emerald-50 to-emerald-100 border-emerald-200">
        <div className="animate-pulse h-20 bg-emerald-200 rounded"></div>
      </Card>
    );
  }

  if (!points) {
    return null;
  }

  return (
    <div className="space-y-4">
      <Card className="p-6 bg-gradient-to-r from-emerald-50 to-emerald-100 border-emerald-200">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Gift className="w-5 h-5 text-emerald-600" />
              <h3 className="text-sm font-medium text-gray-600">
                Saldo de Pontos
              </h3>
            </div>
            <p className="text-4xl font-bold text-emerald-700">
              {points.loyaltyPoints ?? 0}
            </p>
            <p className="text-sm text-gray-600 mt-1">
              Equivalente a R$ {((points.loyaltyPoints ?? 0) * 0.01).toFixed(2)} em desconto
            </p>
          </div>

          <div className="text-right">
            <div className="flex items-center gap-1 text-emerald-600 mb-2">
              <TrendingUp className="w-4 h-4" />
              <span className="text-xs font-medium">Total Gasto</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              R$ {parseFloat(String(points.totalSpent || "0")).toFixed(2)}
            </p>
          </div>
        </div>
      </Card>

      {history && history.length > 0 && (
        <Card className="p-4">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="w-full flex items-center justify-between hover:bg-gray-50 p-2 rounded"
          >
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">
                Histórico Recente
              </span>
            </div>
            <span className="text-xs text-gray-500">
              {showHistory ? "▼" : "▶"}
            </span>
          </button>

          {showHistory && (
            <div className="mt-4 space-y-2 max-h-64 overflow-y-auto">
              {history.map((transaction: any) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded text-sm"
                >
                  <div>
                    <p className="font-medium text-gray-900">
                      {transaction.reason}
                    </p>
                    <p className="text-xs text-gray-500">
                      {transaction.description}
                    </p>
                  </div>
                  <div
                    className={`font-bold ${
                      (transaction.pointsChange || 0) > 0
                        ? "text-emerald-600"
                        : "text-red-600"
                    }`}
                  >
                    {(transaction.pointsChange || 0) > 0 ? "+" : ""}
                    {transaction.pointsChange}
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