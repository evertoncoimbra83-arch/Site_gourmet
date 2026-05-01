import React, { useEffect, useState } from "react";
import { Sheet, SheetContent, SheetTitle, SheetHeader, SheetDescription } from "@/components/ui/sheet"; 
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { 
  Leaf, WheatOff, MilkOff, Tag, Layers, Loader2, Eye, EyeOff, PieChart, Image as ImageIcon, Camera,
  Scale
} from "lucide-react"; 
import { trpc } from "@/_core/trpc";
import { cn } from "@/lib/utils";
import { appToast as toast } from "@/lib/app-toast"; 

import { useDishStore } from "../logic/useDishStore";
import { DishNutriTab } from "../view/DishNutriTab";
import { NutriField } from "../view/NutriField";
import { NutritionInfo } from "@/pages/products/drawer/NutritionInfo"; 
import { MediaPickerModal } from "@/components/MediaPickerModal"; 

// --- INTERFACES ---
interface ToggleBadgeProps {
  label: string; 
  active: boolean; 
  onClick: () => void; 
  icon: React.ElementType;
}

interface SizeItem { 
  id: number | string; 
  name: string; 
  weight?: string; 
  priceModifier?: number | string; 
}

interface LinkedSize { 
  id: number | string; 
  sizeId?: number | string; 
}

interface DishDrawerProps {
  open: boolean;
  onClose: () => void;
  dish: Record<string, unknown> | null; 
  onSubmit: (payload: Record<string, unknown>) => Promise<void> | void;
  categories: Array<{ id: string | number; name: string }>;
  defaultTab?: string;
  autoOpenMedia?: boolean; 
}

// 🛡️ SOLUÇÃO DEFINITIVA DE TIPAGEM (Fase 3 & 5)
// Definimos a interface do formulário para garantir as colunas individuais do Roadmap
interface DishFormValues {
  id?: number;
  name?: string;
  categoryId?: string | number;
  basePrice?: string | number;
  salePrice?: string | number;
  description?: string;
  imageUrl?: string;
  isVegetarian?: boolean;
  isGlutenFree?: boolean;
  isLactoseFree?: boolean;
  showNutrition?: boolean;
  show_nutrition?: boolean;
  energyKcal?: string | number;
  energyKj?: string | number;
  proteins?: string | number;
  carbs?: string | number;
  fatTotal?: string | number;
  fatSaturated?: string | number;
  fatTrans?: string | number;
  fiber?: string | number;
  sodium?: string | number;
  calcium?: string | number;
  iron?: string | number;
  ingredients?: string;
  sizes?: unknown[];
  composition?: unknown[];
}

// Interface para forçar o Hook a enxergar as propriedades (resolve erro 2339)
type TypedDishStore = {
  formData: DishFormValues;
  composition: Record<string, unknown>[];
  setFormData: (data: Partial<DishFormValues>) => void;
  setComposition: (data: Record<string, unknown>[]) => void;
  reset: () => void;
};

const ToggleBadge = ({ label, active, onClick, icon: Icon }: ToggleBadgeProps) => (
  <div onClick={onClick} className={cn("cursor-pointer flex-1 flex items-center justify-center gap-2 px-3 py-3 rounded-xl border transition-all select-none", active ? 'bg-slate-900 border-slate-900 text-white shadow-md' : 'bg-slate-50 border-slate-100 text-slate-400 hover:bg-white')}>
    <Icon size={14} className={active ? "text-white" : "text-slate-400"} />
    <span className="text-[10px] font-black uppercase tracking-wider">{label}</span>
  </div>
);

export function DishDrawer({ 
  open, 
  onClose, 
  dish, 
  onSubmit, 
  categories, 
  defaultTab = "geral",
  autoOpenMedia = false 
}: DishDrawerProps) {
  
  // 🔥 APLICAÇÃO DO CAST: Resolve os erros de 'unknown' nas linhas 53 e 54
  const { 
    formData, 
    setFormData, 
    composition, 
    setComposition, 
    reset 
  } = useDishStore() as unknown as TypedDishStore;

  const utils = trpc.useUtils();
  
  const [localIngredients, setLocalIngredients] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false); 

  useEffect(() => {
    if (open && autoOpenMedia) {
      setIsMediaModalOpen(true);
    }
  }, [open, autoOpenMedia]);

  useEffect(() => {
    if (open) {
      if (dish) {
        const textValue = (dish.ingredients as string) || "";
        const rawStatus = dish.show_nutrition !== undefined ? dish.show_nutrition : dish.showNutrition;
        const showNutriStatus = rawStatus === true || rawStatus === 1 || String(rawStatus) === "true";
        
        setFormData({ 
          ...dish, 
          show_nutrition: showNutriStatus, 
          showNutrition: showNutriStatus, 
          ingredients: textValue 
        } as unknown as Partial<DishFormValues>);
        
        setLocalIngredients(textValue);
        setComposition(Array.isArray(dish.composition) ? (dish.composition as Record<string, unknown>[]) : []);
      } else {
        if (!formData.id) {
          reset();
          setLocalIngredients("");
        }
      }
    }
  }, [dish, open, formData.id, setFormData, setComposition, reset]); 

  const { data: allSizes } = trpc.admin.dishes.listSizes.useQuery(undefined, { enabled: open });
  
  const toggleSize = trpc.admin.dishes.toggleSizeLink.useMutation({
    onSuccess: () => {
      utils.admin.dishes.list.invalidate();
      if (dish?.id) utils.admin.dishes.getById.invalidate(dish.id as number);
      toast.success("Tamanho atualizado!");
    }
  });

  const isDataLoading = dish && formData.id !== dish.id && open;

  const handleFinalSubmit = async () => {
    if (isSubmitting) return; 
    setIsSubmitting(true);
    try {
      const compArray = (composition as Record<string, unknown>[]) || [];
      const validComposition = compArray.map((item) => ({
        ingredientId: Number(item.ingredientId ?? item.id ?? item.originalId),
        ingredientName: String(item.ingredientName || item.name || "Ingrediente"),
        quantity: Number(item.quantity) || 0,
        unit: String(item.unit || "g")
      })).filter((item) => item.ingredientId > 0);

      // FASE 3 DO ROADMAP: Isolando e matando o campo legado no payload
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { nutritionalInfo, nutritional_info, ...cleanFormData } = formData as Record<string, unknown>;

      const payload = {
        ...cleanFormData,
        energyKcal: Number(formData.energyKcal || 0),
        energyKj: Number(formData.energyKj || 0),
        proteins: Number(formData.proteins || 0),
        carbs: Number(formData.carbs || 0),
        fatTotal: Number(formData.fatTotal || 0),
        fatSaturated: Number(formData.fatSaturated || 0),
        fatTrans: Number(formData.fatTrans || 0),
        fiber: Number(formData.fiber || 0),
        sodium: Number(formData.sodium || 0),
        calcium: Number(formData.calcium || 0),
        iron: Number(formData.iron || 0),

        show_nutrition: Boolean(formData.showNutrition),
        showNutrition: Boolean(formData.showNutrition), 
        ingredients: localIngredients, 
        composition: validComposition 
      };

      await onSubmit(payload as Record<string, unknown>);
    } catch {
      toast.error("Erro ao salvar alterações.");
    } finally { setIsSubmitting(false); }
  };

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-2xl p-0 border-none bg-white flex flex-col h-screen shadow-2xl overflow-hidden outline-none">
        {isDataLoading && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-emerald-500" />
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 italic">Sincronizando...</p>
          </div>
        )}

        <SheetHeader className="p-8 pb-4 shrink-0 text-left">
          <SheetTitle className="text-3xl font-black uppercase tracking-tighter italic text-slate-900">
            Ficha Técnica <span className="text-emerald-500">.</span>
          </SheetTitle>
          <SheetDescription className="sr-only">
            Edite as informações comerciais, nutricionais e de engenharia do prato.
          </SheetDescription>
        </SheetHeader>

        <Tabs defaultValue={defaultTab} className="flex-1 flex flex-col overflow-hidden">
          <div className="px-8 shrink-0">
            <TabsList className="grid w-full grid-cols-3 bg-slate-100 rounded-2xl h-12 p-1">
              <TabsTrigger value="geral" className="rounded-xl font-black text-[10px] uppercase"> Comercial </TabsTrigger>
              <TabsTrigger value="nutricao" className="rounded-xl font-black text-[10px] uppercase"> Produção </TabsTrigger>
              <TabsTrigger value="engenharia" className="rounded-xl font-black text-[10px] uppercase" disabled={!dish}> Engenharia </TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 overflow-y-auto px-8 py-6 custom-scrollbar text-left">
            <TabsContent value="geral" className="m-0 space-y-8 outline-none">
              <div className="space-y-3">
                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Foto do Cardápio</Label>
                <div 
                  onClick={() => setIsMediaModalOpen(true)} 
                  className="group relative w-full h-56 bg-slate-50 rounded-4xl border-2 border-dashed border-slate-200 overflow-hidden cursor-pointer hover:border-emerald-500 transition-all shadow-inner flex items-center justify-center"
                >
                  {formData.imageUrl ? (
                    <>
                      <img src={formData.imageUrl as string} className="w-full h-full object-cover transition-transform group-hover:scale-105" alt="Preview" />
                      <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                        <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-xl translate-y-2 group-hover:translate-y-0 transition-transform">
                          <Camera size={14} className="text-emerald-600" />
                          <span className="text-slate-900 text-[10px] font-black uppercase tracking-widest">Trocar Imagem</span>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center gap-3 text-slate-300 group-hover:text-emerald-500 transition-colors">
                      <div className="p-4 bg-white rounded-full shadow-sm">
                        <ImageIcon size={32} strokeWidth={1.5} />
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-widest">Selecionar da Nuvem</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-6">
                <div className={cn("flex items-center justify-between p-5 rounded-[2rem] border-2 transition-all", formData.showNutrition ? "bg-emerald-50 border-emerald-100" : "bg-slate-50 border-slate-100")}>
                  <div className="flex items-center gap-4">
                    <div className={cn("w-10 h-10 rounded-full flex items-center justify-center", formData.showNutrition ? "bg-emerald-500 text-white" : "bg-slate-200 text-slate-400")}>
                      {formData.showNutrition ? <Eye size={18} /> : <EyeOff size={18} />}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[11px] font-black uppercase text-slate-700 italic tracking-tighter">Exibição Nutricional</span>
                      <p className="text-[9px] font-bold text-slate-400 uppercase">Mostrar tabela de macros no site</p>
                    </div>
                  </div>
                  <span className="scale-110">
                    <Switch checked={!!formData.showNutrition} onCheckedChange={(val) => setFormData({ showNutrition: val })} />
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2 space-y-2">
                    <Label className="text-[10px] font-black uppercase text-slate-400">Nome do Prato</Label>
                    <Input className="h-14 rounded-2xl bg-slate-50 border-none font-bold text-lg focus-visible:ring-emerald-500" value={(formData.name as string) || ""} onChange={e => setFormData({ name: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-slate-400">Categoria</Label>
                    <select className="w-full h-14 bg-slate-50 border-none rounded-2xl px-4 font-bold text-sm outline-none focus:ring-2 focus:ring-emerald-500" value={(formData.categoryId as string) || ""} onChange={e => setFormData({ categoryId: e.target.value })}>
                      <option value="">SELECIONAR...</option>
                      {categories?.map((c) => (<option key={c.id} value={c.id}>{c.name.toUpperCase()}</option>))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <NutriField label="Preço Sugerido" icon={Tag} field="price" />
                  <NutriField label="Preço Promo" icon={Tag} field="salePrice" highlight />
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-slate-400">Restrições</Label>
                  <div className="flex gap-2">
                    <ToggleBadge label="Vegetariano" icon={Leaf} active={Boolean(formData.isVegetarian)} onClick={() => setFormData({ isVegetarian: !formData.isVegetarian })} />
                    <ToggleBadge label="Sem Glúten" icon={WheatOff} active={Boolean(formData.isGlutenFree)} onClick={() => setFormData({ isGlutenFree: !formData.isGlutenFree })} />
                    <ToggleBadge label="Sem Lactose" icon={MilkOff} active={Boolean(formData.isLactoseFree)} onClick={() => setFormData({ isLactoseFree: !formData.isLactoseFree })} />
                  </div>
                </div>

                <div className="space-y-2">
                   <Label className="text-[10px] font-black uppercase text-slate-400">Descrição Comercial</Label>
                   <Textarea className="rounded-3xl bg-slate-50 border-none font-medium text-sm min-h-24 p-5 resize-none leading-relaxed focus-visible:ring-emerald-500" value={(formData.description as string) || ""} onChange={e => setFormData({ description: e.target.value })} />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="nutricao" className="m-0 space-y-10 outline-none pb-10">
                <DishNutriTab />
                
                <div className="space-y-3 px-1">
                  <div className="flex items-center gap-2 text-slate-700">
                    <Scale className="text-slate-400" size={16} />
                    <Label className="text-[11px] font-black uppercase tracking-widest italic">Ingredientes (Texto do Rótulo)</Label>
                  </div>
                  <Textarea 
                    className="rounded-3xl bg-white border-2 border-slate-100 font-medium text-xs min-h-35 p-5 resize-none focus:border-emerald-500 transition-all shadow-sm" 
                    placeholder="Os ingredientes aparecerão aqui automaticamente..." 
                    value={localIngredients} 
                    onChange={e => {
                      setLocalIngredients(e.target.value);
                      setFormData({ ingredients: e.target.value });
                    }} 
                  />
                </div>

                <div className="pt-8 border-t border-slate-100 flex flex-col items-center">
                   <div className="flex items-center gap-2 mb-6 text-slate-400">
                    <PieChart size={16} />
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Preview do Rótulo</span>
                  </div>
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  <NutritionInfo data={formData as any} />
                </div>
            </TabsContent>

            <TabsContent value="engenharia" className="m-0 space-y-6 outline-none">
                <div className="bg-slate-50 p-6 rounded-4xl border border-slate-100 space-y-6 text-left">
                  <div className="flex flex-col gap-1 px-2">
                    <h4 className="text-[11px] font-black uppercase text-slate-700 flex items-center gap-2">
                      <Layers size={14} className="text-emerald-500" /> Tamanhos & Porções
                    </h4>
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    {(allSizes as unknown as SizeItem[])?.map((size) => {
                      const isLinked = (formData.sizes as unknown as LinkedSize[])?.some(
                        (s) => Number(s.id) === Number(size.id) || Number(s.sizeId) === Number(size.id)
                      );

                      return (
                        <div key={size.id} className={cn(
                          "flex items-center justify-between p-5 rounded-3xl border-2 transition-all bg-white",
                          isLinked ? "border-slate-900 shadow-md" : "border-slate-100 opacity-60"
                        )}>
                          <div className="flex flex-col">
                            <span className="text-xs font-black uppercase text-slate-700">{size.name}</span>
                            <span className="text-[10px] font-bold text-emerald-600 uppercase">
                              {size.weight} • + R$ {Number(size.priceModifier || 0).toFixed(2)}
                            </span>
                          </div>
                          <Switch 
                            checked={!!isLinked} 
                            onCheckedChange={() => {
                              if (!dish?.id) return toast.error("Salve o prato primeiro.");
                              toggleSize.mutate({ dishId: Number(dish.id), sizeId: Number(size.id) });
                            }} 
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
            </TabsContent>
          </div>
        </Tabs>

        <div className="p-8 bg-white border-t mt-auto flex gap-4 shrink-0">
          <Button variant="ghost" onClick={onClose} className="flex-1 h-14 rounded-2xl font-black text-[10px] uppercase text-red-400 hover:bg-red-50">Cancelar</Button>
          <Button 
            disabled={isSubmitting}
            className="flex-2 h-14 rounded-2xl bg-slate-900 text-white font-black uppercase tracking-widest shadow-lg hover:bg-emerald-600 transition-all active:scale-95 disabled:opacity-50" 
            onClick={handleFinalSubmit}
          > 
            {isSubmitting ? <><Loader2 className="animate-spin mr-2" size={16} /> Salvando...</> : "Confirmar Alterações"}
          </Button>
        </div>

        <MediaPickerModal 
          open={isMediaModalOpen}
          onClose={() => setIsMediaModalOpen(false)}
          onSelect={(url: string) => {
            setFormData({ imageUrl: url });
            setIsMediaModalOpen(false);
            toast.success("Imagem vinculada ao prato!");
          }}
          defaultFolder="pratos" 
        />
      </SheetContent>
    </Sheet>
  );
}
