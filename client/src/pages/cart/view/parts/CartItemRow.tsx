import React from "react";
import { Trash2, Minus, Plus, Sparkles, Flame, Package } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export function CartItem({ group, money, updateQuantity, removeItem }: any) {
  // Extração de dados
  const options = group.options || {};
  const isPackage = group.itemType === "package" || options._type === "multi";
  
  const accompaniments = options.selectedAccompaniments || group.accompaniments || [];
  const sizeLabel = options.selectedSize?.name || group._sizeLabel || group.sizeName;
  const packageMeals = options.meals || group.packageDetails || [];

  const hasValidImage = 
    group.image && 
    typeof group.image === 'string' &&
    !group.image.includes('undefined') && 
    !group.image.includes('null') &&
    group.image.trim() !== "";

  return (
    <motion.div 
      layout 
      initial={{ opacity: 0, y: 10 }} 
      animate={{ opacity: 1, y: 0 }} 
      exit={{ opacity: 0, scale: 0.95 }}
      className={cn(
        "p-4 md:p-6 bg-white border border-slate-100 rounded-[2.5rem] shadow-sm mb-4 transition-all", 
        isPackage && "border-emerald-100 bg-emerald-50/10 shadow-md shadow-emerald-500/5"
      )}
    >
      <div className="flex gap-4 md:gap-5">
        
        {/* --- ÁREA DA FOTO OU EMOJI --- */}
        <div className={cn(
          "h-20 w-20 md:h-24 md:w-24 rounded-[1.5rem] md:rounded-[1.8rem] shrink-0 flex items-center justify-center overflow-hidden relative shadow-inner transition-colors",
          hasValidImage ? "bg-slate-50 border border-slate-100" : "bg-slate-50/60 border border-slate-100/50"
        )}>
          {hasValidImage ? (
            <img 
              src={group.image} 
              className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
              alt={group.name} 
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          ) : (
            // ✨ AQUI ESTÃO OS EMOJIS ✨
            <div className="flex flex-col items-center justify-center gap-0.5">
              {isPackage ? (
                <>
                  <span className="text-4xl drop-shadow-sm select-none">🍱</span>
                  <span className="text-[7px] font-black text-emerald-600 uppercase tracking-tighter">Kit</span>
                </>
              ) : (
                <>
                  <span className="text-4xl drop-shadow-sm select-none">🥗</span>
                  <span className="text-[7px] font-black text-slate-400 uppercase tracking-tighter">Prato</span>
                </>
              )}
            </div>
          )}
          
          {/* Badge flutuante para Pacotes (mesmo com emoji, ajuda a identificar) */}
          {isPackage && (
            <div className="absolute bottom-0 inset-x-0 bg-emerald-500/90 backdrop-blur-[2px] py-0.5 flex justify-center">
              <Package size={10} className="text-white" />
            </div>
          )}
        </div>
        
        <div className="flex-1 min-w-0 flex flex-col justify-between">
          <div>
            {/* Cabeçalho */}
            <div className="flex justify-between items-start mb-1">
              <div className="min-w-0 pr-2">
                <h3 className="font-black text-base md:text-lg text-slate-900 uppercase italic tracking-tighter leading-tight truncate">
                  {group.name || options.dishName || options.packageName || "Item sem nome"}
                </h3>
                {!isPackage && sizeLabel && (
                  <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full uppercase tracking-widest mt-1 inline-block">
                    {sizeLabel}
                  </span>
                )}
              </div>
              <button 
                onClick={() => removeItem && removeItem(group.id)} 
                className="text-slate-300 hover:text-red-500 transition-colors p-1 -mt-1 -mr-2"
              >
                <Trash2 size={18} />
              </button>
            </div>

            {/* Detalhes (Lista de itens) */}
            <div className="space-y-3 mt-2">
              {isPackage ? (
                // --- KIT ---
                packageMeals.map((meal: any, mIdx: number) => (
                  <div key={`meal-${mIdx}`} className="bg-white/60 rounded-xl p-2.5 border border-slate-100 shadow-sm">
                    <p className="font-black text-[10px] text-slate-800 uppercase italic flex items-center gap-1.5 mb-1.5 leading-none">
                      <Sparkles size={10} className="text-emerald-500" /> 
                      {meal.slotName}: <span className="text-emerald-600 truncate">{meal.dishName}</span>
                    </p>

                    {meal.selectedAccompaniments && meal.selectedAccompaniments.length > 0 && (
                      <div className="flex flex-wrap gap-x-3 gap-y-1 ml-4 border-l-2 border-emerald-100 pl-2">
                        {meal.selectedAccompaniments.map((acc: any, aIdx: number) => (
                          <div key={`acc-${aIdx}`} className="flex flex-col">
                            <span className="text-[6px] font-bold text-slate-400 uppercase leading-none">{acc.groupName}</span>
                            <span className="text-[9px] font-bold text-slate-600 uppercase leading-none">+ {acc.name}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                // --- PRATO ---
                accompaniments.length > 0 && (
                  <div className="flex flex-wrap gap-x-3 gap-y-1.5">
                    {accompaniments.map((acc: any, i: number) => (
                      <div key={`acc-${i}`} className="flex flex-col border-l-2 border-slate-200 pl-2">
                        <span className="text-[6px] font-bold text-slate-400 uppercase leading-none">{acc.groupName}</span>
                        <span className="text-[9px] font-bold text-slate-500 uppercase leading-none">+ {acc.name}</span>
                      </div>
                    ))}
                  </div>
                )
              )}
            </div>

            {/* Nutrição */}
            {options.showNutrition && group.appliedNutrition?.kcal > 0 && (
              <div className="mt-3 flex items-center gap-1.5 text-orange-600/80 bg-orange-50 w-fit px-2 py-0.5 rounded-md">
                <Flame size={10} fill="currentColor" />
                <span className="text-[9px] font-black uppercase tracking-tighter">
                  {Math.round(group.appliedNutrition.kcal)} Kcal
                </span>
              </div>
            )}
          </div>

          {/* Rodapé */}
          <div className="flex justify-between items-end mt-4 pt-3 border-t border-slate-50/50">
            <span className="text-lg font-black text-slate-900 italic tracking-tighter">
              {money((Number(group.price) || 0) * (group.quantity || 1))}
            </span>
            <div className="flex items-center gap-3 bg-slate-900 text-white p-1 rounded-xl shadow-lg shadow-slate-200">
              <button 
                onClick={() => updateQuantity && updateQuantity(group.id, (group.quantity || 1) - 1)} 
                className="h-7 w-7 flex items-center justify-center hover:bg-white/10 rounded-lg transition-colors disabled:opacity-30" 
                disabled={(group.quantity || 1) <= 1}
              >
                <Minus size={12} strokeWidth={4} />
              </button>
              <span className="w-4 text-center text-xs font-black italic">{group.quantity || 1}</span>
              <button 
                onClick={() => updateQuantity && updateQuantity(group.id, (group.quantity || 1) + 1)} 
                className="h-7 w-7 flex items-center justify-center hover:bg-white/10 rounded-lg transition-colors"
              >
                <Plus size={12} strokeWidth={4} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}