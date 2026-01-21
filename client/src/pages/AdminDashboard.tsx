import React from "react";
import { useLocation } from "wouter";
import { trpc } from "@/_core/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { 
  BarChart3, ShoppingCart, TrendingUp, 
  Utensils, Package, Settings, ArrowUpRight, 
  AlertCircle, Wallet, Zap, ShieldCheck 
} from "lucide-react";
import { cn } from "@/lib/utils";
import { 
  LineChart, Line, ResponsiveContainer, Tooltip 
} from 'recharts';

export default function AdminDashboard() {
  const [location, setLocation] = useLocation();
  const { data: stats, isLoading } = trpc.admin.analytics.getStats.useQuery();

  if (isLoading) {
    return (
      <div className="p-10 flex flex-col items-center justify-center min-h-[400px]">
        <Zap className="animate-pulse text-emerald-500 mb-4" size={40} />
        <p className="font-black uppercase text-[10px] tracking-[0.3em] text-slate-400">Sincronizando Inteligência...</p>
      </div>
    );
  }

  return (
    <div className="space-y-10 pb-10">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-4xl font-black uppercase italic tracking-tighter text-slate-900 leading-none">
            Visão <span className="text-emerald-600">Geral</span>
          </h1>
          <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-2">
            Desempenho operacional e comportamento do cliente
          </p>
        </div>
        <div className="bg-white px-4 py-2 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3">
          <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[9px] font-black uppercase tracking-widest text-slate-600">Monitor em Tempo Real</span>
        </div>
      </div>

      {/* 1. CARDS DE PERFORMANCE */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          label="Vendas Hoje" 
          value={stats?.revenueToday || "R$ 0,00"} 
          icon={<Wallet size={20} />} 
          trend="+12%" 
          color="emerald" 
        />
        <StatCard 
          label="Pedidos Ativos" 
          value={stats?.ordersToday || "0"} 
          icon={<ShoppingCart size={20} />} 
          trend="Novo" 
          color="slate" 
        />
        <StatCard 
          label="Abandono de Sacola" 
          value={`${stats?.abandonmentRate || 0}%`} 
          icon={<AlertCircle size={20} />} 
          trend="-2%" 
          trendColor="emerald" 
          color="amber" 
        />
        <StatCard 
          label="Conversão" 
          value="4.2%" 
          icon={<BarChart3 size={20} />} 
          trend="+0.8%" 
          color="slate" 
        />
      </div>

      {/* 2. GRÁFICO E INSIGHTS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/40">
           <div className="flex justify-between items-center mb-8 px-2">
              <h3 className="text-xs font-black uppercase italic tracking-tight text-slate-900 flex items-center gap-2">
                <TrendingUp size={16} className="text-emerald-500" /> Curva de Receita
              </h3>
           </div>
           <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stats?.conversionTrend || []}>
                  <Tooltip 
                    contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', fontSize: '10px', fontWeight: 'bold' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="val" 
                    stroke="#10b981" 
                    strokeWidth={4} 
                    dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }} 
                  />
                </LineChart>
              </ResponsiveContainer>
           </div>
        </div>

        <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white space-y-8 flex flex-col justify-between shadow-2xl shadow-emerald-900/20">
           <div className="space-y-6">
              <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-500/60">Insights PostHog</h3>
              <div className="space-y-4">
                 <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                    <p className="text-[9px] font-black uppercase text-slate-500 mb-1">Mais Visualizado</p>
                    <p className="text-sm font-black uppercase italic tracking-tighter">Marmita Fit Frango</p>
                 </div>
                 <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                    <p className="text-[9px] font-black uppercase text-slate-500 mb-1">Origem Principal</p>
                    <p className="text-sm font-black uppercase italic tracking-tighter">Instagram Ads</p>
                 </div>
              </div>
           </div>
           <button 
             onClick={() => window.open('https://app.posthog.com', '_blank')}
             className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
           >
             Ver Replays <ArrowUpRight size={14} />
           </button>
        </div>
      </div>

      {/* 3. AÇÕES RÁPIDAS (Bento Grid Style) */}
      <div className="space-y-6">
        <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 ml-2">Atalhos Operacionais</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
          <QuickActionCard 
            onClick={() => setLocation("/admin/dishes")}
            title="Cardápio"
            desc="Pratos e Preços"
            icon={<Utensils size={24} />}
          />
          <QuickActionCard 
            onClick={() => setLocation("/admin/packages")}
            title="Pacotes"
            desc="Kits Mensais"
            icon={<Package size={24} />}
          />
          {/* ✅ NOVO CARD DE MARKETING */}
          <QuickActionCard 
            onClick={() => setLocation("/admin/marketing")}
            title="Marketing"
            desc="Vendas e Regras"
            icon={<TrendingUp size={24} />}
            variant="marketing"
          />
          <QuickActionCard 
            onClick={() => setLocation("/admin/logs")}
            title="Auditoria"
            desc="Logs do Sistema"
            icon={<ShieldCheck size={24} />}
            variant="highlight"
          />
          <QuickActionCard 
            onClick={() => setLocation("/admin/settings")}
            title="Ajustes"
            desc="Loja e Horários"
            icon={<Settings size={24} />}
          />
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, trend, color, trendColor }: any) {
  const colorStyles = {
    emerald: "text-emerald-600 bg-emerald-50",
    amber: "text-amber-600 bg-amber-50",
    slate: "text-slate-900 bg-slate-50",
  }[color as "emerald" | "amber" | "slate"];

  return (
    <Card className="border-none shadow-sm rounded-[2rem] bg-white overflow-hidden hover:shadow-md transition-shadow">
      <CardContent className="p-8">
        <div className={cn("h-12 w-12 rounded-2xl flex items-center justify-center mb-6", colorStyles)}>
          {icon}
        </div>
        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">{label}</p>
        <div className="flex items-end justify-between">
          <h4 className="text-2xl font-black text-slate-900 tracking-tighter italic">{value}</h4>
          <span className={cn(
            "text-[9px] font-black px-2 py-1 rounded-lg", 
            trendColor === 'emerald' ? 'text-emerald-600 bg-emerald-50' : 'text-slate-400 bg-slate-100'
          )}>
            {trend}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

function QuickActionCard({ onClick, title, desc, icon, variant }: any) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "group p-6 bg-white border border-slate-100 rounded-[2.5rem] hover:border-emerald-500 transition-all flex items-center gap-5 shadow-sm text-left outline-none",
        variant === 'highlight' && "hover:border-slate-900",
        variant === 'marketing' && "hover:border-orange-500"
      )}
    >
      <div className={cn(
        "h-12 w-12 rounded-2xl bg-slate-50 text-slate-400 group-hover:bg-emerald-600 group-hover:text-white transition-all flex items-center justify-center shadow-inner",
        variant === 'highlight' && "group-hover:bg-slate-900",
        variant === 'marketing' && "group-hover:bg-orange-500"
      )}>
        {icon}
      </div>
      <div>
        <p className="font-black text-slate-900 uppercase italic tracking-tighter leading-none text-sm">{title}</p>
        <p className="text-[9px] text-slate-400 font-bold uppercase mt-1 leading-tight">{desc}</p>
      </div>
    </button>
  );
}