import React, { useState, useMemo } from "react";
import { Search, X, Loader2, Utensils, Plus, CheckCircle2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { FullPrescription, PrescriptionOption } from "../../../../../../server/routers/storefront/nutri/types";

export interface CatalogProduct {
  id: string | number;
  name: string;
  imageUrl?: string | null;
  categoryName?: string | null;
  energyKcal?: number | string | null;
  [key: string]: unknown;
}

interface CatalogSidebarProps {
  isPickingFor: { mealId: string; groupId: string } | null;
  onClose: () => void;
  catalog: CatalogProduct[] | undefined;
  loading: boolean;
  onAdd: (product: CatalogProduct) => void;
  prescription: FullPrescription;
}

export function CatalogSidebar({ 
  isPickingFor, 
  onClose, 
  catalog, 
  loading, 
  onAdd, 
  prescription 
}: CatalogSidebarProps) {
  const [searchTerm, setSearchTerm] = useState("");

  // ✅ MEMO: Filtra o catálogo apenas quando o termo de busca ou catálogo mudam (Performance)
  const filteredCatalog = useMemo(() => {
    if (!catalog) return [];
    return catalog.filter((p) => 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.categoryName?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [catalog, searchTerm]);

  if (!isPickingFor) return null;

  // Encontra o grupo atual para marcar pratos já selecionados
  const currentGroup = prescription?.meals
    ?.find((m) => m.id === isPickingFor.mealId)
    ?.groups?.find((g) => g.id === isPickingFor.groupId);

  return (
    <div className="w-full md:w-100 h-full bg-white border-l border-slate-200 flex flex-col z-50 animate-in slide-in-from-right-full duration-500 shrink-0 overflow-hidden shadow-2xl">
      
      {/* HEADER - Visual mais limpo e focado */}
      <div className="p-6 border-b bg-slate-900 text-white flex justify-between items-center shrink-0">
        <div className="min-w-0 text-left">
          <h3 className="font-black uppercase italic text-sm tracking-tighter">Catálogo de Pratos</h3>
          <p className="text-[9px] font-bold text-emerald-400 uppercase truncate mt-0.5">
            Adicionando ao: <span className="text-white">{currentGroup?.name || "Grupo"}</span>
          </p>
        </div>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={onClose} 
          className="rounded-xl hover:bg-white/10 text-white transition-colors"
        >
          <X size={20} />
        </Button>
      </div>

      {/* BUSCA - Estilização alinhada com os Inputs do Dashboard */}
      <div className="p-4 border-b bg-white shrink-0">
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors" size={16} />
          <Input 
            placeholder="PROCURAR ALIMENTO..." 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-11 h-12 rounded-xl text-[10px] font-black uppercase bg-slate-50 border-2 border-transparent focus-visible:border-emerald-500/30 focus-visible:ring-0 transition-all"
          />
        </div>
      </div>

      {/* LISTAGEM - Scroll suave e feedback visual de carregamento */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2.5 bg-slate-50/50 custom-scrollbar">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-40 gap-3">
            <Loader2 className="animate-spin text-emerald-500" size={24} />
            <p className="text-[8px] font-black uppercase text-slate-400 tracking-widest">Sincronizando Catálogo</p>
          </div>
        ) : filteredCatalog.length === 0 ? (
          <div className="text-center py-20 opacity-40">
            <Utensils className="mx-auto mb-2 text-slate-300" size={32} />
            <p className="text-[10px] font-black uppercase italic">Nenhum prato encontrado</p>
          </div>
        ) : (
          filteredCatalog.map((product) => {
            const isAlreadyInGroup = (currentGroup?.options as PrescriptionOption[] | undefined)?.some(
              (o) => String(o.dishId) === String(product.id)
            );

            return (
              <div 
                key={product.id} 
                onClick={() => !isAlreadyInGroup && onAdd(product)}
                className={cn(
                  "group p-3 rounded-2xl border-2 transition-all flex items-center gap-4 text-left",
                  isAlreadyInGroup 
                    ? "bg-slate-50 border-slate-100 opacity-60 cursor-default" 
                    : "bg-white border-white hover:border-emerald-500/30 hover:shadow-lg hover:shadow-emerald-900/5 cursor-pointer active:scale-[0.98]"
                )}
              >
                {/* Thumbnail com Overlay de Seleção */}
                <div className="h-14 w-14 rounded-xl bg-slate-100 overflow-hidden flex items-center justify-center shrink-0 border border-slate-100 relative">
                  {product.imageUrl ? (
                    <img src={product.imageUrl} alt={product.name} className="object-cover h-full w-full" />
                  ) : (
                    <Utensils size={18} className="text-slate-200" />
                  )}
                  {isAlreadyInGroup && (
                    <div className="absolute inset-0 bg-emerald-500/20 flex items-center justify-center backdrop-blur-[1px]">
                      <CheckCircle2 size={20} className="text-white fill-emerald-500" />
                    </div>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-black text-slate-800 uppercase leading-none truncate mb-1">
                    {product.name}
                  </p>
                  <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">
                    {product.categoryName || "Geral"} • <span className="text-emerald-600/70">{product.energyKcal || 0} kcal</span>
                  </p>
                </div>

                {/* Ação Lateral */}
                {!isAlreadyInGroup && (
                  <div className="h-9 w-9 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-emerald-500 group-hover:text-white transition-all shadow-sm">
                    <Plus size={18} strokeWidth={3} />
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}