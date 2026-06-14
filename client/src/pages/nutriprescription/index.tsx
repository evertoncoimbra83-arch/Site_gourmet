import React from "react";
import { Loader2, Utensils, Info, Tag, CalendarDays, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { usePrescriptionLogic } from "./hooks/usePrescriptionLogic";
import { OptionCard } from "./components/OptionCard";

export default function MyPrescriptionPage() {
    const { 
        isLoading, 
        allPrescriptions, 
        activePlan, 
        selectedPlanIndex, 
        setSelectedPlanIndex, 
        totalCartItems, 
        handleAddToCart, 
        navigate,
        isAuthenticated,
        authLoading
    } = usePrescriptionLogic();

    if (authLoading || (isLoading && isAuthenticated)) {
        return (
            <div className="h-[60vh] flex flex-col gap-4 items-center justify-center">
                <Loader2 className="animate-spin text-emerald-500" size={40} />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">A carregar Dieta...</span>
            </div>
        );
    }

    if (!isAuthenticated) {
        return (
            <div className="max-w-md mx-auto text-center py-20 px-6 space-y-6">
                <div className="h-24 w-24 bg-slate-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
                    <Utensils size={40} className="text-slate-300" />
                </div>
                <h2 className="text-2xl font-black uppercase italic text-slate-800">Acesso Restrito</h2>
                <p className="text-sm text-slate-500 font-bold uppercase tracking-tight max-w-xs mx-auto">
                    Faça login ou crie uma conta para visualizar o seu plano alimentar personalizado.
                </p>
                <Button 
                    onClick={() => window.dispatchEvent(new CustomEvent("open-auth-drawer"))} 
                    className="rounded-2xl h-12 px-8 font-black uppercase text-[10px] bg-slate-900 text-white hover:bg-emerald-600 shadow-lg"
                >
                    Entrar ou Cadastrar
                </Button>
            </div>
        );
    }

    if (!activePlan || !activePlan.meals || activePlan.meals.length === 0) {
        return (
            <div className="max-w-md mx-auto text-center py-20 px-6">
                <div className="h-24 w-24 bg-slate-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6"><Utensils size={40} className="text-slate-300" /></div>
                <h2 className="text-2xl font-black uppercase italic text-slate-800">Nenhum plano ativo</h2>
                <Button onClick={() => navigate("/produtos")} className="mt-8 rounded-2xl h-12 px-8 font-black uppercase text-[10px] bg-slate-900 text-white hover:bg-emerald-600">Ver Cardápio</Button>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto py-8 px-4 md:px-6 mb-24 text-left">
            {allPrescriptions && allPrescriptions.length > 1 && (
                <div className="flex gap-3 mb-10 overflow-x-auto pb-4 custom-scrollbar">
                    {allPrescriptions.map((plan, idx) => (
                        <button key={plan.id || idx} onClick={() => setSelectedPlanIndex(idx)} className={cn("px-6 py-4 rounded-3xl border-2 transition-all shrink-0 min-w-40 text-left", selectedPlanIndex === idx ? "bg-slate-900 text-white border-slate-900 shadow-xl scale-105" : "bg-white text-slate-400 border-slate-100")}>
                            <div className="flex items-center gap-2 mb-1"><CalendarDays size={14} className={selectedPlanIndex === idx ? "text-emerald-400" : ""} /><span className="text-[10px] font-black uppercase tracking-widest">Opção {idx + 1}</span></div>
                            <span className="font-black italic text-sm truncate block">{plan.planName}</span>
                        </button>
                    ))}
                </div>
            )}

            <header className="mb-10">
                <div className="flex flex-wrap items-center gap-2 mb-4">
                    <Badge className="bg-emerald-100 text-emerald-700 border-none font-black uppercase text-[9px] tracking-widest px-3 py-1">Plano Ativo</Badge>
                    {activePlan.discountPercentage > 0 && <Badge className="bg-amber-100 text-amber-700 border-none font-black uppercase text-[9px] tracking-widest px-3 py-1 flex gap-1 items-center"><Tag size={10} /> {activePlan.discountPercentage}% OFF</Badge>}
                </div>
                <h1 className="text-3xl md:text-5xl font-black uppercase italic text-slate-900 leading-none">{activePlan.planName}</h1>
                {activePlan.technicalInsight && (
                    <div className="mt-6 p-5 bg-blue-50 rounded-[2rem] border border-blue-100 flex gap-4 text-left">
                        <Info className="text-blue-500 shrink-0 mt-0.5" size={24} />
                        <div className="flex flex-col"><span className="text-[10px] font-black uppercase text-blue-800 tracking-widest mb-1">Diagnóstico Clínico</span><p className="text-blue-900 text-xs font-medium leading-relaxed">{activePlan.technicalInsight}</p></div>
                    </div>
                )}
            </header>

            <div className="space-y-12">
                {activePlan.meals.map((meal, mIdx) => (
                    <section key={mIdx}>
                        <div className="flex items-center gap-4 mb-6">
                            <span className="h-10 w-10 md:h-12 md:w-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-black italic text-lg shadow-lg shrink-0">{mIdx + 1}</span>
                            <h2 className="text-xl md:text-2xl font-black uppercase italic text-slate-800 truncate">{meal.mealName}</h2>
                        </div>
                        {meal.notes && (
                            <div className="mb-6 ml-14 md:ml-16 bg-amber-50 rounded-[1.5rem] p-4 border border-amber-100/50">
                                <p className="text-[9px] text-amber-600 font-black uppercase tracking-widest mb-1">Dica da Análise</p>
                                <p className="text-amber-900 text-xs font-medium">{meal.notes}</p>
                            </div>
                        )}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {!meal.dishes || meal.dishes.length === 0 ? (
                                <div className="bg-white rounded-[2rem] border border-slate-100 p-6 col-span-full text-center text-slate-400"><span className="text-[10px] font-black uppercase tracking-widest block">Nenhum prato associado</span></div>
                            ) : (
                                meal.dishes.map((opt, dIdx) => <OptionCard key={opt.dishId || dIdx} opt={opt} basePrice={Number(opt.price || 0)} nutriDiscount={activePlan.discountPercentage} onAdd={() => handleAddToCart(opt)} />)
                            )}
                        </div>
                    </section>
                ))}
            </div>

            <FloatingCartFooter totalItems={totalCartItems} onCheckout={() => navigate("/carrinho")} />
        </div>
    );
}

function FloatingCartFooter({ totalItems, onCheckout }: { totalItems: number; onCheckout: () => void }) {
    if (totalItems === 0) return null;
    return (
        <div className="fixed bottom-0 left-0 w-full p-4 bg-white/80 backdrop-blur-md border-t border-slate-200 z-50 flex justify-center">
            <div className="w-full max-w-4xl flex items-center justify-between bg-slate-900 rounded-[1.5rem] p-4 shadow-xl">
                <div className="flex items-center gap-4 pl-2">
                    <div className="bg-emerald-500 text-slate-900 h-12 w-12 rounded-xl flex items-center justify-center font-black text-lg">{totalItems}</div>
                    <div className="flex flex-col text-left"><span className="text-white font-black uppercase italic leading-none md:text-lg">A sua Sacola</span><span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Pronta para finalizar</span></div>
                </div>
                <Button onClick={onCheckout} className="h-12 px-8 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-black uppercase text-xs tracking-widest transition-all">Finalizar</Button>
            </div>
        </div>
    );
}