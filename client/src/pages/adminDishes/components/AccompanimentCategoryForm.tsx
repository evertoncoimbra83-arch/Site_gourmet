import React, { useState } from "react";
import { trpc } from "@/_core/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { appToast as toast } from "@/lib/app-toast";
import { 
  Loader2, 
  Leaf, 
  Wheat, 
  Drumstick, 
  Bean, 
  Apple, 
  Beef, 
  Fish, 
  Salad 
} from "lucide-react";

// ✅ Tipagem dos ícones estrita (Elimina o erro de Icons definido mas não usado)
const ICON_MAP: Record<string, React.ElementType> = {
  Wheat,
  Drumstick,
  Leaf,
  Bean,
  Apple,
  Beef,
  Fish,
  Salad
};

const AVAILABLE_ICONS = [
  { id: 'Wheat', label: 'Grãos/Carbo' },
  { id: 'Drumstick', label: 'Proteína' },
  { id: 'Leaf', label: 'Vegetais' },
  { id: 'Bean', label: 'Leguminosas' },
  { id: 'Apple', label: 'Frutas' },
  { id: 'Beef', label: 'Carnes' },
  { id: 'Fish', label: 'Peixes' },
  { id: 'Salad', label: 'Saladas' },
];

export function AccompanimentCategoryForm({ onSave }: { onSave: () => void }) {
  const [name, setName] = useState("");
  const [iconKey, setIconKey] = useState("Leaf");
  
  // ✅ Valor estático para evitar erro de variável não utilizada (setColor)
  const color = "emerald"; 

  const mutation = trpc.admin.accompaniments.categories.upsert.useMutation({
    onSuccess: () => {
      toast.success("Categoria criada com sucesso!");
      setName("");
      onSave();
    },
    onError: (err) => {
      toast.error("Erro ao salvar: " + err.message);
    }
  });

  const handleSave = () => {
    if (!name) {
      toast.error("Digite um nome para a categoria");
      return;
    }

    // ✅ Enviando apenas propriedades conhecidas pelo Backend (Resolve TS2353)
    mutation.mutate({ 
      name, 
      iconKey, 
      color,
      isActive: true 
    });
  };

  return (
    <div className="space-y-4 p-4 bg-white rounded-xl border text-left animate-in fade-in duration-500">
      <div>
        <label className="text-[10px] font-black uppercase text-slate-400 ml-1">
          Nome da Categoria
        </label>
        <Input 
          value={name} 
          onChange={(e) => setName(e.target.value)} 
          placeholder="Ex: Carboidratos" 
          className="mt-1 h-12 rounded-xl border-slate-100 bg-slate-50 focus:bg-white font-bold transition-all shadow-sm"
        />
      </div>

      <div>
        <label className="text-[10px] font-black uppercase text-slate-400 ml-1">
          Ícone Representativo
        </label>
        <div className="grid grid-cols-4 gap-2 mt-2">
          {AVAILABLE_ICONS.map((icon) => {
            const IconComp = ICON_MAP[icon.id];
            const isSelected = iconKey === icon.id;
            
            return (
              <button
                key={icon.id}
                type="button"
                onClick={() => setIconKey(icon.id)}
                className={`p-2 border-2 rounded-xl flex flex-col items-center gap-1 transition-all active:scale-95 ${
                  isSelected 
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-600 shadow-sm' 
                    : 'border-slate-50 bg-white text-slate-300 hover:border-slate-100 hover:text-slate-400'
                }`}
              >
                {IconComp && <IconComp size={20} />}
                <span className="text-[8px] font-bold uppercase">{icon.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <Button 
        onClick={handleSave} 
        disabled={mutation.isPending} 
        className="w-full h-12 bg-slate-900 hover:bg-black text-white rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg active:scale-95 transition-all"
      >
        {mutation.isPending ? (
          <Loader2 className="animate-spin" size={16} />
        ) : (
          "Salvar Categoria"
        )}
      </Button>
    </div>
  );
}