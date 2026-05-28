// client/src/pages/profile/components/ProfileDashboardHome.tsx
import React, { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Star, ShoppingBag, MapPin, User, Utensils, RotateCcw, ExternalLink, ArrowRight, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { DietDashboardCard } from "./DietDashboardCard";
import { formatCurrency, formatDate, getOrderDiscounts, statusLabels, statusStyles } from "../utils/orderHelpers";
import { useReorder } from "../logic/useReorder";
import { ReorderDashboardCard } from "./ReorderDashboardCard";
import type { ProfileVM } from "../logic/ProfileLogic";
import type { Order } from "../types/orderTypes";

export function ProfileDashboardHome({ vm }: { vm: ProfileVM }) {
  const navigate = useNavigate();
  const { reorder, isLoading: isReordering } = useReorder();

  // 1. Saudação Dinâmica
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    const name = vm.user?.name?.split(" ")[0] || "Cliente";
    if (hour < 12) return `Bom dia, ${name} 👋`;
    if (hour < 18) return `Boa tarde, ${name} 👋`;
    return `Boa noite, ${name} 👋`;
  }, [vm.user]);

  // 2. Cálculos de Fidelidade Dinâmicos (Sem hardcoded rules)
  const loyaltyData = useMemo(() => {
    const balance = vm.loyalty?.points ?? vm.loyalty?.balance ?? 0;
    const settings = vm.loyaltySettings as Record<string, unknown> | null;

    if (!settings) {
      return { balance, cashbackValue: 0, showLoyalty: false, rulesText: "" };
    }

    const enabled = settings.enabled === true || String(settings.enabled) === "1";
    if (!enabled) {
      return { balance, cashbackValue: 0, showLoyalty: false, rulesText: "" };
    }

    const redemptionRatePoints = Math.max(1, Number(settings.redemptionRatePoints) || 100);
    const redemptionRateMoney = Math.max(0, Number(settings.redemptionRateMoney) || 1);
    const conversionRateMoney = Number(settings.conversionRateMoney) || 1;
    const conversionRatePoints = Number(settings.conversionRatePoints) || 1;
    const maxDiscountAmount = Number(settings.maxDiscountAmount) || 0;
    const minCartAmount = Number(settings.minCartAmount) || 0;

    const cashbackValue = (balance / redemptionRatePoints) * redemptionRateMoney;

    // Regra explicativa montada a partir das configurações dinâmicas
    const rulesText = `Cada R$ ${conversionRateMoney.toFixed(2).replace(".", ",")} em compras equivalem a ${conversionRatePoints} ponto(s). A cada ${redemptionRatePoints} pontos você libera R$ ${redemptionRateMoney.toFixed(2).replace(".", ",")} de desconto.`;

    const limitsText = [];
    if (maxDiscountAmount > 0) {
      limitsText.push(`Resgate máximo de R$ ${maxDiscountAmount.toFixed(2).replace(".", ",")} por pedido`);
    }
    if (minCartAmount > 0) {
      limitsText.push(`Compra mínima para resgate: R$ ${minCartAmount.toFixed(2).replace(".", ",")}`);
    }

    return {
      balance,
      cashbackValue,
      showLoyalty: true,
      rulesText,
      limitsText: limitsText.join(" | "),
    };
  }, [vm.loyalty, vm.loyaltySettings]);

  // 3. Identifica Pedidos Ativos vs Último Pedido
  const ordersList = (vm.orders as unknown as Order[]) ?? [];

  const { activeOrder } = useMemo(() => {
    const activeStatuses = ["pending", "processing", "shipped", "on_hold"];
    const active = ordersList.find(o => activeStatuses.includes(o.status.toLowerCase()));
    
    return {
      activeOrder: active || null,
    };
  }, [ordersList]);

  return (
    <div className="space-y-6 text-left animate-in fade-in duration-500">
      
      {/* 1. Header com Saudação */}
      <header className="mb-2">
        <h2 className="text-2xl md:text-3xl font-black uppercase italic text-slate-900 leading-none">
          {greeting}
        </h2>
        <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mt-2">
          Bem-vindo ao seu Hub de Relacionamento Gourmet Saudável
        </p>
      </header>

      {/* Recompra Rápida Visual */}
      <ReorderDashboardCard orders={ordersList} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Coluna da Esquerda e Centro (Pedidos, Dieta, Fidelidade) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Card de Pedido Ativo */}
          {activeOrder && (
            <Card className="rounded-[2rem] border-2 border-emerald-100 shadow-lg overflow-hidden bg-white">
              <div className="bg-emerald-50/50 p-4 border-b border-emerald-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock size={16} className="text-emerald-600" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-emerald-800">
                    Pedido em Andamento
                  </span>
                </div>
                <div className={`rounded-full text-[8px] md:text-[9px] font-black uppercase tracking-widest px-2.5 py-0.5 border ${statusStyles[activeOrder.status]}`}>
                  {statusLabels[activeOrder.status] || activeOrder.status}
                </div>
              </div>
              <CardContent className="p-6 flex flex-col sm:flex-row items-center justify-between gap-6">
                <div className="space-y-1 self-start sm:self-auto">
                  <h4 className="text-lg font-black text-slate-900 tracking-tighter uppercase italic">
                    Pedido #{activeOrder.id}
                  </h4>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                    Realizado em {formatDate(activeOrder.createdAt)} • Total: {formatCurrency(activeOrder.total)}
                  </p>
                </div>
                <Button
                  onClick={() => navigate(`/perfil/pedidos/${activeOrder.id}`)}
                  aria-label={`Rastrear pedido ${activeOrder.id}`}
                  className="w-full sm:w-auto h-11 px-6 rounded-xl border border-emerald-200 bg-white hover:bg-emerald-50 text-emerald-700 font-black uppercase text-[10px] tracking-widest transition-all shrink-0 flex items-center justify-center gap-2 group"
                >
                  <ExternalLink size={13} />
                  Rastrear Entrega
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Onboarding se não tiver pedidos */}
          {!activeOrder && ordersList.length === 0 && (
            <Card className="rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden bg-white hover:shadow-md transition-all duration-300">
              <CardContent className="p-6 md:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 text-left">
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-slate-50 flex items-center justify-center shrink-0 text-slate-400">
                    <ShoppingBag size={22} />
                  </div>
                  <div>
                    <h4 className="text-lg font-black text-slate-800 tracking-tight leading-tight">
                      Bem-vindo ao Gourmet Saudável 👋
                    </h4>
                    <p className="text-xs text-slate-500 font-medium leading-relaxed mt-1 max-w-md">
                      Conheça nossas refeições saudáveis e monte seu primeiro pedido.
                    </p>
                  </div>
                </div>
                <Button
                  onClick={() => navigate("/produtos")}
                  className="w-full sm:w-auto h-11 px-6 rounded-xl bg-primary hover:bg-primary-hover text-white font-black uppercase text-[10px] tracking-widest shadow-md transition-all shrink-0 flex items-center justify-center gap-2 group"
                >
                  Explorar Cardápio
                  <ArrowRight size={13} className="transition-transform group-hover:translate-x-1" />
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Card da Dieta (Prescrição do Nutricionista) */}
          <DietDashboardCard diet={vm.diet} isLoading={vm.isLoadingDiet} />

          {/* Card de Fidelidade e Cashback */}
          {loyaltyData.showLoyalty && (
            <Card className="rounded-[2rem] bg-slate-900 border-none shadow-xl overflow-hidden relative text-white">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50/10 blur-3xl rounded-full -mr-16 -mt-16" />
              <CardContent className="p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2 text-emerald-400">
                    <Star size={16} className="fill-emerald-400" />
                    <span className="text-[9px] font-black uppercase tracking-widest leading-none">Programa de Fidelidade</span>
                  </div>
                  <h3 className="text-3xl md:text-4xl font-black italic tracking-tighter leading-none">
                    {loyaltyData.balance} <span className="text-xs not-italic tracking-wider text-emerald-400 uppercase">pts</span>
                  </h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">
                    Equivale a {formatCurrency(loyaltyData.cashbackValue)} de cashback disponível
                  </p>
                  <p className="text-[9px] text-slate-500 font-medium leading-relaxed max-w-lg mt-1 pt-1 border-t border-white/5">
                    {loyaltyData.rulesText} {loyaltyData.limitsText && `(${loyaltyData.limitsText})`}
                  </p>
                </div>
                
                <Button
                  onClick={() => navigate("/perfil/fidelidade")}
                  className="w-full md:w-auto h-11 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase text-[10px] tracking-widest shadow-md transition-all shrink-0 flex items-center justify-center gap-2 group"
                >
                  Ver Extrato
                  <ArrowRight size={13} className="transition-transform group-hover:translate-x-1" />
                </Button>
              </CardContent>
            </Card>
          )}

        </div>

        {/* Coluna da Direita (Atalhos Rápidos de Navegação) */}
        <div className="space-y-6">
          <Card className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm">
            <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider mb-5 border-b border-slate-100 pb-3">
              Acesso Rápido
            </h3>
            <div className="flex flex-col gap-3">
              <ShortcutButton
                icon={<ShoppingBag size={16} />}
                label="Meus Pedidos"
                description="Histórico e rastreios"
                onClick={() => navigate("/perfil/pedidos")}
              />
              <ShortcutButton
                icon={<MapPin size={16} />}
                label="Endereços de Entrega"
                description="Gerencie seus locais"
                onClick={() => navigate("/perfil/enderecos")}
              />
              <ShortcutButton
                icon={<User size={16} />}
                label="Dados Pessoais"
                description="Atualize seu perfil"
                onClick={() => navigate("/perfil/dados")}
              />
              <ShortcutButton
                icon={<Star size={16} />}
                label="Cashback e Pontos"
                description="Extrato de recompensas"
                onClick={() => navigate("/perfil/fidelidade")}
              />
              <ShortcutButton
                icon={<Utensils size={16} />}
                label="Meu Plano Alimentar"
                description="Refeições recomendadas"
                onClick={() => navigate("/meu-plano")}
              />
            </div>
          </Card>
        </div>

      </div>

    </div>
  );
}

function ShortcutButton({ icon, label, description, onClick }: { icon: React.ReactNode, label: string, description: string, onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-4 p-3 rounded-2xl border-none bg-slate-50/60 hover:bg-slate-100/70 transition-all duration-300 text-left w-full group"
    >
      <div className="h-10 w-10 rounded-xl bg-white shadow-sm flex items-center justify-center shrink-0 text-slate-500 group-hover:text-emerald-600 transition-colors">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="text-xs font-bold text-slate-800 tracking-tight mb-0.5 group-hover:text-emerald-700 transition-colors">
          {label}
        </h4>
        <p className="text-[10px] text-slate-400 font-semibold tracking-tight leading-none">
          {description}
        </p>
      </div>
      <ArrowRight size={14} className="text-slate-300 group-hover:text-slate-600 transition-all group-hover:translate-x-1 shrink-0" />
    </button>
  );
}
