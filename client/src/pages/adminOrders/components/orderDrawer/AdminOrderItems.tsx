import { Package, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { statusLabels } from "../../logic/useAdminOrders";

export function AdminOrderItems({ items, isEditing, onPrintLabel }: any) {
  return (
    <section className="space-y-4">
      <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2 px-2 italic">
        <Package size={14} /> Detalhes da Produção
      </h3>

      <div className="space-y-3">
        {items?.map((item: any, idx: number) => {
          const options = typeof item.options === 'string' ? JSON.parse(item.options) : (item.options || {});
          const isPkg = options._type === 'multi' || !!options.meals;
          const displayName = item.dishName || item.name || options.packageName;

          return (
            <div key={item.id || idx} className="bg-white rounded-3xl border border-slate-100 p-5 shadow-sm relative overflow-hidden">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-2xl bg-slate-50 flex items-center justify-center text-xs font-black text-emerald-600 border border-slate-100 shrink-0">
                    {item.quantity}x
                  </div>
                  <div>
                    <span className="text-xs font-black text-slate-800 uppercase block leading-none mb-1">{displayName}</span>
                    <span className="text-[9px] font-bold text-slate-400 uppercase italic">
                      {isPkg ? 'Pacote' : `Ref: ${item.dishId || 'Manual'}`}
                    </span>
                  </div>
                </div>
                {!isEditing && (
                  <Button 
                    variant="ghost" size="icon" 
                    className="h-10 w-10 rounded-2xl bg-amber-50 text-amber-600 hover:bg-amber-600 hover:text-white transition-all" 
                    onClick={() => onPrintLabel(item)}
                  >
                    <Tag size={18} />
                  </Button>
                )}
              </div>

              <div className="mt-4 ml-12 space-y-4 border-l-2 border-slate-50 pl-4">
                {isPkg ? (
                  options.meals?.map((meal: any, mIdx: number) => (
                    <div key={mIdx} className="bg-slate-50/50 p-2 rounded-xl border border-slate-100/50">
                      <p className="text-[9px] font-black text-emerald-600 uppercase italic mb-1">{meal.slotName}:</p>
                      <p className="text-[10px] font-bold text-slate-700 uppercase mb-1">{meal.dishName}</p>
                      <div className="space-y-1">
                        {meal.selectedAccompaniments?.map((acc: any, aIdx: number) => (
                          <p key={aIdx} className="text-[9px] text-slate-400 font-bold uppercase pl-2">
                            • {acc.name} <span className="opacity-50 italic">({acc.groupName})</span>
                          </p>
                        ))}
                      </div>
                    </div>
                  ))
                ) : (
                  (Array.isArray(item.accompaniments) ? item.accompaniments : (options.selectedAccompaniments || [])).map((acc: any, i: number) => (
                    <div key={i} className="flex items-center justify-between">
                      <p className="text-[10px] text-slate-600 font-bold uppercase">• {acc.name}</p>
                      <span className="text-[8px] font-black text-slate-300 uppercase italic">{acc.groupName}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}