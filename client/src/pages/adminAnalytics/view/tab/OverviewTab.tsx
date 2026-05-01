import React from "react";
import { Grid, Card, Flex, Title, AreaChart, Text } from "@tremor/react";
import { Utensils, TrendingUp } from "lucide-react";
import { AnalyticsData, formatters } from "../../logic/useAdminAnalytics";
import { KPICard } from "../../components/KPICard";

export function OverviewTab({ stats }: { stats: AnalyticsData }) {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-700">
      
      {/* 1. KPIs PRINCIPAIS */}
      <Grid numItemsSm={2} numItemsLg={4} className="gap-6">
        <KPICard 
          label="Receita Líquida" 
          value={formatters.money(stats.financials.netRevenue)} 
          sub="Livre de taxas e descontos" 
          color="emerald" 
        />
        <KPICard 
          label="Ticket Médio" 
          value={formatters.money(stats.avgTicket)} 
          sub="Valor médio por pedido" 
          color="blue" 
        />
        <KPICard 
          label="Descontos" 
          value={formatters.money(stats.totalGivenDiscounts)} 
          sub="Impacto em promoções" 
          color="rose" 
        />
        <KPICard 
          label="Novos Clientes" 
          value={formatters.num(stats.newCustomers)} 
          sub="Base Gourmet Saudável" 
          color="amber" 
        />
      </Grid>

      {/* 2. GRÁFICO DE FATURAMENTO */}
      <Card className="rounded-4xl border-none shadow-sm ring-1 ring-slate-100 p-8 bg-white">
        <Flex justifyContent="between" alignItems="start" className="mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600">
              <TrendingUp size={20} />
            </div>
            <div>
              <Title className="font-black uppercase italic text-slate-900 tracking-tighter leading-none">
                Fluxo de <span className="text-emerald-600">Faturamento</span>
              </Title>
              <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                Performance comercial no período
              </Text>
            </div>
          </div>
          
          <div className="text-right hidden sm:block">
             <Text className="text-[10px] font-black uppercase text-slate-400">Total Bruto</Text>
             <Title className="font-black text-slate-900">
                {formatters.money(stats.financials.grossRevenue)}
             </Title>
          </div>
        </Flex>

        <AreaChart
          className="h-80 mt-10"
          data={stats.chartData}
          index="date"
          categories={["Faturamento"]}
          colors={["emerald"]}
          valueFormatter={formatters.money}
          showLegend={false}
          showGridLines={false} // ✅ Deixa o visual mais clean
          curveType="monotone" // ✅ Curva mais suave
          yAxisWidth={80}
        />
      </Card>

      {/* 3. RODAPÉ DE OPERAÇÃO */}
      <Flex className="justify-center gap-2 opacity-20 py-4">
          <Utensils size={14} />
          <Text className="text-[9px] font-black uppercase tracking-[0.3em]">Gourmet Saudável Engine</Text>
      </Flex>
    </div>
  );
}