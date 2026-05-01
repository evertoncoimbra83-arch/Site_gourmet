import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Edit2, Trash2, Utensils, Info, Tag } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

interface DishCardProps {
  dish: any;
  onEdit: () => void;
  onDelete: (id: number) => void;
  onToggle: (id: number, active: boolean) => void;
}

export function DishCard({ dish, onEdit, onDelete, onToggle }: DishCardProps) {
  // ✅ Lógica de Preço e Desconto
  const originalPrice = Number(dish.price || 0);
  const salePrice = dish.salePrice ? Number(dish.salePrice) : null;
  const hasDiscount = Boolean(salePrice && salePrice > 0 && salePrice < originalPrice);
  
  // Cálculo da porcentagem de desconto
  const discountBadge = hasDiscount 
    ? Math.round(((originalPrice - salePrice!) / originalPrice) * 100) 
    : 0;

  return (
    <Card className="group border-none shadow-[0_4px_20px_rgba(0,0,0,0.03)] rounded-[2.5rem] bg-white overflow-hidden hover:shadow-[0_20px_40px_rgba(0,0,0,0.08)] transition-all duration-500">
      <CardContent className="p-5">
        <div className="flex gap-4 md:gap-6 items-start">
          
          {/* COLUNA DA ESQUERDA (IMAGEM + AÇÕES) */}
          <div className="flex flex-col gap-3 shrink-0">
            <div className="h-24 w-24 md:h-32 md:w-32 overflow-hidden rounded-[1.5rem] border border-slate-100 bg-slate-50 relative shadow-sm">
              {dish.imageUrl ? (
                <img 
                  src={dish.imageUrl} 
                  className="h-full w-full object-cover transition-transform group-hover:scale-110 duration-700" 
                  alt={dish.name} 
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center text-slate-200">
                  <Utensils size={32} />
                </div>
              )}
              
              {!dish.isActive && (
                <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[1px] flex items-center justify-center">
                   <Badge className="bg-white text-slate-900 text-[8px] font-black border-none">OCULTO</Badge>
                </div>
              )}

              {/* ✅ BADGE DE DESCONTO SOBRE A FOTO */}
              {hasDiscount && (
                <div className="absolute top-2 right-2 bg-emerald-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded-lg shadow-lg flex items-center gap-1">
                  <Tag size={8} />
                  {discountBadge}% OFF
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <Button 
                variant="secondary" 
                size="icon" 
                className="flex-1 h-10 rounded-xl bg-slate-100 text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 active:scale-90" 
                onClick={(e) => { e.stopPropagation(); onEdit(); }}
              >
                <Edit2 size={16}/>
              </Button>
              <Button 
                variant="secondary" 
                size="icon" 
                className="flex-1 h-10 rounded-xl bg-slate-100 text-slate-600 hover:text-red-500 hover:bg-red-50 active:scale-90" 
                onClick={(e) => { e.stopPropagation(); onDelete(dish.id); }}
              >
                <Trash2 size={16}/>
              </Button>
            </div>
          </div>

          {/* COLUNA DA DIREITA (TEXTO) */}
          <div className="flex-1 min-w-0 py-1 flex flex-col h-full">
            <div className="space-y-1.5">
              <h3 className="font-black text-base md:text-xl text-slate-900 uppercase tracking-tight leading-tight break-words">
                {dish.name}
              </h3>
              
              <div className="flex flex-wrap gap-2 items-center">
                <Badge className="bg-slate-100 text-slate-500 border-none font-black text-[7px] md:text-[8px] tracking-widest uppercase rounded-lg px-2 py-0.5">
                  {dish.categoryName || "Geral"}
                </Badge>
                {dish.showNutrition && (
                  <div className="flex items-center gap-1 text-emerald-500">
                    <Info size={10} />
                    <span className="text-[7px] font-black uppercase tracking-widest">Nutri OK</span>
                  </div>
                )}
              </div>
            </div>

            <p className="text-slate-400 font-medium text-[10px] md:text-xs line-clamp-2 mt-3 leading-relaxed">
              {dish.description || "Sem descrição disponível."}
            </p>

            {/* RODAPÉ DO CARD - PREÇOS */}
            <div className="mt-auto pt-4 flex items-center justify-between border-t border-slate-50">
              <div className="flex flex-col">
                {hasDiscount ? (
                  <>
                    <span className="text-[10px] font-bold text-slate-300 line-through">
                      De {originalPrice.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                    </span>
                    <div className="text-xl md:text-2xl font-black text-emerald-600 tracking-tighter italic uppercase leading-none">
                      <span className="text-xs mr-0.5">R$</span>
                      {salePrice?.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </div>
                  </>
                ) : (
                  <div className="text-xl md:text-2xl font-black text-slate-900 tracking-tighter italic uppercase leading-none">
                    <span className="text-emerald-600 mr-0.5 text-xs">R$</span>
                    {originalPrice.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </div>
                )}
              </div>

              <div className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all duration-300",
                dish.isActive ? "bg-emerald-50/50 border-emerald-100" : "bg-slate-50 border-slate-100"
              )}>
                <Switch 
                  checked={!!dish.isActive} 
                  onCheckedChange={(checked) => onToggle(dish.id, checked)}
                  className="data-[state=checked]:bg-emerald-600 scale-75 md:scale-90"
                />
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}