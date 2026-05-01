import React from "react";
import { Grid, Card, Flex, Title, Table, TableHead, TableRow, TableHeaderCell, TableBody, TableCell, Badge, DonutChart, Text } from "@tremor/react";
import { Tag, SearchX } from "lucide-react";
import { AnalyticsData } from "../../logic/useAdminAnalytics";
import { formatCurrency } from "../../utils/formatters";

export function MarketingTab({ stats }: { stats: AnalyticsData }) {
  const hasDiscounts = stats.discountBreakdown.some(d => d.value > 0);
  
  return (
    <Grid numItemsLg={2} className="gap-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <Card className="rounded-4xl border-none shadow-sm ring-1 ring-slate-100 p-8">
        <Flex alignItems="center" className="gap-2 mb-6">
          <Tag className="text-amber-500" size={24} />
          <Title className="font-black uppercase italic text-slate-800 tracking-tighter">Top Cupons</Title>
        </Flex>
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell className="text-[10px] uppercase text-slate-400">Cupom</TableHeaderCell>
              <TableHeaderCell className="text-[10px] uppercase text-right text-slate-400">Total Desconto</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {stats.topCoupons.map((c, idx) => (
              <TableRow key={idx}>
                <TableCell><Badge color="amber" className="font-black">{c.coupon}</Badge></TableCell>
                <TableCell className="text-right font-black text-rose-500">{formatCurrency(c.total_discounted)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Card className="rounded-4xl border-none shadow-sm ring-1 ring-slate-100 p-8 text-center">
        <Title className="font-black uppercase italic text-slate-800 tracking-tighter mb-6">Mix de Descontos</Title>
        {hasDiscounts ? (
          <DonutChart
            data={stats.discountBreakdown}
            category="value"
            index="name"
            colors={["amber", "emerald", "rose"]}
            valueFormatter={formatCurrency}
            className="h-64"
          />
        ) : (
          <Flex className="flex-col justify-center h-64 opacity-20">
            <SearchX size={48} className="mx-auto" />
            <Text className="text-[10px] font-black uppercase mt-4">Sem cupons utilizados</Text>
          </Flex>
        )}
      </Card>
    </Grid>
  );
}