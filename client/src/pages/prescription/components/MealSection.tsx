// client/src/pages/prescription/components/MealSection.tsx

import React from "react";
import { Utensils } from "lucide-react";
import { OptionCard } from "./OptionCard";

// ✅ Interfaces REVISADAS: originalPrice travado estritamente como 'number'
export interface PrescriptionOptionData {
  dishId: string | number;
  name: string;
  price: string | number;
  originalPrice: number; // 👈 CORREÇÃO: Tipo exigido pelo OptionCard
  image?: string;
  kcal?: number;
  description?: string;
  category?: string;
  [key: string]: unknown; 
}

export interface PatientMeal {
  mealName: string;
  notes?: string;
  dishes: PrescriptionOptionData[];
}

interface MealSectionProps {
  meal: PatientMeal;
  index: number;
  discount: number;
  onAdd: (dish: PrescriptionOptionData) => void;
}

export function MealSection({ meal, index, discount, onAdd }: MealSectionProps) {
  if (!meal) return null;

  const pratos = Array.isArray(meal.dishes) ? meal.dishes : [];

  return (
    <section>
      <div className="flex items-center gap-4 mb-8">
        <span className="h-12 w-12 rounded-2xl bg-slate-100 border-2 border-slate-200 flex items-center justify-center font-black italic text-xl text-slate-400 shrink-0">
          {index + 1}
        </span>
        <h2 className="text-2xl md:text-3xl font-black uppercase italic text-slate-800 truncate">
          {meal.mealName || `Refeição ${index + 1}`}
        </h2>
      </div>

      {meal.notes && (
        <div className="mb-6 ml-0 md:ml-16 p-4 bg-amber-50/50 rounded-2xl border border-amber-100 italic text-xs text-amber-800">
          {`"${meal.notes}"`}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 ml-0 md:ml-16">
        {pratos.length === 0 && (
          <div className="p-6 bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2rem] text-center flex flex-col items-center justify-center text-slate-400 col-span-full">
            <Utensils size={24} className="mb-2 opacity-50" />
            <p className="text-[10px] font-black uppercase tracking-widest">Nenhum prato adicionado</p>
            <p className="text-xs font-medium mt-1">Este plano está vazio nesta refeição.</p>
          </div>
        )}

        {pratos.map((dish: PrescriptionOptionData, dIdx: number) => {
          if (!dish) return null;
          
          // ✅ Fallback de segurança com conversão explícita para Number
          const safeDish: PrescriptionOptionData = {
            ...dish,
            originalPrice: Number(dish.originalPrice ?? dish.price ?? 0)
          };

          return (
            <OptionCard 
              key={safeDish.dishId || dIdx}
              opt={safeDish} // Agora a tipagem bate 100% (duck typing)
              basePrice={Number(safeDish.price || 0)}
              nutriDiscount={discount}
              onAdd={() => onAdd(safeDish)}
            />
          );
        })}
      </div>
    </section>
  );
}