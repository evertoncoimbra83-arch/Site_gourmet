import React, { useState } from "react";
import { useAdminDiscountRules } from "../logic/useAdminDiscountRules";
import { DiscountRuleForm } from "../components/DiscountRuleForm";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from "@/components/ui/accordion";
import { Edit2, Trash2, Loader2, Zap, Plus, LayoutGrid } from "lucide-react";
import { safeNumber } from "@/lib/safe-parse";
import { cn } from "@/lib/utils";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

// ✅ Interface unificada para remover todos os 'any'
interface DiscountRuleItem {
  id: number | string;
  name: string;
  description?: string | null;
  min_quantity?: number;
  minQuantity?: number;
  max_quantity?: number;
  maxQuantity?: number;
  type: 'percentage' | 'fixed';
  value: number | string;
  priority: number | string | null;
}

export function AdminDiscountRulesView() {
  const { state, actions, data, mutations } = useAdminDiscountRules();
  const [localExpandedId, setLocalExpandedId] = useState<string>("");
  const [ruleToDelete, setRuleToDelete] = useState<DiscountRuleItem | null>(null);

  const formatValue = (rule: DiscountRuleItem) => {
    const type = rule.type || 'percentage';
    const rawValue = rule.value ?? 0;
    const numValue = safeNumber(String(rawValue));

    if (isNaN(numValue)) return type === "percentage" ? "0%" : "0.00R$";

    return type === "percentage"
      ? `${Math.round(numValue)}%`
      : `${numValue.toFixed(2)}R$`;
  };

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20 text-left">

      {/* HEADER */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-emerald-600">
            <Zap size={18} />
            <span className="text-[10px] font-black uppercase tracking-[0.3em]">Smart Pricing</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">
            Regras de <span className="text-emerald-600">Volume</span><span className="text-emerald-600">.</span>
          </h1>
          <p className="text-sm md:text-base text-slate-500 font-medium italic">
            Descontos progressivos automáticos por quantidade de itens no carrinho.
          </p>
        </div>

        <Button
          onClick={() => {
            actions.resetForm();
            setLocalExpandedId("new-rule");
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="h-16 px-10 rounded-[2rem] bg-slate-900 hover:bg-emerald-600 text-white font-black uppercase text-[11px] tracking-widest shadow-2xl transition-all active:scale-95 group"
        >
          <Plus className="mr-2 h-5 w-5 transition-transform group-hover:rotate-90" />
          Nova Regra
        </Button>
      </header>

      <Accordion
        type="single"
        collapsible
        className="w-full space-y-6 border-none"
        value={localExpandedId}
        onValueChange={setLocalExpandedId}
      >

        <AccordionItem value="new-rule" className="border-none">
          <AccordionContent className="pb-6">
            <div className="bg-white p-8 md:p-10 rounded-[3rem] border-2 border-dashed border-emerald-100 shadow-sm">
               <div className="flex items-center gap-2 mb-8 text-emerald-600">
                  <LayoutGrid size={16} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Criar nova faixa de desconto</span>
               </div>
               <DiscountRuleForm
                // ✅ CORREÇÃO: Usamos unknown como ponte segura em vez de 'any'
                state={state as unknown as Parameters<typeof DiscountRuleForm>[0]['state']}
                actions={actions as unknown as Parameters<typeof DiscountRuleForm>[0]['actions']}
                mutations={mutations}
                onCancel={() => setLocalExpandedId("")}
               />
            </div>
          </AccordionContent>
        </AccordionItem>

        {state.isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-4">
             <Loader2 className="animate-spin text-emerald-600" size={32} />
             <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Sincronizando...</p>
          </div>
        ) : (
          (data.rules as DiscountRuleItem[] || []).map((rule) => (
            <AccordionItem key={rule.id} value={`edit-${rule.id}`} className="border-none">
              <div className={cn(
                "group bg-white rounded-[2.5rem] border transition-all duration-500 overflow-hidden",
                localExpandedId === `edit-${rule.id}` ? "border-emerald-500 shadow-xl ring-8 ring-emerald-500/5" : "border-slate-50 shadow-sm hover:shadow-md"
              )}>
                <div className="p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">

                  <div className="flex items-center gap-6">
                    <div className="h-14 w-14 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 font-black italic text-xl border border-slate-100 group-hover:text-emerald-500 transition-colors text-center">
                      {String(rule.priority || '0')}
                    </div>
                    <div className="space-y-1">
                      <h3 className="font-black text-xl uppercase italic tracking-tighter text-slate-900 leading-none">
                        {rule.name}
                      </h3>
                      <Badge className="bg-emerald-50 text-emerald-600 border-none font-black text-[9px] uppercase tracking-widest px-3 py-1 rounded-lg">
                         {rule.min_quantity || rule.minQuantity} a {rule.max_quantity || rule.maxQuantity || "∞"} Itens
                      </Badge>
                    </div>
                  </div>

                  <div className="flex items-center justify-between md:justify-end gap-8 border-t md:border-t-0 pt-4 md:pt-0 border-slate-50">
                    <div className="text-right">
                      <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest mb-1">
                        { rule.type === 'percentage' ? 'Percentual' : 'Valor Fixo'}
                      </p>
                      <p className="font-black text-2xl text-emerald-600 italic tracking-tighter leading-none">
                        {formatValue(rule)}
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <AccordionTrigger
                        className="p-0 hover:no-underline"
                        onClick={() => actions.handleEdit(rule as unknown as Parameters<typeof actions.handleEdit>[0])}
                      >
                        <div className={cn(
                          "h-12 w-12 rounded-xl flex items-center justify-center transition-all active:scale-95",
                          localExpandedId === `edit-${rule.id}` ? "bg-slate-900 text-white" : "bg-slate-50 text-slate-400 hover:text-emerald-600"
                        )}>
                          <Edit2 size={18}/>
                        </div>
                      </AccordionTrigger>

                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={mutations.isDeleting}
                        className="h-12 w-12 rounded-xl bg-slate-50 text-slate-200 hover:text-red-500 hover:bg-red-50 transition-all active:scale-95"
                        onClick={(e) => {
                          e.stopPropagation();
                          setRuleToDelete(rule);
                        }}
                      >
                        {mutations.isDeleting ? <Loader2 className="animate-spin" size={18}/> : <Trash2 size={18}/>}
                      </Button>
                    </div>
                  </div>
                </div>

                <AccordionContent className="p-0 border-t border-slate-50 bg-slate-50/20">
                  <div className="p-8 md:p-10">
                    <DiscountRuleForm
                      // ✅ CORREÇÃO: Removido 'any'
                      state={state as unknown as Parameters<typeof DiscountRuleForm>[0]['state']}
                      actions={actions as unknown as Parameters<typeof DiscountRuleForm>[0]['actions']}
                      mutations={mutations}
                      onCancel={() => setLocalExpandedId("")}
                    />
                  </div>
                </AccordionContent>
              </div>
            </AccordionItem>
          ))
        )}
      </Accordion>

      <ConfirmDialog
        open={ruleToDelete !== null}
        title="Excluir Regra"
        description={ruleToDelete ? `Deseja realmente excluir a regra de desconto "${ruleToDelete.name}"?` : ""}
        confirmLabel="Confirmar"
        cancelLabel="Cancelar"
        destructive={true}
        loading={mutations.isDeleting}
        onConfirm={() => {
          if (ruleToDelete) {
            actions.deleteRule(ruleToDelete.id);
            setRuleToDelete(null);
          }
        }}
        onCancel={() => setRuleToDelete(null)}
      />
    </div>
  );
}
