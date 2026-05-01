// client/src/pages/adminOrders/view/steps/StepItems.tsx

import React, { useState } from "react";
import { trpc } from "@/_core/trpc";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Trash2, ShoppingCart, Loader2, Package, UtensilsCrossed, Check, Flame, Edit2, Minus } from "lucide-react";
import { appToast as toast } from "@/lib/app-toast";
import { cn } from "@/lib/utils";

import ProductDrawer from "../steps/products/view/ProductDrawer";
import PackageDrawer from "../steps/packages/view/PackageDrawer"; 

// --- INTERFACES ---
interface Dish {
  id: number;
  name: string;
}

interface PackageType {
  id: string;
  name: string;
}

interface NutritionData {
  energyKcal?: number;
  energy_kcal?: number;
}

interface AccompanimentItem {
  group?: string; 
  groupName?: string; 
  name: string; 
  weight?: number | string; 
}

interface MealItem {
  dishName: string;
  selectedAccompaniments?: AccompanimentItem[];
  accompaniments?: AccompanimentItem[];
  selectedAccs?: AccompanimentItem[];
}

interface ItemOptions {
  isPackage?: boolean;
  sizeName?: string;
  selectedSizeName?: string;
  size?: string;
  meals?: MealItem[];
  accompaniments?: AccompanimentItem[];
  selectedAccs?: AccompanimentItem[]; 
  selectedAccompaniments?: AccompanimentItem[];
}

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number | string;
  options: string | ItemOptions;
  appliedNutrition?: string | NutritionData | NutritionData[];
  applied_nutrition?: string | NutritionData | NutritionData[];
  packageId?: string | null;
}

interface DrawerConfirmPayload {
  unitPrice: number;
  quantity: number;
  options: string;
  applied_nutrition: string;
}

// ✅ Interface para o Bypass de Tipagem atualizada (ESLint friendly)
interface OrdersAdminApi {
  getDraft: { 
    useQuery: (input: Record<string, unknown>, opts?: Record<string, unknown>) => { data: unknown; isLoading: boolean };
    invalidate: () => void;
  };
  listPackages: { 
    useQuery: (input: Record<string, unknown>, opts?: Record<string, unknown>) => { data: { data: unknown }; isLoading: boolean } 
  };
  addItem: { useMutation: (opts: Record<string, unknown>) => { mutate: (data: Record<string, unknown>) => void } };
  removeItem: { useMutation: (opts: Record<string, unknown>) => { mutate: (id: string) => void } };
  updateItem: { useMutation: (opts: Record<string, unknown>) => { mutate: (data: Record<string, unknown>) => void, isPending: boolean } };
}

export default function StepItems({ draftId }: { draftId: string }) {
  const [activeTab, setActiveTab] = useState<"dishes" | "packages">("dishes");
  const [search, setSearch] = useState("");
  const [selectedDish, setSelectedDish] = useState<Dish | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<PackageType | null>(null); 
  
  const [editingPriceId, setEditingPriceId] = useState<string | null>(null);
  const [tempPrice, setTempPrice] = useState<string>("");

  // ✅ BYPASS: Cast para evitar TS2339 e avisos do ESLint
  const ordersAdmin = (trpc.admin.ordersAdmin as unknown as OrdersAdminApi);

  const { data: draftRaw, isLoading: isLoadingDraft } = ordersAdmin.getDraft.useQuery(
    { adminId: "admin_default" }, 
    { enabled: !!draftId, staleTime: 0 }
  );

  const draft = draftRaw as { items: unknown[] } | undefined;
  const items: OrderItem[] = (draft?.items as unknown as OrderItem[]) ?? [];

  const safeParse = (data: unknown) => {
    if (!data) return null;
    if (typeof data === 'object') return data;
    try {
      const firstPass = JSON.parse(String(data));
      if (typeof firstPass === 'string') return JSON.parse(firstPass);
      return firstPass;
    } catch {
      return null;
    }
  };

  const { data: dishesResponse, isLoading: isLoadingDishes } = trpc.public.dishes.list.useQuery(
    { search: search || null, perPage: 8, page: 1 }, 
    { enabled: search.trim().length > 1 && activeTab === "dishes" }
  );

  const { data: packagesResponse, isLoading: isLoadingPackages } = ordersAdmin.listPackages.useQuery(
    { search: search || null, page: 1, perPage: 20 },
    { enabled: search.trim().length > 1 && activeTab === "packages" } 
  );

  const addItemMutation = ordersAdmin.addItem.useMutation({
    onSuccess: () => {
      ordersAdmin.getDraft.invalidate();
      toast.success("Item adicionado!");
    }
  });

  const removeItemMutation = ordersAdmin.removeItem.useMutation({
    onSuccess: () => {
      ordersAdmin.getDraft.invalidate();
    }
  });

  const updateItemMutation = ordersAdmin.updateItem.useMutation({
    onSuccess: () => ordersAdmin.getDraft.invalidate(),
    onError: (err: unknown) => toast.error((err as { message: string }).message)
  });

  const handleUpdateQty = (id: string, newQty: number) => {
    if (newQty < 1) {
      removeItemMutation.mutate(id);
      return;
    }
    updateItemMutation.mutate({ itemId: id, quantity: newQty } as unknown as Record<string, unknown>);
  };

  const handleSavePrice = (id: string) => {
    const val = parseFloat(tempPrice.replace(',', '.'));
    if (!isNaN(val) && val >= 0) {
      updateItemMutation.mutate({ itemId: id, unitPrice: val } as unknown as Record<string, unknown>);
      toast.success("Preço atualizado!");
    }
    setEditingPriceId(null);
  };

  const renderItemDetails = (it: OrderItem) => {
    try {
      const options = (safeParse(it.options) || {}) as ItemOptions;
      
      if (options?.isPackage || it.packageId) {
        const meals = options?.meals || [];
        return (
          <div className="mt-3 space-y-3 bg-slate-50 p-3 rounded-2xl border border-slate-100">
             <div className="flex justify-between items-center border-b border-slate-200/50 pb-1.5 mb-1.5">
                <p className="text-[8px] font-black text-emerald-600 uppercase tracking-widest text-left">Composição</p>
                <Badge variant="outline" className="text-[7px] font-black h-4 bg-white border-emerald-200 text-emerald-700">
                   {options?.sizeName || options?.selectedSizeName || "PADRÃO"}
                </Badge>
             </div>
             <div className="space-y-2">
                {meals.map((m, idx) => (
                  <div key={idx} className="space-y-1 text-left">
                    <div className="flex items-center gap-2 text-[10px] font-black text-slate-700 uppercase">
                       <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                       {m.dishName}
                    </div>
                    <div className="flex flex-wrap gap-1 ml-3.5">
                      {(m.accompaniments || m.selectedAccompaniments || m.selectedAccs)?.map((acc, accIdx) => (
                        <span key={accIdx} className="text-[8px] font-bold text-slate-500 uppercase bg-white px-1.5 border border-slate-100 rounded">
                           {acc.name} {acc.weight ? `(${acc.weight}g)` : ""}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
             </div>
          </div>
        );
      }

      const accompaniments = options?.accompaniments || options?.selectedAccs || options?.selectedAccompaniments || [];
      const sizeLabel = options?.selectedSizeName || options?.size || options?.sizeName;

      return (
        <div className="mt-2 space-y-2 text-left">
          {sizeLabel && <Badge className="bg-slate-900 text-white text-[8px] font-black uppercase px-2 h-4 italic">TAMANHO {sizeLabel}</Badge>}
          <div className="flex flex-wrap gap-1.5">
            {accompaniments.map((acc: AccompanimentItem, idx: number) => (
              <div key={idx} className="flex flex-col bg-emerald-50 border border-emerald-100 px-2 py-1 rounded-lg">
                <span className="text-[6px] font-black text-emerald-400 uppercase leading-none mb-0.5">{acc.group || acc.groupName || "Acomp."}</span>
                <div className="flex items-center gap-1">
                  <Check size={7} className="text-emerald-500" strokeWidth={4} />
                  <span className="text-[9px] font-black text-emerald-700 uppercase">{acc.name}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    } catch { return null; }
  };

  return (
    <div className="space-y-4">
      <div className="bg-slate-900 p-6 rounded-4xl shadow-xl border-b-4 border-emerald-500 mx-2 mt-2">
        <div className="flex gap-4 mb-5">
          {(["dishes", "packages"] as const).map((tab) => (
            <button 
              key={tab}
              onClick={() => { setActiveTab(tab); setSearch(""); }}
              className={cn("font-black uppercase text-[9px] tracking-widest transition-all px-2", activeTab === tab ? "text-emerald-400 scale-105" : "text-slate-500 hover:text-slate-400")}
            >
              {tab === "dishes" ? "Pratos Avulsos" : "Pacotes & Combos"}
            </button>
          ))}
        </div>

        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-emerald-400 transition-colors" size={18} />
          <input 
            className="w-full h-12 bg-white rounded-2xl pl-11 pr-4 font-bold text-sm outline-none uppercase placeholder:text-slate-300" 
            placeholder={activeTab === "dishes" ? "Buscar prato..." : "Qual pacote?"}
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {(isLoadingDishes || isLoadingPackages) && search.trim().length > 1 && <Loader2 className="absolute right-4 top-3.5 animate-spin text-emerald-500" size={18} />}
        </div>
        
        {search.trim().length > 1 && (
          <div className="mt-3 grid grid-cols-1 gap-1 bg-slate-800 p-2 rounded-2xl max-h-60 overflow-y-auto border border-slate-700 shadow-2xl">
            {activeTab === "dishes" ? (
              (dishesResponse as unknown as Dish[] | undefined)?.map((dish) => (
                <button key={dish.id} onClick={() => setSelectedDish(dish)} className="w-full text-left p-3 hover:bg-emerald-600 rounded-xl flex justify-between items-center text-white group transition-all">
                  <div className="flex items-center gap-3">
                    <UtensilsCrossed size={14} className="text-slate-400 group-hover:text-white" />
                    <span className="font-black text-[11px] uppercase">{dish.name}</span>
                  </div>
                  <Check size={16} className="text-emerald-400 group-hover:text-white opacity-0 group-hover:opacity-100" />
                </button>
              ))
            ) : (
              (packagesResponse?.data as unknown as PackageType[] | undefined)?.map((pkg) => (
                <button key={pkg.id} onClick={() => setSelectedPackage(pkg)} className="w-full text-left p-3 hover:bg-emerald-600 rounded-xl flex justify-between items-center text-white group transition-all">
                  <div className="flex items-center gap-3">
                    <Package size={14} className="text-slate-400 group-hover:text-white" />
                    <span className="font-black text-[11px] uppercase">{pkg.name}</span>
                  </div>
                  <Plus size={16} className="text-emerald-400 group-hover:text-white" />
                </button>
              ))
            )}
          </div>
        )}
      </div>

      <div className="bg-white rounded-4xl p-2 min-h-75">
        {isLoadingDraft ? (
          <div className="p-20 flex justify-center"><Loader2 className="animate-spin text-slate-200" size={40} /></div>
        ) : !items.length ? (
          <div className="py-24 text-center opacity-10 flex flex-col items-center">
            <ShoppingCart className="mb-4" size={48} />
            <p className="font-black uppercase tracking-[0.2em] text-xs">Aguardando Pedido</p>
          </div>
        ) : (
          <div className="space-y-3 p-2">
            {items.map((it) => (
              <div key={it.id} className="p-5 flex flex-col bg-white border border-slate-100 rounded-[2.2rem] shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center bg-slate-100 text-slate-900 rounded-xl h-8 overflow-hidden border border-slate-200">
                            <button onClick={() => handleUpdateQty(it.id, it.quantity - 1)} disabled={updateItemMutation.isPending} className="w-7 h-full flex items-center justify-center hover:bg-slate-200 transition-colors">
                               <Minus size={12} strokeWidth={4} />
                            </button>
                            <span className="w-6 text-center text-[11px] font-black">{it.quantity}</span>
                            <button onClick={() => handleUpdateQty(it.id, it.quantity + 1)} disabled={updateItemMutation.isPending} className="w-7 h-full flex items-center justify-center hover:bg-slate-200 transition-colors">
                               <Plus size={12} strokeWidth={4} />
                            </button>
                        </div>

                        <div className="flex flex-col text-left">
                          <h4 className="font-black uppercase text-[13px] text-slate-900 leading-none">{it.name}</h4>
                          {(it.appliedNutrition || it.applied_nutrition) && (
                            <div className="flex items-center gap-1 mt-1 text-orange-500">
                               <Flame size={10} fill="currentColor" />
                               <span className="text-[9px] font-black uppercase">
                                 {(() => {
                                    try {
                                      const rawNut = it.applied_nutrition || it.appliedNutrition;
                                      const nut = safeParse(rawNut) as NutritionData | NutritionData[];
                                      if (!nut) return "N/A";
                                      const totalKcal = Array.isArray(nut) 
                                        ? nut.reduce((acc: number, m: NutritionData) => acc + Number(m.energyKcal || m.energy_kcal || 0), 0)
                                        : Number((nut as NutritionData)?.energyKcal || (nut as NutritionData)?.energy_kcal || 0);
                                      return totalKcal > 0 ? `${Math.round(totalKcal)} Kcal` : "N/A";
                                    } catch { return "N/A"; }
                                 })()}
                               </span>
                            </div>
                          )}
                        </div>
                    </div>
                    {renderItemDetails(it)}
                  </div>
                  
                  <div className="flex flex-col items-end gap-3 shrink-0">
                    {editingPriceId === it.id ? (
                      <div className="flex items-center gap-1 bg-emerald-50 rounded-lg p-1 border border-emerald-200">
                        <span className="text-[10px] font-black text-emerald-600 pl-1">R$</span>
                        <input 
                          type="number"
                          autoFocus
                          className="w-16 bg-transparent text-sm font-black text-emerald-900 outline-none p-0 border-none h-6"
                          value={tempPrice}
                          onChange={(e) => setTempPrice(e.target.value)}
                          onBlur={() => handleSavePrice(it.id)}
                          onKeyDown={(e) => e.key === 'Enter' && handleSavePrice(it.id)}
                        />
                      </div>
                    ) : (
                      <div 
                        onClick={() => { setEditingPriceId(it.id); setTempPrice(String(it.unitPrice || 0)); }}
                        className="group flex items-center gap-1 cursor-pointer hover:bg-slate-50 px-2 py-1 rounded-lg transition-colors border border-transparent hover:border-slate-200"
                        title="Clique para editar o preço"
                      >
                        <span className="font-black italic text-base text-slate-900">
                          R$ {(Number(it.unitPrice || 0) * (it.quantity || 1)).toFixed(2)}
                        </span>
                        <Edit2 size={12} className="text-slate-300 group-hover:text-emerald-500" />
                      </div>
                    )}

                    <button onClick={() => removeItemMutation.mutate(it.id)} className="h-9 w-9 rounded-2xl bg-red-50 text-red-400 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedDish && (
        <ProductDrawer 
          dishId={selectedDish.id} 
          onClose={() => { setSelectedDish(null); setSearch(""); }} 
          onConfirm={(data: unknown) => {
            const typedData = data as DrawerConfirmPayload;
            addItemMutation.mutate({ 
              draftId, 
              dishId: String(selectedDish.id), 
              name: selectedDish.name, 
              ...typedData 
            } as unknown as Record<string, unknown>);
            setSelectedDish(null);
            setSearch("");
          }} 
        />
      )}

      {selectedPackage && (
        <PackageDrawer 
          packageId={selectedPackage.id}
          onClose={() => { setSelectedPackage(null); setSearch(""); }} 
          onConfirm={(data: unknown) => {
            const typedData = data as DrawerConfirmPayload;
            addItemMutation.mutate({ 
              draftId, 
              packageId: String(selectedPackage.id), 
              name: selectedPackage.name, 
              ...typedData 
            } as unknown as Record<string, unknown>);
            setSelectedPackage(null);
            setSearch("");
          }} 
        />
      )}
    </div>
  );
}