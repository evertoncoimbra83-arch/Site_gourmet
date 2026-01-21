import React from "react";
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle,
  SheetDescription 
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Search, CheckCircle2, Loader2, LayoutTemplate, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ShowcaseDrawerProps {
  open: boolean;
  onClose: () => void;
  editingShowcase: any;
  allProducts: any; 
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onToggleProduct: (id: number) => void;
  onSave: () => void;
  isSaving: boolean;
  onFieldChange: (field: string, value: any) => void;
}

export function ShowcaseDrawer({
  open,
  onClose,
  editingShowcase,
  allProducts,
  searchTerm,
  onSearchChange,
  onToggleProduct,
  onSave,
  isSaving,
  onFieldChange
}: ShowcaseDrawerProps) {
  
  // Normalização da lista de produtos (suporta array direto ou objeto com chave .dishes)
  const productsList = Array.isArray(allProducts) 
    ? allProducts 
    : (allProducts?.dishes || []);

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent 
        side="right" 
        className="w-full sm:max-w-xl bg-[#FBFBFC] border-none flex flex-col h-screen outline-none p-0 shadow-2xl"
      >
        {/* HEADER */}
        <div className="p-8 bg-white border-b border-slate-100 shrink-0 relative">
          <div className="flex items-center gap-2 text-emerald-600 mb-1">
            <LayoutTemplate size={14} />
            <span className="text-[9px] font-black uppercase tracking-[0.3em]">Configuração de Vitrine</span>
          </div>
          <SheetTitle className="text-3xl font-black text-slate-900 uppercase italic tracking-tighter">
            {editingShowcase?.id ? "Editar Vitrine" : "Nova Vitrine"}
          </SheetTitle>
          <SheetDescription className="text-[10px] font-medium text-slate-400">
             {productsList.length} produtos disponíveis para seleção.
          </SheetDescription>
          
          <button 
            onClick={onClose} 
            className="absolute right-8 top-10 p-2 text-slate-400 hover:text-slate-900 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* CONTEÚDO SCROLLÁVEL */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-8 space-y-10">
          
          {/* CONFIGURAÇÕES BÁSICAS */}
          <section className="space-y-4 bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-50">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Título da Vitrine</label>
              <Input 
                value={editingShowcase?.title || ""} 
                onChange={(e) => onFieldChange("title", e.target.value)}
                placeholder="Ex: Ofertas da Semana"
                className="h-14 rounded-2xl bg-slate-50 border-none font-bold placeholder:text-slate-300"
              />
            </div>
            <div className="flex items-center justify-between px-2 pt-2">
              <p className="text-[11px] font-black text-slate-700 uppercase">Status Ativo</p>
              <Switch 
                checked={editingShowcase?.active || false}
                onCheckedChange={(checked) => onFieldChange("active", checked)}
              />
            </div>
          </section>

          {/* LISTA DE PRODUTOS */}
          <section className="space-y-6">
            <div className="flex items-center justify-between px-2">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Vincular Pratos</h3>
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                <Input 
                  placeholder="BUSCAR..." 
                  className="h-10 pl-9 w-40 rounded-xl text-[10px] font-black bg-white"
                  value={searchTerm}
                  onChange={(e) => onSearchChange(e.target.value)}
                />
              </div>
            </div>

            <div className="grid gap-3">
              {productsList
                .filter((p: any) => {
                  const nameToFilter = p.name || p.title || "";
                  return nameToFilter.toLowerCase().includes(searchTerm.toLowerCase());
                })
                .map((prod: any) => {
                  const isSelected = editingShowcase?.products?.includes(prod.id);
                  
                  return (
                    <div 
                      key={prod.id} 
                      onClick={() => onToggleProduct(prod.id)}
                      className={cn(
                        "flex items-center gap-4 p-5 rounded-[1.5rem] border cursor-pointer transition-all active:scale-[0.98]",
                        isSelected 
                          ? "bg-slate-900 border-slate-900 text-white" 
                          : "bg-white border-slate-100 text-slate-500 hover:border-slate-200"
                      )}
                    >
                      <div className={cn(
                        "h-6 w-6 rounded-full flex items-center justify-center border-2 transition-colors",
                        isSelected ? "border-emerald-500 bg-emerald-500" : "border-slate-100"
                      )}>
                        {isSelected && <CheckCircle2 size={14} className="text-white" />}
                      </div>
                      
                      <div className="flex-1 min-w-0 text-left">
                        <p className={cn(
                          "font-black text-[12px] uppercase italic truncate", 
                          isSelected ? "text-white" : "text-slate-800"
                        )}>
                          {prod.name || prod.title || "Item sem nome"}
                        </p>
                        <p className={cn(
                          "text-[9px] font-bold uppercase", 
                          isSelected ? "text-emerald-400" : "text-slate-400"
                        )}>
                          R$ {Number(prod.price || 0).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  );
              })}
              
              {productsList.length === 0 && (
                <div className="py-20 text-center border-2 border-dashed border-slate-100 rounded-[2.5rem] bg-slate-50/50">
                   <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Nenhum produto encontrado</p>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* FOOTER */}
        <div className="p-8 bg-white border-t border-slate-100 shrink-0">
          <Button 
            onClick={onSave} 
            disabled={isSaving}
            className="w-full h-16 rounded-[1.5rem] bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase tracking-[0.2em] text-xs transition-colors"
          >
            {isSaving ? <Loader2 className="animate-spin" /> : "Salvar Vitrine"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}