import React from "react";
import { Card, Flex, Title, BarList } from "@tremor/react";
import { CreditCard } from "lucide-react";
import { AnalyticsData } from "../../logic/useAdminAnalytics";
import { formatCurrency } from "../../utils/formatters";

export function FinanceTab({ stats }: { stats: AnalyticsData }) {
  return (
    <Card className="rounded-4xl border-none shadow-sm ring-1 ring-slate-100 p-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <Flex alignItems="center" className="gap-2 mb-8">
        <CreditCard className="text-blue-500" size={24} />
        <Title className="font-black uppercase italic text-slate-800 tracking-tighter">Meios de Pagamento</Title>
      </Flex>
      <BarList 
        data={stats.paymentMethods.map(p => ({ name: p.name, value: p.value }))} 
        color="blue" 
        valueFormatter={formatCurrency} 
      />
    </Card>
  );
}