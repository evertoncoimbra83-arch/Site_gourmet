import React from "react";
import { Card, Text, Metric, BadgeDelta, Flex } from "@tremor/react";
import { cn } from "@/lib/utils";

interface KPICardProps {
  label: string;
  value: string | number;
  sub?: string;
  color?: "emerald" | "blue" | "rose" | "amber" | "slate";
  delta?: string; // Ex: "+12%"
  isIncrease?: boolean;
}

export function KPICard({ label, value, sub, color = "emerald", delta, isIncrease }: KPICardProps) {
  
  // Mapeamento de cores para bordas sutis e badges

  return (
    <Card className="rounded-3xl border-none shadow-sm ring-1 ring-slate-100 p-6 bg-white transition-all hover:shadow-md">
      <Flex alignItems="start" justifyContent="between">
        <div className="text-left">
          {/* Label do KPI (Sóbrio e Espaçado) */}
          <Text className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 mb-1">
            {label}
          </Text>
          
          {/* Valor Principal (Impacto Visual) */}
          <Metric className="text-2xl font-black italic uppercase tracking-tighter text-slate-900 leading-none">
            {value}
          </Metric>
        </div>

        {/* Badge de Delta (Opcional - para crescimento) */}
        {delta && (
          <BadgeDelta 
            deltaType={isIncrease ? "moderateIncrease" : "moderateDecrease"}
            className="rounded-lg font-black text-[9px] px-2 py-1"
          >
            {delta}
          </BadgeDelta>
        )}
      </Flex>

      {/* Sub-legenda com cor contextual leve */}
      {sub && (
        <div className="mt-4 pt-4 border-t border-slate-50 flex items-center gap-2">
          <div className={cn("h-1.5 w-1.5 rounded-full animate-pulse", 
            color === 'emerald' ? "bg-emerald-500" : 
            color === 'rose' ? "bg-rose-500" : 
            color === 'blue' ? "bg-blue-500" : "bg-amber-500"
          )} />
          <Text className="text-[9px] font-bold uppercase tracking-widest text-slate-400">
            {sub}
          </Text>
        </div>
      )}
    </Card>
  );
}