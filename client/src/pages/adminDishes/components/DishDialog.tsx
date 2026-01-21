import { useState, useEffect } from "react";
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetFooter, 
} from "@/components/ui/sheet"; 
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Zap, Beef, Wheat, Droplets, Activity, Info, Scale } from "lucide-react"; 
import ImagePicker from "./ImagePicker"; 

export function DishDrawer({ open, onClose, dish, onSubmit, categories }: any) {
  const [formData, setFormData] = useState<any>({
    name: "", description: "", price: "", categoryId: "", imageUrl: "",
    energy: "", energy_dv: "", protein: "", protein_dv: "", carbs: "", carbs_dv: "",
    fat_total: "", fat_total_dv: "", sodium: "", sodium_dv: "", fiber: "", fiber_dv: "",
  });

  useEffect(() => {
    if (dish && open) {
      const rawInfo = dish.nutritional_info || dish.nutritionalInfo;
      let info: any = {};
      try { info = typeof rawInfo === 'string' ? JSON.parse(rawInfo) : (rawInfo || {}); } catch (e) { info = {}; }
      setFormData({
        name: dish.name || "",
        description: dish.description || "",
        price: String(dish.price || ""),
        categoryId: String(dish.categoryId || ""),
        imageUrl: dish.imageUrl || "",
        energy: info?.energy?.value || "", energy_dv: info?.energy?.dv || "",
        protein: info?.protein?.value || "", protein_dv: info?.protein?.dv || "",
        carbs: info?.carbs?.value || "", carbs_dv: info?.carbs?.dv || "",
        fat_total: info?.fat_total?.value || "", fat_total_dv: info?.fat_total?.dv || "",
        sodium: info?.sodium?.value || "", sodium_dv: info?.sodium?.dv || "",
        fiber: info?.fiber?.value || "", fiber_dv: info?.fiber?.dv || "",
      });
    } else if (open) {
      setFormData({ name: "", description: "", price: "", categoryId: "", imageUrl: "", energy: "", energy_dv: "", protein: "", protein_dv: "", carbs: "", carbs_dv: "", fat_total: "", fat_total_dv: "", sodium: "", sodium_dv: "", fiber: "", fiber_dv: "" });
    }
  }, [dish, open]);

  const handleSave = () => {
    const nutritionalInfo = {
      energy: { value: formData.energy, dv: formData.energy_dv || "0" },
      protein: { value: formData.protein, dv: formData.protein_dv || "0" },
      carbs: { value: formData.carbs, dv: formData.carbs_dv || "0" },
      fat_total: { value: formData.fat_total, dv: formData.fat_total_dv || "0" },
      sodium: { value: formData.sodium, dv: formData.sodium_dv || "0" },
      fiber: { value: formData.fiber, dv: formData.fiber_dv || "0" },
    };

    onSubmit({
      id: dish?.id,
      name: formData.name,
      description: formData.description,
      price: Number(formData.price.toString().replace(',', '.')) || 0,
      categoryId: Number(formData.categoryId) || 0,
      imageUrl: formData.imageUrl,
      nutritional_info: JSON.stringify(nutritionalInfo) 
    });
  };

  const NutriField = ({ label, icon: Icon, field, unit }: any) => (
    <div className="flex flex-col p-5 rounded-[2rem] bg-slate-50 border border-slate-100">
      <div className="flex items-center gap-3 mb-4">
        <Icon className="w-4 h-4 text-emerald-600" />
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</span>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Input 
          className="h-10 bg-white border-none rounded-xl text-xs font-bold shadow-sm" 
          placeholder={`Qtd (${unit})`}
          value={formData[field]} 
          onChange={e => setFormData({...formData, [field]: e.target.value})} 
        />
        <Input 
          className="h-10 bg-white border-none rounded-xl text-xs font-bold text-emerald-600 shadow-sm" 
          placeholder="% VD"
          value={formData[`${field}_dv`]} 
          onChange={e => setFormData({...formData, [`${field}_dv`]: e.target.value})} 
        />
      </div>
    </div>
  );

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent 
        side="right" 
        className="w-full sm:max-w-2xl p-0 border-none shadow-2xl bg-white flex flex-col h-full"
      >
        {/* HEADER FIXO */}
        <div className="p-6 md:p-8 border-b border-slate-50 shrink-0">
          <div className="flex items-center gap-3 text-slate-300 mb-2">
            <Scale size={16} />
            <span className="text-[9px] font-black uppercase tracking-[0.4em]">Gestão de Prato</span>
          </div>
          <SheetTitle className="text-2xl md:text-3xl font-black uppercase text-slate-900 tracking-tighter italic leading-none">
            {dish ? "Editar" : "Novo"} Prato<span className="text-emerald-500">.</span>
          </SheetTitle>
        </div>

        {/* ÁREA DE CONTEÚDO COM ROLAGEM */}
        <ScrollArea className="flex-1 overflow-y-auto">
          <div className="p-6 md:p-8 space-y-10">
            
            {/* IDENTIDADE E IMAGEM */}
            <div className="flex flex-col gap-8">
              {/* Box da Foto */}
              <div className="bg-slate-50 p-4 rounded-[2.5rem] border border-slate-100">
                <ImagePicker 
                  value={formData.imageUrl} 
                  onChange={(url: string) => setFormData({...formData, imageUrl: url})} 
                  label="Foto do Cardápio" 
                />
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Título</Label>
                  <Input 
                    className="h-14 rounded-2xl bg-slate-50 border-none font-bold text-lg focus:ring-2 focus:ring-emerald-500/20" 
                    value={formData.name} 
                    onChange={e => setFormData({...formData, name: e.target.value})} 
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Preço (R$)</Label>
                    <Input 
                      className="h-14 rounded-2xl bg-slate-50 border-none font-bold text-lg text-emerald-700" 
                      value={formData.price} 
                      onChange={e => setFormData({...formData, price: e.target.value})} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Categoria</Label>
                    <select 
                      className="w-full h-14 bg-slate-50 border-none rounded-2xl px-4 font-bold text-sm outline-none appearance-none cursor-pointer"
                      value={formData.categoryId}
                      onChange={e => setFormData({...formData, categoryId: e.target.value})}
                    >
                      <option value="">SELECIONAR...</option>
                      {categories?.map((c: any) => (
                        <option key={c.id} value={c.id}>{c.name.toUpperCase()}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Descrição</Label>
                  <Textarea 
                    className="rounded-[1.5rem] bg-slate-50 border-none font-medium text-sm min-h-[120px] p-5 resize-none leading-relaxed" 
                    value={formData.description} 
                    onChange={e => setFormData({...formData, description: e.target.value})} 
                  />
                </div>
              </div>
            </div>

            <Separator className="bg-slate-50" />

            {/* TABELA NUTRICIONAL */}
            <div className="space-y-6 pb-10">
              <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-600">Tabela Nutricional</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <NutriField label="Energia" icon={Zap} field="energy" unit="kcal" />
                <NutriField label="Carbos" icon={Wheat} field="carbs" unit="g" />
                <NutriField label="Proteínas" icon={Beef} field="protein" unit="g" />
                <NutriField label="Gorduras" icon={Droplets} field="fat_total" unit="g" />
                <NutriField label="Fibras" icon={Activity} field="fiber" unit="g" />
                <NutriField label="Sódio" icon={Info} field="sodium" unit="mg" />
              </div>
            </div>
          </div>
        </ScrollArea>

        {/* FOOTER FIXO */}
        <div className="p-6 md:p-8 bg-white border-t border-slate-100 shrink-0">
          <div className="flex gap-4 w-full">
            <Button 
              variant="ghost" 
              onClick={onClose} 
              className="flex-1 h-14 rounded-2xl font-black text-[10px] tracking-widest uppercase text-slate-400"
            >
              Cancelar
            </Button>
            <Button 
              className="flex-[2] h-14 rounded-2xl bg-slate-900 hover:bg-emerald-600 text-white font-black text-[11px] tracking-widest shadow-xl transition-all active:scale-95" 
              onClick={handleSave}
            >
              SALVAR PRATO
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}