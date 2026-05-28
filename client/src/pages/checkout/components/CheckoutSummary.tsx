// client/src/pages/checkout/components/CheckoutSummary.tsx
import React, { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Loader2, ShoppingBag, ArrowRight,
  Store, Truck, ChevronRight,
  Gift, Percent, MessageSquare, Scale, AlertCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCheckout } from "../context/CheckoutContext";
import { useCheckoutReadiness } from "../logic/useCheckoutReadiness";
import { trpc } from "@/_core/trpc";

const SummaryRow = ({ label, value, icon, isDiscount }: { label: string; value: string; icon?: React.ReactElement | null; isDiscount?: boolean }) => (
  <div className={cn(
    "flex justify-between items-center",
    isDiscount
      ? "bg-emerald-50 px-3 py-2 rounded-xl border border-emerald-100 my-1"
      : "px-1 py-1"
  )}>
    <span className={cn(
      "flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest",
      isDiscount ? "text-emerald-600" : "text-slate-500"
    )}>
      {icon && <span className="opacity-60">{icon}</span>}
      {label}
    </span>
    <span className={cn(
      "text-sm font-black",
      isDiscount ? "text-emerald-600" : "text-slate-900"
    )}>
      {isDiscount ? `- ${value}` : value}
    </span>
  </div>
);

export default function CheckoutSummary() {
  const { 
    summary, 
    logistics, 
    actions, 
    isSubmitting, 
    isLoading, 
    machineState 
  } = useCheckout();

  const { data: loyaltySettings } = trpc.loyalty.getSettings.useQuery();

  const estimatedPoints = useMemo(() => {
    if (!loyaltySettings || loyaltySettings.enabled === false) return 0;
    const earnPts = Number(loyaltySettings.conversionRatePoints ?? 1);
    const earnMoney = Number(loyaltySettings.conversionRateMoney ?? 1);
    const earnPointsPerReal = earnMoney > 0 ? earnPts / earnMoney : 0;
    return Math.floor(summary.total * earnPointsPerReal);
  }, [loyaltySettings, summary.total]);
  
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  
  // ✅ Orquestrador de prontidão — avalia os 6 portões independentemente
  const checkoutCtx = useCheckout();
  const readiness = useCheckoutReadiness({ viewModel: checkoutCtx, machineState, acceptedTerms });
  const isProcessing = machineState === 'submitting' || isSubmitting;
  const canSubmit = readiness.isReady && !isProcessing;

  useEffect(() => {
    if (!import.meta.env.DEV) return;

    console.debug("[checkout:readiness]", {
      gate: readiness.gate,
      gates: readiness.gates,
      machineState,
      logisticsCanContinue: logistics.canContinue,
      logisticsCanDeliver: logistics.canDeliver,
      selectedAddressId: logistics.selectedAddressId,
      paymentSelectedId: checkoutCtx.payment.selectedId,
      acceptedTerms,
    });
  }, [
    readiness.gate,
    readiness.gates,
    machineState,
    logistics.canContinue,
    logistics.canDeliver,
    logistics.selectedAddressId,
    checkoutCtx.payment.selectedId,
    acceptedTerms,
  ]);

  return (
    <Card className="border-none shadow-2xl rounded-4xl bg-white overflow-hidden sticky top-24 text-left">
      <CardHeader className="px-6 pt-8 pb-4 border-b border-slate-50 bg-slate-50/30">
        <div className="flex items-center gap-3 text-slate-900 font-black uppercase italic tracking-tighter">
          <div className="h-8 w-8 rounded-xl bg-slate-900 flex items-center justify-center text-white">
            <ShoppingBag size={14} />
          </div>
          <CardTitle className="text-lg">Revisão Final</CardTitle>
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        {/* LISTA DE ITENS PROCESSADOS */}
        <div className="space-y-4 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
          {summary.items.length > 0 ? (
            summary.items.map((item) => (
              <div key={item.id} className={cn("p-4 border rounded-3xl", item.isPackage ? "border-emerald-100 bg-emerald-50/10" : "border-slate-100 bg-white")}>
                <div className="flex justify-between items-start gap-2 mb-2">
                  <div className="min-w-0 flex-1">
                    <h4 className="font-black text-[11px] text-slate-900 uppercase italic leading-tight">{item.quantity}x {item.name}</h4>
                    {item.displaySize && (
                      <span className="inline-flex items-center gap-1 mt-1 text-[7px] font-black text-emerald-600 uppercase">
                        <Scale size={7} /> {item.displaySize}
                      </span>
                    )}
                  </div>
                  <p className="font-black text-[11px] text-slate-900 italic shrink-0">{item.priceFormatted}</p>
                </div>

                {item.isPackage ? (
                  <div className="space-y-1.5 mt-2">
                    {/* ✅ Correção Erro 18048: Adicionado fallback (item.packageMeals || []) */}
                    {(item.packageMeals || []).map((meal, mIdx) => (
                      <div key={mIdx} className="bg-white/60 rounded-xl p-2 border border-emerald-50">
                        <p className="font-black text-[9px] text-slate-700 uppercase italic mb-1.5">
                          <span className="text-emerald-500 mr-1">●</span>{meal.dishName}
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {meal.accompaniments.map((acc, aIdx) => (
                            <span key={aIdx} className="text-[7px] font-bold text-slate-400 uppercase bg-slate-50 border px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                              <ChevronRight size={6} className="text-emerald-500" /> {acc}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {/* ✅ Correção Erro 18048: Adicionado fallback (item.accompaniments || []) */}
                    {(item.accompaniments || []).map((acc, aIdx) => (
                      <span key={aIdx} className="text-[7px] font-bold text-slate-500 uppercase bg-slate-50 border border-slate-100 px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                        <ChevronRight size={6} className="text-emerald-500" /> {acc}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="py-10 text-center">
              {isLoading ? (
                <Loader2 className="animate-spin mx-auto text-emerald-500" size={20} />
              ) : (
                <p className="text-[9px] font-black text-slate-500 uppercase">Carrinho vazio</p>
              )}
            </div>
          )}
        </div>

        {/* FINANCEIRO */}
        <div className="space-y-2 pt-2 border-t border-slate-100">
          <SummaryRow label="Subtotal" value={summary.subtotalFormatted} />
          
          <SummaryRow 
            label={logistics.type === "delivery" ? "Taxa de Entrega" : "Retirada na Loja"} 
            value={logistics.shippingCostFormatted} 
            icon={logistics.type === "pickup" ? <Store size={12} /> : <Truck size={12} />}
          />
          
          <div className="space-y-1 mt-2">
            {summary.discounts.map((disc, idx) => (
              <SummaryRow 
                key={idx} 
                isDiscount 
                label={disc.label} 
                value={disc.valueFormatted} 
                icon={disc.label.includes("Fidelidade") ? <Gift size={10} /> : <Percent size={10} />} 
              />
            ))}
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-between items-end">
            <div className="flex flex-col">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Total à pagar</span>
              {summary.discounts.length > 0 && (
                <span className="text-[7px] font-black text-emerald-600 uppercase italic animate-pulse">Descontos aplicados</span>
              )}
            </div>
            <span className="text-3xl font-black text-slate-900 italic tracking-tighter">{summary.totalFormatted}</span>
          </div>

          {estimatedPoints > 0 && (
            <div className="mt-3 bg-emerald-50 border border-emerald-100/50 rounded-2xl p-3 flex items-start gap-2.5 text-emerald-800 text-[10px] font-bold uppercase tracking-wider">
              <Gift size={14} className="text-emerald-600 shrink-0 mt-0.5 animate-pulse" />
              <span>Você ganhará aproximadamente <strong className="text-emerald-700 font-black">{estimatedPoints} pontos</strong> com este pedido.</span>
            </div>
          )}
        </div>

        {/* NOTAS E TERMOS */}
        <div className="space-y-3">
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="notes" className="border-none bg-slate-50 rounded-2xl px-4">
              <AccordionTrigger className="hover:no-underline py-3 text-slate-500">
                <div className="flex items-center gap-2">
                  <MessageSquare size={13} className="opacity-70" />
                  <span className="text-[9px] font-black uppercase tracking-widest italic">Observações</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pb-4">
                <Textarea 
                  placeholder="Ex: tirar cebola, campainha estragada..." 
                  className="min-h-20 bg-white border-slate-200 rounded-xl text-xs resize-none" 
                  value={summary.notes} 
                  onChange={(e) => actions.setNotes(e.target.value)} 
                />
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-start gap-3">
            <Checkbox id="terms" checked={acceptedTerms} onCheckedChange={(c) => setAcceptedTerms(!!c)} className="mt-1" />
            <Label htmlFor="terms" className="text-[9px] font-bold uppercase leading-relaxed text-slate-500 cursor-pointer">
              Li e concordo com os <Link to="/termos" className="text-emerald-600 underline">Termos</Link> e <Link to="/privacidade" className="text-emerald-600 underline">Privacidade</Link>.
            </Label>
          </div>
        </div>

        {/* BOTÃO FINALIZAR */}
        <div className="space-y-4">
          <Button
            data-testid="btn-finalize-order"
            onClick={() => actions.placeOrder()}
            disabled={!canSubmit}
            className={cn(
              "w-full h-16 rounded-3xl font-black uppercase tracking-widest text-xs shadow-xl transition-all", 
              canSubmit ? "bg-slate-900 hover:bg-emerald-600 text-white" : "bg-slate-100 text-slate-400 cursor-not-allowed"
            )}
          >
            {isProcessing ? (
              <Loader2 className="animate-spin" />
            ) : (
              <div className="flex items-center gap-2">
                <span>Finalizar Pedido</span>
                <ArrowRight size={16} />
              </div>
            )}
          </Button>

          {!canSubmit && machineState !== 'loading' && (
            <div className="flex flex-col gap-1 items-center">
              {machineState !== 'review_ready' && machineState !== 'submitting' && (
                <p className="text-[8px] font-black text-rose-500 uppercase italic">Complete os passos anteriores para liberar</p>
              )}
              {import.meta.env.DEV && (
                <p className="text-[8px] font-mono text-slate-500">
                  gate={readiness.gate} machine={machineState}
                </p>
              )}
              {logistics.type === "delivery" && !logistics.canDeliver && (
                <div className="flex items-center gap-1.5 text-rose-500 mb-1">
                   <AlertCircle size={10} />
                   <p className="text-[8px] font-black uppercase italic">Pedido mínimo para entrega não atingido</p>
                </div>
              )}
              {!acceptedTerms && (
                <p className="text-[8px] font-black text-amber-500 uppercase italic">✓ Aceite os termos acima para finalizar</p>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}