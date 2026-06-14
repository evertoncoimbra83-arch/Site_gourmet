import React, { ComponentProps, useEffect, useMemo, useState, useRef } from "react";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Minus, Plus, ShoppingBag, X, ChevronDown } from "lucide-react";
import { trpc } from "@/_core/trpc";
import { cn } from "@/lib/utils";
import { getImageFallback, resolveImageUrl } from "@shared/utils/image-url";

// ✅ HOOKS CENTRALIZADOS
import { useDishNutrition } from "@/pages/products/logic/useDishNutrition";
import { mapDishFromDb } from "@/pages/products/logic/mappers";
import { hasAccompaniments, validateAccSelections } from "@/pages/products/logic/validation";

const NO_ACCOMPANIMENTS_FALLBACK =
  "Este tamanho não possui acompanhamentos. O peso informado corresponde ao prato principal.";

// ✅ COMPONENTES VISUAIS
import { NutritionInfo } from "@/pages/products/drawer/NutritionInfo";
import { SizeSelector } from "@/pages/products/drawer/SizeSelector";

// --- TIPOS DERIVADOS ---
type SelectorProps = ComponentProps<typeof SizeSelector>;
type SizesType = SelectorProps['sizes'];
type SelectedAccsType = SelectorProps['selectedAccs'];
type AddAccHandler = SelectorProps['onAddAcc'];
// RemoveAccHandler removido pois não estava sendo usado explicitamente

// --- INTERFACES LOCAIS ---
interface AccOption {
  id: number | string;
  name: string;
  priceModifier: number;
  groupId: number | string;
  groupName: string;
  defaultGrammage: number;
  [key: string]: unknown;
}

interface SizeOption {
  id: number | string;
  name: string;
  priceModifier: number;
  accompanimentGroups: unknown[];
  [key: string]: unknown;
}

interface ProductDrawerProps {
  dishId: string | number | null;
  onClose: () => void;
  onConfirm: (selection: Record<string, unknown>) => void;
}

export default function ProductDrawer({ dishId, onClose, onConfirm }: ProductDrawerProps) {
  const sizeSelectorRef = useRef<HTMLDivElement>(null);
  const footerRef = useRef<HTMLDivElement>(null);

  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState<SizeOption | null>(null);
  const [selectedAccs, setSelectedAccs] = useState<AccOption[]>([]);
  const [showFullNutrition, setShowFullNutrition] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const numericId = useMemo(() => (dishId ? Number(dishId) : null), [dishId]);

  const { data: rawDish, isLoading } = trpc.public.dishes.getById.useQuery(
    { id: numericId as number },
    { enabled: !!numericId, staleTime: 1000 * 60 * 5 }
  );

  const dish = useMemo(() => (rawDish ? mapDishFromDb(rawDish) : null), [rawDish]);

  const basePrice = Number(dish?.price || 0);
  const salePrice = Number(dish?.salePrice || 0);
  const hasDiscount = salePrice > 0 && salePrice < basePrice;

  const scrollTo = (ref: React.RefObject<HTMLDivElement>) => {
    setTimeout(() => {
      ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 200);
  };

  useEffect(() => {
    if (dish) {
      setQuantity(1);
      setSelectedAccs([]);
      setSelectedSize(null);
      setShowFullNutrition(false);
    }
  }, [dish]);

  // ✅ CORREÇÃO 1: Parameters<T> para evitar 'any' no hook de nutrição
  const totalNutrition = useDishNutrition(
    dish as unknown as Parameters<typeof useDishNutrition>[0],
    selectedSize as unknown as Parameters<typeof useDishNutrition>[1],
    selectedAccs as unknown as Parameters<typeof useDishNutrition>[2]
  );

  const totalUnitPrice = useMemo(() => {
    if (!dish) return 0;
    const referencePrice = hasDiscount ? salePrice : basePrice;
    const sizeMod = Number(selectedSize?.priceModifier || 0);
    const sizeFactor = 1 + (sizeMod / 100);
    const accsMod = selectedAccs?.reduce((sum, a) => sum + Number(a.priceModifier || 0), 0) || 0;

    return Number(((referencePrice * sizeFactor) + accsMod).toFixed(2));
  }, [dish, selectedSize, selectedAccs, hasDiscount, salePrice, basePrice]);

  const isAccompanimentsComplete = useMemo(() => {
    return validateAccSelections(selectedAccs as any, selectedSize as any).ok;
  }, [selectedSize, selectedAccs]);

  // ✅ CORREÇÃO 2: Handler compatível com ambos (Add e Remove)
  // O componente espera (group, id) onde id pode ser string ou number
  const handleAccSelection: AddAccHandler = (group, optId) => {
  const groupRecord = group as unknown as Record<string, unknown>;

  const options = (groupRecord.processedOptions ??
    groupRecord.options ??
    []) as unknown[];

  const isRecord = (v: unknown): v is Record<string, unknown> =>
    typeof v === "object" && v !== null;

  const getId = (v: unknown): unknown => (isRecord(v) ? v["id"] : undefined);

  const opt = options.find((o) => String(getId(o)) === String(optId)) as
    | Record<string, unknown>
    | undefined;

  if (!opt) return;

  const gId = (groupRecord.groupId ?? groupRecord.id) as string | number;
  const gName = (groupRecord.name ?? "Acompanhamento") as string;

  setSelectedAccs((prev) => {
    const exists = prev.some(
      (a) => String(a.id) === String(opt.id) && String(a.groupId) === String(gId)
    );

    if (exists) {
      return prev.filter(
        (a) => !(String(a.id) === String(opt.id) && String(a.groupId) === String(gId))
      );
    }

    const maxAllowed = Number(groupRecord.maxSelections ?? 1);

    const newItem: AccOption = {
      ...(opt as Record<string, unknown>),
      id: opt.id as string | number,
      name: opt.name as string,
      groupId: gId,
      groupName: gName,
      defaultGrammage: Number(groupRecord.defaultGrammage ?? 100),
      priceModifier: Number(opt.priceModifier ?? 0),
    };

    if (maxAllowed === 1) {
      return [...prev.filter((a) => String(a.groupId) !== String(gId)), newItem];
    }

    const countInGroup = prev.filter((a) => String(a.groupId) === String(gId)).length;
    return countInGroup < maxAllowed ? [...prev, newItem] : prev;
  });
};

  // Wrapper para o onRemoveAcc para garantir compatibilidade de tipos
  const handleRemoveAcc = (group: unknown, id: string | number) => {
      // O SizeSelector define o segundo argumento como string | number
      // O handleAccSelection (definido como AddAccHandler) espera o segundo argumento compatível
      // Aqui fazemos a ponte.
      handleAccSelection(group as Parameters<AddAccHandler>[0], String(id));
  };

  const handleConfirm = async () => {
    setIsSubmitting(true);
    const normalizedAccs = selectedAccs.map(acc => ({
        id: acc.id,
        name: acc.name,
        group: acc.groupName,
        weight: acc.defaultGrammage,
        groupId: acc.groupId
    }));

    const optionsPayload = {
      dishId: dish?.id,
      selectedSizeId: selectedSize?.id,
      selectedSizeName: selectedSize?.name,
      selectedAccompaniments: normalizedAccs,
      hasNoAvailableAccompaniments: selectedSize ? !hasAccompaniments(selectedSize) : false,
      noAccompanimentsMessage:
        selectedSize && !hasAccompaniments(selectedSize)
          ? String(selectedSize.noAccompanimentsMessage || "").trim() ||
            NO_ACCOMPANIMENTS_FALLBACK
          : undefined,
      size: selectedSize?.name,
      _type: 'single'
    };

    onConfirm({
      unitPrice: totalUnitPrice,
      quantity: quantity,
      options: JSON.stringify(optionsPayload),
      applied_nutrition: JSON.stringify(totalNutrition),
      name: dish?.name,
      dishId: String(dish?.id),
      image: dish?.imageUrl
    });

    setIsSubmitting(false);
  };

  // ✅ CORREÇÃO 3: useMemo retornando o tipo exato 'SizesType' sem 'any'
  const processedSizes = useMemo<SizesType>(() => {
    const rawSizes = (dish?.sizes || []) as unknown[];

    return (rawSizes.map((size) => {
      const s = size as Record<string, unknown>;
      const groups = (s.accompanimentGroups || []) as Record<string, unknown>[];

      return {
        ...s,
        accompanimentGroups: groups.map((group) => {
          const options = (group.options || []) as Record<string, unknown>[];
          return {
            ...group,
            processedOptions: options.map((opt) => ({
              ...opt,
              id: opt.id,
              name: opt.name,
              priceModifier: Number(opt.priceModifier || 0)
            }))
          };
        })
      };
    }) as unknown) as SizesType;
  }, [dish?.sizes]);

  return (
    <Sheet open={!!dishId} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-xl p-0 flex flex-col h-full bg-[#FBFBFC] border-none shadow-2xl focus:outline-none overflow-hidden">
        <SheetTitle className="sr-only">Configurar {dish?.name}</SheetTitle>
        <SheetDescription className="sr-only">Personalize seu prato</SheetDescription>

        <div className="relative shrink-0 bg-white border-b border-slate-50">
          <div className="absolute top-4 right-4 z-50 md:hidden">
            <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full bg-black/10 backdrop-blur-md text-white">
              <X size={20} />
            </Button>
          </div>
          <div className="relative w-full h-44 md:h-64 bg-slate-100">
            {dish?.imageUrl ? (
              <img
                src={resolveImageUrl(dish.imageUrl, "product")}
                className="w-full h-full object-cover"
                alt={dish.name}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  if (!target.dataset.fallbackApplied) {
                    target.dataset.fallbackApplied = "true";
                    target.src = getImageFallback("product");
                  }
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-300"><ShoppingBag size={40} /></div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-[#FBFBFC] via-transparent to-transparent" />
          </div>
          <div className="px-6 md:px-8 pb-4 -mt-8 relative z-10 space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-black uppercase text-emerald-500 tracking-[0.2em] bg-white px-3 py-1 rounded-full shadow-sm border border-slate-50">Configuração</span>
              {selectedSize && (
                <Badge className="bg-slate-900 text-white border-none font-black text-[9px] px-3 py-1 rounded-full animate-in zoom-in">
                  TAMANHO: {selectedSize.name}
                </Badge>
              )}
            </div>
            <h2 className="text-2xl md:text-3xl font-black uppercase italic tracking-tighter text-slate-900 leading-tight">
              {dish?.name || "..."}
            </h2>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar scroll-smooth">
          <div className="px-6 md:px-8 space-y-8 py-6 pb-40">
            {selectedSize && Boolean(dish?.showNutrition) && totalNutrition && (
              <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden shrink-0">
                <div className="p-4 space-y-3">
                  <div className="flex justify-between items-end">
                    <div className="flex flex-col">
                      <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Total Calórico</span>
                      <span className="text-xl font-black text-slate-900 italic leading-none">{totalNutrition.energyKcal} <span className="text-[10px] not-italic text-slate-400">KCAL</span></span>
                    </div>
                    <button onClick={() => setShowFullNutrition(!showFullNutrition)} className="flex items-center gap-1 text-[9px] font-black text-emerald-600 uppercase tracking-widest">
                      {showFullNutrition ? 'Recolher' : 'Ver Macros'}
                      <ChevronDown className={cn("transition-transform duration-300", showFullNutrition && "rotate-180")} size={12} />
                    </button>
                  </div>
                  <div className="h-2 w-full flex rounded-full overflow-hidden bg-slate-100">
                    <div className="h-full bg-blue-500 transition-all" style={{ width: `${(totalNutrition.carbs / (totalNutrition.carbs + totalNutrition.proteins + totalNutrition.fatTotal || 1)) * 100}%` }} />
                    <div className="h-full bg-emerald-500 transition-all" style={{ width: `${(totalNutrition.proteins / (totalNutrition.carbs + totalNutrition.proteins + totalNutrition.fatTotal || 1)) * 100}%` }} />
                    <div className="h-full bg-amber-500 transition-all" style={{ width: `${(totalNutrition.fatTotal / (totalNutrition.carbs + totalNutrition.proteins + totalNutrition.fatTotal || 1)) * 100}%` }} />
                  </div>
                </div>
                {showFullNutrition && (
                  <div className="px-4 pb-4 pt-2 border-t border-slate-50 bg-slate-50/30">
                    <NutritionInfo
                      data={totalNutrition}
                      totalWeight={totalNutrition.yieldWeight}
                    />
                  </div>
                )}
              </div>
            )}

            {isLoading ? (
              <div className="flex h-40 items-center justify-center"><Loader2 className="animate-spin text-emerald-500" /></div>
            ) : (
              <div ref={sizeSelectorRef}>
                <SizeSelector
                  sizes={processedSizes}
                  selectedId={selectedSize?.id ?? null}
                  onSelect={(s: unknown) => { setSelectedSize(s as SizeOption); setSelectedAccs([]); scrollTo(sizeSelectorRef); }}
                  selectedAccs={selectedAccs as unknown as SelectedAccsType}
                  onAddAcc={handleAccSelection}
                  // ✅ Usamos o wrapper que compatibiliza os tipos
                  onRemoveAcc={handleRemoveAcc as unknown as SelectorProps['onRemoveAcc']}
                />
              </div>
            )}
          </div>
        </div>

        {dish && (
          <div ref={footerRef} className="p-4 md:p-6 border-t bg-white shrink-0 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] z-50 w-full">
            <div className="w-full space-y-4">
              {!isAccompanimentsComplete && (
                <div className="bg-amber-50 rounded-xl py-2.5 border border-amber-100 flex items-center justify-center gap-2">
                  <p className="text-[10px] font-black uppercase text-amber-600 tracking-widest italic animate-pulse">
                    {!selectedSize ? "Escolha um tamanho" : "Finalize sua montagem"}
                  </p>
                </div>
              )}

              <div className="flex gap-2 items-center w-full">
                <div className="flex items-center bg-slate-50 rounded-2xl h-14 px-1 shrink-0 border border-slate-100">
                  <Button variant="ghost" size="icon" className="h-10 w-10 hover:bg-white rounded-xl" onClick={() => setQuantity(Math.max(1, quantity - 1))}><Minus size={14} /></Button>
                  <span className="w-8 text-center font-black text-base italic">{quantity}</span>
                  <Button variant="ghost" size="icon" className="h-10 w-10 hover:bg-white rounded-xl" onClick={() => setQuantity(quantity + 1)}><Plus size={14} /></Button>
                </div>

                <Button
                  disabled={!isAccompanimentsComplete || isSubmitting || !selectedSize}
                  onClick={handleConfirm}
                  className={cn(
                    "flex-1 h-14 rounded-2xl font-black uppercase tracking-widest transition-all shadow-xl overflow-hidden",
                    isAccompanimentsComplete ? "bg-slate-900 text-white hover:bg-slate-800 active:scale-[0.98]" : "bg-slate-100 text-slate-400"
                  )}
                >
                  {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : (
                    <div className="flex items-center justify-between w-full px-2">
                      <span className="hidden md:inline italic truncate pr-2">Confirmar Item</span>
                      <ShoppingBag size={20} className="md:hidden ml-2" />

                      <span className="bg-white/10 px-3 py-1.5 rounded-lg whitespace-nowrap text-[12px] border border-white/5">
                        R$ {(totalUnitPrice * quantity).toFixed(2)}
                      </span>
                    </div>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
