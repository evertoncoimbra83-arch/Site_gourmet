// client/src/pages/adminSettings/view/AdminSettingsView.tsx
import React, { ComponentProps, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Loader2, Save, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

import { useAdminSettings } from "../logic/useAdminSettings";
import { useCompanyInfo } from "../logic/useCompanyInfo";
import { useAccessibilityLogic } from "../logic/useAccessibilityLogic";

import { settingsAreas, defaultAreaId, isSettingsAreaId } from "../config/settingsAreas";
import { StoreTab } from "../components/tabs/StoreTab";
import { OperationTab } from "../components/tabs/OperationTab";
import { SecurityTab } from "../components/tabs/SecurityTab";
import { IaTab } from "../components/tabs/IaTab";
import { AppearanceTab } from "../components/tabs/AppearanceTab";
import { IntegrationsTab } from "../components/tabs/IntegrationsTab";

import { CompanyInfoForm } from "../components/CompanyInfoForm";
import { CheckoutSuccessSettings } from "../components/CheckoutSuccessSettings";
import { SecurityConfig } from "../components/GoogleAuthConfig";
import { AccessibilitySettings } from "../components/AccessibilitySettings";

export function AdminSettingsView() {
  const [searchParams, setSearchParams] = useSearchParams();
  const settingsTab = useAdminSettings();
  const companyTab = useCompanyInfo();
  const accessibilityTab = useAccessibilityLogic();

  const isLoading =
    settingsTab.state.isLoading ||
    companyTab.state.isLoading ||
    accessibilityTab.state.isLoading;

  const tabFromUrl = searchParams.get("tab");
  const activeTab = isSettingsAreaId(tabFromUrl) ? tabFromUrl : defaultAreaId;

  useEffect(() => {
    if (!isSettingsAreaId(tabFromUrl)) {
      const next = new URLSearchParams(searchParams);
      next.set("tab", defaultAreaId);
      setSearchParams(next, { replace: true });
    }
  }, [searchParams, setSearchParams, tabFromUrl]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-32 text-left">
        <Loader2 className="animate-spin text-[#2D5A3D]" size={40} />
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">
          Sincronizando Ajustes...
        </p>
      </div>
    );
  }

  const handleGlobalSave = async () => {
    await settingsTab.actions.handleSaveAll();
    await companyTab.actions.handleSave();
  };

  const handleTabChange = (next: string) => {
    if (!isSettingsAreaId(next)) return;
    const params = new URLSearchParams(searchParams);
    params.set("tab", next);
    setSearchParams(params, { replace: false });
  };

  const isPending = settingsTab.state.isPending || companyTab.state.isPending;

  return (
    <div className="space-y-8 pb-20 text-left animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <header className="flex flex-col gap-6 rounded-[2rem] border border-slate-200 bg-white p-6 md:p-8 xl:flex-row xl:items-end xl:justify-between">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-emerald-700">
            <Settings2 size={14} />
            Ajustes por área
          </div>
          <div>
            <h1 className="text-3xl font-black uppercase italic tracking-tighter text-slate-900 md:text-4xl">
              Central de <span className="text-[#2D5A3D]">Ajustes</span>
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-500">
              Organizado por área operacional — loja, operação, segurança, IA,
              aparência e integrações.
            </p>
          </div>
        </div>
        <Button
          onClick={handleGlobalSave}
          disabled={isPending}
          className="h-14 rounded-2xl bg-[#2D5A3D] px-8 font-black text-white shadow-xl transition-all active:scale-95 hover:bg-[#1e3b28]"
        >
          {isPending ? (
            <div className="flex items-center gap-2">
              <Loader2 className="animate-spin" size={18} />
              <span>GRAVANDO...</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Save size={18} />
              <span>SALVAR TUDO</span>
            </div>
          )}
        </Button>
      </header>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
        <TabsList className="h-auto w-full justify-start rounded-[2rem] border border-slate-200 bg-slate-100 p-2">
          <div className="flex w-full gap-2 overflow-x-auto pb-1 lg:grid lg:grid-cols-3 lg:overflow-visible xl:grid-cols-6">
            {settingsAreas.map((area) => {
              const Icon = area.icon;
              return (
                <TabsTrigger
                  key={area.id}
                  value={area.id}
                  className={cn(
                    "h-auto min-h-16 min-w-[220px] rounded-[1.25rem] px-4 py-3 text-left data-[state=active]:bg-white lg:min-w-0",
                    "data-[state=active]:shadow-sm",
                  )}
                >
                  <div className="flex w-full items-center gap-3">
                    <Icon size={18} className={area.accent} />
                    <div className="min-w-0">
                      <div className="text-[10px] font-black uppercase tracking-widest text-slate-900">
                        {area.label}
                      </div>
                      <div className="mt-1 line-clamp-2 text-[10px] font-bold normal-case tracking-normal text-slate-500">
                        {area.description}
                      </div>
                    </div>
                  </div>
                </TabsTrigger>
              );
            })}
          </div>
        </TabsList>

        <TabsContent value="store" className="outline-none">
          <StoreTab
            companyTab={{
              state: companyTab.state as unknown as ComponentProps<typeof CompanyInfoForm>["state"],
              actions: companyTab.actions as unknown as ComponentProps<typeof CompanyInfoForm>["actions"],
            }}
          />
        </TabsContent>

        <TabsContent value="operation" className="outline-none">
          <OperationTab
            settingsTab={{
              state: { formData: settingsTab.state.formData as unknown as ComponentProps<typeof CheckoutSuccessSettings>["settings"] },
              actions: {
                updateField: (field, value) =>
                  settingsTab.actions.updateField(
                    field as Parameters<typeof settingsTab.actions.updateField>[0],
                    value as Parameters<typeof settingsTab.actions.updateField>[1],
                  ),
              },
            }}
          />
        </TabsContent>

        <TabsContent value="security" className="outline-none">
          <SecurityTab />
        </TabsContent>

        <TabsContent value="ia" className="outline-none">
          <IaTab
            settingsTab={{
              state: settingsTab.state as unknown as ComponentProps<typeof SecurityConfig>["state"],
              actions: settingsTab.actions as unknown as ComponentProps<typeof SecurityConfig>["actions"],
            }}
          />
        </TabsContent>

        <TabsContent value="appearance" className="outline-none">
          <AppearanceTab
            accessibilityTab={{
              state: accessibilityTab.state as unknown as ComponentProps<typeof AccessibilitySettings>["state"],
              actions: accessibilityTab.actions as unknown as ComponentProps<typeof AccessibilitySettings>["actions"],
            }}
          />
        </TabsContent>

        <TabsContent value="integrations" className="outline-none">
          <IntegrationsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
