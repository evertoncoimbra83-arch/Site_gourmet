// client/src/pages/adminAnalytics/components/AnalyticsWidgets.tsx

import React from "react";
import { 
  Card, Text, Metric, Flex, Grid, Title, 
  BarList, Table, TableHead, TableRow, 
  TableHeaderCell, TableBody, TableCell, Badge, DonutChart 
} from "@tremor/react";
import { 
  Wallet, TrendingUp, Ticket, Users, 
  Utensils, CreditCard, ChefHat,
  LucideIcon, 
  SearchX
} from "lucide-react";
import { AnalyticsData, formatters } from "../logic/useAdminAnalytics";
import { cn } from "@/lib/utils";

// --- AUXILIAR: ESTADO VAZIO ---
export const AnalyticsEmptyState = ({ 
  icon: Icon, 
  label 
}: { 
  icon: LucideIcon,
  label: string 
}) => (
  <div className="flex flex-col items-center justify-center py-16 opacity-30 border-2 border-dashed border-slate-200 rounded-[2rem] bg-slate-50/50 w-full h-full min-h-50">
    <Icon size={40} className="text-slate-300" />
    <Text className="text-[10px] font-black uppercase mt-4 tracking-widest text-slate-400">{label}</Text>
  </div>
);

// --- WIDGET: KPIs PRINCIPAIS ---
export const KPISection = ({ data }: { data: AnalyticsData }) => {
  const kpis = [
    { label: "Receita Líquida", val: formatters.money(data.financials.netRevenue), icon: Wallet, color: "emerald" as const, desc: "Livre de descontos", bgClass: "bg-emerald-50", textClass: "text-emerald-500" },
    { label: "Ticket Médio", val: formatters.money(data.avgTicket), icon: TrendingUp, color: "blue" as const, desc: "Por pedido concluído", bgClass: "bg-blue-50", textClass: "text-blue-500" },
    { label: "Descontos", val: formatters.money(data.totalGivenDiscounts), icon: Ticket, color: "rose" as const, desc: "Margem reinvestida", bgClass: "bg-rose-50", textClass: "text-rose-500" },
    { label: "Novos Clientes", val: formatters.num(data.newCustomers), icon: Users, color: "amber" as const, desc: "Cadastros no período", bgClass: "bg-amber-50", textClass: "text-amber-500" },
  ];

  return (
    <Grid numItemsSm={2} numItemsLg={4} className="gap-6">
      {kpis.map((kpi) => (
        <Card key={kpi.label} className="rounded-[2rem] border-none shadow-sm ring-1 ring-slate-100 p-6" decoration="top" decorationColor={kpi.color}>
          <Flex justifyContent="between" alignItems="start">
            <div>
              <Text className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{kpi.label}</Text>
              <Metric className="font-black text-slate-900 mt-1">{kpi.val}</Metric>
              <Text className="mt-2 text-[10px] text-slate-400 italic leading-none">{kpi.desc}</Text>
            </div>
            {/* O Tailwind não suporta interpolação dinâmica pura (ex: bg-${color}-50). Usamos as classes mapeadas acima */}
            <div className={cn("p-2 rounded-xl", kpi.bgClass)}>
                <kpi.icon size={16} className={cn(kpi.textClass)} />
            </div>
          </Flex>
        </Card>
      ))}
    </Grid>
  );
};

// --- WIDGET: RANKINGS (PRATOS E PAGAMENTOS) ---
export const RankingsSection = ({ data }: { data: AnalyticsData }) => (
  <Grid numItemsLg={2} className="gap-6">
    <Card className="rounded-4xl border-none shadow-sm ring-1 ring-slate-100 p-8 flex flex-col h-full">
      <Title className="font-black uppercase italic text-slate-800 tracking-tighter mb-6 flex items-center gap-2">
        <Utensils size={18} className="text-emerald-500" /> Pratos Mais Vendidos
      </Title>
      {data.topDishes.length > 0 ? (
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell className="text-[10px] uppercase text-slate-400">Produto</TableHeaderCell>
              <TableHeaderCell className="text-right text-[10px] uppercase text-slate-400">Qtd</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.topDishes.map((dish) => (
              <TableRow key={dish.dishId}>
                <TableCell className="font-bold text-slate-700">{dish.name}</TableCell>
                <TableCell className="text-right">
                  <Badge color="emerald" className="rounded-lg font-black border-none px-3 py-1 text-[10px] uppercase tracking-tighter">
                    {dish.count} un.
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <div className="flex-1 flex"><AnalyticsEmptyState icon={SearchX} label="Nenhum prato vendido" /></div>
      )}
    </Card>

    <Card className="rounded-4xl border-none shadow-sm ring-1 ring-slate-100 p-8 flex flex-col h-full">
      <Title className="font-black uppercase italic text-slate-800 tracking-tighter mb-6 flex items-center gap-2">
        <CreditCard size={18} className="text-blue-500" /> Métodos de Pagamento
      </Title>
      {data.paymentMethods.length > 0 ? (
        <>
          <div className="mt-4 flex-1">
            <BarList 
              data={data.paymentMethods.map(p => ({ name: p.name, value: p.value }))} 
              color="blue" 
              valueFormatter={formatters.money} 
            />
          </div>
          <Grid numItems={2} className="gap-4 mt-8 pt-6 border-t border-slate-50">
            {data.paymentMethods.slice(0, 4).map(p => (
              <div key={p.name} className="p-4 rounded-2xl bg-slate-50/50 border border-slate-100">
                <Text className="text-[9px] font-black uppercase text-slate-400 truncate tracking-widest leading-none">{p.name}</Text>
                <p className="text-lg font-black text-slate-900 mt-2">{p.count} <span className="text-xs font-normal text-slate-400">vendas</span></p>
              </div>
            ))}
          </Grid>
        </>
      ) : (
        <div className="flex-1 flex"><AnalyticsEmptyState icon={CreditCard} label="Sem dados financeiros" /></div>
      )}
    </Card>
  </Grid>
);

// --- WIDGET: MARKETING (CUPONS E DESCONTOS) ---
export const MarketingSection = ({ data }: { data: AnalyticsData }) => (
  <Grid numItemsSm={1} numItemsLg={2} className="gap-6">
    <Card className="rounded-4xl border-none shadow-sm ring-1 ring-slate-100 p-8 flex flex-col h-full">
      <Title className="font-black uppercase italic text-slate-800 tracking-tighter mb-6 flex items-center gap-2">
        <Ticket size={18} className="text-amber-500" /> Mix de Descontos
      </Title>
      {data.discountBreakdown.some(d => d.value > 0) ? (
        <DonutChart
          className="h-64 mt-6"
          data={data.discountBreakdown}
          category="value"
          index="name"
          colors={["amber", "emerald", "slate"]}
          valueFormatter={formatters.money}
          variant="pie"
        />
      ) : (
        <div className="flex-1 flex"><AnalyticsEmptyState icon={Ticket} label="Nenhum desconto aplicado" /></div>
      )}
    </Card>

    <Card className="rounded-4xl border-none shadow-sm ring-1 ring-slate-100 p-8 flex flex-col h-full">
      <Title className="font-black uppercase italic text-slate-800 tracking-tighter mb-6">Top Cupons</Title>
      {data.topCoupons.length > 0 ? (
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell className="text-[10px] uppercase text-slate-400">Cupom</TableHeaderCell>
              <TableHeaderCell className="text-right text-[10px] uppercase text-slate-400">Uso</TableHeaderCell>
              <TableHeaderCell className="text-right text-[10px] uppercase text-slate-400">Total</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.topCoupons.map((c) => (
              <TableRow key={c.coupon}>
                <TableCell><Badge color="amber" className="uppercase font-black px-3 rounded-lg border-none text-[10px] tracking-wider">{c.coupon}</Badge></TableCell>
                <TableCell className="text-right font-black text-slate-600 italic tracking-tighter">{c.usage_count}x</TableCell>
                <TableCell className="text-right font-black text-slate-900">{formatters.money(c.total_discounted)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <div className="flex-1 flex"><AnalyticsEmptyState icon={Ticket} label="Sem uso de cupons" /></div>
      )}
    </Card>
  </Grid>
);

// --- WIDGET: INTELIGÊNCIA DE MENU ---
export const MenuIntelligenceSection = ({ data }: { data: AnalyticsData }) => (
  <Grid numItemsSm={1} numItemsLg={2} className="gap-6">
    <Card className="rounded-4xl border-none shadow-sm ring-1 ring-slate-100 p-8 flex flex-col h-full">
      <Title className="font-black uppercase italic text-slate-800 tracking-tighter mb-6 flex items-center gap-2">
        <ChefHat size={18} className="text-rose-500" /> Acompanhamentos
      </Title>
      {data.topAccompaniments.length > 0 ? (
        <BarList 
          data={data.topAccompaniments.map(a => ({ name: a.name, value: a.count }))} 
          color="rose" 
          valueFormatter={formatters.num} 
        />
      ) : (
        <div className="flex-1 flex"><AnalyticsEmptyState icon={ChefHat} label="Sem acompanhamentos" /></div>
      )}
    </Card>

    <Card className="rounded-4xl border-none shadow-sm ring-1 ring-slate-100 p-8 flex flex-col h-full">
      <Title className="font-black uppercase italic text-slate-800 tracking-tighter mb-6">Mix em Pacotes</Title>
      {data.topDishesInPackages.length > 0 ? (
        <Table>
            <TableHead>
            <TableRow>
                <TableHeaderCell className="text-[10px] uppercase text-slate-400">Prato</TableHeaderCell>
                <TableHeaderCell className="text-right text-[10px] uppercase text-slate-400">Qtd</TableHeaderCell>
            </TableRow>
            </TableHead>
            <TableBody>
            {data.topDishesInPackages.map((d) => (
                <TableRow key={d.dishId}>
                <TableCell className="font-bold text-slate-700">{d.name}</TableCell>
                <TableCell className="text-right font-black text-emerald-600">{d.count}x</TableCell>
                </TableRow>
            ))}
            </TableBody>
        </Table>
      ) : (
        <div className="flex-1 flex"><AnalyticsEmptyState icon={Utensils} label="Sem mix de pacotes" /></div>
      )}
    </Card>
  </Grid>
);