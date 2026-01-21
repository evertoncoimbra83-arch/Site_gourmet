import { useEffect, useMemo, useState } from "react";
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetDescription 
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Loader2, Minus, Plus, Leaf, AlertCircle } from "lucide-react";
import { trpc } from "@/_core/trpc";
import { useCartDrawer } from "@/_core/hooks/useCartDrawer"; 
import { useProductNutrition } from "@/hooks/useProductNutrition";
import { mapDishFromDb } from "@/lib/mappers";
import { cn } from "@/lib/utils";
import { toast } from "@/components/ui/use-toast";

import { NutritionInfo } from "./drawer/NutritionInfo"; 
import { AccompanimentList } from "./drawer/AccompanimentList";
import { SizeSelector } from "./drawer/SizeSelector";

export default function ProductDrawer({ dishId, onClose }: { dishId: string | number | null, onClose: () => void }) {
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState<any>(null);
  const [selectedAccs, setSelectedAccs] = useState<any[]>([]);

  const { addToCart, isAdding } = useCartDrawer();

  const { data: rawDish, isLoading } = trpc.public.dishes.getById.useQuery(
    { id: Number(dishId!) },
    { enabled: !!dishId, staleTime: 1000 * 60 * 5 }
  );

  const dish = useMemo(() => (rawDish ? mapDishFromDb(rawDish) : null), [rawDish]);
  const totalNutrition = useProductNutrition(dish, selectedAccs);

  useEffect(() => {
    if (dish) {
      setQuantity(1);
      setSelectedAccs([]);
      const sizes = dish.sizes || [];
      
      if (sizes.length > 0) {
        setSelectedSize(sizes[0]);
      } else {
        setSelectedSize({ id: 'padrão', name: 'Padrão', priceModifier: 0, accompanimentGroups: [] });
      }
    }
  }, [dish]);

  // ✅ 1. LÓGICA DE ORDENAÇÃO POR PESO (CORRIGIDA: MENOR -> MAIOR)
  const sortedAccompanimentGroups = useMemo(() => {
    if (!selectedSize?.accompanimentGroups) return [];

    const extractNumber = (str: string) => {
      const match = str.match(/(\d+)/);
      return match ? parseInt(match[0], 10) : 0;
    };

    const groups = [...selectedSize.accompanimentGroups].sort((a: any, b: any) => 
      (a.name || "").localeCompare(b.name || "", 'pt-BR', { numeric: true })
    );

    return groups.map((group: any) => ({
      ...group,
      maxSelections: Number(group.maxSelections || 1),
      options: [...(group.options || [])].sort((a: any, b: any) => {
        const numA = extractNumber(a.name || "");
        const numB = extractNumber(b.name || "");

        // Ordenação numérica crescente (ex: 80g antes de 120g)
        if (numA !== numB) {
          return numA - numB;
        }
        return (a.name || "").localeCompare(b.name || "", 'pt-BR');
      })
    }));
  }, [selectedSize]);

  // ✅ 2. VALIDAÇÃO DE ITENS OBRIGATÓRIOS
  const isAccompanimentsComplete = useMemo(() => {
    if (!selectedSize?.accompanimentGroups?.length) return true;
    
    return selectedSize.accompanimentGroups.every((group: any) => {
      const count = selectedAccs.filter(a => Number(a.groupId) === Number(group.id)).length;
      return count === Number(group.maxSelections || 1);
    });
  }, [selectedSize, selectedAccs]);

  const totalUnitPrice = useMemo(() => {
    if (!dish) return 0;
    const basePrice = Number(dish.price || 0);
    const sizeMod = Number(selectedSize?.priceModifier || 0);
    const accsTotal = selectedAccs.reduce((sum, acc) => sum + Number(acc.priceModifier || 0), 0);
    return basePrice + sizeMod + accsTotal;
  }, [dish, selectedSize, selectedAccs]);

  // ✅ 3. LÓGICA DE ADIÇÃO (CHAVE COMPOSTA PARA PERMITIR REPETIDOS EM GRUPOS DIFERENTES)
  const handleAddAcc = (group: any, optionId: number | string) => {
    const opt = group.options.find((o: any) => Number(o.id) === Number(optionId));
    if (!opt) return;

    const isAlreadyInThisGroup = selectedAccs.some(
      a => Number(a.id) === Number(opt.id) && Number(a.groupId) === Number(group.id)
    );

    if (isAlreadyInThisGroup) {
      setSelectedAccs(prev => prev.filter(
        a => !(Number(a.id) === Number(opt.id) && Number(a.groupId) === Number(group.id))
      ));
      return;
    }
    
    const currentCount = selectedAccs.filter(a => Number(a.groupId) === Number(group.id)).length;
    if (currentCount >= Number(group.maxSelections)) {
      toast.error(`Você já selecionou ${group.maxSelections} itens neste grupo.`);
      return;
    }
    
    setSelectedAccs(prev => [...prev, { ...opt, groupId: group.id, groupName: group.name }]);
  };

  const handleAddToCart = async () => {
    if (!dish || !selectedSize || !isAccompanimentsComplete) return;

    try {
      const cleanPayload = {
        _type: "single",
        dishId: dish.id,
        dishName: dish.name,
        quantity,
        showNutrition: dish.showNutrition,
        selectedSize: {
          id: selectedSize.id,
          name: selectedSize.name,
          priceModifier: Number(selectedSize.priceModifier || 0)
        },
        selectedAccompaniments: selectedAccs.map(acc => ({
          id: acc.id,
          name: acc.name,
          groupId: acc.groupId,
          groupName: acc.groupName || "Acompanhamento",
          priceModifier: Number(acc.priceModifier || 0)
        })),
        appliedNutrition: {
          kcal: Math.round(totalNutrition?.kcal || 0),
          proteins: Number((totalNutrition?.proteins || 0).toFixed(1)),
          carbs: Number((totalNutrition?.carbs || 0).toFixed(1)),
          fats: Number((totalNutrition?.fats || 0).toFixed(1))
        }
      };

      await addToCart(
        { 
          id: dish.id, 
          name: dish.name, 
          price: totalUnitPrice, 
          image: dish.imageUrl,
          options: cleanPayload,
          nutrition: cleanPayload.appliedNutrition
        },
        quantity,
        cleanPayload,
        onClose
      );
    } catch (err) {
      toast.error("Não foi possível adicionar o item.");
    }
  };

  const canConfirm = !!dish && isAccompanimentsComplete && !isAdding && (dish.sizes?.length > 0 ? !!selectedSize : true);

  return (
    <Sheet open={!!dishId} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-xl p-0 flex flex-col h-full bg-[#FBFBFC] border-none shadow-2xl overflow-hidden">
        
        <SheetHeader className="sr-only">
          <SheetTitle>Detalhes do Produto: {dish?.name}</SheetTitle>
          <SheetDescription>Selecione as opções e acompanhamentos</SheetDescription>
        </SheetHeader>

        {isLoading ? (
          <div className="flex h-full items-center justify-center">
            <Loader2 className="animate-spin text-emerald-600 w-10 h-10" />
          </div>
        ) : dish ? (
          <>
            <div className="flex-1 overflow-y-auto pb-44 scrollbar-hide">
              <div className="relative w-full h-80 bg-slate-200">
                {dish.imageUrl && <img src={dish.imageUrl} className="w-full h-full object-cover" alt={dish.name} />}
                <div className="absolute inset-0 bg-linear-to-t from-[#FBFBFC] via-[#FBFBFC]/10 to-transparent" />
              </div>

              <div className="px-8 -mt-16 relative z-10 space-y-10">
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {dish.flags.isVegetarian && (
                      <span className="flex items-center gap-1 bg-emerald-50 text-emerald-700 text-[9px] font-black uppercase px-2 py-1 rounded-md border border-emerald-100">
                        <Leaf size={10} /> Vegetariano
                      </span>
                    )}
                  </div>

                  <div className="space-y-2">
                    <h2 className="text-4xl font-black text-slate-950 uppercase italic tracking-tighter leading-none">
                      {dish.name}
                    </h2>
                    <p className="text-slate-500 text-sm font-medium leading-relaxed italic">
                      {dish.description}
                    </p>
                  </div>
                </div>

                {dish.showNutrition && (
                  <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                     <NutritionInfo data={totalNutrition} />
                  </div>
                )}

                <div className="space-y-12 pb-10">
                  <SizeSelector 
                    sizes={dish.sizes} 
                    selectedId={selectedSize?.id} 
                    onSelect={(s: any) => { setSelectedSize(s); setSelectedAccs([]); }} 
                  />
                  
                  {selectedSize && (
                    <AccompanimentList 
                      groups={sortedAccompanimentGroups} 
                      selectedAccs={selectedAccs} 
                      onAdd={handleAddAcc} 
                      // ✅ REMOÇÃO FILTRANDO POR ID + GROUPID
                      onRemove={(id: string, groupId: number | string) => 
                        setSelectedAccs(prev => prev.filter(
                          a => !(Number(a.id) === Number(id) && Number(a.groupId) === Number(groupId))
                        ))
                      } 
                    />
                  )}
                </div>
              </div>
            </div>

            <div className="p-8 border-t border-slate-100 bg-white/95 backdrop-blur-xl absolute bottom-0 left-0 right-0 z-50">
              <div className="flex flex-col gap-4 max-w-lg mx-auto">
                {!isAccompanimentsComplete && selectedSize && (
                  <div className="flex items-center justify-center gap-2 text-amber-600 animate-pulse">
                    <AlertCircle size={12} />
                    <span className="text-[9px] font-black uppercase tracking-widest">Selecione os itens obrigatórios</span>
                  </div>
                )}

                <div className="flex gap-4 items-center">
                  <div className="flex items-center border-2 border-slate-100 rounded-full bg-slate-50 h-16 px-3">
                    <Button variant="ghost" size="icon" onClick={() => setQuantity(Math.max(1, quantity - 1))}><Minus size={16} /></Button>
                    <span className="w-12 text-center font-black text-xl">{quantity}</span>
                    <Button variant="ghost" size="icon" onClick={() => setQuantity(quantity + 1)}><Plus size={16} /></Button>
                  </div>
                  
                  <Button 
                    disabled={!canConfirm} 
                    onClick={handleAddToCart} 
                    className={cn(
                      "flex-1 h-16 font-black rounded-full uppercase text-[12px] tracking-widest transition-all", 
                      canConfirm ? "bg-slate-950 text-emerald-400" : "bg-slate-100 text-slate-400"
                    )}
                  >
                    {isAdding ? <Loader2 className="animate-spin" /> : (
                      <div className="flex justify-between w-full px-4 items-center">
                        <span>ADICIONAR</span>
                        <span>R$ {(totalUnitPrice * quantity).toFixed(2)}</span>
                      </div>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}