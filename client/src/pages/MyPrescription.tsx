import React, { useMemo, useState, useEffect } from "react";
import { trpc } from "@/_core/trpc";
import { useCart } from "@/_core/CartContext";
import { useNavigate, useSearchParams } from "react-router-dom";
import { appToast as toast } from "@/lib/app-toast";
import { 
  Loader2, Utensils, Info, Tag, CalendarDays, 
  Flame, Beef, Wheat, Droplets, CheckCircle2, ShoppingBag 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// --- INTERFACES DE DADOS ---

interface DishOption {
  dishId: string | number;
  name: string;
  price: number;
  sizeId?: string | number;
  sizeName?: string;
  mainDishWeight?: number;
  nutritionalData?: {
    macros?: Record<string, number>;
    baseMacros?: Record<string, number>;
  };
  macros?: Record<string, number>;
  allowedAccompaniments?: Array<{
    id: string | number;
    name: string;
    weight?: number;
  }>;
  [key: string]: unknown;
}

interface ProcessedMeal {
  mealName: string;
  notes: string;
  dishes: DishOption[];
}

interface Prescription {
  id: string;
  planName: string;
  technicalInsight: string;
  discountPercentage: number;
  meals: ProcessedMeal[];
}

interface CatalogProduct {
  id: string | number;
  price?: string | number;
  basePrice?: string | number;
  salePrice?: string | number;
}

// Interface para as refeições brutas mapeadas do banco
interface RawMeal {
  mealName?: string;
  name?: string;
  notes?: string;
  dishes?: unknown[];
  groups?: Array<{ options?: unknown[] }>;
}

// Interface para os dados brutos que vêm do tRPC
interface RawPrescription {
  id: string | number;
  planName?: string;
  plan_name?: string;
  technicalInsight?: string;
  technical_insight?: string;
  discountPercentage?: number;
  discount_percentage?: number;
  dietSnapshot?: string | RawMeal[];
  diet_snapshot?: string | RawMeal[];
  meals?: RawMeal[];
  suggestedData?: RawMeal[];
}

interface TRPCRouterWithProducts {
  products?: {
    list: {
      useQuery: () => { data: { data: CatalogProduct[] } | CatalogProduct[] | null };
    };
  };
}

// ============================================================================
// 1. LÓGICA (HOOK)
// ============================================================================
function usePrescriptionLogic() {
  const { data: rawPrescriptions, isLoading: isPrescLoading } = trpc.nutri.getDashboard.useQuery();
  const [searchParams] = useSearchParams();
  const scanId = searchParams.get("scanId");
  
  const productsRouter = (trpc as unknown as TRPCRouterWithProducts).products;
  const { data: catalogRaw } = productsRouter?.list?.useQuery?.() || { data: null };
  
  const catalog = useMemo(() => {
    if (!catalogRaw) return [];
    return Array.isArray(catalogRaw) ? catalogRaw : (catalogRaw as { data: CatalogProduct[] }).data || [];
  }, [catalogRaw]);

  const [selectedPlanIndex, setSelectedPlanIndex] = useState(0);
  const { addItem, items } = useCart();
  const navigate = useNavigate();

  const allPrescriptions = useMemo((): Prescription[] => {
    if (!rawPrescriptions || !Array.isArray(rawPrescriptions)) return [];

    return (rawPrescriptions as unknown as RawPrescription[]).map((raw) => {
      // ✅ FIX: rawMeals agora usa a interface estrita RawMeal em vez de any[]
      let rawMeals: RawMeal[] = [];
      const snap = raw.dietSnapshot || raw.diet_snapshot || raw.meals || raw.suggestedData;
      
      if (snap) {
        try {
          // ✅ FIX: Cast para RawMeal[] no JSON.parse e no array de fallback
          rawMeals = typeof snap === 'string' ? (JSON.parse(snap) as RawMeal[]) : (snap as RawMeal[]);
        } catch {
          rawMeals = [];
        }
      }

      // ✅ FIX: 'm' tipado estritamente como RawMeal
      const processedMeals = (Array.isArray(rawMeals) ? rawMeals : []).map((m: RawMeal): ProcessedMeal => {
        // ✅ FIX: 'g' tipado pela interface RawMeal implicitamente no flatMap, sem necessidade de 'any'
        const pratos = (m.dishes || m.groups?.flatMap((g) => g.options || []) || []) as DishOption[];
        
        const enrichedPratos = pratos.map((p): DishOption => {
          const catalogItem = catalog.find((c) => Number(c.id) === Number(p.dishId));
          
          const realPrice = catalogItem 
            ? Number(catalogItem.price || catalogItem.basePrice || catalogItem.salePrice || 0) 
            : Number(p.price || p.priceAtCreation || 0);

          return { ...p, price: realPrice };
        });

        return {
          mealName: String(m.mealName || m.name || "Refeição"),
          notes: String(m.notes || ""),
          dishes: enrichedPratos
        };
      });

      return {
        id: String(raw.id),
        planName: String(raw.planName || raw.plan_name || "Plano Alimentar"),
        technicalInsight: String(raw.technicalInsight || raw.technical_insight || ""),
        discountPercentage: Number(raw.discountPercentage || raw.discount_percentage || 0),
        meals: processedMeals
      };
    });
  }, [rawPrescriptions, catalog]);

  useEffect(() => {
    if (scanId && allPrescriptions.length > 0) {
      const foundIdx = allPrescriptions.findIndex(p => p.id === scanId);
      if (foundIdx !== -1 && foundIdx !== selectedPlanIndex) {
        setSelectedPlanIndex(foundIdx);
      }
    }
  }, [scanId, allPrescriptions, selectedPlanIndex]);

  const activePlan = allPrescriptions[selectedPlanIndex] || null;

  const handleAddToCart = async (opt: DishOption) => {
    if (!opt.dishId || !activePlan) {
      toast.error("Erro ao adicionar: Prato indisponível.");
      return;
    }

    try {
      const basePrice = Number(opt.price || 0);
      const discount = activePlan.discountPercentage || 0;
      const finalPrice = discount > 0 ? basePrice * (1 - discount / 100) : basePrice;

      const macros = opt.nutritionalData?.macros || opt.nutritionalData?.baseMacros || opt.macros || {};
      const kcal = Number(macros.kcal || macros.energyKcal || 0);
      const protein = Number(macros.proteins || macros.protein || 0);
      const carbs = Number(macros.carbs || 0);
      const fat = Number(macros.fatTotal || macros.fat || 0);

      await addItem({
        itemType: "dish",
        dishId: Number(opt.dishId),
        quantity: 1,
        price: finalPrice,
        name: opt.name || "Prato Selecionado",
        image: "",
        options: {
          _type: 'single',
          dishId: Number(opt.dishId),
          selectedSizeId: Number(opt.sizeId || 0),
          selectedSizeName: opt.sizeName || (opt.mainDishWeight ? `${opt.mainDishWeight}g` : "Tamanho Padrão"),
          selectedAccs: (opt.allowedAccompaniments || []).map((acc) => ({
            id: Number(acc.id),
            name: acc.name,
            weight: Number(acc.weight || 100),
            groupName: "Acompanhamento"
          }))
        },
        appliedNutrition: { energyKcal: kcal, proteins: protein, carbs: carbs, fatTotal: fat }
      });
      toast.success(`${opt.name} adicionado à sacola!`);
    } catch {
      toast.error("Ocorreu um erro ao processar a sua sacola.");
    }
  };

  return {
    isLoading: isPrescLoading,
    allPrescriptions,
    activePlan,
    selectedPlanIndex,
    setSelectedPlanIndex,
    totalCartItems: items?.length || 0,
    handleAddToCart,
    navigate
  };
}

// ============================================================================
// 2. COMPONENTES VISUAIS
// ============================================================================

interface OptionCardProps {
  opt: DishOption;
  basePrice: number;
  nutriDiscount: number;
  onAdd: (opt: DishOption) => void;
}

function OptionCard({ opt, basePrice, nutriDiscount, onAdd }: OptionCardProps) {
  const macros = opt.nutritionalData?.macros || opt.nutritionalData?.baseMacros || opt.macros || {};
  const kcal = Math.round(Number(macros.kcal || macros.energyKcal || 0));
  const protein = Math.round(Number(macros.proteins || macros.protein || 0));
  const carbs = Math.round(Number(macros.carbs || 0));
  const fat = Math.round(Number(macros.fatTotal || macros.fat || 0));
  
  const finalPrice = nutriDiscount > 0 ? basePrice * (1 - nutriDiscount / 100) : basePrice;

  return (
    <div className="bg-white rounded-4xl border-2 border-slate-100 p-2 flex flex-col shadow-sm hover:shadow-xl hover:border-emerald-200 transition-all group h-full text-left">
      <div className="p-6 flex-1">
        <h3 className="text-lg font-black uppercase italic text-slate-800 mb-5 group-hover:text-emerald-700 transition-colors leading-tight">
          {opt.name || "Prato Sem Nome"}
        </h3>
        
        <div className="grid grid-cols-4 gap-2 mb-8 bg-slate-50/80 rounded-2xl p-4 border border-slate-100">
          <div className="flex flex-col items-center"><Flame size={14} className="text-slate-400 mb-1" /><span className="text-[10px] font-black text-slate-800">{kcal}</span><span className="text-[8px] uppercase text-slate-400 font-bold">Kcal</span></div>
          <div className="flex flex-col items-center"><Beef size={14} className="text-emerald-500 mb-1" /><span className="text-[10px] font-black text-emerald-700">{protein}g</span><span className="text-[8px] uppercase text-emerald-500 font-bold">Prot</span></div>
          <div className="flex flex-col items-center"><Wheat size={14} className="text-blue-500 mb-1" /><span className="text-[10px] font-black text-blue-700">{carbs}g</span><span className="text-[8px] uppercase text-blue-500 font-bold">Carb</span></div>
          <div className="flex flex-col items-center"><Droplets size={14} className="text-orange-500 mb-1" /><span className="text-[10px] font-black text-orange-700">{fat}g</span><span className="text-[8px] uppercase text-orange-500 font-bold">Gord</span></div>
        </div>

        {opt.allowedAccompaniments && opt.allowedAccompaniments.length > 0 && (
          <ul className="space-y-2.5 mb-2">
            {opt.allowedAccompaniments.map((acc, aIdx) => (
              <li key={aIdx} className="flex items-start gap-2 text-sm font-medium text-slate-600">
                <CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                <span className="leading-tight">{acc.name}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="bg-slate-50 p-5 rounded-[2rem] flex items-center justify-between border border-slate-100 mt-auto">
        <div className="flex flex-col text-left">
          {nutriDiscount > 0 && basePrice > 0 && (
            <span className="text-[10px] font-bold text-slate-400 line-through">
              R$ {basePrice.toFixed(2).replace('.', ',')}
            </span>
          )}
          <span className="text-xl font-black italic text-emerald-600 leading-none">
            {finalPrice > 0 ? `R$ ${finalPrice.toFixed(2).replace('.', ',')}` : "Ver Preço"}
          </span>
        </div>
        <Button onClick={() => onAdd(opt)} className="h-12 px-6 rounded-2xl bg-slate-900 hover:bg-emerald-600 text-white font-black uppercase text-[10px] tracking-widest shadow-md transition-all active:scale-95">
          <ShoppingBag size={16} className="mr-2 hidden sm:block" /> Adicionar
        </Button>
      </div>
    </div>
  );
}

// ============================================================================
// 3. PÁGINA PRINCIPAL
// ============================================================================
export default function MyPrescriptionPage() {
  const { 
    isLoading, 
    allPrescriptions, 
    activePlan,
    selectedPlanIndex, 
    setSelectedPlanIndex,
    totalCartItems, 
    handleAddToCart, 
    navigate 
  } = usePrescriptionLogic();

  if (isLoading) {
    return (
      <div className="h-[60vh] flex flex-col gap-4 items-center justify-center">
        <Loader2 className="animate-spin text-emerald-500" size={40} />
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">A carregar Dieta...</span>
      </div>
    );
  }

  if (!activePlan || !activePlan.meals || activePlan.meals.length === 0) {
    return (
      <div className="max-w-md mx-auto text-center py-20 px-6 animate-in fade-in zoom-in duration-500">
        <div className="h-24 w-24 bg-slate-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
          <Utensils size={40} className="text-slate-300" />
        </div>
        <h2 className="text-2xl font-black uppercase italic text-slate-800">Nenhum plano ativo</h2>
        <p className="text-slate-500 text-sm mt-2">Você ainda não possui um plano ou análise ativa.</p>
        <Button onClick={() => navigate("/produtos")} className="mt-8 rounded-2xl h-12 px-8 font-black uppercase text-[10px] bg-slate-900 text-white hover:bg-emerald-600 transition-all">
          Ver Cardápio Normal
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 md:px-6 mb-24 animate-in fade-in slide-in-from-bottom-4 duration-500 text-left">
      
      {allPrescriptions && allPrescriptions.length > 1 && (
        <div className="flex gap-3 mb-10 overflow-x-auto pb-4 custom-scrollbar">
          {allPrescriptions.map((plan, idx) => (
            <button
              key={plan.id || idx}
              onClick={() => setSelectedPlanIndex(idx)}
              className={cn(
                "px-6 py-4 rounded-3xl border-2 transition-all shrink-0 min-w-40 text-left",
                selectedPlanIndex === idx ? "bg-slate-900 text-white border-slate-900 shadow-xl scale-105" : "bg-white text-slate-400 border-slate-100 hover:border-emerald-200"
              )}
            >
              <div className="flex items-center gap-2 mb-1">
                <CalendarDays size={14} className={selectedPlanIndex === idx ? "text-emerald-400" : ""} />
                <span className="text-[10px] font-black uppercase tracking-widest">Opção {idx + 1}</span>
              </div>
              <span className="font-black italic text-sm truncate block">{plan.planName}</span>
            </button>
          ))}
        </div>
      )}

      <header className="mb-10 text-center md:text-left">
        <div className="flex flex-wrap items-center gap-2 mb-4 justify-center md:justify-start">
          <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-none font-black uppercase text-[9px] tracking-widest px-3 py-1">
            Plano Ativo
          </Badge>
          {activePlan.discountPercentage > 0 && (
            <Badge className="bg-amber-100 text-amber-700 border-none font-black uppercase text-[9px] tracking-widest px-3 py-1 flex gap-1 items-center">
              <Tag size={10} /> {activePlan.discountPercentage}% OFF
            </Badge>
          )}
        </div>
        <h1 className="text-3xl md:text-5xl font-black uppercase italic text-slate-900 leading-none">
          {activePlan.planName}
        </h1>
        {activePlan.technicalInsight && (
          <div className="mt-6 p-5 bg-blue-50 rounded-[2rem] border border-blue-100 flex gap-4 text-left shadow-sm">
            <Info className="text-blue-500 shrink-0 mt-0.5" size={24} />
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase text-blue-800 tracking-widest mb-1">Diagnóstico Clínico</span>
              <p className="text-blue-900 text-xs font-medium leading-relaxed">{activePlan.technicalInsight}</p>
            </div>
          </div>
        )}
      </header>

      <div className="space-y-12">
        {activePlan.meals.map((meal, mIdx) => (
          <section key={mIdx} className="relative">
            <div className="flex items-center gap-4 mb-6">
              <span className="h-10 w-10 md:h-12 md:w-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-black italic text-lg shadow-lg shadow-slate-200 shrink-0">
                {mIdx + 1}
              </span>
              <h2 className="text-xl md:text-2xl font-black uppercase italic text-slate-800 truncate">{meal.mealName}</h2>
            </div>

            {meal.notes && (
              <div className="mb-6 ml-14 md:ml-16 bg-amber-50 rounded-[1.5rem] p-4 border border-amber-100/50">
                <p className="text-[9px] text-amber-600 font-black uppercase tracking-widest mb-1">Dica da Análise</p>
                <p className="text-amber-900 text-xs font-medium">{meal.notes}</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(!meal.dishes || meal.dishes.length === 0) ? (
                <div className="bg-white rounded-[2rem] border border-slate-100 p-5 md:p-6 shadow-sm col-span-full text-center text-slate-400">
                  <span className="text-[10px] font-black uppercase tracking-widest block">Nenhum prato associado a esta refeição</span>
                </div>
              ) : (
                meal.dishes.map((opt, dIdx) => {
                  const basePrice = Number(opt.price || 0);
                  return (
                    <OptionCard 
                      key={opt.dishId || dIdx}
                      opt={opt}
                      basePrice={basePrice}
                      nutriDiscount={activePlan.discountPercentage}
                      onAdd={() => handleAddToCart(opt)}
                    />
                  );
                })
              )}
            </div>
          </section>
        ))}
      </div>

      <FloatingCartFooter 
        totalItems={totalCartItems} 
        onCheckout={() => navigate("/carrinho")} 
      />
    </div>
  );
}

function FloatingCartFooter({ totalItems, onCheckout }: { totalItems: number; onCheckout: () => void }) {
  if (totalItems === 0) return null;
  return (
    <div className="fixed bottom-0 left-0 w-full p-4 bg-white/80 backdrop-blur-md border-t border-slate-200 shadow-[0_-10px_30px_rgba(0,0,0,0.05)] z-50 animate-in slide-in-from-bottom-10 flex justify-center">
      <div className="w-full max-w-4xl flex items-center justify-between bg-slate-900 rounded-[1.5rem] p-3 md:p-4 shadow-xl">
        <div className="flex items-center gap-4 pl-2">
          <div className="bg-emerald-500 text-slate-900 h-10 w-10 md:h-12 md:w-12 rounded-xl flex items-center justify-center font-black text-lg shadow-lg shadow-emerald-500/30">
            {totalItems}
          </div>
          <div className="flex flex-col text-left">
            <span className="text-white font-black uppercase italic leading-none md:text-lg">A sua Sacola</span>
            <span className="text-slate-400 text-[9px] md:text-[10px] font-bold uppercase tracking-widest">Pronta para finalizar</span>
          </div>
        </div>
        <Button onClick={onCheckout} className="h-12 px-6 md:px-8 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-black uppercase text-[10px] md:text-xs tracking-widest transition-all active:scale-95">
          Finalizar <ShoppingBag size={18} className="ml-2 hidden md:block" />
        </Button>
      </div>
    </div>
  );
}