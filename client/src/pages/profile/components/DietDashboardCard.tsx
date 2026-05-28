// client/src/pages/profile/components/DietDashboardCard.tsx
import React from "react";
import { Utensils, ArrowRight, Tag, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";

interface DishOption {
  dishId: string | number;
  name: string;
  price?: number;
  priceAtCreation?: number;
}

interface ProcessedMeal {
  mealName: string;
  notes?: string | null;
  dishes: DishOption[];
}

interface Prescription {
  id: string;
  planName: string | null;
  technicalInsight: string | null;
  discountPercentage: number | null;
  meals: ProcessedMeal[];
}

export function DietDashboardCard({ diet, isLoading }: { diet: Prescription[] | null; isLoading: boolean }) {
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <Card className="rounded-[2rem] border-slate-100 shadow-sm overflow-hidden bg-white animate-pulse">
        <CardContent className="p-6 h-32 bg-slate-50/50" />
      </Card>
    );
  }

  const activePlan = diet && diet.length > 0 ? diet[0] : null;

  if (!activePlan) {
    return (
      <Card className="rounded-[2rem] border-slate-100 shadow-sm overflow-hidden bg-white hover:shadow-md transition-all duration-300">
        <CardContent className="p-6 md:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 text-left">
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-2xl bg-slate-50 flex items-center justify-center shrink-0 text-slate-400">
              <Utensils size={22} />
            </div>
            <div>
              <h4 className="text-sm font-black uppercase text-slate-800 tracking-tight italic">
                Sua Alimentação Planejada
              </h4>
              <p className="text-xs text-slate-400 font-medium leading-relaxed mt-1 max-w-md">
                Tenha um cardápio personalizado elaborado por nutricionistas parceiros com descontos exclusivos em nossas refeições.
              </p>
            </div>
          </div>
          <Button
            onClick={() => navigate("/nutricionistas")}
            className="w-full sm:w-auto h-11 px-6 rounded-xl bg-slate-900 hover:bg-emerald-600 text-white font-black uppercase text-[10px] tracking-widest shadow-md transition-all shrink-0"
          >
            Conhecer Nutricionistas
          </Button>
        </CardContent>
      </Card>
    );
  }

  const mealCount = activePlan.meals?.length || 0;

  return (
    <Card className="rounded-[2rem] border border-emerald-100 shadow-sm overflow-hidden bg-gradient-to-br from-white to-emerald-50/10 hover:shadow-md transition-all duration-300">
      <CardContent className="p-6 md:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 text-left">
        <div className="flex items-start gap-4">
          <div className="h-12 w-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0 text-emerald-600">
            <Utensils size={22} className="text-emerald-600" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="text-[9px] font-black uppercase text-emerald-700 tracking-widest bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                Plano Ativo
              </span>
              {activePlan.discountPercentage && activePlan.discountPercentage > 0 && (
                <span className="text-[9px] font-black uppercase text-amber-700 tracking-widest bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100 flex items-center gap-1">
                  <Tag size={9} /> {activePlan.discountPercentage}% OFF
                </span>
              )}
            </div>
            <h3 className="text-lg font-black uppercase italic text-slate-800 leading-tight">
              {activePlan.planName}
            </h3>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wide mt-1">
              {mealCount} {mealCount === 1 ? "refeição prescrita" : "refeições prescritas"}
            </p>
          </div>
        </div>
        
        <Button
          onClick={() => navigate("/meu-plano")}
          className="w-full sm:w-auto h-11 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase text-[10px] tracking-widest shadow-md transition-all shrink-0 flex items-center gap-2 group"
        >
          Ver Dieta Completa
          <ArrowRight size={13} className="transition-transform group-hover:translate-x-1" />
        </Button>
      </CardContent>
    </Card>
  );
}
