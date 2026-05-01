// client/src/pages/adminSettings/components/tabs/OperationTab.tsx
import React, { ComponentProps } from "react";
import { ShoppingBag } from "lucide-react";
import { Card } from "@/components/ui/card";
import { CheckoutSuccessSettings } from "../CheckoutSuccessSettings";
import { LoyaltyAutomationCard } from "../LoyaltyAutomationCard";
import { AreaShell } from "../AreaShell";
import { ShortcutGrid } from "../ShortcutGrid";
import { settingsAreas } from "../../config/settingsAreas";

const area = settingsAreas[1];

interface OperationTabProps {
  settingsTab: {
    state: { formData: ComponentProps<typeof CheckoutSuccessSettings>["settings"] };
    actions: { updateField: (field: string, value: unknown) => void };
  };
}

export function OperationTab({ settingsTab }: OperationTabProps) {
  return (
    <AreaShell area={area}>
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
        <CheckoutSuccessSettings
          settings={settingsTab.state.formData}
          onUpdate={(field, value) => settingsTab.actions.updateField(field, value)}
        />
        <div className="space-y-6">
          <Card className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="rounded-2xl bg-amber-50 p-3 text-amber-600">
                <ShoppingBag size={20} />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-black uppercase tracking-tight text-slate-900">
                  Checkout & Conversão
                </h3>
                <p className="text-sm leading-relaxed text-slate-500">
                  A mensagem de sucesso e o clube de benefícios continuam editáveis
                  aqui para manter o contexto pós-pedido.
                </p>
              </div>
            </div>
          </Card>
          <LoyaltyAutomationCard />
        </div>
      </div>
      <ShortcutGrid shortcuts={area.shortcuts || []} />
    </AreaShell>
  );
}