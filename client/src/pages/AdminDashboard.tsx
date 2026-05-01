import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom"; 
import { trpc } from "@/_core/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { 
  ShoppingCart, TrendingUp, 
  Utensils, Settings, 
  AlertCircle, Wallet, Zap, Palette,
  RefreshCcw, Clock, PackageSearch,
  BarChart3
} from "lucide-react";
import { cn } from "@/lib/utils";
import { 
  LineChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis 
} from 'recharts';
import { SystemHealthIndicator } from "../components/SystemHealthIndicator";
import { Badge } from "@/components/ui/badge";
import OrderDetailsDrawer from "@/pages/adminOrders/components/OrderDetailsDrawer";
import { formatCurrency } from "@/pages/profile/utils/orderHelpers";

// --- INTERFACES DE TIPAGEM ---

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  trend: string;
  color: "emerald" | "amber" | "slate" | "rose";
  trendColor?: "emerald" | "slate" | "rose";
  isLive?: boolean;
  onClick?: () => void;
}

interface QuickActionProps {
  onClick: () => void;
  title: string;
  desc: string;
  icon: React.ReactNode;
  variant?: "theme" | "marketing" | "default";
}

// ✅ Interface ajustada para refletir o schema real do banco/admin
interface RecentOrder {
  id: string;
  customerName: string | null;
  status: string | null;
  createdAt: string | Date | null;
  total: number | null; // Corrigido de totalAmount para total
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const utils = trpc.useUtils();
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  // 1. Métricas de Analytics (BI)
  const { data: stats, isLoading, isFetching } = trpc.admin.analytics.getDashboardStats.useQuery(undefined, {
    refetchInterval: 30000, 
    refetchOnWindowFocus: true,
  });

  // 2. Busca de Pedidos Recentes - Sincronizado com a lista real do Admin
  const { data: ordersResponse } = trpc.admin.orders.list.useQuery(
    { perPage: 5, page: 1 }, 
    { refetchInterval: 30000 }
  ); 
  
  // ✅ Mapeamento seguro para evitar valores zerados
  const recentOrders = (ordersResponse?.orders || []) as unknown as RecentOrder[];

  useEffect(() => {
    utils.admin.analytics.getDashboardStats.invalidate();
  }, [utils]);

  const totalOrdersCount = useMemo(() => {
    return stats?.paymentMethods?.reduce((acc, p) => acc + (Number(p.value) || 0), 0) || 0;
  }, [stats]);

  const averageTicket = totalOrdersCount > 0 
    ? ((stats?.financials?.grossRevenue || 0) / totalOrdersCount) 
    : 0;

  if (isLoading) {
    return (
      <div className="p-10 flex flex-col items-center justify-center min-h-[60vh]">
        <Zap className="animate-pulse text-emerald-500 mb-4" size={40} />
        <p className="font-black uppercase text-[10px] tracking-[0.3em] text-slate-400">Sincronizando BI...</p>
      </div>
    );
  }

  return (
    <div className="space-y-10 pb-10 text-left animate-in fade-in duration-500">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-4xl font-black uppercase italic tracking-tighter text-slate-900 leading-none">
              Painel <span className="text-emerald-600">Operacional</span>
            </h1>
            {isFetching && <RefreshCcw size={14} className="animate-spin text-slate-300 mt-1" />}
          </div>
          <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-2">
            Métricas de faturamento e fluxo de pedidos em tempo real
          </p>
        </div>
        
        <div className="flex flex-col items-end gap-2 bg-white p-3 rounded-2xl shadow-sm border border-slate-100">
            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest px-1">Integridade do Sistema</span>
            <SystemHealthIndicator />
        </div>
      </div>

      {/* 1. CARDS DE PERFORMANCE */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          onClick={() => navigate("/admin/analytics")}
          label="Receita Bruta" 
          value={formatCurrency(stats?.financials?.grossRevenue || 0)} 
          icon={<Wallet size={20} />} 
          trend="Hoje" 
          color="emerald" 
          trendColor="emerald"
        />
        <StatCard 
          onClick={() => navigate("/admin/orders")}
          label="Pedidos" 
          value={totalOrdersCount} 
          icon={<ShoppingCart size={20} />} 
          trend="Tempo Real" 
          color="slate" 
          isLive={true}
        />
        <StatCard 
          label="Ticket Médio" 
          value={formatCurrency(averageTicket)} 
          icon={<TrendingUp size={20} />} 
          trend="Por Pedido" 
          color="emerald" 
        />
        <StatCard 
          onClick={() => navigate("/admin/users")}
          label="Novos Clientes" 
          value={stats?.newCustomers ?? 0} 
          icon={<AlertCircle size={20} />} 
          trend="Conversão" 
          color="slate" 
        />
      </div>

      {/* 2. GRÁFICO DE BI E FEED DE PEDIDOS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Gráfico de BI (Analytics Real) */}
        <div className="lg:col-span-2 bg-white p-8 rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-200/40">
            <div className="flex justify-between items-center mb-8 px-2">
              <h3 className="text-xs font-black uppercase italic tracking-tight text-slate-900 flex items-center gap-2">
                <BarChart3 size={16} className="text-emerald-500" /> Histórico de Vendas
              </h3>
              <button 
                onClick={() => navigate("/admin/analytics")}
                className="text-[9px] font-black uppercase tracking-widest text-emerald-600 hover:underline"
              >
                Análise Completa
              </button>
            </div>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stats?.chartData || []}>
                  <XAxis dataKey="name" hide />
                  <YAxis hide />
                  <Tooltip 
                    contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', fontSize: '10px', fontWeight: 'bold' }}
                    formatter={(value) => [
                      formatCurrency(Number(value || 0)),
                      "Faturamento",
                    ]}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="Faturamento" 
                    stroke="#10b981" 
                    strokeWidth={4} 
                    dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }} 
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
        </div>

        {/* FEED DE PEDIDOS RECENTES - Fix de valores zerados */}
        <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-200/40 flex flex-col">
            <div className="flex justify-between items-center mb-6 px-2">
              <h3 className="text-xs font-black uppercase italic tracking-tight text-slate-900 flex items-center gap-2">
                <Clock size={16} className="text-emerald-500" /> Fluxo de Pedidos
              </h3>
            </div>
            
            <div className="flex-1 space-y-4 overflow-y-auto pr-2 custom-scrollbar">
              {recentOrders.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-3 opacity-50 py-10">
                  <PackageSearch size={32} className="text-slate-300" />
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Aguardando pedidos...</p>
                </div>
              ) : (
                recentOrders.map((order) => (
                  <div 
                    key={order.id} 
                    className="group p-4 bg-slate-50 hover:bg-emerald-50/50 rounded-3xl border border-slate-100 transition-all cursor-pointer" 
                    onClick={() => setSelectedOrderId(order.id)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <p className="text-[10px] font-black uppercase text-slate-900 truncate pr-2">
                        {order.customerName || "Cliente Gourmet"}
                      </p>
                      <Badge className={cn(
                        "text-[8px] uppercase tracking-widest font-black border-none",
                        order.status === 'pending' ? "bg-amber-100 text-amber-700" :
                        order.status === 'completed' ? "bg-emerald-100 text-emerald-700" :
                        "bg-blue-100 text-blue-700"
                      )}>
                        {order.status || "Novo"}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-end">
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                        {order.createdAt ? new Date(order.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : "--:--"}
                      </p>
                      <p className="text-sm font-black italic text-emerald-600">
                        {/* ✅ CORREÇÃO: Usando order.total em vez de totalAmount */}
                        {formatCurrency(Number(order.total || 0))}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
        </div>
      </div>

      {/* 3. ATALHOS RÁPIDOS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <QuickActionCard 
          onClick={() => navigate("/admin/dishes")}
          title="Cardápio"
          desc="Pratos e Ingredientes"
          icon={<Utensils size={24} />}
        />
        <QuickActionCard 
          onClick={() => navigate("/admin/theme")}
          title="Aparência"
          desc="Banners e Identidade"
          icon={<Palette size={24} />}
          variant="theme"
        />
        <QuickActionCard 
          onClick={() => navigate("/admin/marketing")}
          title="Campanhas"
          desc="Cupons e Promoções"
          icon={<Zap size={24} />}
          variant="marketing"
        />
        <QuickActionCard 
          onClick={() => navigate("/admin/settings")}
          title="Ajustes"
          desc="Configurações de Loja"
          icon={<Settings size={24} />}
        />
      </div>

      <OrderDetailsDrawer 
        orderId={selectedOrderId} 
        onClose={() => setSelectedOrderId(null)} 
      />
    </div>
  );
}

// --- SUBCOMPONENTES ---

function StatCard({ label, value, icon, trend, color, trendColor, isLive, onClick }: StatCardProps) {
  const colorStyles = {
    emerald: "text-emerald-600 bg-emerald-50",
    amber: "text-amber-600 bg-amber-50",
    slate: "text-slate-900 bg-slate-50",
    rose: "text-rose-600 bg-rose-50",
  }[color];

  return (
    <Card 
      onClick={onClick}
      className={cn(
        "border-none shadow-sm rounded-4xl bg-white overflow-hidden transition-all duration-300 text-left",
        onClick ? "cursor-pointer hover:shadow-xl hover:scale-[1.02] hover:ring-2 hover:ring-emerald-500/20" : "hover:shadow-md"
      )}
    >
      <CardContent className="p-8">
        <div className="flex justify-between items-start mb-6">
          <div className={cn("h-12 w-12 rounded-2xl flex items-center justify-center", colorStyles)}>
            {icon}
          </div>
          {isLive && (
            <div className="flex items-center gap-1.5 px-2 py-1 bg-emerald-50 rounded-lg">
               <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
               <span className="text-[8px] font-black text-emerald-600 uppercase tracking-widest">Live</span>
            </div>
          )}
        </div>
        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">{label}</p>
        <div className="flex items-end justify-between">
          <h4 className="text-2xl font-black text-slate-900 tracking-tighter italic leading-none">{value}</h4>
          <span className={cn(
            "text-[9px] font-black px-2 py-1 rounded-lg tracking-widest uppercase", 
            trendColor === 'emerald' ? 'text-emerald-600 bg-emerald-50' : 'text-slate-400 bg-slate-100'
          )}>
            {trend}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

function QuickActionCard({ onClick, title, desc, icon, variant }: QuickActionProps) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "group p-6 bg-white border border-slate-100 rounded-4xl hover:border-slate-900 transition-all flex items-center gap-5 shadow-sm text-left outline-none active:scale-95 hover:shadow-xl",
        variant === 'theme' && "hover:border-emerald-500",
        variant === 'marketing' && "hover:border-emerald-500"
      )}
    >
      <div className={cn(
        "h-14 w-14 rounded-2xl bg-slate-50 text-slate-300 group-hover:bg-slate-900 group-hover:text-white transition-all flex items-center justify-center shadow-inner shrink-0",
        variant === 'theme' && "group-hover:bg-emerald-600",
        variant === 'marketing' && "group-hover:bg-emerald-600"
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
