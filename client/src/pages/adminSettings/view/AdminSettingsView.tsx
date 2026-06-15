import React from "react";
import { useSearchParams } from "react-router-dom";
import { Loader2, Save, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { useAdminSettings } from "../logic/useAdminSettings";
import { useCompanyInfo } from "../logic/useCompanyInfo";
import { useAccessibilityLogic } from "../logic/useAccessibilityLogic";

import {
  defaultAreaId,
  isSettingsAreaId,
  settingsAreas,
  type SettingsAreaId,
} from "../config/settingsAreas";
import { StoreTab } from "../components/tabs/StoreTab";
import { OperationTab } from "../components/tabs/OperationTab";
import { SecurityTab } from "../components/tabs/SecurityTab";
import { AppearanceTab } from "../components/tabs/AppearanceTab";
import { IntegrationsTab } from "../components/tabs/IntegrationsTab";
import IntegrationPage from "../../admin/IntegrationPage";

export function AdminSettingsView() {
  const [searchParams, setSearchParams] = useSearchParams();
  const settingsTab = useAdminSettings();
  const companyTab = useCompanyInfo();
  const accessibilityTab = useAccessibilityLogic();

  const isLoading =
    settingsTab.state.isLoading ||
    companyTab.state.isLoading ||
    accessibilityTab.state.isLoading;

  const isSaving =
    settingsTab.state.isPending ||
    companyTab.state.isPending ||
    accessibilityTab.state.isPending;

  const tabFromUrl = searchParams.get("tab");
  const activeTab = isSettingsAreaId(tabFromUrl) ? tabFromUrl : defaultAreaId;

  const handleTabChange = (tabId: SettingsAreaId) => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set("tab", tabId);
    setSearchParams(nextParams, { replace: true });
  };

  const handleGlobalSave = async () => {
    await settingsTab.actions.handleSaveAll();
    await companyTab.actions.handleSave();
    await accessibilityTab.actions.handleSave();
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-40">
        <Loader2 className="mb-4 animate-spin text-emerald-600" size={40} />
        <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
          Sincronizando Ecossistema...
        </p>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case "store":
        return <StoreTab companyTab={companyTab as unknown as any} />;

      case "operation":
        return (
          <OperationTab
            settingsTab={{
              state: {
                formData: settingsTab.state.formData as unknown as any,
              },
              actions: {
                updateField: (field: string, value: unknown) =>
                  settingsTab.actions.updateField(field as any, value as any),
              },
            }}
          />
        );

      case "appearance":
        return (
          <AppearanceTab
            accessibilityTab={{
              state: {
                accessibilityData:
                  accessibilityTab.state.accessibilityData as unknown as any,
                isLoading: accessibilityTab.state.isLoading,
              },
              actions: {
                updateField: (data: unknown) =>
                  accessibilityTab.actions.updateField(data as any),
              },
            }}
          />
        );

      case "integrations":
        return (
          <IntegrationsTab
            settingsTab={{
              state: {
                formData: settingsTab.state.formData,
                isPending: settingsTab.state.isPending,
                isTestingGoogle: settingsTab.state.isTestingGoogle,
              },
              actions: {
                updateField: settingsTab.actions.updateField,
                handleSaveAll: settingsTab.actions.handleSaveAll,
                testGoogleOAuth: settingsTab.actions.testGoogleOAuth,
              },
            }}
          />
        );

      case "ia":
        return <IntegrationPage />;

      case "security":
        return <SecurityTab />;

      default:
        return null;
    }
  };

  return (
    <div className="animate-in space-y-6 pb-20 duration-700 fade-in">
      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-100 bg-white/80 px-2 py-4 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-slate-900 p-2 text-white">
            <Settings2 size={20} />
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-slate-900">
              Configuracoes
            </h1>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
              Painel de Controle Operacional
            </p>
          </div>
        </div>

        <Button
          onClick={handleGlobalSave}
          disabled={isSaving}
          className="h-11 rounded-xl bg-emerald-600 px-6 text-xs font-bold uppercase tracking-widest text-white shadow-lg shadow-emerald-200/50 transition-all hover:bg-emerald-700 active:scale-95"
        >
          {isSaving ? (
            <Loader2 className="animate-spin" size={16} />
          ) : (
            <Save size={16} className="mr-2" />
          )}
          {isSaving ? "Gravando..." : "Salvar Alteracoes"}
        </Button>
      </div>

      <div className="overflow-x-auto pb-1">
        <div className="inline-flex min-w-full gap-2 rounded-2xl border border-slate-200 bg-white/90 p-2 shadow-sm">
          {settingsAreas.map((area) => {
            const Icon = area.icon;
            const isActive = area.id === activeTab;

            return (
              <button
                key={area.id}
                type="button"
                onClick={() => handleTabChange(area.id)}
                className={cn(
                  "flex min-w-[150px] flex-1 items-center gap-3 rounded-xl px-4 py-3 text-left transition-all",
                  isActive
                    ? "bg-slate-900 text-white shadow-lg"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-900",
                )}
              >
                <div
                  className={cn(
                    "rounded-xl p-2",
                    isActive
                      ? "bg-white/10 text-emerald-300"
                      : "bg-slate-100 text-slate-500",
                  )}
                >
                  <Icon size={16} />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em]">
                    {area.label}
                  </p>
                  <p
                    className={cn(
                      "mt-1 line-clamp-2 text-[11px]",
                      isActive ? "text-slate-300" : "text-slate-400",
                    )}
                  >
                    {area.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <main className="w-full min-w-0">
        <div className="min-h-150 animate-in rounded-2xl border border-slate-200 bg-white p-6 shadow-sm duration-500 fade-in slide-in-from-top-2 md:p-8">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}
