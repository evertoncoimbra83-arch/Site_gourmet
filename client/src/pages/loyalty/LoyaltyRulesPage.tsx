// src/pages/loyalty/LoyaltyRulesPage.tsx

import React, { useMemo } from "react";
import { trpc } from "@/_core/trpc";
import { Loader2, Star, Target, Zap, Gift, Info } from "lucide-react";
import { formatCurrency } from "@/pages/profile/utils/orderHelpers";
import { SEO } from "@/components/SEO";

// 1. Interface para as regras de resgate
interface RedemptionRule {
  minOrderValue?: number;
  min_order_value?: number;
  maxDiscount?: number;
  max_discount?: number;
}

// 2. Interface para o retorno do tRPC (ajustada para refletir seu backend)
interface LoyaltySettingsResponse {
  id: string;
  enabled: boolean | null;
  conversionRatePoints: number | null;
  pointsPerSignup?: number | null;
  redemptionRatePoints: number | null;
  redemptionRateMoney: string | number | null;
  redemptionRules: RedemptionRule[] | string | null;
  pointsExpirationDays: number | null;
}

export default function LoyaltyRulesPage() {
  const { data, isLoading } = trpc.loyalty.getSettings.useQuery();
  
  // Cast seguro para a nossa interface
  const settings = data as unknown as LoyaltySettingsResponse;

  const rules = useMemo(() => {
    const rawRules = settings?.redemptionRules;
    if (!rawRules) return [] as RedemptionRule[];
    try {
      return (typeof rawRules === 'string' ? JSON.parse(rawRules) : rawRules) as RedemptionRule[];
    } catch {
      return [] as RedemptionRule[];
    }
  }, [settings]);

  if (isLoading) return (
    <div className="h-[60vh] flex flex-col items-center justify-center">
      <Loader2 className="animate-spin text-emerald-500" size={40} />
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-4">Sincronizando regras...</p>
    </div>
  );

  // ✅ Uso das propriedades sem 'any'
  const enabled = !!settings?.enabled;
  const conversionRate = Number(settings?.conversionRatePoints || 1);
  const signupPoints = Number(settings?.pointsPerSignup || 0);
  const redemptionPoints = Number(settings?.redemptionRatePoints || 100);
  const redemptionMoney = Number(settings?.redemptionRateMoney || 1);

  if (!enabled) return (
    <div className="max-w-2xl mx-auto py-20 px-6 text-center">
      <p className="text-sm font-black uppercase italic text-slate-400 tracking-widest">
        O Clube de Fidelidade está temporariamente em manutenção.
      </p>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto py-12 px-6 space-y-12 text-left animate-in fade-in duration-700">
      <SEO 
        title="Clube de Fidelidade e Cashback" 
        description="Conheça o Clube de Fidelidade Gourmet Saudável. Acumule pontos em todas as compras de suas marmitas congeladas e ganhe cashback e descontos exclusivos." 
        path="/fidelidade" 
      />
      <header className="space-y-4">
        <div className="flex items-center gap-2 text-emerald-600">
          <Star size={20} className="fill-emerald-500" />
          <span className="text-[10px] font-black uppercase tracking-[0.3em]">Gourmet Saudável</span>
        </div>
        <h1 className="text-4xl md:text-6xl font-black uppercase italic text-slate-900 leading-none">
          Clube de <br /> <span className="text-emerald-600">Fidelidade</span>.
        </h1>
        <p className="text-slate-500 text-sm font-medium leading-relaxed max-w-md">
          Comer bem nunca foi tão recompensador. Acumule pontos em cada pedido e troque por descontos reais.
        </p>
      </header>

      <div className="grid gap-4">
        <RuleCard 
          icon={<Zap className="text-orange-500" />}
          title="Como Acumular"
          description={`Cada ${formatCurrency(conversionRate)} em compras equivalem a 1 ponto na sua conta. Quanto mais você compra, mais você ganha.`}
        />
        
        {signupPoints > 0 && (
          <RuleCard 
            icon={<Gift className="text-emerald-500" />}
            title="Bônus de Boas-vindas"
            description={`Comece com o pé direito! Ao criar sua conta, você já ganha ${signupPoints} pontos de presente.`}
          />
        )}

        <RuleCard 
          icon={<Target className="text-blue-500" />}
          title="Poder de Troca"
          description={`A cada ${redemptionPoints} pontos acumulados, você libera ${formatCurrency(redemptionMoney)} de desconto direto no seu carrinho.`}
        />
      </div>

      {rules.length > 0 && (
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <Info size={18} className="text-slate-400" />
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-900 italic">Limites de Resgate por Pedido</h3>
          </div>
          
          <div className="bg-slate-900 rounded-4xl overflow-hidden shadow-2xl border border-white/5">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/5 border-b border-white/10">
                  <th className="p-6 text-[10px] font-black uppercase text-white/40 tracking-widest">Valor do Pedido</th>
                  <th className="p-6 text-[10px] font-black uppercase text-white/40 tracking-widest text-right">Desconto Permitido</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {rules.map((rule, idx) => (
                  <tr key={idx} className="hover:bg-white/2 transition-colors group">
                    <td className="p-6 text-sm font-bold text-white uppercase italic">
                      Acima de {formatCurrency(rule.minOrderValue || rule.min_order_value || 0)}
                    </td>
                    <td className="p-6 text-sm font-black text-emerald-400 text-right uppercase italic group-hover:scale-105 transition-transform origin-right">
                      Até {formatCurrency(rule.maxDiscount || rule.max_discount || 0)} OFF
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}

function RuleCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="bg-white border border-slate-100 p-6 rounded-[2rem] flex gap-5 items-start shadow-sm hover:shadow-md transition-all group">
      <div className="h-12 w-12 rounded-2xl bg-slate-50 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300">
        {icon}
      </div>
      <div className="space-y-1">
        <h4 className="text-xs font-black uppercase text-slate-900 tracking-tight italic">{title}</h4>
        <p className="text-xs text-slate-500 leading-relaxed font-medium">{description}</p>
      </div>
    </div>
  );
}