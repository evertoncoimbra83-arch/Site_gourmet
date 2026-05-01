import React, { useState } from "react";
import { trpc } from "@/_core/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Edit2, Trash2, Utensils, Layers, Check, Plus, Scale, Loader2, Save, Camera } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { appToast as toast } from "@/lib/app-toast";

// --- INTERFACES ---
interface DishSize {
  id: number | string;
  name: string;
}

interface DishCategory {
  id: number | string;
  name: string;
  label?: string;
  displayOrder?: number;
}

interface Dish {
  id: number | string;
  name: string;
  price: number | string;
  salePrice?: number | string | null;
  imageUrl?: string | null;
  isActive: boolean | number;
  category?: DishCategory | null;
  categoryName?: string;
  composition?: unknown[]; 
  sizes?: DishSize[];
}

interface DishCardProps {
  dish: Dish;
  onEdit: () => void;
  onImageClick?: () => void;
  onDelete: (id: number) => void;
  onToggle: (id: number, active: boolean) => void;
  isEditing?: boolean;
}

export function DishCard({ dish, onEdit, onImageClick, onDelete, onToggle, isEditing }: DishCardProps) {
  const utils = trpc.useUtils();
  
  const [isPriceOpen, setIsPriceOpen] = useState(false);
  const [priceInput, setPriceInput] = useState(String(dish.price || ""));
  const [imageError, setImageError] = useState(false);

  const getCategoryDisplay = () => {
    if (dish.category?.name) return dish.category.name;
    if (dish.categoryName) return dish.categoryName;
    if (dish.category?.label) return dish.category.label;
    if (typeof dish.category === 'string') return dish.category;
    return "Sem Categoria";
  };

  const getFullImageUrl = (rawUrl: string | null | undefined) => {
    if (!rawUrl || imageError) return null;
    if (rawUrl.startsWith("http") || rawUrl.startsWith("blob:")) return rawUrl;
    
    const baseUrl = (import.meta.env.VITE_API_URL || "http://localhost:3001").replace(/\/$/, "");
    let cleanPath = rawUrl.replace(/\\/g, "/");
    
    if (cleanPath.includes("/uploads/")) cleanPath = cleanPath.split("/uploads/")[1];
    else if (cleanPath.includes("/public/")) cleanPath = cleanPath.split("/public/")[1];

    cleanPath = cleanPath.replace(/^\//, "");
    return `${baseUrl}/uploads/${cleanPath.replace(/^uploads\//, "")}`;
  };

  const currentImageUrl = getFullImageUrl(dish.imageUrl);

  const { data: allSizes } = trpc.admin.dishes.listSizes.useQuery(undefined, {
    staleTime: 1000 * 60 * 10 
  });

  const updateDish = trpc.admin.dishes.update.useMutation({
    onSuccess: () => {
      utils.admin.dishes.list.invalidate();
      setIsPriceOpen(false);
      toast.success(`Preço atualizado para R$ ${Number(priceInput.replace(",", ".")).toFixed(2)}`);
    },
    onError: (err) => {
      toast.error(`Erro ao salvar: ${err.message}`);
    }
  });

  const handleSavePrice = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.stopPropagation();
    const cleanValue = priceInput.replace(",", ".");
    const newPrice = parseFloat(cleanValue);

    if (isNaN(newPrice)) {
      toast.error("Valor inválido");
      return;
    }

    // ✅ Tipagem do payload para evitar o erro do ESLint
    updateDish.mutate({
      id: Number(dish.id),
      price: newPrice 
    } as Parameters<typeof updateDish.mutate>[0]);
  };

  const toggleSize = trpc.admin.dishes.toggleSizeLink.useMutation({
    onSuccess: () => {
      utils.admin.dishes.list.invalidate();
      toast.success("Tamanho atualizado!");
    }
  });

  const originalPrice = Number(dish.price || 0);
  const salePrice = dish.salePrice ? Number(dish.salePrice) : null;
  const hasDiscount = Boolean(salePrice && salePrice > 0 && salePrice < originalPrice);
  const hasComposition = Array.isArray(dish.composition) && dish.composition.length > 0;
  const hasEngineering = Array.isArray(dish.sizes) && dish.sizes.length > 0;
  const discountPercent = hasDiscount ? Math.round(((originalPrice - salePrice!) / originalPrice) * 100) : 0;

  return (
    <Card className={cn(
      "group border-none shadow-[0_4px_20px_rgba(0,0,0,0.03)] rounded-4xl bg-white overflow-hidden transition-all duration-500",
      !dish.isActive ? "opacity-60 grayscale-[0.5] bg-slate-50" : "hover:shadow-[0_20px_40px_rgba(0,0,0,0.08)]"
    )}>
      <CardContent className="p-5 flex flex-col h-full min-h-40 text-left">
        <div className="flex gap-4 items-start">
          
          <div 
            onClick={onImageClick}
            className={cn(
              "h-20 w-20 overflow-hidden rounded-[1.5rem] border border-slate-100 bg-slate-50 relative shrink-0 cursor-pointer transition-all active:scale-95 group/img",
              !dish.isActive && "pointer-events-none"
            )}
          >
            {currentImageUrl ? (
              <img 
                src={currentImageUrl} 
                className="h-full w-full object-cover transition-transform group-hover/img:scale-110 duration-700" 
                alt={dish.name} 
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center text-slate-200">
                <Utensils size={24} />
              </div>
            )}
            
            <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                <Camera size={16} className="text-white" />
            </div>

            {hasDiscount && !!dish.isActive && (
              <div className="absolute top-1 right-1 bg-emerald-500 text-white text-[6px] font-black px-1.5 py-0.5 rounded-lg shadow-lg">
                {discountPercent}% OFF
              </div>
            )}
            {hasComposition && (
              <div className="absolute bottom-1 left-1 bg-slate-900/80 text-white p-1 rounded-md backdrop-blur-sm">
                <Scale size={10} className="text-emerald-400" />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start gap-2">
              <div className="space-y-1">
                <h3 className={cn(
                  "font-black text-xs md:text-[15px] uppercase tracking-tight leading-[1.2] line-clamp-2 transition-colors",
                  !dish.isActive ? "text-slate-400" : "text-slate-900"
                )}>
                  {dish.name}
                </h3>
                <Badge className="bg-slate-100 text-slate-500 border-none font-black text-[7px] uppercase px-2 py-0.5">
                  {getCategoryDisplay()}
                </Badge>
              </div>

              <div className="flex gap-1 shrink-0">
                <Button variant="ghost" size="icon" className="h-7 w-7 rounded-xl text-slate-300 hover:text-emerald-600 hover:bg-emerald-50" onClick={onEdit} disabled={isEditing}>
                  {isEditing ? <Loader2 size={12} className="animate-spin" /> : <Edit2 size={12}/>}
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7 rounded-xl text-slate-300 hover:text-red-500 hover:bg-red-50" onClick={() => onDelete(Number(dish.id))}>
                  <Trash2 size={12}/>
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1" />

        <div className="pt-3 flex items-end justify-between border-t border-slate-100/50 mt-4">
          <Popover open={isPriceOpen} onOpenChange={setIsPriceOpen}>
            <PopoverTrigger asChild>
              <div 
                role="button"
                className={cn(
                  "flex flex-col cursor-pointer p-1 -ml-1 rounded-lg transition-colors hover:bg-slate-50 group/price select-none",
                  !dish.isActive && "pointer-events-none"
                )}
                onClick={(e) => e.stopPropagation()}
              >
                {hasDiscount && !!dish.isActive && (
                  <span className="text-[9px] font-bold text-slate-300 line-through leading-none mb-1">
                    R$ {originalPrice.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </span>
                )}
                <div className={cn(
                  "font-black text-lg italic leading-none transition-colors flex items-center gap-1",
                  !dish.isActive ? "text-slate-300" : (hasDiscount ? "text-emerald-600" : "text-slate-900")
                )}>
                  <span className="text-[10px] mr-0.5 font-bold not-italic">R$</span>
                  {(salePrice || originalPrice).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  <Edit2 size={10} className="text-slate-300 opacity-0 group-hover/price:opacity-100 transition-all" />
                </div>
              </div>
            </PopoverTrigger>
            
            <PopoverContent className="w-48 p-3 rounded-2xl shadow-xl border-slate-100 bg-white" align="start" sideOffset={5}>
              <div className="space-y-3" onClick={(e) => e.stopPropagation()}>
                <p className="text-[10px] font-black uppercase text-slate-400">Novo Preço</p>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-400">R$</span>
                  <Input 
                    autoFocus
                    type="text" 
                    value={priceInput} 
                    onChange={(e) => setPriceInput(e.target.value)}
                    className="h-8 text-sm font-bold border-slate-200 focus-visible:ring-emerald-500"
                    onKeyDown={(e) => e.key === 'Enter' && handleSavePrice(e as React.KeyboardEvent<HTMLInputElement>)}
                  />
                </div>
                <Button 
                  size="sm" 
                  className="w-full h-8 text-[10px] bg-emerald-600 hover:bg-emerald-700 font-bold uppercase"
                  onClick={handleSavePrice}
                  disabled={updateDish.isPending}
                >
                  {updateDish.isPending ? <Loader2 size={12} className="animate-spin mr-2" /> : <Save size={12} className="mr-2" />}
                  Salvar
                </Button>
              </div>
            </PopoverContent>
          </Popover>

          <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className={cn(
                    "h-8 px-3 rounded-xl text-[9px] font-black uppercase flex items-center gap-2 border transition-all",
                    hasEngineering ? "bg-slate-900 text-white border-slate-900 shadow-md" : "bg-slate-50 text-slate-400 border-slate-100"
                  )}
                  onClick={(e) => e.stopPropagation()}
                >
                  <Layers size={12} />
                  {hasEngineering ? `${dish.sizes?.length} TAM.` : "VINCULAR"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-56 p-3 rounded-3xl shadow-2xl border-none bg-white" align="end">
                <p className="text-[9px] font-black uppercase text-slate-400 mb-3 px-1">Engenharia de Prato</p>
                <div className="space-y-1 max-h-48 overflow-y-auto custom-scrollbar">
                  {(allSizes as unknown as DishSize[])?.map((size) => {
                    const isLinked = dish.sizes?.some((s) => Number(s.id) === Number(size.id));
                    return (
                      <button
                        key={size.id}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSize.mutate({ dishId: Number(dish.id), sizeId: Number(size.id) });
                        }}
                        className={cn(
                          "w-full flex items-center justify-between p-2.5 rounded-xl text-[9px] font-bold uppercase transition-all",
                          isLinked ? "bg-emerald-50 text-emerald-700" : "hover:bg-slate-50 text-slate-400"
                        )}
                      >
                        <span>{size.name}</span>
                        {isLinked ? <Check size={12} className="text-emerald-500" /> : <Plus size={12} className="opacity-30" />}
                      </button>
                    );
                  })}
                </div>
              </PopoverContent>
            </Popover>

            <div className={cn(
              "flex items-center px-2 py-1 rounded-xl border transition-all shadow-sm",
              dish.isActive ? "bg-emerald-50 border-emerald-100" : "bg-slate-200 border-slate-300"
            )}
            onClick={(e) => e.stopPropagation()}
            >
              <Switch 
                checked={!!dish.isActive} 
                onCheckedChange={(checked) => onToggle(Number(dish.id), checked)}
                className="data-[state=checked]:bg-emerald-600 scale-75"
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}