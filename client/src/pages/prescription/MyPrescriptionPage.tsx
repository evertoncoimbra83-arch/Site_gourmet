// client/src/pages/prescription/MyPrescriptionPage.tsx

import React, { useState } from "react";
import { Loader2, CheckCircle2, Bug, AlertCircle } from "lucide-react";

// ✅ IMPORTANDO A LÓGICA E O CARD QUE NÓS JÁ CONSERTAMOS!
import { usePrescriptionLogic } from "./hooks/usePrescriptionLogic";
import { OptionCard } from "./components/OptionCard";

export default function MyPrescriptionPage() {
  // A mágica toda agora vem do hook importado
  const { isLoading, activePlan, handleAddToCart } = usePrescriptionLogic();
  const [showDebug, setShowDebug] = useState(false);

  if (isLoading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center gap-4 bg-slate-50">
        <Loader2 className="animate-spin text-emerald-500" size={40} />
        <p className="text-xs font-black uppercase text-slate-400">Carregando sua dieta...</p>
      </div>
    );
  }

  if (!activePlan) {
    return (
      <div className="h-screen flex flex-col items-center justify-center p-8 text-center">
        <AlertCircle size={48} className="text-slate-200 mb-4" />
        <h2 className="font-black uppercase italic text-slate-800">Nenhum plano encontrado</h2>
        <p className="text-sm text-slate-400 max-w-xs">Você ainda não possui uma prescrição ativa.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 pb-24">
      <div className="max-w-4xl mx-auto py-12 px-4 relative">
        <header className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div>
            <h1 className="text-4xl md:text-5xl font-black uppercase italic text-slate-900 tracking-tighter leading-none">
              {activePlan.planName}
            </h1>
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mt-4 flex items-center gap-2">
              <CheckCircle2 size={12} className="text-emerald-500" /> 
              Prescrição Oficial Gourmet Saudável
            </p>
          </div>
          {activePlan.discountPercentage > 0 && (
            <div className="bg-slate-900 text-white px-6 py-3 rounded-3xl rotate-2 shadow-xl border-4 border-white">
              <p className="text-[10px] font-black uppercase opacity-60">Seu Benefício</p>
              <p className="text-2xl font-black italic">-{activePlan.discountPercentage}% OFF</p>
            </div>
          )}
        </header>

        <div className="space-y-16">
          {activePlan.meals.map((meal, idx) => (
            <section key={idx}>
              <div className="flex items-center gap-4 mb-8">
                <span className="h-10 w-10 bg-emerald-500 text-white rounded-2xl flex items-center justify-center text-lg font-black shadow-lg shadow-emerald-200 rotate-3">
                  {idx + 1}
                </span>
                <h2 className="text-2xl font-black uppercase italic text-slate-800 tracking-tight">
                  {meal.mealName}
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {meal.dishes.map((dish, dIdx) => (
                  <OptionCard 
                    key={dIdx} 
                    opt={dish} 
                    basePrice={Number(dish.originalPrice || dish.price || 0)} // Compatível com nossa nova tipagem
                    nutriDiscount={activePlan.discountPercentage} 
                    onAdd={() => handleAddToCart(dish)} // O hook já sabe o desconto internamente
                  />
                ))}
              </div>
            </section>
          ))}
        </div>

        {/* BOTAO DE DEBUG (Oculto para o usuário final, visível ao clicar) */}
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
          {showDebug && (
            <div className="w-87.5 bg-slate-900 text-emerald-400 rounded-3xl shadow-2xl p-6 font-mono text-[10px] mb-2 border border-white/10">
              <pre className="max-h-75 overflow-y-auto custom-scrollbar">
                {JSON.stringify(activePlan, null, 2)}
              </pre>
            </div>
          )}
          <button 
            onClick={() => setShowDebug(!showDebug)}
            className="p-4 rounded-full bg-slate-900 text-white shadow-2xl hover:scale-110 transition-all border-2 border-white/20"
          >
            <Bug size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}