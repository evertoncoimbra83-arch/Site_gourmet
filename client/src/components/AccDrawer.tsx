import { useState, useEffect } from "react";
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetDescription 
} from "@/components/ui/sheet"; 
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Zap, Beef, Wheat, Droplets, Activity, Info, 
  Search, Plus, Trash2, RefreshCw, Calculator,
  Settings, Apple, PlusCircle, X, Loader2 
} from "lucide-react"; 
import { trpc } from "@/_core/trpc";

export function AccDrawer({ open, onClose, acc, onSubmit }: any) {
  const [formData, setFormData] = useState<any>({
    name: "", 
    price: "0.00", 
    showNutrition: false,
    energy: "0", protein: "0", carbs: "0", fat_total: "0", sodium: "0", fiber: "0",
  });

  const [view, setView] = useState<'idle' | 'search' | 'manual'>('idle');
  const [searchTerm, setSearchTerm] = useState("");
  const [composition, setComposition] = useState<any[]>([]); 
  const [manualItem, setManualItem] = useState({
    name: "", quantity: "100", calories: "0", protein: "0", carbohydrates: "0", fats: "0", fiber: "0", sodium: "0"
  });

  // 1. Busca Ingredientes (TACO)
  const searchResults = (trpc as any).admin.nutrition.searchIngredients.useQuery(searchTerm, {
    enabled: searchTerm.length > 2
  }).data;

  // 2. Busca Composição/Ficha Técnica (Blindagem contra undefined)
  const { data: savedComposition, isLoading: isLoadingComp } = (trpc as any).admin.accompaniments.options.getComposition.useQuery(
    { id: acc?.id },
    { enabled: !!acc?.id && open }
  );

  useEffect(() => {
    if (acc && open) {
      const rawInfo = acc.nutritionalInfo || acc.nutritional_info;
      let info: any = {};
      try { info = typeof rawInfo === 'string' ? JSON.parse(rawInfo) : (rawInfo || {}); } catch (e) { info = {}; }
      
      setFormData({
        name: acc.name || "", 
        price: acc.price_modifier || "0.00",
        showNutrition: !!(info.visible || acc.showNutrition), 
        energy: info?.energy?.value || "0", 
        protein: info?.protein?.value || "0",
        carbs: info?.carbs?.value || "0", 
        fat_total: info?.fat_total?.value || "0",
        sodium: info?.sodium?.value || "0", 
        fiber: info?.fiber?.value || "0",
      });

      if (savedComposition?.composition) {
        setComposition(savedComposition.composition);
      } else {
        setComposition([]);
      }
      setView('idle');
    }
  }, [acc, open, savedComposition]);

  const calculateBase100g = () => {
    const totals = (composition || []).reduce((accSum, curr) => {
      const q = parseFloat(curr.quantity || "0");
      const f = q / 100;
      return {
        energy: accSum.energy + (parseFloat(curr.energyKcal || curr.calories || "0") * f),
        protein: accSum.protein + (parseFloat(curr.protein || "0") * f),
        carbs: accSum.carbs + (parseFloat(curr.carbohydrates || curr.carbs || "0") * f),
        fat: accSum.fat + (parseFloat(curr.fatTotal || curr.fats || "0") * f),
        fiber: accSum.fiber + (parseFloat(curr.fiber || "0") * f),
        sodium: accSum.sodium + (parseFloat(curr.sodium || "0") * f),
      };
    }, { energy: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sodium: 0 });

    setFormData((prev: any) => ({
      ...prev,
      energy: totals.energy.toFixed(0),
      protein: totals.protein.toFixed(1),
      carbs: totals.carbs.toFixed(1),
      fat_total: totals.fat.toFixed(1),
      fiber: totals.fiber.toFixed(1),
      sodium: totals.sodium.toFixed(0),
    }));
  };

  const handleSave = () => {
    const payload = {
      id: acc?.id,
      name: formData.name,
      isActive: acc?.isActive ?? true,
      showNutrition: formData.showNutrition,
      nutritionalInfo: JSON.stringify({
        visible: formData.showNutrition,
        energy: { value: formData.energy },
        protein: { value: formData.protein },
        carbs: { value: formData.carbs },
        fat_total: { value: formData.fat_total },
        sodium: { value: formData.sodium },
        fiber: { value: formData.fiber },
      }),
      composition: (composition || []).map(i => ({
        ingredientId: i.ingredientId || i.id,
        quantity: String(i.quantity)
      }))
    };
    onSubmit(payload);
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:max-w-2xl p-0 border-none bg-white flex flex-col h-screen outline-none shadow-2xl">
        <SheetHeader className="p-8 pb-4 shrink-0 text-left">
          <SheetTitle className="text-3xl font-black uppercase text-slate-900 tracking-tighter italic">
            Ficha Técnica<span className="text-emerald-500">.</span>
          </SheetTitle>
        </SheetHeader>

        <Tabs defaultValue="geral" className="flex-1 flex flex-col overflow-hidden">
          <div className="px-8 shrink-0">
            <TabsList className="grid w-full grid-cols-2 bg-slate-100 rounded-2xl h-12 p-1">
              <TabsTrigger value="geral" className="rounded-xl font-black text-[10px] uppercase tracking-widest gap-2"> <Settings size={14} /> Definições </TabsTrigger>
              <TabsTrigger value="nutricao" className="rounded-xl font-black text-[10px] uppercase tracking-widest gap-2"> <Apple size={14} /> Nutrição </TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 overflow-y-auto px-8 py-6 custom-scrollbar">
            <TabsContent value="geral" className="space-y-6 m-0">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Nome Público</Label>
                <Input className="h-14 rounded-2xl bg-slate-50 border-none font-bold text-lg" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
            </TabsContent>

            <TabsContent value="nutricao" className="space-y-8 m-0">
              <div className="p-6 bg-emerald-50/40 border border-emerald-100/50 rounded-4xl space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-emerald-600 flex items-center gap-2"><Calculator size={14} /> Composição</h4>
                  {composition?.length > 0 && (
                    <Button onClick={calculateBase100g} className="h-7 rounded-full bg-emerald-500 text-[9px] uppercase font-black shadow-md"><RefreshCw size={10} className="mr-1" /> Calcular Macros</Button>
                  )}
                </div>

                <div className="space-y-3">
                  {isLoadingComp ? (
                    <div className="flex justify-center p-4"><Loader2 className="animate-spin text-emerald-500" /></div>
                  ) : (
                    composition.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-3 p-3 bg-white rounded-2xl border border-slate-100 shadow-sm">
                        <div className="flex-1 flex flex-col">
                           <span className="text-[10px] font-bold text-slate-600 truncate uppercase">{item.name}</span>
                           {item.isManual && <span className="text-[7px] text-orange-500 font-black uppercase tracking-tighter">Manual</span>}
                        </div>
                        <div className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-lg">
                          <input type="number" className="w-12 text-[10px] font-black text-emerald-600 text-center bg-transparent outline-none" value={item.quantity} onChange={e => { const nc = [...composition]; nc[idx].quantity = e.target.value; setComposition(nc); }} />
                          <span className="text-[9px] font-bold text-slate-300">G</span>
                        </div>
                        <Trash2 size={14} className="text-slate-300 hover:text-red-500 cursor-pointer transition-colors" onClick={() => setComposition(composition.filter((_, i) => i !== idx))} />
                      </div>
                    ))
                  )}

                  {view === 'idle' && (
                    <div className="grid grid-cols-2 gap-2 pt-2">
                      <Button variant="outline" onClick={() => setView('search')} className="border-dashed border-2 rounded-2xl text-[9px] font-black uppercase h-12 hover:bg-emerald-50"><Search size={14} className="mr-2" /> Tabela TACO</Button>
                      <Button variant="outline" onClick={() => setView('manual')} className="border-dashed border-2 rounded-2xl text-[9px] font-black uppercase h-12 text-orange-600 border-orange-200"><PlusCircle size={14} className="mr-2" /> Insumo Manual</Button>
                    </div>
                  )}

                  {view === 'search' && (
                    <div className="space-y-2 animate-in fade-in zoom-in-95">
                      <div className="flex items-center bg-white border rounded-xl px-3 shadow-sm">
                        <Search size={14} className="text-slate-300" />
                        <Input placeholder="Pesquisar ingrediente..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} autoFocus className="border-none text-xs h-10 focus:ring-0" />
                        <X size={14} className="text-slate-300 cursor-pointer" onClick={() => { setView('idle'); setSearchTerm(""); }} />
                      </div>
                      {searchResults && (
                        <div className="bg-white border rounded-xl max-h-40 overflow-auto shadow-xl z-50">
                          {searchResults.map((ing: any) => (
                            <div key={ing.id} onClick={() => { setComposition([...composition, { ...ing, quantity: "100" }]); setView('idle'); setSearchTerm(""); }} className="p-3 text-[10px] font-bold border-b last:border-0 hover:bg-emerald-50 cursor-pointer flex justify-between uppercase">
                              {ing.name} <Plus size={12} className="text-emerald-500" />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {view === 'manual' && (
                    <div className="p-4 bg-white border rounded-2xl space-y-4 animate-in slide-in-from-top-2">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="col-span-2 space-y-1">
                          <Label className="text-[9px] uppercase font-bold text-slate-400">Nome do Insumo</Label>
                          <Input className="h-8 text-xs bg-slate-50 border-none" value={manualItem.name} onChange={e => setManualItem({...manualItem, name: e.target.value})} />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[9px] uppercase font-bold text-slate-400">Kcal (100g)</Label>
                          <Input type="number" className="h-8 text-xs bg-slate-50 border-none" value={manualItem.calories} onChange={e => setManualItem({...manualItem, calories: e.target.value})} />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[9px] uppercase font-bold text-slate-400">Prot (g)</Label>
                          <Input type="number" className="h-8 text-xs bg-slate-50 border-none" value={manualItem.protein} onChange={e => setManualItem({...manualItem, protein: e.target.value})} />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="ghost" className="flex-1 h-8 text-[9px] font-black uppercase" onClick={() => setView('idle')}>Cancelar</Button>
                        <Button className="flex-1 h-8 bg-orange-500 hover:bg-orange-600 text-white text-[9px] font-black uppercase" onClick={() => { setComposition([...composition, { ...manualItem, id: Date.now()*-1, isManual: true }]); setView('idle'); }}>Adicionar</Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: "Energia (Kcal)", field: "energy", icon: Zap },
                  { label: "Proteína (g)", field: "protein", icon: Beef },
                  { label: "Carbos (g)", field: "carbs", icon: Wheat },
                  { label: "Gorduras (g)", field: "fat_total", icon: Droplets },
                  { label: "Fibras (g)", field: "fiber", icon: Activity },
                  { label: "Sódio (mg)", field: "sodium", icon: Info },
                ].map((item) => (
                  <div key={item.field} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col">
                    <span className="text-[9px] font-black uppercase text-slate-400 mb-2 flex items-center gap-1"><item.icon size={10} /> {item.label}</span>
                    <Input value={formData[item.field]} onChange={e => setFormData({...formData, [item.field]: e.target.value})} className="h-8 bg-white border-none rounded-lg font-bold text-xs" />
                  </div>
                ))}
              </div>
            </TabsContent>
          </div>
        </Tabs>

        <div className="p-8 bg-white border-t mt-auto flex gap-4">
          <Button variant="ghost" onClick={onClose} className="flex-1 h-14 rounded-2xl font-black text-[10px] uppercase text-slate-400">Descartar</Button>
          <Button className="flex-2 h-14 rounded-2xl bg-slate-900 hover:bg-emerald-600 text-white font-black text-[11px] uppercase tracking-widest shadow-xl transition-all" onClick={handleSave}>SALVAR FICHA TÉCNICA</Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}