import React, { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet"; 
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Zap, Beef, Wheat, Droplets, Activity, Info, Scale } from "lucide-react"; 
import ImagePicker from "./ImagePicker"; 

// --- INTERFACES ---

/**
 * Interface que representa o formato do JSON legado no banco de dados.
 */
interface LegacyNutriValue {
  value: string | number;
  dv?: string | number;
}

interface LegacyNutritionalInfo {
  energy?: LegacyNutriValue;
  protein?: LegacyNutriValue;
  carbs?: LegacyNutriValue;
  fat_total?: LegacyNutriValue;
  sodium?: LegacyNutriValue;
  fiber?: LegacyNutriValue;
}

/**
 * Interface do formulário alinhada com as novas colunas (Fase 1 e 3).
 */
interface DishFormData {
  id?: number | string;
  name: string;
  description: string;
  price: string;
  categoryId: string;
  imageUrl: string;
  energyKcal: string;
  proteins: string;
  carbs: string;
  fatTotal: string;
  sodium: string;
  fiber: string;
}

interface DishDrawerProps {
  open: boolean;
  onClose: () => void;
  dish: Record<string, unknown> | null; 
  onSubmit: (data: Record<string, unknown>) => void;
  categories: Array<{ id: string | number; name: string }>;
}

export function DishDrawer({ open, onClose, dish, onSubmit, categories }: DishDrawerProps) {
  const [formData, setFormData] = useState<DishFormData>({
    name: "", description: "", price: "", categoryId: "", imageUrl: "",
    energyKcal: "", proteins: "", carbs: "", fatTotal: "", sodium: "", fiber: "",
  });

  useEffect(() => {
    if (open) {
      if (dish) {
        // Tenta extrair dados do JSON legado se as colunas novas estiverem vazias
        let legacyInfo: LegacyNutritionalInfo = {};
        const rawLegacy = (dish.nutritional_info || dish.nutritionalInfo);
        
        if (typeof rawLegacy === 'string' && rawLegacy.trim() !== "") {
          try {
            legacyInfo = JSON.parse(rawLegacy) as LegacyNutritionalInfo;
          } catch {
            legacyInfo = {};
          }
        } else if (rawLegacy && typeof rawLegacy === 'object') {
          legacyInfo = rawLegacy as LegacyNutritionalInfo;
        }

        setFormData({
          id: dish.id as string | number,
          name: (dish.name as string) || "",
          description: (dish.description as string) || "",
          price: String(dish.price || ""),
          categoryId: String(dish.categoryId || ""),
          imageUrl: (dish.imageUrl as string) || "",
          // Prioridade: Coluna Nova > Valor no JSON antigo > Vazio
          energyKcal: String(dish.energyKcal ?? legacyInfo.energy?.value ?? ""),
          proteins: String(dish.proteins ?? legacyInfo.protein?.value ?? ""),
          carbs: String(dish.carbs ?? legacyInfo.carbs?.value ?? ""),
          fatTotal: String(dish.fatTotal ?? legacyInfo.fat_total?.value ?? ""),
          sodium: String(dish.sodium ?? legacyInfo.sodium?.value ?? ""),
          fiber: String(dish.fiber ?? legacyInfo.fiber?.value ?? ""),
        });
      } else {
        setFormData({ 
          name: "", description: "", price: "", categoryId: "", imageUrl: "", 
          energyKcal: "", proteins: "", carbs: "", fatTotal: "", sodium: "", fiber: "" 
        });
      }
    }
  }, [dish, open]);

  const handleSave = () => {
    // Montagem do payload plano (Fase 3 do Roadmap)
    const payload: Record<string, unknown> = {
      id: dish?.id,
      name: formData.name,
      description: formData.description,
      price: Number(formData.price.toString().replace(',', '.')) || 0,
      categoryId: Number(formData.categoryId) || 0,
      imageUrl: formData.imageUrl,
      // Novos campos individuais
      energyKcal: Number(formData.energyKcal) || 0,
      proteins: Number(formData.proteins) || 0,
      carbs: Number(formData.carbs) || 0,
      fatTotal: Number(formData.fatTotal) || 0,
      sodium: Number(formData.sodium) || 0,
      fiber: Number(formData.fiber) || 0,
      // Invalida o campo antigo no banco
      nutritional_info: null 
    };

    onSubmit(payload);
  };

  const NutriField = ({ label, icon: Icon, field, unit }: { 
    label: string, 
    icon: React.ElementType, 
    field: keyof DishFormData, 
    unit: string 
  }) => (
    <div className="flex flex-col p-5 rounded-[2rem] bg-slate-50 border border-slate-100">
      <div className="flex items-center gap-3 mb-4">
        <Icon className="w-4 h-4 text-emerald-600" />
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</span>
      </div>
      <Input 
        type="number"
        className="h-12 bg-white border-none rounded-xl text-lg font-black text-slate-700 shadow-sm px-4 focus-visible:ring-emerald-500/20" 
        placeholder={`0 ${unit}`}
        value={formData[field] as string} 
        onChange={e => setFormData({...formData, [field]: e.target.value})} 
      />
    </div>
  );

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:max-w-2xl p-0 border-none shadow-2xl bg-white flex flex-col h-full outline-none">
        <div className="p-8 border-b border-slate-50 shrink-0 text-left">
          <div className="flex items-center gap-3 text-slate-300 mb-2">
            <Scale size={16} />
            <span className="text-[9px] font-black uppercase tracking-[0.4em]">Gestão de Prato</span>
          </div>
          <SheetTitle className="text-3xl font-black uppercase text-slate-900 tracking-tighter italic leading-none">
            {dish ? "Editar" : "Novo"} Prato<span className="text-emerald-500">.</span>
          </SheetTitle>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-8 space-y-10 text-left">
            <div className="bg-slate-50 p-4 rounded-4xl border border-slate-100">
                <ImagePicker 
                  value={formData.imageUrl} 
                  onChange={(url: string) => setFormData({...formData, imageUrl: url})} 
                  label="Foto do Cardápio" 
                />
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Título</Label>
                <Input className="h-14 rounded-2xl bg-slate-50 border-none font-bold text-lg" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Preço</Label>
                  <Input className="h-14 rounded-2xl bg-slate-50 border-none font-bold text-lg text-emerald-700" placeholder="R$ 0,00" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Categoria</Label>
                  <select className="w-full h-14 bg-slate-50 border-none rounded-2xl px-4 font-bold text-sm outline-none appearance-none cursor-pointer" value={formData.categoryId} onChange={e => setFormData({...formData, categoryId: e.target.value})}>
                    <option value="">CATEGORIA...</option>
                    {categories?.map(c => <option key={c.id} value={c.id}>{c.name.toUpperCase()}</option>)}
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Descrição Comercial</Label>
                <Textarea className="rounded-3xl bg-slate-50 border-none p-5 min-h-25 font-medium text-sm resize-none" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
              </div>
            </div>

            <Separator className="bg-slate-50" />

            <div className="space-y-6 pb-10">
              <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-600">Dados Nutricionais (p/ 100g)</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <NutriField label="Energia" icon={Zap} field="energyKcal" unit="kcal" />
                <NutriField label="Carbos" icon={Wheat} field="carbs" unit="g" />
                <NutriField label="Proteínas" icon={Beef} field="proteins" unit="g" />
                <NutriField label="Gorduras" icon={Droplets} field="fatTotal" unit="g" />
                <NutriField label="Fibras" icon={Activity} field="fiber" unit="g" />
                <NutriField label="Sódio" icon={Info} field="sodium" unit="mg" />
              </div>
            </div>
          </div>
        </ScrollArea>

        <div className="p-8 bg-white border-t border-slate-100 shrink-0">
          <Button 
            className="w-full h-14 rounded-2xl bg-slate-900 hover:bg-emerald-600 text-white font-black text-[11px] tracking-widest shadow-xl transition-all active:scale-95" 
            onClick={handleSave}
          >
            SALVAR ALTERAÇÕES
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}