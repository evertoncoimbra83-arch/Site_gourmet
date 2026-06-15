import { useState } from "react";
import { ShoppingBag, Utensils } from "lucide-react";
import { normalizeImageUrl } from "@shared/utils/assets";
import { safeNumber } from "@/lib/safe-parse";
import type { SuccessOrderItem } from "../types";
import { getItemSizeText, getItemSubDetailsText } from "../utils/orderHelpers";

function SuccessItemImage({ src, alt }: { src?: string | null; alt: string }) {
  const [hasError, setHasError] = useState(false);

  return (
    <div className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-200/60 bg-gradient-to-br from-slate-50 to-slate-100 shadow-xs transition-all duration-300 hover:shadow-sm sm:h-14 sm:w-14">
      {src && !hasError ? (
        <img
          src={src}
          alt={alt}
          onError={() => setHasError(true)}
          className="h-full w-full object-cover animate-in fade-in duration-300"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-emerald-50/50 to-teal-50/30">
          <Utensils className="h-5 w-5 text-emerald-600/60 animate-in fade-in duration-300 sm:h-6 sm:w-6" />
        </div>
      )}
    </div>
  );
}

interface OrderSummaryCardProps {
  items: SuccessOrderItem[] | undefined;
  money: (value: number) => string;
}

export function OrderSummaryCard({ items, money }: OrderSummaryCardProps) {
  if (!items || items.length === 0) return null;

  return (
    <div className="bg-slate-50/50 rounded-[2rem] p-5 border border-slate-100 space-y-4">
      <div className="flex items-center gap-2 text-slate-700 font-black uppercase text-[10px] tracking-wider pb-2 border-b border-slate-200/40">
        <ShoppingBag size={14} className="text-slate-500" />
        Resumo dos Itens
      </div>

      <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
        {items.map(item => {
          const sizeText = getItemSizeText(item);
          const subDetailsText = getItemSubDetailsText(item);

          return (
            <div
              key={item.id}
              className="flex items-start gap-3 py-2 border-b border-slate-100 last:border-none"
            >
              <SuccessItemImage
                src={item.imageUrl ? normalizeImageUrl(item.imageUrl) : null}
                alt={item.dishName || item.name || "Item"}
              />
              <div className="flex-1 min-w-0 text-left">
                <div className="flex items-baseline gap-2">
                  <span className="text-[10px] font-black text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-md shrink-0">
                    {item.quantity}x
                  </span>
                  <h4 className="text-xs font-black text-slate-800 truncate">
                    {item.dishName || item.name}
                  </h4>
                </div>
                {sizeText && (
                  <span className="inline-block mt-0.5 text-[8px] font-black uppercase text-emerald-600 bg-emerald-50 px-1.5 py-0.2 rounded-sm tracking-wide">
                    Porcao: {sizeText}
                  </span>
                )}
                {subDetailsText && (
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight mt-1 line-clamp-2 leading-snug">
                    {subDetailsText}
                  </p>
                )}
              </div>
              <div className="text-right shrink-0">
                <span className="text-xs font-black text-slate-700 italic">
                  {money(safeNumber(item.totalPrice))}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
