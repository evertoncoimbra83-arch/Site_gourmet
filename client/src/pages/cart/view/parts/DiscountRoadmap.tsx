// client/src/components/cart/DiscountRoadmap.tsx

import React, { useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TrendingUp, Gift, Award, CheckCircle2 } from "lucide-react";
import confetti from "canvas-confetti";

interface DiscountTier {
  minQuantity: number;
  discountValue: number;
}

interface DiscountRoadmapProps {
  tiers: DiscountTier[];
  itemCount: number;
}

export function DiscountRoadmap({ tiers = [], itemCount = 0 }: DiscountRoadmapProps) {
  // ✅ REGRAS DE OURO DOS HOOKS: Todos os useMemo/useEffect devem ficar no topo, 
  // antes de qualquer "if (length === 0) return null".
  
  const safeTiers = useMemo(() => 
    Array.isArray(tiers) ? [...tiers].sort((a, b) => a.minQuantity - b.minQuantity) : [], 
    [tiers]
  );

  const validItemCount = Math.max(0, itemCount || 0);

  // Cálculo de Tiers centralizado
  const { currentTier, nextGoal, isMax } = useMemo(() => {
    if (safeTiers.length === 0) return { currentTier: null, nextGoal: null, isMax: false };
    
    const reversed = [...safeTiers].reverse();
    const current = reversed.find(t => validItemCount >= t.minQuantity) || safeTiers[0];
    const next = safeTiers.find(t => t.minQuantity > validItemCount);
    
    return { currentTier: current, nextGoal: next, isMax: !next };
  }, [safeTiers, validItemCount]);

  // Cálculo de Progresso
  const progress = useMemo(() => {
    if (safeTiers.length === 0) return 0;
    const lastTierQuantity = safeTiers[safeTiers.length - 1]?.minQuantity || 1;
    const raw = (validItemCount / lastTierQuantity) * 100;
    return isFinite(raw) ? Math.min(Math.max(0, raw), 100) : 0;
  }, [validItemCount, safeTiers]);

  // Efeito de confetes
  useEffect(() => {
    if (isMax && validItemCount > 0) {
      confetti({ 
        particleCount: 40, 
        spread: 70, 
        origin: { y: 0.8 }, 
        colors: ['#10b981', '#0f172a'],
        zIndex: 999 
      });
    }
  }, [isMax, validItemCount]);

  // ✅ SÓ AGORA podemos dar o return null se não houver dados.
  // Isso garante que os Hooks acima foram chamados exatamente na mesma ordem na renderização anterior.
  if (safeTiers.length === 0 || !currentTier) return null;

  return (
    <div className="relative overflow-hidden rounded-3xl border border-slate-100 bg-white p-4 shadow-xl shadow-slate-200/50">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-slate-900 flex items-center justify-center shrink-0">
            {isMax ? <Award size={20} className="text-emerald-400" /> : <Gift size={20} className="text-emerald-400" />}
          </div>
          <div>
            <h3 className="text-lg font-black tracking-tighter text-slate-900 leading-none uppercase italic">
              {currentTier.discountValue}% <span className="text-emerald-500 text-sm not-italic">de desconto</span>
            </h3>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">
              {isMax ? "Nível Máximo" : "Benefício Ativo"}
            </p>
          </div>
        </div>
        
        <div className="text-right">
          <span className="block text-[10px] font-black text-slate-400 uppercase tracking-tighter">Carrinho</span>
          <span className="text-sm font-black text-slate-700 tabular-nums">{validItemCount} un</span>
        </div>
      </div>

      <div className="relative mb-4">
        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-slate-900 rounded-full"
            initial={false}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 1, ease: "circOut" }}
          />
        </div>
        
        <div className="absolute top-1/2 -translate-y-1/2 w-full flex justify-between px-0 pointer-events-none">
          {safeTiers.map((tier, i) => (
            <div key={`tier-${tier.minQuantity}-${i}`} className="flex flex-col items-center">
              <div className={`w-2.5 h-2.5 rounded-full border-2 transition-colors duration-500 ${
                validItemCount >= tier.minQuantity ? "bg-emerald-500 border-white" : "bg-white border-slate-200"
              }`} />
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-slate-50 pt-3">
        <AnimatePresence mode="wait">
          {nextGoal ? (
            <motion.div 
              key="next-tier"
              initial={{ opacity: 0, y: 5 }} 
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="flex items-center gap-2 text-slate-500"
            >
              <TrendingUp size={14} className="text-emerald-500" />
              <p className="text-[10px] font-bold uppercase tracking-tight">
                Faltam <span className="text-slate-900 font-black">{nextGoal.minQuantity - validItemCount} un</span> para{" "}
                <span className="text-emerald-600 font-black">{nextGoal.discountValue}% de desconto</span>
              </p>
            </motion.div>
          ) : (
            <motion.div 
              key="max-tier"
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }}
              className="flex items-center gap-1.5 text-emerald-600 font-black text-[10px] uppercase tracking-widest"
            >
              <CheckCircle2 size={14} /> Melhor oferta atingida!
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}