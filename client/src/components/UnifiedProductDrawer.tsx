import { useState, useEffect, useMemo } from "react";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { 
  Minus, 
  Plus, 
  ShoppingBag, 
  CheckCircle2, 
  Flame, 
  ChefHat,
  Info
} from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { trpc } from "@/_core/trpc";
import { useCart } from "@/_core/CartContext";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import AccompanimentSelector from "./AccompanimentSelector";

// --- HELPERS DE DADOS REFORÇADOS ---
const parseNutri = (info: any) => {
  if (!info) return null;
  try { 
    // Trata casos onde o JSON pode vir como string dupla do MySQL
    const firstParse = typeof info === 'string' ? JSON.parse(info) : info;
    return typeof firstParse === 'string' ? JSON.parse(firstParse) : firstParse;
  } catch (e) { return null; }
};

const getKcal = (info: any): number => {
  const data = parseNutri(info);
  if (!data) return 0;
  // Busca exaustiva: energy.value -> calories -> kcal -> valor_energetico
  const val = data.energy?.value ?? data.calories ?? data.kcal ?? data.energy ?? 0;
  const num = Number(typeof val === 'object' ? val?.value : val);
  return isNaN(num) ? 0 : num;
};

const getNutriVal = (data: any, key: string) => {
  const parsed = parseNutri(data);
  if (!parsed) return "--";
  
  const variants: Record<string, string[]> = {
    carbo: ["carbs", "carbohydrates", "carbo", "carboidratos"],
    prot: ["protein", "proteina", "protein_total", "prot"],
    gord: ["fat", "fat_total", "gordura", "lipideos"]
  };
  
  const searchKeys = variants[key] || [key];
  for (const k of searchKeys) {
    const val = parsed[k]?.value ?? parsed[k];
    if (val !== undefined && val !== null) return val;
  }
  return "--";
};

export default function UnifiedProductDrawer({ productId, type, onClose }: { productId: number | null, type: 'dish' | 'package', onClose: () => void }) {
  const [quantity, setQuantity] = useState(1);
  const [selectedMeals, setSelectedMeals] = useState<any[]>([]);
  const { addItem } = useCart();

  const { data: pkg, isLoading: loadingPkg } = trpc.packages.getById.useQuery(
    { id: productId! }, { enabled: !!productId && type === 'package' }
  );

  const { data: dish, isLoading: loadingDish } = trpc.products.getById.useQuery(
    { id: productId! }, { enabled: !!productId && type === 'dish' }
  );

  const isLoading = loadingPkg || loadingDish;
  const currentItem = type === 'package' ? pkg : dish;

  useEffect(() => {
    if (!currentItem) return;

    if (type === 'package' && pkg?.options) {
      const meals = pkg.options.map((slot: any, i: number) => ({
        mealIndex: i,
        label: slot.name || `Refeição ${i + 1}`,
        dishId: null,
        dishName: "",
        dishSizeName: "Padrão",
        nutritional_info: null,
        allowedDishes: slot.dishes || [],
        accompanimentGroups: slot.accompanimentGroups || slot.accompaniment_groups || [], 
        selectedAccompaniments: [],
        accPriceExtra: 0,
        sizePriceExtra: 0,
      }));
      setSelectedMeals(meals);
    } else if (type === 'dish' && dish) {
      const availableSizes = dish.dish_sizes || dish.dishSizes || dish.sizes || [];
      const firstSize = availableSizes.length > 0 ? availableSizes[0] : null;

      setSelectedMeals([{
        mealIndex: 0,
        label: dish.name,
        dishId: dish.id,
        dishName: dish.name,
        description: dish.description,
        nutritional_info: dish.nutritional_info || dish.nutritionalInfo,
        availableSizes: availableSizes,
        dishSizeId: firstSize?.id || null,
        dishSizeName: firstSize?.name || "Padrão",
        sizePriceExtra: Number(firstSize?.priceModifier || firstSize?.price_modifier || 0),
        allowedDishes: [dish],
        accompanimentGroups: dish.accompanimentGroups || dish.accompaniment_groups || firstSize?.accompanimentGroups || firstSize?.accompaniment_groups || [],
        selectedAccompaniments: [],
        accPriceExtra: 0,
      }]);
    }
    setQuantity(1);
  }, [currentItem, type, pkg, dish, productId]);

  const totalPrice = useMemo(() => {
    const base = Number(currentItem?.price || 0);
    const extras = selectedMeals.reduce((sum, m) => sum + (m.accPriceExtra || 0) + (m.sizePriceExtra || 0), 0);
    return base + extras;
  }, [currentItem, selectedMeals]);

  const handleToggleAcc = (mealIdx: number, group: any, option: any) => {
    setSelectedMeals(prev => prev.map(m => {
      if (m.mealIndex !== mealIdx) return m;
      const current = m.selectedAccompaniments || [];
      const isSelected = current.some((a: any) => a.id === option.id);
      let next;
      if (isSelected) next = current.filter((a: any) => a.id !== option.id);
      else {
        const max = Number(group.maxSelections || group.max_selections || 1);
        if (current.filter((a: any) => a.groupId === group.id).length >= max) {
          if (max === 1) next = [...current.filter((a: any) => a.groupId !== group.id), { ...option, groupId: group.id, groupName: group.name }];
          else return m;
        } else next = [...current, { ...option, groupId: group.id, groupName: group.name }];
      }
      const extra = next.reduce((s: number, a: any) => s + Number(a.price || a.priceModifier || a.price_modifier || 0), 0);
      return { ...m, selectedAccompaniments: next, accPriceExtra: extra };
    }));
  };

  const handleAddToCart = async () => {
    if (!currentItem || !selectedMeals.every(m => m.dishId)) return;
    const options = selectedMeals.map((m, idx) => ({
      sequence: idx + 1,
      label: m.label,
      dishName: m.dishName,
      dishSize: m.dishSizeName,
      totalNutritionalInfo: parseNutri(m.nutritional_info),
      accompaniments: m.selectedAccompaniments.map((a: any) => ({
        id: a.id,
        name: a.name,
        group: a.groupName,
        price: Number(a.price || a.priceModifier || a.price_modifier || 0)
      }))
    }));

    await addItem({
      packageId: type === 'package' ? Number(currentItem.id) : null,
      dishId: type === 'dish' ? Number(currentItem.id) : null,
      name: currentItem.name,
      price: totalPrice,
      quantity,
      type: type,
      options: options
    });
    toast.success("Adicionado à sacola!");
    onClose();
  };

  if (isLoading) return null;

  return (
    <Sheet open={!!productId} onOpenChange={(open) => !open && onClose()}>
      {/* 🚀 ESTRUTURA PARA ROLAGEM FIXA: h-full flex flex-col */}
      <SheetContent side="right" className="w-full sm:max-w-xl p-0 flex flex-col h-full bg-white border-none shadow-2xl overflow-hidden focus:outline-none">
        
        {/* HEADER FIXO */}
        <div className="p-8 bg-white border-b shrink-0 z-20">
          <div className="flex items-center gap-2 text-emerald-600 mb-2 font-black uppercase text-[10px] tracking-widest">
            {type === 'package' ? <PackageCheck size={16} /> : <ChefHat size={16} />}
            {type === 'package' ? "Configuração de Combo" : "Prato Individual"}
          </div>
          <SheetTitle className="text-4xl font-black uppercase italic tracking-tighter text-slate-900 leading-none mb-3">
            {currentItem?.name}
          </SheetTitle>
          {/* DESCRIÇÃO */}
          {currentItem?.description && (
            <p className="text-slate-400 text-xs font-medium leading-relaxed max-w-sm">
              {currentItem.description}
            </p>
          )}
        </div>

        {/* 🚀 ÁREA ROLÁVEL COM flex-1 e min-h-0 */}
        <ScrollArea className="flex-1 w-full min-h-0 bg-[#F8FAFC]">
          <div className="p-6 space-y-6 pb-12">
            {selectedMeals.map((meal, idx) => (
              <div key={idx} className="space-y-6">
                
                {/* INFORMAÇÃO NUTRICIONAL (LOGO ABAIXO DA DESCRIÇÃO) */}
                <div className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm">
                  <div className="flex items-center justify-between mb-4 border-b border-slate-50 pb-4">
                    <div className="flex items-center gap-2">
                      <Flame size={18} className="text-orange-500 fill-orange-500" />
                      <span className="text-xs font-black uppercase tracking-tighter text-slate-800 italic">Informação Nutricional</span>
                    </div>
                    <Badge variant="outline" className="rounded-full border-emerald-100 text-emerald-600 font-black italic">
                      {getKcal(meal.nutritional_info)} Kcal
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { l: "Carbo", k: "carbo" }, 
                      { l: "Prot", k: "prot" }, 
                      { l: "Gord", k: "gord" }
                    ].map(item => (
                      <div key={item.k} className="bg-slate-50/50 p-3 rounded-2xl border border-slate-100 text-center">
                        <span className="text-[8px] font-black text-slate-400 uppercase block mb-1">{item.l}</span>
                        <span className="text-sm font-black text-slate-700 italic">
                          {getNutriVal(meal.nutritional_info, item.k)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* OPÇÕES DE TAMANHO (RESTAURADO E ESTILIZADO SEM O ÍCONE) */}
                {type === 'dish' && meal.availableSizes?.length > 1 && (
                  <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-4 flex items-center gap-2">
                      <Info size={12} className="text-emerald-500" /> 1. Escolha o Tamanho
                    </Label>
                    <div className="grid grid-cols-1 gap-2 px-2">
                      {meal.availableSizes.map((size: any) => (
                        <button
                          key={size.id}
                          onClick={() => setSelectedMeals(prev => prev.map(m => m.mealIndex === idx ? { 
                            ...m, 
                            dishSizeId: size.id, 
                            dishSizeName: size.name, 
                            sizePriceExtra: Number(size.priceModifier || size.price_modifier || 0),
                            accompanimentGroups: size.accompanimentGroups || size.accompaniment_groups || m.accompanimentGroups
                          } : m))}
                          className={cn(
                            "flex items-center justify-between p-5 rounded-[1.8rem] border-2 transition-all font-black uppercase italic text-[11px] tracking-tight",
                            meal.dishSizeId === size.id ? "bg-slate-900 text-white border-slate-900 shadow-xl scale-[1.01]" : "bg-white text-slate-400 border-slate-100 hover:border-emerald-200"
                          )}
                        >
                          {size.name}
                          {meal.dishSizeId === size.id && <CheckCircle2 size={18} className="text-emerald-500 fill-white" />}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* ACOMPANHAMENTOS */}
                {meal.dishId && meal.accompanimentGroups?.length > 0 && (
                  <div className="pt-4 px-2">
                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-2 mb-4 block italic">Monte seu prato</Label>
                    <AccompanimentSelector 
                      groups={meal.accompanimentGroups}
                      selections={meal.selectedAccompaniments.reduce((acc: any, curr: any) => {
                        const gId = curr.groupId;
                        if (!acc[gId]) acc[gId] = [];
                        acc[gId].push(curr);
                        return acc;
                      }, {})}
                      onToggle={(group, option) => handleToggleAcc(idx, group, option)} 
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* FOOTER FIXO */}
        <div className="p-8 bg-white border-t shrink-0 shadow-[0_-20px_50px_rgba(0,0,0,0.05)] z-30">
          <div className="flex items-center justify-between mb-6">
            <div className="space-y-0.5">
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest leading-none">Subtotal do Item</p>
              <p className="text-4xl font-black text-slate-900 italic tracking-tighter leading-none">R$ {(totalPrice * quantity).toFixed(2)}</p>
            </div>
            <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-[1.5rem] border border-slate-100">
              <Button size="icon" variant="ghost" className="h-10 w-10 rounded-xl" onClick={() => setQuantity(Math.max(1, quantity - 1))}><Minus size={14} strokeWidth={3}/></Button>
              <span className="font-black text-lg w-8 text-center italic text-slate-800">{quantity}</span>
              <Button size="icon" variant="ghost" className="h-10 w-10 rounded-xl" onClick={() => setQuantity(quantity + 1)}><Plus size={14} strokeWidth={3}/></Button>
            </div>
          </div>
          <Button onClick={handleAddToCart} className="w-full h-16 rounded-[2.5rem] font-black uppercase tracking-[0.2em] bg-[#2D5A3D] text-white shadow-xl hover:bg-[#1f3d29] transition-all active:scale-95">
            <ShoppingBag className="mr-3" size={20} /> Adicionar à Sacola
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}