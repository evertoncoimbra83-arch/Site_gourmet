import React, { useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { safeNumber } from "@/lib/safe-parse";
import { 
  Scale, Calculator, Flame, Bone, Magnet, Beef, 
  Wheat, Droplets, Info, Activity, Layers 
} from "lucide-react";

// --- INTERFACES ---
interface IngredientData {
  name?: string;
  yieldFactor?: string | number;
  energyKcal?: string | number;
  energyKj?: string | number;
  carbs?: string | number;
  proteins?: string | number;
  fatTotal?: string | number;
  fatSaturated?: string | number;
  fatTrans?: string | number;
  fiber?: string | number;
  sodium?: string | number;
  calcium?: string | number;
  iron?: string | number;
  [key: string]: unknown; // Permite chaves dinâmicas do banco de dados (snake_case)
}

interface IngredientFormProps {
  formData: IngredientData;
  setFormData: (data: IngredientData) => void;
  handleKcalChange: (kcal: string) => void;
}

/**
 * ✅ VIEW 1: TABELA NUTRICIONAL REVISADA
 */
function NutritionalLabel({ data }: { data: IngredientData }) {
  const fmt = (val: unknown) => {
    if (val === undefined || val === null || val === "") return "0.00";
    const num = safeNumber(String(val).replace(',', '.'));
    return isNaN(num) ? "0.00" : num.toFixed(2);
  };

  return (
    <div className="border-2 border-slate-900 p-5 bg-white font-sans text-slate-900 w-full max-w-[320px] mx-auto shadow-xl select-none text-left">
      <h2 className="text-2xl font-black border-b-8 border-slate-900 pb-1 mb-2 uppercase italic tracking-tighter">
        Informação <span className="text-emerald-600">Nutricional</span>
      </h2>
      <div className="text-[10px] font-bold border-b-4 border-slate-900 pb-1 mb-2 uppercase tracking-tight">
        Porção de 100g (Base Técnica)
      </div>
      <div className="space-y-1 text-xs">
        <div className="flex justify-between border-b border-slate-200 py-1 font-black text-sm">
          <span>Valor Energético</span>
          <span>{fmt(data.energyKcal)} kcal / {fmt(data.energyKj)} kJ</span>
        </div>
        <div className="flex justify-between border-b border-slate-100 py-1 font-bold">
          <span>Carboidratos</span>
          <span>{fmt(data.carbs)}g</span>
        </div>
        <div className="flex justify-between border-b border-slate-100 py-1 font-bold">
          <span>Proteínas</span>
          <span>{fmt(data.proteins)}g</span>
        </div>
        <div className="pt-1">
          <div className="flex justify-between font-bold border-b border-slate-100 py-1">
            <span>Gorduras Totais</span>
            <span>{fmt(data.fatTotal)}g</span>
          </div>
          <div className="pl-4 text-[10px] text-slate-500 space-y-1 py-1 border-b border-slate-100">
            <div className="flex justify-between italic">
              <span>Gorduras Saturadas</span>
              <span>{fmt(data.fatSaturated)}g</span>
            </div>
            <div className="flex justify-between italic">
              <span>Gorduras Trans</span>
              <span>{fmt(data.fatTrans || data.fat_trans)}g</span>
            </div>
          </div>
        </div>
        <div className="flex justify-between border-b border-slate-100 py-1 font-bold">
          <span>Fibra Alimentar</span>
          <span>{fmt(data.fiber)}g</span>
        </div>
        <div className="flex justify-between border-b border-slate-100 py-1 font-black text-sm uppercase">
          <span>Sódio</span>
          <span>{fmt(data.sodium)}mg</span>
        </div>
        <div className="flex justify-between py-1 text-slate-500 italic text-[10px]">
          <span>Cálcio / Ferro</span>
          <span>{fmt(data.calcium)}mg / {fmt(data.iron)}mg</span>
        </div>
      </div>
    </div>
  );
}

export const IngredientForm = React.forwardRef<HTMLDivElement, IngredientFormProps>(
  ({ formData, setFormData, handleKcalChange }, ref) => {
    
    useEffect(() => {
      const mappings: Record<string, string> = {
        fat_total: 'fatTotal',
        fat_saturated: 'fatSaturated',
        fat_trans: 'fatTrans',
        energy_kcal: 'energyKcal',
        energy_kj: 'energyKj',
        proteins: 'proteins',
        carbs: 'carbs',
        fiber: 'fiber',
        sodium: 'sodium',
        calcium: 'calcium',
        iron: 'iron',
        yield_factor: 'yieldFactor'
      };

      let needsUpdate = false;
      const updatedData = { ...formData };

      Object.entries(mappings).forEach(([dbKey, formKey]) => {
        if (formData[dbKey] !== undefined && (formData[formKey] === undefined || formData[formKey] === null)) {
          updatedData[formKey] = formData[dbKey] as string | number;
          needsUpdate = true;
        }
      });

      if (needsUpdate) {
        setFormData(updatedData);
      }
    }, [formData, setFormData]);

    const updateField = (field: string, value: string) => {
      setFormData({ ...formData, [field]: value });
    };

    const nutriFields = [
      { id: 'carbs', label: 'Carbo (g)', icon: Wheat },
      { id: 'proteins', label: 'Proteína (g)', icon: Beef },
      { id: 'fatTotal', label: 'Gord. Total (g)', icon: Droplets },
      { id: 'fatSaturated', label: 'Gord. Sat. (g)', icon: Layers },
      { id: 'fiber', label: 'Fibra (g)', icon: Activity },
      { id: 'sodium', label: 'Sódio (mg)', icon: Info },
      { id: 'calcium', label: 'Cálcio (mg)', icon: Bone },
      { id: 'iron', label: 'Ferro (mg)', icon: Magnet },
    ];

    return (
      <div ref={ref} className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        <div className="space-y-6 bg-slate-50/50 p-6 rounded-4xl border border-slate-100 shadow-inner">
          <div className="space-y-4">
            <div className="space-y-2 text-left">
              <Label className="text-[10px] font-black uppercase text-slate-400 ml-2">Nome do Alimento</Label>
              <Input 
                className="h-14 rounded-2xl bg-white border-none shadow-sm font-bold text-slate-700"
                value={formData.name || ""}
                onChange={e => updateField('name', e.target.value)}
                placeholder="Ex: Arroz Integral"
              />
            </div>

            <div className="grid grid-cols-3 gap-4 text-left">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-400 ml-2">Yield (Fator)</Label>
                <div className="relative">
                   <Scale className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                   <Input 
                    className="h-12 pl-9 rounded-xl border-none shadow-sm font-black text-xs text-center" 
                    value={String(formData.yieldFactor || "1.00")} 
                    onChange={e => updateField('yieldFactor', e.target.value)} 
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-400 ml-2">Kcal (100g)</Label>
                <div className="relative">
                   <Calculator className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                   <Input 
                    className="h-12 pl-9 rounded-xl border-none shadow-sm font-black text-emerald-600 text-xs text-center" 
                    value={String(formData.energyKcal || "0")} 
                    onChange={e => handleKcalChange(e.target.value)} 
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-400 ml-2">kJ (100g)</Label>
                <div className="relative">
                   <Flame className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                   <Input 
                    className="h-12 pl-9 rounded-xl border-none shadow-sm font-black text-orange-600 text-xs text-center" 
                    value={String(formData.energyKj || "0")} 
                    onChange={e => updateField('energyKj', e.target.value)} 
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-x-6 gap-y-4 text-left">
            {nutriFields.map((f) => (
              <div key={f.id} className="space-y-1.5">
                <div className="flex items-center gap-1 ml-1">
                  <f.icon size={10} className="text-slate-400" />
                  <Label className="text-[9px] font-black uppercase text-slate-400">{f.label}</Label>
                </div>
                <Input 
                  className="h-11 rounded-xl border-none shadow-sm font-bold bg-white text-center"
                  value={String(formData[f.id] || "0")}
                  onChange={e => updateField(f.id, e.target.value)}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col items-center justify-center space-y-4 py-6 lg:sticky lg:top-0">
          <span className="text-[10px] font-black uppercase text-slate-300 tracking-[0.2em]">Visualização em Tempo Real</span>
          <NutritionalLabel data={formData} />
        </div>
      </div>
    );
  }
);

IngredientForm.displayName = "IngredientForm";
