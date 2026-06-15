// e:/IA/projects/Site_React/client/src/pages/adminLoyalty/view/AdminLoyaltyView.tsx

import React, { useState } from "react";
import { useAdminLoyalty, LoyaltySettings } from "../logic/useAdminLoyalty";
import { AdminLoyaltyRules } from "../components/AdminLoyaltyRules";
import { AdminLoyaltyConfig } from "../components/AdminLoyaltyConfig";
import { AdminLoyaltyUsers } from "../components/AdminLoyaltyUsers";
import { LoyaltyBalanceReconciliation } from "../components/LoyaltyBalanceReconciliation";
import { LoyaltyHistoryDrawer } from "../components/LoyaltyHistoryDrawer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Save, Loader2, TrendingUp, Target, Users, Star, Scale } from "lucide-react";

type DrawerHistory = Parameters<typeof LoyaltyHistoryDrawer>[0]["history"];

export function AdminLoyaltyView() {
  const { state, actions, data, mutations } = useAdminLoyalty();
  const [transactionIdToDelete, setTransactionIdToDelete] = useState<number | string | null>(null);

  // Garante os valores numéricos para não dar erro de undefined
  const safeState = {
    ...state,
    formData: {
      ...state.formData,
      conversionRatePoints: state.formData.conversionRatePoints ?? 0,
      pointsPerSignup: state.formData.pointsPerSignup ?? 0,
      redemptionRatePoints: state.formData.redemptionRatePoints ?? 0,
      redemptionRateMoney: state.formData.redemptionRateMoney ?? 0,
    } as LoyaltySettings
  };

  // Mapeamento limpo do histórico
  const safeHistory = data.history.map(item => ({
    ...item,
    created_at: item.createdAt || (item as unknown as Record<string, unknown>).created_at || new Date().toISOString()
  })) as unknown as DrawerHistory;

  return (
    <div className="space-y-10 pb-20 px-4 md:px-0 text-left">
      <ConfirmDialog
        open={transactionIdToDelete !== null}
        title="Excluir movimentacao?"
        description="Essa acao remove o lancamento do extrato e nao estorna pontos automaticamente."
        confirmLabel="Excluir lancamento"
        cancelLabel="Revisar antes"
        destructive
        loading={mutations.deleteMutation.isPending}
        onCancel={() => setTransactionIdToDelete(null)}
        onConfirm={() => {
          if (transactionIdToDelete === null) return;
          actions.handleDeleteTransaction(transactionIdToDelete);
        }}
      />

      {/* HEADER GLOBAL */}
      <header className="flex flex-col md:flex-row justify-between items-center gap-6 pt-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-emerald-600">
            <Star size={18} className="animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em]">Retention Strategy</span>
          </div>
          <h1 className="text-4xl font-black text-slate-900 uppercase italic leading-none">
            Configurar <span className="text-emerald-600">Fidelidade</span>.
          </h1>
        </div>

        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="bg-white px-5 h-14 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 flex-1 md:flex-none">
             <Label className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Status do Clube</Label>
             <Switch
                checked={!!state.formData.enabled}
                onCheckedChange={val => actions.setFormData({...state.formData, enabled: val})}
                className="data-[state=checked]:bg-emerald-500 scale-90"
             />
          </div>
          <button
            onClick={actions.handleSaveSettings}
            disabled={mutations.updateSettings.isPending}
            className="h-14 px-8 rounded-2xl bg-slate-950 hover:bg-emerald-600 text-white font-black uppercase text-[11px] tracking-widest shadow-xl transition-all active:scale-95 flex-1 md:flex-none flex items-center justify-center gap-2"
          >
            {mutations.updateSettings.isPending ? <Loader2 className="animate-spin" size={16}/> : <Save size={16}/>}
            Salvar Tudo
          </button>
        </div>
      </header>

      <Tabs defaultValue="rules" className="w-full">
        <TabsList className="bg-slate-100/50 p-1.5 rounded-2xl md:rounded-full h-14 mb-8 inline-flex border border-slate-100">
          <TabsTrigger value="rules" className="px-6 md:px-8 rounded-full font-black text-[10px] uppercase h-full data-[state=active]:bg-white data-[state=active]:text-emerald-600 shadow-sm transition-all">
            <TrendingUp className="mr-2" size={14}/> Tabela de Descontos
          </TabsTrigger>
          <TabsTrigger value="accumulation" className="px-6 md:px-8 rounded-full font-black text-[10px] uppercase h-full data-[state=active]:bg-white data-[state=active]:text-emerald-600 shadow-sm transition-all">
            <Target className="mr-2" size={14}/> Regras de Ganho
          </TabsTrigger>
          <TabsTrigger value="customers" className="px-6 md:px-8 rounded-full font-black text-[10px] uppercase h-full data-[state=active]:bg-white data-[state=active]:text-emerald-600 shadow-sm transition-all">
            <Users className="mr-2" size={14}/> Clientes
          </TabsTrigger>
          <TabsTrigger value="reconciliation" className="px-6 md:px-8 rounded-full font-black text-[10px] uppercase h-full data-[state=active]:bg-white data-[state=active]:text-emerald-600 shadow-sm transition-all">
            <Scale className="mr-2" size={14}/> Ajuste de Saldos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="rules" className="outline-none">
          <AdminLoyaltyRules
            state={safeState as unknown as Parameters<typeof AdminLoyaltyRules>[0]["state"]}
            actions={actions as unknown as Parameters<typeof AdminLoyaltyRules>[0]["actions"]}
          />
        </TabsContent>

        <TabsContent value="accumulation" className="outline-none">
          <AdminLoyaltyConfig
            state={safeState as unknown as Parameters<typeof AdminLoyaltyConfig>[0]["state"]}
            actions={actions as unknown as Parameters<typeof AdminLoyaltyConfig>[0]["actions"]}
          />
        </TabsContent>

        <TabsContent value="customers" className="outline-none">
          <AdminLoyaltyUsers
            state={safeState as unknown as Parameters<typeof AdminLoyaltyUsers>[0]["state"]}
            actions={actions as unknown as Parameters<typeof AdminLoyaltyUsers>[0]["actions"]}
            data={data as unknown as Parameters<typeof AdminLoyaltyUsers>[0]["data"]}
          />
        </TabsContent>

        <TabsContent value="reconciliation" className="outline-none">
          <LoyaltyBalanceReconciliation />
        </TabsContent>
      </Tabs>

      {/* DRAWER DE HISTÓRICO */}
      <LoyaltyHistoryDrawer
        open={!!state.selectedCustomer}
        onClose={() => actions.setSelectedCustomer(null)}
        customer={state.selectedCustomer}
        history={safeHistory}
        onApply={actions.handleManualAdjustment}
        manualPoints={state.manualPoints}
        setManualPoints={actions.setManualPoints}
        manualReason={state.manualReason}
        setManualReason={actions.setManualReason}
        isPending={state.isPending}

        // ✅ AQUI ESTÁ O SEGREDO: Conectando a lixeira com a função de deletar
        onDelete={setTransactionIdToDelete}
      />
    </div>
  );
}
