import React, { useMemo } from "react";
import { trpc } from "@/_core/trpc";
import { useCart } from "@/_core/CartContext";
import { 
  Loader2, ShoppingBag, CheckCircle2, 
  UtensilsCrossed, Flame, Beef, Wheat, 
  Droplets, Sparkles, ChevronRight 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { appToast as toast } from "@/lib/app-toast";
import { cn } from "@/lib/utils";

interface AiScanResultViewProps {
  taskId: string;
}

export function AiScanResultView({ taskId }: AiScanResultViewProps) {
  const { addItem } = useCart();
  const utils = trpc.useUtils();
  
  // 1. CONSUMO DAS APIS (TRPC)
  const aiApi = (trpc as any).ai;
  const statusQuery = aiApi.checkStatus.useQuery(
    { scanId: taskId }, 
    { 
      enabled: !!taskId, 
      refetchInterval: (data: any) => data?.status === "pending" ? 3000 : false 
    }
  );

  const productsQuery = trpc.products.list.useQuery(undefined, { staleTime: Infinity });

  // 2. PROCESSAMENTO DOS DADOS (MEMO)
  const meals = useMemo(() => {
    const statusData = statusQuery.data;
    if (!statusData || statusData.status !== "completed") return [];
    
    try {
      const catalog = (productsQuery.data as any[]) || [];
      const suggested = statusData.data;
      const parsed = typeof suggested === 'string' ? JSON.parse(suggested) : suggested;
      const rawMeals = Array.isArray(parsed) ? parsed : (parsed?.meals || [parsed]);

      return rawMeals.map((m: any) => {
        const rawDishes = m.dishes || m.groups?.flatMap((g: any) => g.options) || [];

        return {
          name: m.name || m.mealName || "Refeição",
          notes: m.notes || "",
          dishes: rawDishes.map((p: any) => {
            const item = catalog.find((c) => Number(c.id) === Number(p.dishId));
            return {
              ...p,
              name: p.name || item?.name || "Prato Selecionado",
              price: item ? Number(item.salePrice || item.price || 0) : Number(p.price || 0),
              imageUrl: item?.imageUrl || "",
              macros: p.macros || p.nutritionalData?.baseMacros || p.nutritionalData?.macros || {},
              selectedAccompaniments: p.selectedAccompaniments || []
            };
          })
        };
      });
    } catch { return []; }
  }, [statusQuery.data, productsQuery.data]);

  const handleAddDish = async (dish: any) => {
    try {
      await addItem({
        itemType: "dish",
        dishId: Number(dish.dishId),
        quantity: 1,
        price: dish.price,
        name: dish.name,
        image: dish.imageUrl || "",
        options: {
          _type: 'single',
          dishId: Number(dish.dishId),
          selectedSizeId: Number(dish.sizeId || 0),
          selectedSizeName: dish.sizeName || "Tamanho Sugerido",
          selectedAccs: (dish.selectedAccompaniments || []).map((acc: any) => ({
            id: Number(acc.optionId || acc.id),
            name: acc.name,
            weight: Number(acc.weight || 100),
            groupName: "Acompanhamento Sugerido"
          }))
        },
        appliedNutrition: {
          energyKcal: Number(dish.macros?.kcal || dish.macros?.energyKcal || 0),
          proteins: Number(dish.macros?.protein || dish.macros?.proteins || 0),
          carbs: Number(dish.macros?.carbs || 0),
          fatTotal: Number(dish.macros?.fat || dish.macros?.fatTotal || 0),
        }
      });
      toast.success(`${dish.name} adicionado à sacola!`);
    } catch {
      toast.error("Erro ao adicionar prato.");
    }
  };

  if (statusQuery.isLoading || statusQuery.data?.status === "pending") {
    return (
      <div className="py-24 flex flex-col items-center justify-center gap-6 bg-slate-50/50 rounded-[3rem] border border-dashed border-slate-200 animate-in fade-in duration-700">
        <div className="relative">
           <Loader2 className="animate-spin text-emerald-500" size={48} strokeWidth={1.5} />
           <Sparkles className="absolute -top-1 -right-1 text-amber-400 animate-pulse" size={16} />
        </div>
        <div className="text-center">
          <span className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-400 block mb-2">Processando IA</span>
          <p className="text-slate-500 text-xs font-medium italic">Cruzando sua dieta com nosso cardápio...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-16 p-2 md:p-4">
      {meals.map((meal: any, idx: number) => (
        <section key={idx} className="animate-in fade-in slide-in-from-bottom-6 duration-700 delay-150">
          {/* HEADER DA REFEIÇÃO */}
          <div className="flex flex-col mb-8 gap-2">
            <div className="flex items-center gap-3">
               <div className="h-10 w-10 rounded-2xl bg-slate-950 text-emerald-400 flex items-center justify-center font-black italic shadow-xl rotate-3">
                 {idx + 1}
               </div>
               <h2 className="text-2xl md:text-3xl font-black uppercase italic text-slate-900 tracking-tighter">
                 {meal.name}
               </h2>
            </div>
            {meal.notes && (
              <div className="bg-emerald-50/60 border-l-4 border-emerald-400 p-4 rounded-r-[2rem] rounded-bl-[1rem] ml-4 md:ml-12 mt-2">
                <span className="text-[9px] font-black uppercase tracking-widest text-emerald-700 mb-1 flex items-center gap-2">
                  <CheckCircle2 size={12} /> Insight da Nutri IA
                </span>
                <p className="text-[12px] font-semibold text-emerald-900/80 leading-relaxed italic">
                  {`"${meal.notes}"`}
                </p>
              </div>
            )}
          </div>

          {/* GRID DE PRATOS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 ml-0 md:ml-8">
            {meal.dishes.map((dish: any, dIdx: number) => (
              <div key={dIdx} className="group bg-white rounded-[2.8rem] border border-slate-100 p-2 flex flex-col shadow-sm hover:shadow-2xl hover:border-emerald-200 transition-all duration-500 relative overflow-hidden">
                
                {/* CARD CONTENT */}
                <div className="p-6 pb-2">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-black uppercase italic text-slate-800 leading-tight group-hover:text-emerald-700 transition-colors">
                      {dish.name}
                    </h3>
                    <div className="bg-slate-100 text-slate-500 px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-tighter">
                      {dish.sizeName || 'Mapeado'}
                    </div>
                  </div>

                  {/* ACOMPANHAMENTOS */}
                  {dish.selectedAccompaniments?.length > 0 && (
                    <div className="mb-6 space-y-2 bg-slate-50/50 p-4 rounded-3xl border border-slate-100">
                      <p className="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-1 flex items-center gap-1.5">
                        <UtensilsCrossed size={10} /> Guarnição Ideal
                      </p>
                      <ul className="grid grid-cols-1 gap-1.5">
                        {dish.selectedAccompaniments.map((acc: any, aIdx: number) => (
                          <li key={aIdx} className="text-[11px] font-bold text-slate-600 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            {acc.name}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* MACROS PILLS */}
                  <div className="grid grid-cols-4 gap-2 mb-4">
                    <div className="flex flex-col items-center p-2 rounded-2xl bg-orange-50/50 border border-orange-100">
                       <Flame size={12} className="text-orange-500 mb-1" />
                       <span className="text-[11px] font-black text-slate-800">{Math.round(dish.macros.kcal || 0)}</span>
                       <span className="text-[7px] uppercase font-black text-orange-400">Kcal</span>
                    </div>
                    <div className="flex flex-col items-center p-2 rounded-2xl bg-emerald-50/50 border border-emerald-100">
                       <Beef size={12} className="text-emerald-500 mb-1" />
                       <span className="text-[11px] font-black text-emerald-700">{Math.round(dish.macros.protein || dish.macros.proteins || 0)}g</span>
                       <span className="text-[7px] uppercase font-black text-emerald-400">Prot</span>
                    </div>
                    <div className="flex flex-col items-center p-2 rounded-2xl bg-blue-50/50 border border-blue-100">
                       <Wheat size={12} className="text-blue-500 mb-1" />
                       <span className="text-[11px] font-black text-blue-700">{Math.round(dish.macros.carbs || 0)}g</span>
                       <span className="text-[7px] uppercase font-black text-blue-400">Carb</span>
                    </div>
                    <div className="flex flex-col items-center p-2 rounded-2xl bg-slate-50 border border-slate-100">
                       <Droplets size={12} className="text-slate-400 mb-1" />
                       <span className="text-[11px] font-black text-slate-600">{Math.round(dish.macros.fat || dish.macros.fatTotal || 0)}g</span>
                       <span className="text-[7px] uppercase font-black text-slate-400">Gord</span>
                    </div>
                  </div>
                </div>

                {/* BOTTOM ACTION */}
                <div className="mt-auto p-4 pt-0">
                  <div className="bg-slate-950 p-3 rounded-[2rem] flex items-center justify-between shadow-xl group-hover:bg-emerald-600 transition-all duration-500">
                    <div className="pl-4">
                      <span className="text-[8px] font-black text-white/50 uppercase tracking-widest block leading-none mb-1">Preço Sugerido</span>
                      <span className="text-lg font-black italic text-white leading-none">
                        R$ {Number(dish.price || 0).toFixed(2).replace('.', ',')}
                      </span>
                    </div>
                    <Button 
                      onClick={() => handleAddDish(dish)}
                      className="bg-white hover:bg-emerald-50 text-slate-950 rounded-2xl h-11 px-6 font-black uppercase text-[10px] tracking-widest transition-transform active:scale-95 shadow-lg"
                    >
                      Escolher <ChevronRight size={14} className="ml-1" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}