// pages\adminAnalytics\view\tab\ProductsTab.tsx
import React from "react";
import { Grid, Card, Flex, Title, Table, TableHead, TableRow, TableHeaderCell, TableBody, TableCell, Badge, BarList } from "@tremor/react";
import { ChefHat, BarChart3 } from "lucide-react";
import { AnalyticsData, formatters } from "../../logic/useAdminAnalytics";

export function ProductsTab({ stats }: { stats: AnalyticsData }) {
  return (
    <Grid numItemsLg={2} className="gap-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <Card className="rounded-4xl border-none shadow-sm ring-1 ring-slate-100 p-8">
        <Flex alignItems="center" className="gap-2 mb-6">
          <ChefHat className="text-emerald-500" size={24} />
          <Title className="font-black uppercase italic text-slate-800 tracking-tighter">Ranking: Pratos</Title>
        </Flex>
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell className="text-[10px] uppercase text-slate-400">Produto</TableHeaderCell>
              <TableHeaderCell className="text-[10px] uppercase text-right text-slate-400">Vendas</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {stats.topDishes.map((dish, idx) => (
              <TableRow key={idx}>
                <TableCell className="font-bold text-slate-700">{dish.name}</TableCell>
                <TableCell className="text-right">
                  <Badge color="emerald" className="rounded-lg font-black">{formatters.num(dish.count)} un.</Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Card className="rounded-4xl border-none shadow-sm ring-1 ring-slate-100 p-8">
        <Flex alignItems="center" className="gap-2 mb-6">
          <BarChart3 className="text-rose-500" size={24} />
          <Title className="font-black uppercase italic text-slate-800 tracking-tighter">Acompanhamentos</Title>
        </Flex>
        <BarList
          data={stats.topAccompaniments.map(a => ({ name: a.name, value: a.count }))}
          color="rose"
          className="mt-4"
          valueFormatter={formatters.num}
        />
      </Card>
    </Grid>
  );
}