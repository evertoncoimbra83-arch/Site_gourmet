import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, CheckCircle2, TrendingUp, Gift } from "lucide-react";
import { cn } from "@/lib/utils";

export function DiscountRoadmap({ tiers, itemCount }: { tiers: any[], itemCount: number }) {
  if (!tiers || tiers.length === 0 || !tiers[0]?.minQuantity) return null;

  const maxQty = tiers[tiers.length - 1].minQuantity || 1;
  const progressPercentage = Math.min((itemCount / maxQty) * 100, 100);
  const nextGoal = tiers.find(t => (t.minQuantity || 0) > itemCount);

  return (
    <div className="relative overflow-hidden rounded-[2.5rem] border border-slate-100 bg-white p-1 shadow-2xl shadow-slate-200/50">
      <div className="relative bg-gradient-to-b from-slate-50/50 to-white p-7 sm:p-8 rounded-[2.3rem] space-y-10">
        
        {/* Header Section */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-emerald-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-200">
              <Gift size={18} />
            </div>
            <div className="flex flex-col">
              <h4 className="text-[10px] font-bold uppercase tracking-[0.15em] text-emerald-600 leading-none mb-1">Campanha Ativa</h4>
              <p className="text-sm font-bold text-slate-900 tracking-tight">Escala de Descontos</p>
            </div>
          </div>
          <div className="px-4 py-2 bg-slate-900 rounded-2xl shadow-lg">
            <span className="text-[11px] font-bold text-white uppercase tracking-wider">{itemCount} {itemCount === 1 ? 'Item' : 'Itens'}</span>
          </div>
        </div>

        {/* Roadmap Line Section */}
        <div className="relative pt-10 pb-4 px-2">
          {/* Background Line */}
          <div className="absolute top-[3.25rem] left-0 w-full h-2 bg-slate-100 rounded-full" />
          
          {/* Active Progress Line */}
          <motion.div 
            className="absolute top-[3.25rem] left-0 h-2 rounded-full z-0"
            style={{ 
              background: "linear-gradient(90deg, #10b981 0%, #34d399 100%)",
              boxShadow: "0 0 20px rgba(16, 185, 129, 0.3)"
            }}
            initial={{ width: 0 }}
            animate={{ width: `${progressPercentage}%` }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          />
          
          <div className="relative flex justify-between">
            {tiers.map((tier, index) => {
              const tierMin = tier.minQuantity || 0;
              const isAchieved = itemCount >= tierMin;
              
              return (
                <div key={`tier-${index}`} className="flex flex-col items-center relative z-10">
                  
                  {/* Floating Discount Badge - O DESCONTO AQUI */}
                  <motion.div 
                    initial={false}
                    animate={{ 
                      y: isAchieved ? -8 : 0,
                      scale: isAchieved ? 1.1 : 1
                    }}
                    className={cn(
                      "absolute -top-12 px-3 py-1.5 rounded-xl font-black text-[12px] transition-all duration-500 shadow-sm border",
                      isAchieved 
                        ? "bg-emerald-500 text-white border-emerald-400 shadow-emerald-200" 
                        : "bg-white text-slate-400 border-slate-100"
                    )}
                  >
                    {tier.discountValue}%
                    {/* Pequena seta do badge */}
                    <div className={cn(
                      "absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 rotate-45 border-r border-b",
                      isAchieved ? "bg-emerald-500 border-emerald-400" : "bg-white border-slate-100"
                    )} />
                  </motion.div>

                  {/* Tier Node (O ponto na linha) */}
                  <div className={cn(
                    "h-5 w-5 rounded-full border-4 transition-all duration-500 bg-white mt-1",
                    isAchieved 
                      ? "border-emerald-500 scale-110" 
                      : "border-slate-200"
                  )} />
                  
                  {/* Quantity Label */}
                  <span className={cn(
                    "text-[10px] font-bold uppercase mt-3 tracking-tighter",
                    isAchieved ? "text-emerald-600" : "text-slate-400"
                  )}>
                    {tierMin} un
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Messaging Section */}
        <AnimatePresence mode="wait">
          {nextGoal ? (
            <motion.div 
              key="next" 
              initial={{ opacity: 0, y: 5 }} 
              animate={{ opacity: 1, y: 0 }} 
              exit={{ opacity: 0 }} 
              className="bg-emerald-50 rounded-2xl p-5 flex items-center justify-between border border-emerald-100/50"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white rounded-lg shadow-sm">
                  <Sparkles size={16} className="text-emerald-500" />
                </div>
                <p className="text-[12px] font-bold text-emerald-900 leading-tight">
                  Faltam <span className="text-emerald-600 text-base">{(nextGoal.minQuantity || 0) - itemCount}</span> para você<br/>
                  liberar o desconto de <span className="text-emerald-600 text-base">{nextGoal.discountValue}%</span>
                </p>
              </div>
              <TrendingUp size={20} className="text-emerald-300" />
            </motion.div>
          ) : (
            <motion.div 
              key="max" 
              initial={{ opacity: 0, scale: 0.98 }} 
              animate={{ opacity: 1, scale: 1 }} 
              className="bg-emerald-600 rounded-[1.5rem] p-5 text-center shadow-xl shadow-emerald-200"
            >
              <div className="flex items-center justify-center gap-3">
                <CheckCircle2 size={20} className="text-white" />
                <p className="text-sm font-black text-white uppercase tracking-widest">
                  Nível Máximo Alcançado!
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}