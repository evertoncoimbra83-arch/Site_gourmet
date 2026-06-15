import React, { useState, useEffect } from "react";
import { trpc } from "@/_core/trpc";
import { Loader2, Info, AlertTriangle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { appToast as toast } from "@/lib/app-toast";
import { convertPurchaseQuantityToBaseUnit, calculateCostPerBaseUnit, normalizePurchaseUnit } from "../../../../../server/finance/purchases";

interface ItemClassifierProps {
  itemId: number;
  onClose: () => void;
  onSuccess: () => void;
}

export function ItemClassifier({ itemId, onClose, onSuccess }: ItemClassifierProps) {
  const [category, setCategory] = useState<string>("");
  const [linkedEntityType, setLinkedEntityType] = useState<string>("ingredient");
  const [linkedEntityId, setLinkedEntityId] = useState<number | null>(null);
  const [conversionFactor, setConversionFactor] = useState<string>("1.0000");
  const [saveRule, setSaveRule] = useState<boolean>(true);
  const [itemSearchText, setItemSearchText] = useState("");

  const utils = trpc.useUtils();

  // Queries
  const { data: ingredientsList, isLoading: isLoadingIngredients } =
    trpc.admin.ingredients.list.useQuery(
      { search: itemSearchText || undefined },
      { enabled: category === "FOOD_INGREDIENT" }
    );

  const { data: suggestion } =
    trpc.admin.purchases.suggestItemClassification.useQuery({ itemId });

  // Obter itens da compra selecionada para encontrar o item atual
  const [purchaseItem, setPurchaseItem] = useState<any>(null);

  useEffect(() => {
    // Busca do item localmente a partir do cache do getEntry (já carregado na listagem)
    // Para simplificar, buscamos da listagem ou fazemos uma busca rápida
    // Mas para garantir, podemos ler o banco de dados direto. Como não temos uma query getSingleItem,
    // podemos resgatar os dados do item classificando chamando a API do TRPC ou passando por props.
    // Vamos obter todos os itens do entry ou ler os dados.
    // Mas espere, podemos buscar da API de compras se necessário, ou fazer uma chamada.
    // Como getEntry retorna os itens, podemos obter do cache.
    const getCacheData = async () => {
      try {
        const cache = utils.admin.purchases.getEntry.getData();
        if (cache && cache.items) {
          const found = cache.items.find((it) => it.id === itemId);
          if (found) {
            setPurchaseItem(found);
            setCategory(found.category || "");
            setLinkedEntityType(found.linkedEntityType || "ingredient");
            setLinkedEntityId(found.linkedEntityId || null);
            setConversionFactor(found.conversionFactor ? String(Number(found.conversionFactor)) : "1.0000");
          }
        }
      } catch (e) {
        console.error(e);
      }
    };
    getCacheData();
  }, [itemId, utils]);

  // Mutations
  const classifyMutation = trpc.admin.purchases.classifyItem.useMutation({
    onSuccess: (res) => {
      toast.success("Item classificado!");
      onSuccess();
    },
    onError: (err) => {
      toast.error("Erro ao classificar item", { description: err.message });
    },
  });

  const handleSave = () => {
    if (!category) {
      toast.warning("Selecione uma categoria.");
      return;
    }

    if ((category === "FOOD_INGREDIENT" || category === "PACKAGING") && !linkedEntityId) {
      toast.warning("Selecione um ingrediente/embalagem correspondente da base.");
      return;
    }

    const needsConversionFactor = ["pacote", "rolo", "caixa"].includes(normalizePurchaseUnit(purchaseItem?.unit || ""));
    const factorNum = parseFloat(conversionFactor) || 1;

    if (needsConversionFactor && factorNum <= 0) {
      toast.warning("O fator de conversão é obrigatório para caixas, rolos ou pacotes.");
      return;
    }

    classifyMutation.mutate({
      itemId,
      category: category as any,
      linkedEntityType: (category === "FOOD_INGREDIENT" ? "ingredient" : category === "PACKAGING" ? "packaging" : null) as any,
      linkedEntityId,
      conversionFactor: factorNum,
      saveRule,
    });
  };

  const getComputedCostPreview = () => {
    if (!purchaseItem) return null;
    const factorNum = parseFloat(conversionFactor) || 1;
    const qty = Number(purchaseItem.quantity);
    const price = Number(purchaseItem.totalPrice);
    const baseQty = convertPurchaseQuantityToBaseUnit(qty, purchaseItem.unit, factorNum);
    const cost = calculateCostPerBaseUnit(price, baseQty);
    return {
      baseQty,
      cost,
      baseUnit: ["kg", "g"].includes(purchaseItem.unit) ? "g" : ["l", "ml"].includes(purchaseItem.unit) ? "ml" : "un",
    };
  };

  const costPreview = getComputedCostPreview();

  return (
    <Dialog open={true} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-lg rounded-4xl p-6 bg-white border-none shadow-2xl">
        <DialogHeader className="text-left">
          <DialogTitle className="text-xl font-black uppercase text-slate-900 italic">
            Classificar <span className="text-emerald-500">Item</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-400">
            Associe o item bruto a uma categoria operacional e insumo do catálogo.
          </DialogDescription>
        </DialogHeader>

        {purchaseItem ? (
          <div className="space-y-4 py-3 text-left">
            {/* Resumo do Item Bruto */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
              <span className="text-[9px] font-black uppercase text-slate-400">Item da Nota Fiscal</span>
              <p className="text-xs font-bold text-slate-800">{purchaseItem.rawDescription}</p>
              <p className="text-[10px] text-slate-500 font-semibold mt-1">
                Lançamento: {Number(purchaseItem.quantity)} {purchaseItem.unit} por R$ {Number(purchaseItem.totalPrice).toFixed(2)}
              </p>
            </div>

            {/* Aviso de Não Atualização de Custo Vigente */}
            <div className="flex items-start gap-2.5 p-3.5 bg-amber-50/75 border border-amber-100 rounded-2xl text-amber-800 text-[9px] font-black uppercase tracking-wider shrink-0">
              <AlertTriangle size={14} className="shrink-0 mt-0.5" />
              <span>Nota: Esta classificação não altera o custo vigente do cardápio ou do catálogo de insumos nesta fase.</span>
            </div>

            {/* Bloco de Sugestão Inteligente */}
            {suggestion && (
              <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex flex-col gap-2 text-left animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-black uppercase text-emerald-800 tracking-wider">
                    💡 Sugestão Inteligente Encontrada
                  </span>
                  <span className="text-[8px] font-bold text-slate-400">
                    Confiança: {suggestion.confidence} uso(s)
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 font-medium leading-normal">{suggestion.reason}</p>

                <div className="text-[10px] font-bold text-slate-700 bg-white/60 p-3 rounded-xl border border-emerald-100/30 space-y-1">
                  <div><strong>Categoria:</strong> {suggestion.category}</div>
                  {suggestion.linkedEntityName && (
                    <div><strong>Insumo sugerido:</strong> {suggestion.linkedEntityName}</div>
                  )}
                  {suggestion.conversionFactor > 1 && (
                    <div><strong>Conversão sugerida:</strong> {suggestion.conversionFactor} base/compra</div>
                  )}
                </div>

                <Button
                  type="button"
                  onClick={() => {
                    setCategory(suggestion.category);
                    setLinkedEntityType(suggestion.linkedEntityType || "ingredient");
                    setLinkedEntityId(suggestion.linkedEntityId);
                    setConversionFactor(String(suggestion.conversionFactor));
                    if (suggestion.linkedEntityType === "ingredient" && suggestion.linkedEntityName) {
                      setItemSearchText(suggestion.linkedEntityName);
                    }
                    toast.success("Sugestão inteligente aplicada!");
                  }}
                  className="h-9 w-full bg-emerald-600 hover:bg-emerald-700 text-white text-[8px] font-black uppercase tracking-widest rounded-xl transition-all shadow-sm"
                >
                  Aplicar Sugestão
                </Button>
              </div>
            )}

            {/* Categoria */}
            <div className="space-y-1">
              <Label className="text-[9px] font-black uppercase text-slate-400">Categoria Financeira</Label>
              <select
                className="w-full h-11 bg-slate-50 border-none rounded-xl font-bold text-xs px-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 text-slate-700"
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value);
                  setLinkedEntityId(null);
                }}
              >
                <option value="">Selecione...</option>
                <option value="FOOD_INGREDIENT">Insumo Alimentar (Ingrediente)</option>
                <option value="PACKAGING">Embalagem de Marmita</option>
                <option value="LABEL_PRINTING">Etiquetas / Impressão</option>
                <option value="CLEANING">Material de Limpeza</option>
                <option value="LOGISTICS">Frete / Logística</option>
                <option value="PAYMENT_OR_SERVICE_FEE">Taxa de Gateway / Serviço</option>
                <option value="OPERATIONAL_EXPENSE">Outro Custo Operacional</option>
                <option value="IGNORE">Ignorar no Dashboard</option>
              </select>
            </div>

            {/* Vinculo se ingrediente */}
            {category === "FOOD_INGREDIENT" && (
              <div className="space-y-2 border border-dashed border-emerald-200 p-4 rounded-2xl bg-emerald-50/20">
                <div className="space-y-1">
                  <Label className="text-[9px] font-black uppercase text-emerald-600">Vincular a Insumo Base</Label>
                  <Input
                    placeholder="Pesquisar insumo técnico..."
                    className="h-10 bg-white border-slate-200 rounded-lg text-xs font-semibold"
                    value={itemSearchText}
                    onChange={(e) => setItemSearchText(e.target.value)}
                  />
                </div>

                {isLoadingIngredients ? (
                  <div className="flex justify-center py-2"><Loader2 className="animate-spin text-emerald-500" size={16} /></div>
                ) : ingredientsList && ingredientsList.length > 0 ? (
                  <div className="max-h-36 overflow-y-auto space-y-1 mt-2 pr-1 custom-scrollbar">
                    {ingredientsList.map((ing) => (
                      <div
                        key={ing.id}
                        onClick={() => {
                          setLinkedEntityId(ing.id);
                          setItemSearchText(ing.name);
                        }}
                        className={`px-3 py-2 text-xs font-bold rounded-lg cursor-pointer transition-colors border ${
                          linkedEntityId === ing.id
                            ? "bg-emerald-600 text-white border-emerald-600"
                            : "bg-white text-slate-700 hover:bg-slate-50 border-slate-100"
                        }`}
                      >
                        {ing.name} ({ing.unit})
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[9px] text-slate-400 font-bold uppercase text-center mt-2">Nenhum insumo técnico encontrado.</p>
                )}
              </div>
            )}

            {/* Fator de conversão se unidade agregada */}
            {["pacote", "rolo", "caixa"].includes(normalizePurchaseUnit(purchaseItem.unit)) && (
              <div className="space-y-2 border border-dashed border-amber-200 p-4 rounded-2xl bg-amber-50/20">
                <div className="flex items-center gap-1.5 text-amber-800">
                  <AlertTriangle size={14} />
                  <span className="text-[9px] font-black uppercase tracking-wider">Fator de Conversão Obrigatório</span>
                </div>
                <p className="text-[10px] text-slate-500 font-semibold leading-normal">
                  A unidade de compra é <strong>{purchaseItem.unit}</strong>. Informe a quantidade de itens na unidade base que cada {purchaseItem.unit} contém (ex: 1 caixa contém 100 unidades base).
                </p>
                <div className="space-y-1 mt-2">
                  <Label className="text-[9px] font-black uppercase text-amber-700">Fator de Conversão (unidades por {purchaseItem.unit})</Label>
                  <Input
                    type="number"
                    className="h-10 bg-white border-slate-200 rounded-lg text-xs font-black text-center text-slate-800"
                    value={conversionFactor}
                    onChange={(e) => setConversionFactor(e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* Preview de Custo Computado */}
            {costPreview && costPreview.cost > 0 && (
              <div className="p-4 bg-emerald-50/40 rounded-2xl border border-emerald-100 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2 text-emerald-800">
                  <Info size={16} />
                  <span className="text-[9px] font-black uppercase tracking-wider">Custo Computado</span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-emerald-700">
                    R$ {costPreview.cost.toFixed(6)} <span className="text-[9px] text-slate-400">/ {costPreview.baseUnit}</span>
                  </p>
                  <p className="text-[9px] text-slate-400 font-bold uppercase mt-0.5">
                    Qtd base total: {costPreview.baseQty.toFixed(2)} {costPreview.baseUnit}
                  </p>
                </div>
              </div>
            )}

            {/* Checkbox de salvar regra */}
            <div className="flex items-center gap-2 pt-2 ml-1">
              <input
                id="saveRule"
                type="checkbox"
                className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                checked={saveRule}
                onChange={(e) => setSaveRule(e.target.checked)}
              />
              <Label htmlFor="saveRule" className="text-[10px] font-bold text-slate-500 uppercase cursor-pointer select-none">
                Salvar como regra automática para futuras compras
              </Label>
            </div>
          </div>
        ) : (
          <div className="py-10 flex justify-center"><Loader2 className="animate-spin text-emerald-500" /></div>
        )}

        <DialogFooter className="gap-3 mt-4">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            className="h-12 px-5 font-bold text-xs"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={classifyMutation.isPending || !purchaseItem}
            className="h-12 bg-emerald-600 text-white font-black uppercase text-[10px] tracking-wider px-6 rounded-xl hover:bg-emerald-700"
          >
            {classifyMutation.isPending ? <Loader2 className="animate-spin" /> : "Confirmar Classificação"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
