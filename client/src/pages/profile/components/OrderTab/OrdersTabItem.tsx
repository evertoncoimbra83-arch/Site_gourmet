// client/src/pages/profile/components/OrderTab/OrdersTabItem.tsx
import React, { useMemo, useState } from "react";
import { Flame, Beef, Wheat, Droplets, FileText, ShoppingBag, Utensils, RotateCcw } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { NutritionData } from "@/pages/adminLabelEditor/print-engine/logic";
import { formatCurrency, safeNum } from "../../utils/orderHelpers";
import { OrderItem, OrderNutritionSummary } from "../../types/orderTypes";
import { useReorder } from "../../logic/useReorder";
import { normalizeImageUrl } from "@shared/utils/assets";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Helper de parse seguro para JSON locais
function safeJsonParse(value: unknown): Record<string, unknown> {
  if (!value) return {};
  if (typeof value === "object" && value !== null && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  if (typeof value !== "string") return {};
  try {
    const parsed = JSON.parse(value);
    return typeof parsed === "object" && parsed !== null && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

function getNoAccompanimentsMessage(options: Record<string, unknown>): string {
  return typeof options.noAccompanimentsMessage === "string"
    ? options.noAccompanimentsMessage.trim()
    : "";
}

// Fallback de imagem com tratamento de erro (redimensiona no mobile)
function OrderItemImage({ src, alt }: { src?: string | null; alt: string }) {
  const [hasError, setHasError] = useState(false);

  return (
    <div className="h-12 w-12 sm:h-16 sm:w-16 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200/60 overflow-hidden shrink-0 flex items-center justify-center relative shadow-xs transition-all duration-300 hover:shadow-sm">
      {src && !hasError ? (
        <img
          src={src}
          alt={alt}
          onError={() => setHasError(true)}
          className="h-full w-full object-cover animate-in fade-in duration-300"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/50 to-teal-50/30 flex items-center justify-center">
          <Utensils className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-600/60 animate-in fade-in duration-300" />
        </div>
      )}
    </div>
  );
}

// Extrair tamanho/porção do Item (cabeçalho)
function getItemSizeText(item: OrderItem, label?: OrderNutritionSummary) {
  const options = safeJsonParse(item.options);
  const parsedOptions = safeJsonParse(item.parsedOptions);

  const rawSize =
    options.selectedSizeName ||
    options.sizeName ||
    item.sizeName ||
    item.size_name ||
    (options.size as any)?.name ||
    (options.selectedSize as any)?.name ||
    options._sizeLabel ||
    parsedOptions.selectedSizeName ||
    parsedOptions.sizeName ||
    (parsedOptions.size as any)?.name ||
    (parsedOptions.selectedSize as any)?.name ||
    parsedOptions._sizeLabel ||
    "";

  const size = typeof rawSize === "string" ? rawSize.trim() : "";
  const isStandard = !size || size.toUpperCase() === "PADRÃO" || size.toUpperCase() === "PADRAO";

  if (!isStandard) {
    return size;
  }

  // Fallback para porção/peso se não houver tamanho definido
  const nutrition = label?.nutrition || (item as any)?.nutrition || (item as any)?.nutritionalInfo || null;
  const yieldWeight = nutrition ? Number((nutrition as any).yieldWeight || (nutrition as any).yield_weight || 0) : 0;
  if (yieldWeight > 0) {
    return `${yieldWeight}g`;
  }

  return null;
}

function NutriTable({ nut, title }: { nut: NutritionData; title: string }) {
  const n = (val: number | undefined) => safeNum(val);

  const portion = nut.yieldWeight || 100;
  const kcal = Math.round(n(nut.energyKcal));
  const kj = Math.round(n(nut.energyKj) || kcal * 4.184);

  const rows = [
    { label: "Valor Energético", val: `${kcal} kcal / ${kj} kJ` },
    { label: "Carboidratos", val: `${n(nut.carbs).toFixed(1)} g` },
    { label: "Açúcares Totais", val: `${n(nut.addedSugars).toFixed(1)} g`, indent: true },
    {
      label: "Açúcares Adicionados",
      val: `${n(nut.addedSugars).toFixed(1)} g`,
      indent: true,
    },
    { label: "Proteínas", val: `${n(nut.proteins).toFixed(1)} g` },
    { label: "Gorduras Totais", val: `${n(nut.fatTotal).toFixed(1)} g` },
    { label: "Gorduras Saturadas", val: `${n(nut.fatSaturated).toFixed(1)} g`, indent: true },
    { label: "Gorduras Trans", val: `${n(nut.fatTrans).toFixed(1)} g`, indent: true },
    { label: "Fibra Alimentar", val: `${n(nut.fiber).toFixed(1)} g` },
    { label: "Sódio", val: `${Math.round(n(nut.sodium))} mg` },
  ];

  return (
    <div className="space-y-3 text-left">
      <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
        {title}
      </p>

      <div className="border border-slate-200 rounded-2xl overflow-hidden">
        <div className="bg-slate-900 px-4 py-2.5 flex justify-between">
          <span className="text-[10px] font-black uppercase text-white tracking-wider">
            Informação Nutricional
          </span>
          <span className="text-[10px] font-bold text-slate-400">
            Porção {portion}g
          </span>
        </div>

        {rows.map((row, i) => (
          <div
            key={i}
            className={`flex justify-between items-center px-4 py-2 border-b border-slate-100 last:border-0 ${
              i % 2 === 0 ? "bg-white" : "bg-slate-50/50"
            }`}
          >
            <span
              className={`text-[11px] font-bold text-slate-700 ${
                row.indent ? "pl-4 font-normal text-slate-500" : ""
              }`}
            >
              {row.label}
            </span>
            <span className="text-[11px] font-black text-slate-900">{row.val}</span>
          </div>
        ))}

        <div className="bg-slate-50 px-4 py-2 border-t border-slate-100">
          <p className="text-[9px] text-slate-400 leading-snug">
            * Valores diários com base em uma dieta de 2.000 kcal.
          </p>
        </div>
      </div>
    </div>
  );
}

function MealDetailsSection({
  label,
  showMacros = true,
  showTechnicalSheet = true,
}: {
  label: OrderNutritionSummary;
  showMacros?: boolean;
  showTechnicalSheet?: boolean;
}) {
  return (
    <>
      {/* Macros em visual compacto e premium */}
      {showMacros && label.hasNutrition && (
        <div className="text-[10px] text-slate-500 font-medium mt-3 bg-slate-50/60 border border-slate-100/80 rounded-xl py-2 px-3 w-fit text-left flex items-center gap-1.5 flex-wrap">
          <span className="font-bold text-slate-400 mr-1 uppercase text-[8px] tracking-wider">Macros:</span>
          <span className="text-slate-800 font-black">{label.kcal} kcal</span>
          <span className="text-slate-300 font-normal select-none">•</span>
          <span className="text-slate-800 font-black">
            {label.proteins}g <span className="text-[8px] font-bold text-emerald-600">P</span>
          </span>
          <span className="text-slate-300 font-normal select-none">•</span>
          <span className="text-slate-800 font-black">
            {label.carbs}g <span className="text-[8px] font-bold text-blue-500">C</span>
          </span>
          <span className="text-slate-300 font-normal select-none">•</span>
          <span className="text-slate-800 font-black">
            {label.fat}g <span className="text-[8px] font-bold text-orange-400">G</span>
          </span>
        </div>
      )}

      {showTechnicalSheet && (
        <Dialog>
          <DialogTrigger asChild>
            <button className={`${showMacros ? "mt-4" : "mt-2"} inline-flex items-center gap-1.5 rounded-full border border-emerald-100 bg-white px-3 py-1.5 text-[9px] font-black uppercase tracking-widest text-emerald-700 transition-colors hover:border-emerald-300 hover:bg-emerald-50 outline-none cursor-pointer`}>
              <FileText size={11} /> Ver ficha técnica
            </button>
          </DialogTrigger>

          <DialogContent className="max-w-md rounded-3xl border-0 p-0 overflow-hidden outline-none flex flex-col max-h-[85dvh]">
            <DialogHeader className="bg-slate-900 px-6 py-5 text-left">
              <DialogTitle className="text-white font-black uppercase tracking-tight text-sm italic">
                Ficha Técnica
              </DialogTitle>
              <DialogDescription className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-0.5">
                {label.displayName}
              </DialogDescription>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto overscroll-contain p-6 space-y-6 text-left">
            <div className="space-y-2">
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                Composição
              </p>
              <div className="flex flex-wrap gap-1.5">
                <span className="text-[10px] text-slate-700 font-bold bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100 uppercase italic">
                  {label.mainDishName || label.displayName}
                </span>
                {label.accompaniments?.map((accompaniment, index) => (
                  <span
                    key={index}
                    className="text-[10px] text-slate-500 font-bold bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200 uppercase"
                  >
                    + {accompaniment}
                  </span>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                Ingredientes
              </p>
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-[11px] font-semibold leading-relaxed text-slate-600 whitespace-pre-line uppercase">
                {label.combinedIngredients || "Ingredientes não informados."}
              </div>
            </div>

            <NutriTable nut={label.nutrition || {}} title="Tabela Nutricional (ANVISA)" />
          </div>
        </DialogContent>
      </Dialog>
      )}
    </>
  );
}

export function OrdersTabItem({ item }: { item: OrderItem }) {
  const nutritionLabels = useMemo(() => item.nutritionLabels ?? [], [item.nutritionLabels]);
  const options = useMemo(() => safeJsonParse(item.options), [item.options]);

  // Detecção se é pacote ou prato
  const isPackage = useMemo(() => {
    return (
      options._type === "package_custom" ||
      Array.isArray(options.meals) ||
      nutritionLabels.length > 1 ||
      String(item.name).toLowerCase().includes("pacote")
    );
  }, [options, nutritionLabels, item.name]);

  const { isItemAvailable, reorderSingleItem, isReorderingSingle } = useReorder();
  const isAvailable = isItemAvailable(item);
  const isPending = isReorderingSingle[item.id] || false;

  // Tamanho/porção do item para exibição no cabeçalho
  const itemSizeText = useMemo(() => {
    return getItemSizeText(item, nutritionLabels[0]);
  }, [item, nutritionLabels]);

  // Mapeia prato avulso (Acompanhamentos com peso)
  const singleDishDetails = useMemo(() => {
    if (isPackage) return null;
    const label = nutritionLabels[0] || null;

    let accompaniments: string[] = [];
    if (label) {
      accompaniments = label.accompaniments;
    }

    if (Array.isArray(options.selectedAccs)) {
      accompaniments = options.selectedAccs
        .map((acc: any) => {
          const name = acc.name || acc.label || "";
          const weight = acc.weight ? `${acc.weight}g` : "";
          return weight ? `${name} ${weight}` : name;
        })
        .filter(Boolean);
    }

    return {
      accompaniments,
      noAccompanimentsMessage: getNoAccompanimentsMessage(options),
      nutritionLabel: label,
    };
  }, [isPackage, options, nutritionLabels]);

  // Mapeia refeições do pacote (Marmitas com pratos e acompanhamentos com peso)
  const mealsList = useMemo(() => {
    if (!isPackage) return [];

    if (Array.isArray(options.meals)) {
      return options.meals.map((meal: any, idx: number) => {
        const label = nutritionLabels[idx] || null;

        const accompaniments: string[] = (meal.accompaniments || [])
          .map((acc: any) => {
            const name = acc.name || acc.label || "";
            const weight = acc.weight ? `${acc.weight}g` : "";
            return weight ? `${name} ${weight}` : name;
          })
          .filter(Boolean);

        return {
          slot: meal.label || `Marmita ${idx + 1}`,
          dishName: meal.dishName || meal.name || "Item do Combo",
          accompaniments,
          nutritionLabel: label,
        };
      });
    }

    // Fallback para dados estruturados flat do print-engine
    return nutritionLabels.map((label, idx) => ({
      slot: label.slot || `Marmita ${idx + 1}`,
      dishName: label.mainDishName || label.displayName,
      accompaniments: label.accompaniments as string[],
      nutritionLabel: label,
    }));
  }, [isPackage, options.meals, nutritionLabels]);

  return (
    <div className="bg-white border border-slate-100 rounded-3xl p-5 md:p-6 shadow-sm space-y-5 text-left">
      <div className="flex flex-col sm:flex-row gap-4 sm:items-center border-b border-slate-50 pb-4">

        {/* Lado Esquerdo: Imagem + Quantidade + Nome do Produto */}
        <div className="flex items-start gap-3 sm:gap-4 flex-1 min-w-0">
          <OrderItemImage
            src={item.imageUrl ? normalizeImageUrl(item.imageUrl) : null}
            alt={item.name}
          />

          <div className="flex-1 min-w-0 text-left">
            <div className="flex items-start gap-2">
              <span className="h-6 px-2 bg-emerald-600 text-white rounded-lg flex items-center justify-center font-black text-[10px] shrink-0 mt-0.5">
                {item.quantity}x
              </span>
              <div className="flex flex-col text-left min-w-0 w-full">
                <div className="flex items-start gap-2 flex-wrap min-w-0">
                  <h4 className="font-black text-slate-900 uppercase text-xs md:text-sm tracking-tight italic break-words line-clamp-2 sm:line-clamp-none">
                    {isPackage ? ((options.packageName as string) || item.name) : (item.dishName || item.name)}
                  </h4>
                  {!isAvailable && (
                    <span className="bg-rose-50 text-rose-600 border border-rose-100 rounded-full text-[8px] font-black uppercase tracking-widest px-2.5 py-0.5 shrink-0 mt-0.5">
                      Produto indisponível
                    </span>
                  )}
                </div>
                {/* Exibição do tamanho/porção logo abaixo do nome */}
                {itemSizeText && (
                  <span className="text-[10px] text-emerald-600 font-black uppercase tracking-widest mt-1">
                    {itemSizeText}
                  </span>
                )}
                {/* Tags Nutricionais Compactas (Exibidas diretamente no card para pratos simples) */}
                {!isPackage && nutritionLabels[0] && nutritionLabels[0].hasNutrition && (
                  <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                    <span className="inline-flex items-center gap-0.5 text-[9px] font-black uppercase tracking-wider text-amber-700 bg-amber-50 border border-amber-100/50 px-1.5 py-0.5 rounded-md select-none">
                      🔥 {nutritionLabels[0].kcal} kcal
                    </span>
                    <span className="inline-flex items-center gap-0.5 text-[9px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-100/50 px-1.5 py-0.5 rounded-md select-none">
                      💪 {nutritionLabels[0].proteins}g Prot
                    </span>
                    <span className="text-[9.5px] font-bold text-slate-400 select-none">
                      P {nutritionLabels[0].proteins}g • C {nutritionLabels[0].carbs}g • G {nutritionLabels[0].fat}g
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Lado Direito: Preço alinhado em linha própria no mobile com borda separadora */}
        <div className="flex sm:flex-col sm:items-end justify-between items-center sm:justify-center shrink-0 border-t border-slate-50 sm:border-0 pt-2 sm:pt-0 mt-1 sm:mt-0">
          <span className="sm:hidden text-[9px] text-slate-400 uppercase font-black tracking-widest leading-none">
            Valor do Item
          </span>
          <span className="font-black text-slate-900 text-xs sm:text-sm md:text-base shrink-0">
            {formatCurrency(item.totalPrice)}
          </span>
        </div>

      </div>

      <div className="space-y-2 pl-4 border-l-2 border-emerald-50">
        {/* Renderização de Prato Avulso */}
        {!isPackage && singleDishDetails && (
          <div className="text-left">
            {/* Acompanhamentos */}
            {(singleDishDetails.accompaniments.length > 0 || singleDishDetails.noAccompanimentsMessage) && (
              <div className="mb-3">
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-2">
                  Acompanhamentos
                </p>
                {singleDishDetails.accompaniments.length > 0 ? (
                  singleDishDetails.accompaniments.map((accName, accIdx) => (
                    <p key={accIdx} className="text-[11px] text-slate-600 font-bold mb-1 pl-2 border-l-2 border-slate-200 uppercase">
                      {accName}
                    </p>
                  ))
                ) : (
                  <p className="text-[11px] text-slate-500 font-bold mb-1 pl-2 border-l-2 border-slate-200">
                    {singleDishDetails.noAccompanimentsMessage}
                  </p>
                )}
              </div>
            )}

            {/* Macros e ficha técnica */}
            {singleDishDetails.nutritionLabel && (
              <MealDetailsSection
                label={singleDishDetails.nutritionLabel}
                showMacros={false}
                showTechnicalSheet={false}
              />
            )}
          </div>
        )}

        {/* Renderização de Pacote Customizado */}
        {isPackage &&
          mealsList.map((meal, idx) => (
            <div key={idx} className="relative border-b border-slate-50 last:border-0 py-4 first:pt-0 text-left">
              {/* Nome do slot (Marmita 1, Marmita 2, etc.) */}
              <p className="text-[8px] font-black text-emerald-600 uppercase tracking-[0.15em] leading-none mb-1.5 italic">
                {meal.slot}
              </p>

              {/* Nome do prato interno */}
              <p className="text-sm font-bold text-slate-800 leading-snug mb-2 uppercase italic">
                {meal.dishName}
              </p>

              {/* Acompanhamentos internos listados linha por linha */}
              {meal.accompaniments.length > 0 && (
                <div className="space-y-1 mb-2 pl-2 border-l border-slate-200">
                  {meal.accompaniments.map((accName: string, accIdx: number) => (
                    <p key={accIdx} className="text-[10px] text-slate-500 font-bold uppercase">
                      {accName}
                    </p>
                  ))}
                </div>
              )}

              {/* Macros e ficha técnica da marmita individual */}
              {meal.nutritionLabel && (
                <MealDetailsSection label={meal.nutritionLabel} />
              )}
            </div>
          ))}
      </div>

      {/* Ações do item: Ficha técnica (esquerda) e Recompra individual (direita) */}
      <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-2">
        <div className="w-full sm:w-auto">
          {!isPackage && singleDishDetails?.nutritionLabel && (
            <Dialog>
              <DialogTrigger asChild>
                <button className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-full border border-emerald-100 bg-white px-4 py-2 text-[9px] font-black uppercase tracking-widest text-emerald-700 transition-colors hover:border-emerald-300 hover:bg-emerald-50 outline-none cursor-pointer">
                  <FileText size={11} /> Ver ficha técnica
                </button>
              </DialogTrigger>

              <DialogContent className="max-w-md rounded-3xl border-0 p-0 overflow-hidden outline-none flex flex-col max-h-[85dvh]">
                <DialogHeader className="bg-slate-900 px-6 py-5 text-left">
                  <DialogTitle className="text-white font-black uppercase tracking-tight text-sm italic">
                    Ficha Técnica
                  </DialogTitle>
                  <DialogDescription className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-0.5">
                    {singleDishDetails.nutritionLabel.displayName}
                  </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto overscroll-contain p-6 space-y-6 text-left">
                  <div className="space-y-2">
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                      Composição
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      <span className="text-[10px] text-slate-700 font-bold bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100 uppercase italic">
                        {singleDishDetails.nutritionLabel.mainDishName || singleDishDetails.nutritionLabel.displayName}
                      </span>
                      {singleDishDetails.nutritionLabel.accompaniments?.map((accompaniment, index) => (
                        <span
                          key={index}
                          className="text-[10px] text-slate-500 font-bold bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200 uppercase"
                        >
                          + {accompaniment}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                      Ingredientes
                    </p>
                    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-[11px] font-semibold leading-relaxed text-slate-600 whitespace-pre-line uppercase">
                      {singleDishDetails.nutritionLabel.combinedIngredients || "Ingredientes não informados."}
                    </div>
                  </div>

                  <NutriTable nut={singleDishDetails.nutritionLabel.nutrition || {}} title="Tabela Nutricional (ANVISA)" />
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>

        <Button
          size="sm"
          onClick={() => reorderSingleItem(item)}
          disabled={!isAvailable || isPending}
          aria-label={`Comprar novamente ${item.name}`}
          className={cn(
            "w-full sm:w-auto h-10 px-5 rounded-2xl font-black uppercase text-[10px] tracking-widest gap-2 transition-all active:scale-95 flex items-center justify-center cursor-pointer shadow-xs",
            isAvailable
              ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/10"
              : "bg-slate-100 text-slate-400 border border-slate-200"
          )}
        >
          {isPending ? (
            <RotateCcw size={12} className="animate-spin" />
          ) : (
            <ShoppingBag size={12} />
          )}
          {isPending
            ? "Processando..."
            : isPackage
            ? "Comprar este pacote"
            : "Comprar este prato"}
        </Button>
      </div>
    </div>
  );
}
