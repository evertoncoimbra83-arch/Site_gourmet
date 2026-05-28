import React, { useState, useEffect, useMemo } from "react";
import { trpc } from "@/_core/trpc";
import { 
  Search, Plus, Loader2, Beaker, Trash2, Globe, Camera, X, Info 
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, 
  DialogFooter, DialogDescription
} from "@/components/ui/dialog"; 
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { IngredientForm } from "./IngredientForm";
import { BarcodeScanner } from "./BarcodeScanner";
import { safeNumber } from "@/lib/safe-parse";

// --- INTERFACES ---
interface ExternalProduct {
  name: string;
  brand?: string;
  image?: string;
  energyKcal: number | string;
  energyKj: number | string;
  proteins: number | string;
  carbs: number | string;
  fatTotal: number | string;
  fatSaturated: number | string;
  fiber: number | string;
  sodium: number | string;
}

interface LocalIngredient {
  id: number;
  name: string;
  energyKcal: string | number;
  yieldFactor?: string | number;
  [key: string]: unknown;
}

export function IngredientManager() {
  const { toast } = useToast();
  const utils = trpc.useUtils();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedIngId, setSelectedIngId] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const itemsPerPage = 12;

  const [externalQuery, setExternalQuery] = useState("");
  const [externalResults, setExternalResults] = useState<ExternalProduct[]>([]);
  const [showScanner, setShowScanner] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  const [formData, setFormData] = useState({
    name: "", yieldFactor: "1.00", energyKcal: "0", energyKj: "0",
    proteins: "0", carbs: "0", addedSugars: "0", fatTotal: "0",
    fatSaturated: "0", fatTrans: "0", fiber: "0", sodium: "0"
  });

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1); 
    }, 400);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const { data: ingredients, isLoading } = trpc.admin.ingredients.list.useQuery({ search: debouncedSearch });

  const paginatedItems = useMemo(() => {
    if (!ingredients) return [];
    const start = (page - 1) * itemsPerPage;
    return (ingredients as unknown as LocalIngredient[]).slice(start, start + itemsPerPage);
  }, [ingredients, page]);

  const handleImportExternal = async (queryOverride?: string) => {
    const query = queryOverride || externalQuery;
    if (!query) return;

    setIsSearching(true);
    setExternalResults([]);

    const isFatSecret = query.includes("fatsecret.com.br");
    (toast as unknown as (opt: unknown) => void)({ 
      title: isFatSecret ? "Processando link do FatSecret..." : "Consultando base técnica...",
      description: "Aguarde um momento." 
    });

    try {
      const results = await utils.admin.ingredients.searchExternal.fetch({ name: query });
      
      if (results && results.length > 0) {
        setExternalResults(results as unknown as ExternalProduct[]);
        if (queryOverride) setExternalQuery(queryOverride);
      } else {
        (toast as unknown as (opt: unknown) => void)({ title: "Nenhum produto correspondente", variant: "destructive" });
      }
    } catch {
      (toast as unknown as (opt: unknown) => void)({ title: "Falha na conexão", description: "Verifique o link ou sua internet.", variant: "destructive" });
    } finally {
      setIsSearching(false);
    }
  };

  const selectProduct = (prod: ExternalProduct) => {
    setFormData({
      ...formData,
      name: prod.name + (prod.brand ? ` (${prod.brand})` : ""),
      energyKcal: String(prod.energyKcal),
      energyKj: String(prod.energyKj),
      proteins: String(prod.proteins),
      carbs: String(prod.carbs),
      fatTotal: String(prod.fatTotal),
      fatSaturated: String(prod.fatSaturated),
      fiber: String(prod.fiber),
      sodium: String(prod.sodium),
    });
    setExternalResults([]);
    setExternalQuery("");
    (toast as unknown as (opt: unknown) => void)({ title: "Tabela nutricional carregada!" });
  };

  const createMutation = trpc.admin.ingredients.create.useMutation({
    onSuccess: () => {
      utils.admin.ingredients.list.invalidate();
      setIsModalOpen(false);
      (toast as unknown as (opt: unknown) => void)({ title: "Insumo salvo com sucesso!" });
    }
  });

  const deleteMutation = trpc.admin.ingredients.delete.useMutation({
    onSuccess: () => {
      utils.admin.ingredients.list.invalidate();
      setIsModalOpen(false);
      (toast as unknown as (opt: unknown) => void)({ title: "Insumo removido da base." });
    }
  });

  const handleOpenDetails = (ing: LocalIngredient) => {
    setSelectedIngId(ing.id);
    setExternalResults([]);
    setFormData({
      name: ing.name, yieldFactor: String(ing.yieldFactor || "1.00"),
      energyKcal: String(ing.energyKcal || "0"), energyKj: String(ing.energyKj || "0"),
      proteins: String(ing.proteins || "0"), carbs: String(ing.carbs || "0"),
      addedSugars: String(ing.addedSugars || "0"), fatTotal: String(ing.fatTotal || "0"),
      fatSaturated: String(ing.fatSaturated || "0"), fatTrans: String(ing.fatTrans || "0"),
      fiber: String(ing.fiber || "0"), sodium: String(ing.sodium || "0")
    });
    setIsModalOpen(true);
  };

  const handleOpenCreate = () => {
    setSelectedIngId(null);
    setExternalResults([]);
    setExternalQuery("");
    setFormData({
      name: "", yieldFactor: "1.00", energyKcal: "0", energyKj: "0",
      proteins: "0", carbs: "0", addedSugars: "0", fatTotal: "0",
      fatSaturated: "0", fatTrans: "0", fiber: "0", sodium: "0"
    });
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {showScanner && (
        <BarcodeScanner 
          onScan={(code) => { setShowScanner(false); handleImportExternal(code); }} 
          onClose={() => setShowScanner(false)} 
        />
      )}

      <div className="flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full text-left">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <Input 
            placeholder="Pesquisar insumo na base técnica..." 
            className="h-14 pl-12 rounded-2xl bg-white border-none shadow-sm focus:ring-2 focus:ring-emerald-500/10 font-bold"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button onClick={handleOpenCreate} className="h-14 px-8 rounded-2xl bg-slate-950 hover:bg-emerald-600 text-white font-black uppercase text-[10px] tracking-widest transition-all w-full md:w-auto shadow-lg active:scale-95">
          <Plus size={18} className="mr-2" /> Novo Insumo
        </Button>
      </div>

      {isLoading ? (
        <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-emerald-500" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {paginatedItems.map((ing) => (
            <div 
              key={ing.id} 
              onClick={() => handleOpenDetails(ing)} 
              className="bg-white p-4 h-24 rounded-[1.8rem] border border-slate-100 shadow-sm flex items-center justify-between group cursor-pointer hover:border-emerald-500 transition-all overflow-hidden active:scale-[0.98] text-left"
            >
              <div className="flex items-center gap-3 w-full">
                <div className="shrink-0 w-10 h-10 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center group-hover:bg-emerald-50 group-hover:text-emerald-500 transition-colors">
                  <Beaker size={18} />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-black text-slate-800 uppercase text-[10px] leading-tight italic line-clamp-2">{ing.name}</h3>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter mt-1">{ing.energyKcal} kcal / 100g</p>
                </div>
              </div>
              <Info size={14} className="text-slate-200 group-hover:text-emerald-500 ml-2" />
            </div>
          ))}
        </div>
      )}

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-4xl rounded-4xl p-8 border-none max-h-[95vh] flex flex-col bg-white overflow-hidden shadow-2xl">
          <DialogHeader className="mb-4 text-left">
            <DialogTitle className="text-3xl font-black uppercase italic tracking-tighter">
                {selectedIngId ? "Detalhes do" : "Novo"} <span className="text-emerald-500">Insumo</span>
            </DialogTitle>
            <DialogDescription className="sr-only">Formulário técnico para gestão nutricional.</DialogDescription>
          </DialogHeader>

          {!selectedIngId && (
            <div className="space-y-3 mb-6 text-left">
              <div className="p-4 bg-emerald-50/50 rounded-[1.5rem] border border-emerald-100 flex gap-3 items-end">
                <div className="flex-1 space-y-2">
                  <Label className="text-[9px] font-black uppercase text-emerald-600 ml-2 flex items-center gap-1">
                    <Globe size={12} /> Busca Inteligente (Nome, Link FatSecret ou Barcode)
                  </Label>
                  <div className="relative">
                    <Input 
                      placeholder="Cole o link do FatSecret ou digite o nome..." 
                      className="h-11 bg-white border-emerald-200 rounded-xl focus:ring-emerald-500 pr-12 font-bold shadow-sm"
                      value={externalQuery}
                      onChange={(e) => {
                        const val = e.target.value;
                        try {
                          setExternalQuery(decodeURIComponent(val));
                        } catch {
                          setExternalQuery(val);
                        }
                      }}
                      onKeyDown={(e) => e.key === 'Enter' && handleImportExternal()}
                    />
                    <button onClick={() => setShowScanner(true)} className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-600 hover:text-emerald-800 transition-colors">
                      <Camera size={20} />
                    </button>
                  </div>
                </div>
                <Button 
                  onClick={() => handleImportExternal()} 
                  disabled={isSearching} 
                  className="h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase text-[10px] px-6 rounded-xl transition-all shadow-md active:scale-95"
                >
                  {isSearching ? <Loader2 className="animate-spin" /> : "Importar"}
                </Button>
              </div>

              {externalResults.length > 0 && (
                <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="flex justify-between items-center px-2">
                    <span className="text-[9px] font-black uppercase text-slate-400 italic tracking-wider">Sugestões ({externalResults.length})</span>
                    <button onClick={() => setExternalResults([])} className="text-[9px] font-black uppercase text-red-400 hover:text-red-500 flex items-center gap-1">
                      <X size={10} /> Limpar
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto p-2 bg-slate-50 rounded-2xl border-2 border-dashed border-emerald-200 custom-scrollbar">
                    {externalResults.map((prod, idx) => (
                      <div 
                        key={idx} 
                        onClick={() => selectProduct(prod)} 
                        className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-100 hover:border-emerald-500 cursor-pointer transition-all group shadow-sm active:scale-[0.98]"
                      >
                        <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center shrink-0">
                          {prod.image ? (
                             <img src={prod.image} className="w-10 h-10 object-contain rounded-lg" alt="" />
                          ) : (
                             <Beaker size={16} className="text-slate-300" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[10px] font-black uppercase text-slate-700 truncate">{prod.name}</p>
                          <p className="text-[9px] font-bold text-emerald-600 uppercase italic truncate">{prod.brand || 'Insumo Externo'}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
            <IngredientForm 
              formData={formData as unknown as Parameters<typeof IngredientForm>[0]['formData']} 
              // ✅ CORREÇÃO DEFINITIVA: Removido 'any', usando o tipo extraído da prop do IngredientForm
              setFormData={setFormData as unknown as (data: Parameters<typeof IngredientForm>[0]['formData']) => void} 
              handleKcalChange={(kcal) => {
                const val = safeNumber(kcal);
                setFormData(prev => ({ ...prev, energyKcal: kcal, energyKj: (val * 4.184).toFixed(2) }));
              }} 
            />
          </div>

          <DialogFooter className="pt-8 border-t border-slate-50 gap-4 mt-auto">
            {selectedIngId && (
              <Button 
                variant="ghost" 
                disabled={deleteMutation.isPending} 
                onClick={() => window.confirm("Excluir este insumo?") && deleteMutation.mutate({ id: selectedIngId })} 
                className="h-14 rounded-2xl text-red-500 hover:bg-red-50 font-black uppercase text-[10px] px-6 transition-all"
              >
                {deleteMutation.isPending ? <Loader2 className="animate-spin" /> : <><Trash2 size={18} className="mr-2" /> Excluir permanentemente</>}
              </Button>
            )}
            <Button 
              onClick={() => createMutation.mutate({ ...formData, id: selectedIngId || undefined } as unknown as Parameters<typeof createMutation.mutate>[0])} 
              disabled={createMutation.isPending} 
              className="h-14 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase flex-1 shadow-lg shadow-emerald-100 tracking-widest transition-all active:scale-95"
            >
              {createMutation.isPending ? <Loader2 className="animate-spin" /> : (selectedIngId ? "Salvar Alterações" : "Concluir Cadastro")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
