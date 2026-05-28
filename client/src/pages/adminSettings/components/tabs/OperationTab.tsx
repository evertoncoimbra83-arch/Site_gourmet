import React from "react";
import { Link } from "react-router-dom";
import { Gift, ShoppingBag } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckoutSuccessSettings } from "../CheckoutSuccessSettings";
import { LoyaltyAutomationCard } from "../LoyaltyAutomationCard";
import { PanicButton } from "../PanicButton";
import { AreaShell } from "../AreaShell";
import { ShortcutGrid } from "../ShortcutGrid";
import { settingsAreas } from "../../config/settingsAreas";

const area = settingsAreas[1];

interface OperationTabProps {
  settingsTab: {
    state: {
      formData: {
        success_order_message?: string;
        partners_json?: string;
        [key: string]: unknown;
      };
    };
    actions: {
      updateField: (field: string, value: string) => void;
    };
  };
}

export function OperationTab({ settingsTab }: OperationTabProps) {
  return (
    <AreaShell area={area}>
      <div className="grid w-full grid-cols-1 gap-6 text-left xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
        <div className="w-full space-y-6 text-left">
          <CheckoutSuccessSettings
            settings={settingsTab.state.formData}
            onUpdate={(field, value) =>
              settingsTab.actions.updateField(field, value)
            }
          />
        </div>

        <div className="w-full space-y-6 text-left">
          <PanicButton />

          <Card className="rounded-[2rem] border border-slate-200 bg-white p-6 text-left shadow-xs">
            <div className="flex items-start gap-4 text-left">
              <div className="shrink-0 rounded-2xl bg-amber-50 p-3 text-amber-600">
                <ShoppingBag size={20} />
              </div>
              <div className="space-y-3 text-left">
                <h3 className="text-left text-lg font-black uppercase tracking-tight text-slate-900">
                  Checkout e Pos-pedido
                </h3>
                <p className="text-left text-xs font-medium leading-relaxed text-slate-500">
                  Esta area edita apenas a mensagem de sucesso e os parceiros
                  exibidos depois que o pedido e concluido. Regras de
                  fidelidade, pontuacao, cashback e resgate continuam no modulo
                  de Fidelidade.
                </p>
                <Button asChild variant="outline" className="rounded-xl">
                  <Link to="/admin/loyalty">
                    <Gift size={14} className="mr-2" />
                    Abrir Fidelidade
                  </Link>
                </Button>
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
