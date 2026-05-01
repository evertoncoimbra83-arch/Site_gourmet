import React, { useState } from "react";
import { Title, Text, Flex, TabGroup, TabList, Tab, Button, Badge } from "@tremor/react";
import { Loader2, RefreshCw, Monitor, Activity } from "lucide-react";
import { useAdminAnalytics } from "../logic/useAdminAnalytics"; 
import { trpc } from "@/_core/trpc"; // Importado para checar status global

// 📦 Importando os módulos
import { OverviewTab } from "./tab/OverviewTab";
import { ProductsTab } from "./tab/ProductsTab";
import { MarketingTab } from "./tab/MarketingTab";
import { FinanceTab } from "./tab/FinanceTab";
import { HealthTab } from "./tab/HealthTab"; // ✅ Nossa nova aba de infra
import { GA4Panel } from "../components/GA4Panel";
import { EmptyState } from "../components/EmptyState";

export default function AdminAnalyticsView() {
  const { 
    stats, 
    isLoading, 
    periodIndex, 
    setPeriodIndex, 
    periodLabels, 
    syncHistory, 
    isSyncing 
  } = useAdminAnalytics();

  const [activeTab, setActiveTab] = useState(0);

  // ✅ Monitoramento silencioso para o Header
  const { data: health } = trpc.admin.health.checkStatus.useQuery(undefined, {
    refetchInterval: 30000, // Checa a cada 30s se o "fio" ainda está passando corrente
  });

  const isSystemCritical = health?.status === "critical";

  if (isLoading && !stats) {
    return (
      <div className="h-[70vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="animate-spin text-emerald-600" size={40} />
        <Text className="font-black uppercase tracking-[0.3em] text-slate-400 text-[10px]">Sincronizando BI...</Text>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700 text-left pb-12">
      
      {/* 1. HEADER E AÇÕES */}
      <div className="border-b border-slate-100 pb-8 space-y-6">
        <Flex justifyContent="between" alignItems="center" className="flex-wrap gap-4">
          <div className="space-y-1">
            <Title className="text-4xl md:text-5xl font-black uppercase italic tracking-tighter text-slate-900 leading-none">
              Business <span className="text-emerald-600">Intelligence</span>
            </Title>
            {isSystemCritical && (
              <Badge color="rose" icon={Activity} className="animate-pulse rounded-lg font-black uppercase text-[8px] border-none py-1">
                SISTEMA EM MODO DE CRÍTICO (.10 OFFLINE)
              </Badge>
            )}
          </div>
          
          <Button
            variant="secondary"
            onClick={() => syncHistory()}
            disabled={isSyncing}
            icon={isSyncing ? Loader2 : RefreshCw}
            className="rounded-2xl h-12 bg-white border-slate-200 font-black uppercase tracking-widest text-[10px] shadow-sm hover:shadow-md transition-all"
          >
            {isSyncing ? "SINCRONIZANDO..." : "ATUALIZAR DADOS"}
          </Button>
        </Flex>

        {/* 2. MENU DE NAVEGAÇÃO (TABS) */}
        <Flex justifyContent="between" className="flex-wrap gap-6 items-end">
          <div className="space-y-2">
            <Text className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Visão Analítica</Text>
            <TabGroup index={activeTab} onIndexChange={setActiveTab}>
              <TabList variant="line" className="gap-4">
                <Tab className="font-black uppercase text-[10px] tracking-widest py-3">Geral</Tab>
                <Tab className="font-black uppercase text-[10px] tracking-widest py-3">Produtos</Tab>
                <Tab className="font-black uppercase text-[10px] tracking-widest py-3">Marketing</Tab>
                <Tab className="font-black uppercase text-[10px] tracking-widest py-3">Financeiro</Tab>
                {/* ✅ Nova Aba Padrão Ouro */}
                <Tab className="font-black uppercase text-[10px] tracking-widest py-3 flex items-center gap-2">
                  Infraestrutura
                  {isSystemCritical && <span className="h-2 w-2 rounded-full bg-rose-500 animate-ping" />}
                </Tab>
              </TabList>
            </TabGroup>
          </div>

          {/* 3. SELETOR DE PERÍODO (DATA) */}
          <div className={activeTab === 4 ? "invisible" : "space-y-2"}> {/* Esconde período na aba de infra */}
            <Text className="text-[10px] font-black uppercase tracking-widest text-slate-400 text-right mr-1">Período</Text>
            <TabGroup index={periodIndex} onIndexChange={setPeriodIndex}>
              <TabList variant="solid" className="rounded-2xl p-1 bg-slate-100">
                {periodLabels.map((label, idx) => (
                  <Tab key={idx} className="text-[9px] font-black uppercase tracking-widest px-6 h-9">
                    {label}
                  </Tab>
                ))}
              </TabList>
            </TabGroup>
          </div>
        </Flex>
      </div>

      {/* 4. CONTEÚDO DINÂMICO */}
      <div className="mt-8">
        {activeTab === 0 && (stats ? <OverviewTab stats={stats} /> : <EmptyState syncHistory={syncHistory} isSyncing={isSyncing} />)}
        {activeTab === 1 && (stats ? <ProductsTab stats={stats} /> : <EmptyState syncHistory={syncHistory} isSyncing={isSyncing} />)}
        {activeTab === 2 && (stats ? <MarketingTab stats={stats} /> : <EmptyState syncHistory={syncHistory} isSyncing={isSyncing} />)}
        {activeTab === 3 && (stats ? <FinanceTab stats={stats} /> : <EmptyState syncHistory={syncHistory} isSyncing={isSyncing} />)}
        {/* ✅ Render da nossa HealthTab */}
        {activeTab === 4 && <>
        <GA4Panel />
        <div className="mt-8"><HealthTab /></div>
      </>}
      </div>

      {/* FOOTER DO TERMINAL */}
      <Flex className="pt-8 border-t border-slate-100 opacity-30 mt-12">
        <Monitor size={14} className="mr-2 text-slate-400" />
        <Text className="text-[10px] font-black uppercase tracking-widest text-slate-400">Terminal de BI Gourmet Saudável &copy; 2026</Text>
      </Flex>
    </div>
  );
}