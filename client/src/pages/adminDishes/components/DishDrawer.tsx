import { useState, useEffect, useRef } from "react";
import { Sheet, SheetContent, SheetTitle, SheetHeader } from "@/components/ui/sheet"; 
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { 
  Zap, Beef, Wheat, Droplets, Activity, Info, 
  Calculator, Settings, Apple, PlusCircle, X, ChevronLeft,
  Plus, Trash2, RefreshCw, Leaf, WheatOff, MilkOff, Tag
} from "lucide-react"; 
import ImagePicker from "./ImagePicker"; 
import { trpc } from "@/_core/trpc";

const INITIAL_FORM = {
  name: "", description: "", price: "", salePrice: "", categoryId: "", imageUrl: "",
  ingredients: "", isVegetarian: false, isGlutenFree: false, isLactoseFree: false,
  showNutrition: true,
  energyKcal: "0", energyKj: "0", protein: "0", carbs: "0", fatTotal: "0", sodium: "0", fiber: "0",
};

export function DishDrawer({ open, onClose, dish, onSubmit, categories }: any) {
  const isFirstRender = useRef(true);
  const lastDishId = useRef<any>(null);

  const [formData, setFormData] = useState<any>(() => {
    if (dish) return INITIAL_FORM; 
    const saved = localStorage.getItem("dish_draft");
    return saved ? JSON.parse(saved).formData : INITIAL_FORM;
  });

  const [composition, setComposition] = useState<any[]>(() => {
    if (dish) return [];
    const saved = localStorage.getItem("dish_draft");
    return saved ? JSON.parse(saved).composition : [];
  });

  const [view, setView] = useState<'idle' | 'search' | 'manual'>('idle');
  const [searchTerm, setSearchTerm] = useState("");
  const [manualIng, setManualIng] = useState({ 
    name: "", energyKcal: "0", protein: "0", carbs: "0", fatTotal: "0", sodium: "0", fiber: "0" 
  });

  const { data: searchResults } = trpc.admin.nutrition.searchIngredients.useQuery(searchTerm, {
    enabled: searchTerm.length > 2
  });

  const upsertManual = trpc.admin.nutrition.upsertIngredient.useMutation();

  useEffect(() => {
    if (open) {
      if (dish && dish.id !== lastDishId.current) {
          setFormData({
            ...dish,
            price: String(dish.price || ""),
            salePrice: String(dish.salePrice || ""), // ✅ Campo Promocional
            categoryId: String(dish.categoryId || ""),
            energyKcal: String(dish.energyKcal || "0"),
            energyKj: String(Math.round((dish.energyKcal || 0) * 4.2)),
            protein: String(dish.proteins || "0"),
            carbs: String(dish.carbs || "0"),
            fatTotal: String(dish.fatTotal || "0"),
            sodium: String(dish.sodium || "0"),
            fiber: String(dish.fiber || "0"),
            ingredients: dish.ingredients || "",
            isVegetarian: !!dish.isVegetarian,
            isGlutenFree: !!dish.isGlutenFree,
            isLactoseFree: !!dish.isLactoseFree,
          });
          setComposition([]);
          lastDishId.current = dish.id;
      } else if (!dish) {
        const saved = localStorage.getItem("dish_draft");
        if (!saved && !isFirstRender.current) {
          setFormData(INITIAL_FORM);
          setComposition([]);
        }
      }
      isFirstRender.current = false;
    }
  }, [dish, open]);

  useEffect(() => {
    if (open && !dish) {
      localStorage.setItem("dish_draft", JSON.stringify({ formData, composition }));
    }
  }, [formData, composition, open, dish]);

  const applyTacoCalculations = () => {
    const totals = composition.reduce((acc, curr) => {
      const quantity = parseFloat(String(curr.quantity || "0").replace(',', '.'));
      const factor = quantity / 100;
      return {
        energy: acc.energy + (parseFloat(curr.energyKcal || curr.calories || curr.energy || "0") * factor),
        protein: acc.protein + (parseFloat(curr.protein || "0") * factor),
        carbs: acc.carbs + (parseFloat(curr.carbohydrates || curr.carbs || "0") * factor),
        fat: acc.fat + (parseFloat(curr.fatTotal || curr.fats || "0") * factor),
        fiber: acc.fiber + (parseFloat(curr.fiber || "0") * factor),
        sodium: acc.sodium + (parseFloat(curr.sodium || "0") * factor),
      };
    }, { energy: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sodium: 0 });

    setFormData({
      ...formData,
      ingredients: composition.map(c => c.name).join(', '),
      energyKcal: totals.energy.toFixed(0),
      energyKj: (totals.energy * 4.2).toFixed(0),
      protein: totals.protein.toFixed(1),
      carbs: totals.carbs.toFixed(1), 
      fatTotal: totals.fat.toFixed(1),
      fiber: totals.fiber.toFixed(1), 
      sodium: totals.sodium.toFixed(0),
    });
  };

  const handleManualSubmit = async () => {
    if (!manualIng.name) return;
    try {
      const payload = { ...manualIng, carbohydrates: manualIng.carbs };
      const res = await upsertManual.mutateAsync(payload as any);
      if (res.success) {
        setComposition([...composition, { ...manualIng, id: res.id, quantity: "100" }]);
        setSearchTerm("");
        setView('idle');
        setManualIng({ name: "", energyKcal: "0", protein: "0", carbs: "0", fatTotal: "0", sodium: "0", fiber: "0" });
      }
    } catch (err) { console.error(err); }
  };

  const ToggleBadge = ({ label, active, onClick, icon: Icon }: any) => (
    <div 
      onClick={onClick}
      className={`
        cursor-pointer flex items-center gap-2 px-4 py-3 rounded-xl border transition-all select-none
        ${active ? 'bg-emerald-500 border-emerald-500 text-white shadow-md shadow-emerald-200' : 'bg-slate-50 border-slate-100 text-slate-400 hover:bg-white'}
      `}
    >
      <Icon size={14} className={active ? "text-white" : "text-slate-400"} />
      <span className="text-[10px] font-black uppercase tracking-wider">{label}</span>
    </div>
  );

  const NutriField = ({ label, icon: Icon, field, secondaryValue }: any) => (
    <div className="flex flex-col p-4 rounded-3xl bg-slate-50 border border-slate-100 group transition-all hover:bg-white hover:shadow-sm">
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-2">
          <Icon className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-500" />
          <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">{label}</span>
        </div>
        {secondaryValue && <span className="text-[8px] font-bold text-slate-300">{secondaryValue}</span>}
      </div>
      <Input 
        className="h-9 bg-white border-none rounded-xl text-xs font-bold shadow-sm" 
        value={formData[field]} 
        onChange={e => setFormData({...formData, [field]: e.target.value})} 
      />
    </div>
  );

  return (
    <Sheet open={open} onOpenChange={(v) => { if(!v) onClose(); }}>
      <SheetContent side="right" className="w-full sm:max-w-2xl p-0 border-none bg-white flex flex-col h-screen outline-none shadow-2xl overflow-hidden">
        <SheetHeader className="p-8 pb-4 shrink-0">
          <SheetTitle className="text-3xl font-black uppercase text-slate-900 tracking-tighter italic">
            {dish ? "Editar" : "Novo"} Prato<span className="text-emerald-500">.</span>
          </SheetTitle>
        </SheetHeader>

        <Tabs defaultValue="geral" className="flex-1 flex flex-col overflow-hidden">
          <div className="px-8 shrink-0">
            <TabsList className="grid w-full grid-cols-2 bg-slate-100 rounded-2xl h-12 p-1">
              <TabsTrigger value="geral" className="rounded-xl font-black text-[10px] uppercase tracking-widest gap-2"> <Settings size={14} /> Geral </TabsTrigger>
              <TabsTrigger value="nutricao" className="rounded-xl font-black text-[10px] uppercase tracking-widest gap-2"> <Apple size={14} /> Nutrição </TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar px-8 py-6">
            <TabsContent value="geral" className="m-0 space-y-8">
               <ImagePicker value={formData.imageUrl} onChange={(url: string) => setFormData({...formData, imageUrl: url})} label="Foto de Capa" />
               <div className="space-y-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Título do Prato</Label>
                    <Input className="h-14 rounded-2xl bg-slate-50 border-none font-bold text-lg" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Preço Base (R$)</Label>
                      <Input className="h-14 rounded-2xl bg-slate-50 border-none font-bold text-lg text-slate-600" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} />
                    </div>
                    
                    {/* ✅ NOVO CAMPO: PREÇO PROMOCIONAL */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Preço Promo (R$)</Label>
                        <Tag size={10} className="text-emerald-500" />
                      </div>
                      <Input className="h-14 rounded-2xl bg-emerald-50 border border-emerald-100 font-bold text-lg text-emerald-700 placeholder:text-emerald-200" placeholder="0.00" value={formData.salePrice} onChange={e => setFormData({...formData, salePrice: e.target.value})} />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Categoria</Label>
                      <select className="w-full h-14 bg-slate-50 border-none rounded-2xl px-4 font-bold text-sm outline-none cursor-pointer" value={formData.categoryId} onChange={e => setFormData({...formData, categoryId: e.target.value})}>
                        <option value="">SELECIONAR...</option>
                        {categories?.map((c: any) => (<option key={c.id} value={c.id}>{c.name.toUpperCase()}</option>))}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Tags de Saúde</Label>
                    <div className="flex gap-2 flex-wrap">
                        <ToggleBadge label="Vegetariano" icon={Leaf} active={formData.isVegetarian} onClick={() => setFormData({...formData, isVegetarian: !formData.isVegetarian})} />
                        <ToggleBadge label="Sem Glúten" icon={WheatOff} active={formData.isGlutenFree} onClick={() => setFormData({...formData, isGlutenFree: !formData.isGlutenFree})} />
                        <ToggleBadge label="Sem Lactose" icon={MilkOff} active={formData.isLactoseFree} onClick={() => setFormData({...formData, isLactoseFree: !formData.isLactoseFree})} />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Descrição Comercial</Label>
                    <Textarea className="rounded-3xl bg-slate-50 border-none font-medium text-sm min-h-25 p-5 resize-none leading-relaxed" placeholder="Destaque o sabor e ingredientes..." value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Ingredientes (Para Etiqueta)</Label>
                    <Textarea className="rounded-3xl bg-amber-50 border border-amber-100 font-medium text-xs min-h-20 p-5 resize-none leading-relaxed text-amber-900" placeholder="Ex: Arroz integral, feijão preto..." value={formData.ingredients} onChange={e => setFormData({...formData, ingredients: e.target.value})} />
                  </div>
               </div>
            </TabsContent>

            <TabsContent value="nutricao" className="m-0 space-y-8">
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2"> <Calculator size={14}/> Ficha Técnica</h4>
                  {composition.length > 0 && <Button onClick={applyTacoCalculations} className="h-8 rounded-full bg-emerald-500 hover:bg-emerald-600 text-[9px] font-black uppercase gap-2"> <RefreshCw size={12} /> Calcular Totais </Button>}
                </div>

                <div className="space-y-3">
                  {composition.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-4 p-4 rounded-3xl bg-slate-50 border border-slate-100">
                      <div className="flex-1">
                        <p className="text-[10px] font-black uppercase text-slate-800">{item.name}</p>
                        <p className="text-[9px] text-slate-400 font-bold">{item.energyKcal || item.calories || "0"} kcal/100g</p>
                      </div>
                      <div className="flex items-center gap-2 bg-white rounded-xl px-3 py-1.5 border border-slate-100">
                        <input type="number" className="w-12 text-xs font-black text-emerald-600 bg-transparent text-center outline-none" value={item.quantity} onChange={e => { const nc = [...composition]; nc[idx].quantity = e.target.value; setComposition(nc); }} />
                        <span className="text-[9px] font-black text-slate-300 uppercase">g</span>
                      </div>
                      <Trash2 size={16} className="text-slate-300 hover:text-red-500 cursor-pointer" onClick={() => setComposition(composition.filter((_, i) => i !== idx))} />
                    </div>
                  ))}
                  
                  {view === 'idle' && (
                    <button onClick={() => setView('search')} className="w-full py-6 rounded-[2.5rem] border-2 border-dashed border-slate-200 text-slate-400 hover:border-emerald-300 hover:text-emerald-500 flex flex-col items-center gap-2 transition-all">
                      <PlusCircle size={24} /> <span className="text-[10px] font-black uppercase">Adicionar Ingrediente</span>
                    </button>
                  )}

                  {view === 'search' && (
                    <div className="p-6 rounded-[2.5rem] bg-emerald-50/50 border border-emerald-100 space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-black uppercase text-emerald-600 tracking-widest">Busca TACO / Manual</span>
                        <X size={16} className="text-emerald-400 cursor-pointer" onClick={() => { setView('idle'); setSearchTerm(""); }} />
                      </div>
                      <Input placeholder="Buscar..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} autoFocus />
                      <div className="bg-white shadow-xl rounded-xl border max-h-40 overflow-auto divide-y">
                        {searchResults?.map((ing: any) => (
                          <div key={ing.id} onClick={() => { 
                            setComposition([...composition, { ...ing, quantity: "100" }]); 
                            setSearchTerm(""); setView('idle'); 
                          }} className="p-3 hover:bg-emerald-50 cursor-pointer flex justify-between items-center">
                            <span className="text-xs font-bold text-slate-700">{ing.name}</span> <Plus size={14} className="text-emerald-500" />
                          </div>
                        ))}
                        <div onClick={() => { setView('manual'); setSearchTerm(""); }} className="p-4 bg-slate-900 text-white cursor-pointer flex justify-center items-center gap-2 rounded-b-xl hover:bg-emerald-600 transition-colors">
                          <PlusCircle size={14} /> <span className="text-[9px] font-black uppercase tracking-widest">Criar Insumo Manual</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {view === 'manual' && (
                    <div className="p-6 rounded-[2.5rem] bg-slate-900 text-white space-y-4 shadow-xl">
                      <div className="flex items-center gap-3">
                        <ChevronLeft size={16} className="cursor-pointer" onClick={() => setView('search')} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Manual (p/ 100g)</span>
                      </div>
                      <Input placeholder="Nome" className="bg-slate-800 border-none text-white h-12" value={manualIng.name} onChange={e => setManualIng({...manualIng, name: e.target.value})} />
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { label: 'KCAL', key: 'energyKcal', icon: Zap },
                          { label: 'PROT', key: 'protein', icon: Beef },
                          { label: 'CARB', key: 'carbs', icon: Wheat },
                          { label: 'GORD', key: 'fatTotal', icon: Droplets },
                          { label: 'FIBR', key: 'fiber', icon: Activity },
                          { label: 'SOD', key: 'sodium', icon: Info },
                        ].map((item) => (
                          <div key={item.key} className="space-y-1"> 
                            <Label className="text-[8px] uppercase text-slate-400">{item.label}</Label> 
                            <Input type="number" className="h-10 bg-slate-800 border-none text-white text-[10px]" value={(manualIng as any)[item.key]} onChange={e => setManualIng({...manualIng, [item.key]: e.target.value})} /> 
                          </div>
                        ))}
                      </div>
                      <Button onClick={handleManualSubmit} disabled={upsertManual.isPending} className="w-full bg-emerald-500 h-12 rounded-xl font-black text-[10px]">SALVAR E ADICIONAR</Button>
                    </div>
                  )}
                </div>
              </div>

              <Separator className="bg-slate-50" />
              <div className="grid grid-cols-2 gap-3">
                <NutriField 
                  label="Valor Energético" 
                  icon={Zap} 
                  field="energyKcal" 
                  secondaryValue={`${formData.energyKj} kJ`} 
                />
                <NutriField label="Carboidratos" icon={Wheat} field="carbs" />
                <NutriField label="Proteínas" icon={Beef} field="protein" />
                <NutriField label="Gorduras" icon={Droplets} field="fatTotal" />
                <NutriField label="Fibras" icon={Activity} field="fiber" />
                <NutriField label="Sódio" icon={Info} field="sodium" />
              </div>
            </TabsContent>
          </div>
        </Tabs>

        <div className="p-8 bg-white border-t mt-auto flex gap-4 shrink-0">
          <Button variant="ghost" onClick={() => { if(confirm("Limpar rascunho?")) { localStorage.removeItem("dish_draft"); setFormData(INITIAL_FORM); setComposition([]); onClose(); } }} className="flex-1 h-14 rounded-2xl font-black text-[10px] uppercase text-red-400">Limpar Rascunho</Button>
          <Button className="flex-2 h-14 rounded-2xl bg-slate-900 text-white font-black uppercase tracking-widest" onClick={() => {
              onSubmit({
                ...formData,
                id: dish?.id,
                energyKcal: Number(formData.energyKcal),
                proteins: Number(formData.protein),
                carbs: Number(formData.carbs),
                fatTotal: Number(formData.fatTotal),
                sodium: Number(formData.sodium),
                fiber: Number(formData.fiber),
                price: Number(formData.price),
                salePrice: formData.salePrice ? Number(formData.salePrice) : null, // ✅ Enviando Preço Promo
                categoryId: formData.categoryId ? Number(formData.categoryId) : null,
              });
              localStorage.removeItem("dish_draft");
          }}>SALVAR ALTERAÇÕES</Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}