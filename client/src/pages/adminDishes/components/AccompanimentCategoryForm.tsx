import { useState } from "react";
import { trpc } from "@/_core/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast"; // ✅ Importando o toast
import * as Icons from "lucide-react"; 
import { Loader2 } from "lucide-react";

// ✅ Definindo a lista de ícones disponíveis
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
  const [color, setColor] = useState("emerald");

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
    if (!name) return toast.error("Digite um nome para a categoria");
    mutation.mutate({ 
        name, 
        iconKey, 
        color,
        displayOrder: 0,
        isActive: true 
    });
  };

  return (
    <div className="space-y-4 p-4 bg-white rounded-xl border">
      <div>
        <label className="text-[10px] font-black uppercase text-slate-400">Nome da Categoria</label>
        <Input 
          value={name} 
          onChange={(e) => setName(e.target.value)} 
          placeholder="Ex: Carboidratos" 
          className="mt-1"
        />
      </div>

      <div>
        <label className="text-[10px] font-black uppercase text-slate-400">Ícone Representativo</label>
        <div className="grid grid-cols-4 gap-2 mt-2">
          {AVAILABLE_ICONS.map((icon) => {
            const IconComp = (Icons as any)[icon.id];
            const isSelected = iconKey === icon.id;
            
            return (
              <button
                key={icon.id}
                type="button"
                onClick={() => setIconKey(icon.id)}
                className={`p-2 border-2 rounded-xl flex flex-col items-center gap-1 transition-all ${
                  isSelected 
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-600' 
                    : 'border-slate-100 bg-white text-slate-400 hover:border-slate-200'
                }`}
              >
                {IconComp && <IconComp size={20} />}
                <span className="text-[9px] font-bold uppercase">{icon.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      <Button 
        onClick={handleSave} 
        disabled={mutation.isPending} // ✅ Corrigido: de isLoading para isPending
        className="w-full h-12 bg-slate-950 text-white rounded-xl font-black uppercase text-[10px] tracking-widest"
      >
        {mutation.isPending ? ( // ✅ Corrigido: de isLoading para isPending
          <Loader2 className="animate-spin" size={16} />
        ) : (
          "Salvar Categoria"
        )}
      </Button>
    </div>
  );
}